import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { SaleOrdersService } from 'src/sale-orders/sale-orders.service';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly saleOrdersService: SaleOrdersService,
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
    @Req() req: Request & { rawBody: Buffer },
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    try {
      const event = await this.stripeService.constructEventFromPayload(
        signature,
        rawBody,
      );

      console.log('🔔 Webhook de Stripe recibido:', event.type);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log('✅ Checkout completado:', session.id);
          // await this.saleOrdersService.updateOrderStatus(session.metadata.order_id, 'PAID');
          break;
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          console.log('✅ Pago exitoso:', paymentIntent.id);
          // await this.saleOrdersService.updateOrderStatus(paymentIntent.metadata.order_id, 'PAID');
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          console.log('❌ Pago fallido:', paymentIntent.id);
          // await this.saleOrdersService.updateOrderStatus(paymentIntent.metadata.order_id, 'CANCELLED');
          break;
        }
      }

      return { received: true };
    } catch (error) {
      const err = error as Error;
      console.error('Error procesando webhook:', err);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}
