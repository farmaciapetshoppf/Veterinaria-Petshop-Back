import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { SaleOrdersService } from 'src/sale-orders/sale-orders.service';
import { MailerService } from 'src/mailer/mailer.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';

@ApiTags('Stripe')
@Controller('stripe')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.User)
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly saleOrdersService: SaleOrdersService,
    private readonly mailerService: MailerService,
  ) {}

  @ApiOperation({
    summary: 'Crear sesión de checkout',
    description: 'Crea una sesión de checkout para procesar un pago con Stripe',
  })
  @ApiBody({
    description: 'Datos para crear una sesión de checkout',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo de sesión de checkout',
        value: {
          items: [
            {
              product: {
                name: 'Producto 1',
                description: 'Descripción del producto 1',
                imageUrl: 'https://example.com/producto1.png',
              },
              unitPrice: 1000,
              quantity: 1,
            },
          ],
          orderId: '123456',
          buyerEmail: 'comprador@example.com',
          successUrl: 'https://mi-tienda.com/success',
          cancelUrl: 'https://mi-tienda.com/cancel',
        },
      },
    },
  })
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body()
    body: {
      items: {
        product: {
          name: string;
          description: string;
          imageUrl: string;
        };
        unitPrice: number;
        quantity: number;
      }[];
      orderId: string;
      buyerEmail: string;
      successUrl: string;
      cancelUrl: string;
    },
  ) {
    try {
      const { items, orderId, buyerEmail, successUrl, cancelUrl } = body;
      const session = await this.stripeService.createCheckoutSession(
        items,
        orderId,
        buyerEmail,
        successUrl,
        cancelUrl,
      );
      console.log('Stripe session:', session);
      return {
        message: 'Sesión de checkout creada exitosamente',
        session,
      };
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(
        `Error al crear sesión de checkout: ${err.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Crear intent de pago',
    description: 'Crea un intent de pago para procesamiento directo',
  })
  @ApiBody({
    description: 'Datos para crear un intent de pago',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo de intent de pago',
        value: {
          amount: 3000,
          orderId: '123456',
          customerEmail: 'comprador@example.com',
        },
      },
    },
  })
  @Post('create-payment-intent')
  async createPaymentIntent(
    @Body() body: { amount: number; orderId: string; customerEmail?: string },
  ) {
    try {
      const { amount, orderId, customerEmail } = body;
      const paymentIntent = await this.stripeService.createPaymentIntent(
        amount,
        orderId,
        customerEmail,
      );
      return {
        message: 'Intent de pago creado exitosamente',
        paymentIntent,
      };
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(
        `Error al crear intent de pago: ${err.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Webhook de Stripe',
    description: 'Endpoint para recibir notificaciones de Stripe',
  })
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      const event = this.stripeService.constructEventFromPayload(
        signature,
        req.body,
      );

      console.log('🔔 Webhook de Stripe recibido:', event.type);

      // Extraer order_id y definir el estado según el tipo de evento
      let orderId: string | undefined;
      let newStatus: string | undefined;
      let customerEmail: string | null | undefined;

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log('✅ Checkout completado:', session.id);
          orderId = session.metadata?.order_id;
          newStatus = 'PAID';
          customerEmail = session.customer_details?.email;
          break;
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          console.log('✅ Pago exitoso:', paymentIntent.id);
          orderId = paymentIntent.metadata?.order_id;
          newStatus = 'PAID';
          customerEmail = paymentIntent.receipt_email;
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          console.log('❌ Pago fallido:', paymentIntent.id);
          orderId = paymentIntent.metadata?.order_id;
          newStatus = 'CANCELLED';
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Procesar la actualización si tenemos un orderId y un estado
      if (orderId && newStatus) {
        await this.saleOrdersService.updateOrderStatus(orderId, newStatus);

        // Enviar correo de confirmación si el estado es PAID
        if (newStatus === 'PAID') {
          try {
            const order = await this.saleOrdersService.getOrderDetails(orderId);

            if (order) {
              // Verificar que tenemos un email válido
              const emailTo = customerEmail || order.buyer?.email;

              if (emailTo) {
                await this.mailerService.sendPurchaseConfirmation({
                  to: emailTo,
                  userName: order.buyer?.name || 'Cliente',
                  orderId: order.id,
                  items: order.items.map((item) => ({
                    productName: item.product.name,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice).toFixed(2),
                    subtotal: (Number(item.unitPrice) * item.quantity).toFixed(
                      2,
                    ),
                  })),
                  total: Number(order.total).toFixed(2),
                });
                console.log('📧 Correo de confirmación enviado a:', emailTo);
              } else {
                console.warn(
                  '⚠️ No se pudo enviar el correo: dirección de email no disponible',
                );
              }
            } else {
              console.warn(
                `⚠️ No se encontró la orden ${orderId} para enviar correo`,
              );
            }
          } catch (emailError) {
            console.error(
              '❌ Error enviando correo de confirmación:',
              emailError,
            );
          }
        }
      } else if (newStatus) {
        console.warn('⚠️ No se encontró order_id en metadata');
      }

      // Retornar 200 para que Stripe no reintente
      return { received: true };
    } catch (error) {
      console.error('Error procesando webhook:', error);
    }
  }
}
