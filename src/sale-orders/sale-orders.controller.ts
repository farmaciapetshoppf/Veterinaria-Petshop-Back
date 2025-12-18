import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SaleOrdersService } from './sale-orders.service';
import { CreateSaleOrderDto } from './dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import {
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Sale Orders')
@Controller('sale-orders')
export class SaleOrdersController {
  constructor(private readonly saleOrdersService: SaleOrdersService) {}

  // ==================== ENDPOINTS DE CARRITO ====================

  @ApiOperation({
    summary: 'Agregar producto al carrito activo',
    description:
      'Agrega un producto al carrito del usuario. El stock se descuenta inmediatamente y el carrito expira en 24hs.',
  })
  @ApiBody({
    description: 'Datos del producto a agregar',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
          description: 'ID del usuario',
        },
        productId: {
          type: 'string',
          example: 'abc123',
          description: 'ID del producto',
        },
        quantity: {
          type: 'number',
          example: 2,
          description: 'Cantidad a agregar',
        },
      },
      required: ['userId', 'productId', 'quantity'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Producto agregado exitosamente al carrito',
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o carrito vencido',
  })
  @ApiResponse({ status: 404, description: 'Usuario o producto no encontrado' })
  @Post('cart/add')
  addToCart(
    @Body() body: { userId: string; productId: string; quantity: number },
  ) {
    console.log('🛒 Request para agregar al carrito:', {
      userId: body.userId,
      productId: body.productId,
      quantity: body.quantity,
      tipo: typeof body.quantity,
    });
    return this.saleOrdersService.addToCart(
      body.userId,
      body.productId,
      body.quantity,
    );
  }

  @ApiOperation({
    summary: 'Obtener carrito activo del usuario',
    description: 'Retorna el carrito en estado ACTIVE con todos sus productos.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario',
  })
  @ApiResponse({ status: 200, description: 'Carrito encontrado' })
  @ApiResponse({
    status: 200,
    description: 'No hay carrito activo (data: null)',
  })
  @Get('cart/:userId')
  getActiveCart(@Param('userId') userId: string) {
    return this.saleOrdersService.getActiveCart(userId);
  }

  @ApiOperation({
    summary: 'Actualizar cantidad de producto en carrito',
    description:
      'Modifica la cantidad de un producto. Si quantity=0, elimina el producto del carrito.',
  })
  @ApiBody({
    description: 'Datos para actualizar',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
          description: 'ID del usuario',
        },
        productId: {
          type: 'string',
          example: 'abc123',
          description: 'ID del producto',
        },
        quantity: {
          type: 'number',
          example: 5,
          description: 'Nueva cantidad (0 para eliminar)',
        },
      },
      required: ['userId', 'productId', 'quantity'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cantidad actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @ApiResponse({ status: 404, description: 'Carrito o producto no encontrado' })
  @Patch('cart/update')
  updateCartItem(
    @Body() body: { userId: string; productId: string; quantity: number },
  ) {
    return this.saleOrdersService.updateCartItem(
      body.userId,
      body.productId,
      body.quantity,
    );
  }

  @ApiOperation({
    summary: 'Eliminar producto del carrito',
    description: 'Elimina un producto del carrito y restaura su stock.',
  })
  @ApiBody({
    description: 'IDs del usuario y producto',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
          description: 'ID del usuario',
        },
        productId: {
          type: 'string',
          example: 'abc123',
          description: 'ID del producto a eliminar',
        },
      },
      required: ['userId', 'productId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Producto eliminado del carrito' })
  @ApiResponse({ status: 404, description: 'Carrito o producto no encontrado' })
  @Delete('cart/remove')
  removeFromCart(@Body() body: { userId: string; productId: string }) {
    return this.saleOrdersService.removeFromCart(body.userId, body.productId);
  }

  @ApiOperation({
    summary: 'Vaciar carrito completo',
    description: 'Elimina todos los productos del carrito y restaura el stock.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario',
  })
  @ApiResponse({ status: 200, description: 'Carrito vaciado exitosamente' })
  @ApiResponse({
    status: 200,
    description: 'No hay carrito activo para vaciar',
  })
  @Delete('cart/clear/:userId')
  clearCart(@Param('userId') userId: string) {
    return this.saleOrdersService.clearCart(userId);
  }

  @ApiOperation({
    summary: 'Obtener historial de compras',
    description: 'Retorna todas las órdenes pagadas (PAID) del usuario.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario',
  })
  @ApiResponse({ status: 200, description: 'Historial de compras obtenido' })
  @Get('history/:userId')
  getOrderHistory(@Param('userId') userId: string) {
    return this.saleOrdersService.getOrderHistory(userId);
  }

  @ApiOperation({
    summary: 'Procesar checkout y crear preferencia de MercadoPago',
    description:
      'Convierte el carrito ACTIVE en PENDING y genera una preferencia de pago en MercadoPago con URLs configuradas en el backend.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferencia creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Preferencia de pago creada exitosamente',
        },
        data: {
          type: 'object',
          properties: {
            preferenceId: {
              type: 'string',
              example: '123456789-abcd-1234-5678-123456789abc',
            },
            initPoint: {
              type: 'string',
              example:
                'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...',
            },
            sandboxInitPoint: {
              type: 'string',
              example:
                'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Carrito vacío o vencido' })
  @ApiResponse({ status: 404, description: 'No hay carrito activo' })
  @Post('checkout/:userId')
  checkout(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.saleOrdersService.checkout(userId, checkoutDto);
  }

  @ApiOperation({
    summary: 'Webhook de MercadoPago',
    description:
      'Endpoint para recibir notificaciones de pago de MercadoPago. Este endpoint es llamado automáticamente por MercadoPago cuando hay cambios en el estado del pago.',
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado correctamente' })
  @Post('webhook')
  handleWebhook(@Body() body: any, @Query() query: any) {
    // MercadoPago envía datos tanto en body como en query params
    const webhookData = {
      ...body,
      ...query,
      // Si viene 'data.id' en query, también agregarlo como data.id
      ...(query['data.id'] && { data: { id: query['data.id'] } }),
    };
    return this.saleOrdersService.handleWebhook(webhookData);
  }

  @ApiOperation({
    summary: 'Cancelar carritos vencidos (CRON JOB)',
    description:
      'Busca y cancela todos los carritos ACTIVE que hayan superado las 24hs de vida. Restaura el stock. Este endpoint se ejecuta automáticamente cada 2 horas, pero puede ser invocado manualmente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Carritos vencidos cancelados exitosamente',
  })
  @Post('cron/cancel-expired')
  cancelExpiredCarts() {
    return this.saleOrdersService.cancelExpiredCarts();
  }

  // ==================== CHECKOUT Y MERCADO PAGO ====================

  @ApiOperation({
    summary: 'Iniciar checkout con Mercado Pago',
    description:
      'Cambia el carrito de ACTIVE a PENDING y genera el link de pago de Mercado Pago. Retorna la URL para redirigir al usuario al checkout.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario',
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout iniciado - retorna link de pago',
    schema: {
      example: {
        message: 'Checkout exitoso',
        checkoutUrl:
          'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abc...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Carrito vacío o vencido' })
  @ApiResponse({ status: 404, description: 'No hay carrito activo' })

  // ==================== ENDPOINTS ORIGINALES ====================
  @ApiOperation({
    summary: 'Create new sale order (DEPRECADO - usar cart/add)',
  })
  @Post()
  create(@Body() createSaleOrderDto: CreateSaleOrderDto) {
    return this.saleOrdersService.create(createSaleOrderDto);
  }

  @ApiOperation({ summary: 'Get all sale orders' })
  @Get()
  findAll() {
    return this.saleOrdersService.findAll();
  }

  @ApiOperation({ summary: 'Get sale order by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleOrdersService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update sale order' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSaleOrderDto: UpdateSaleOrderDto,
  ) {
    return this.saleOrdersService.update(+id, updateSaleOrderDto);
  }

  @ApiOperation({ summary: 'Delete sale order' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saleOrdersService.remove(+id);
  }

  // ==================== CÁLCULO DE ENVÍO ====================

  @ApiOperation({
    summary: 'Calcular costo de envío',
    description: `Calcula el costo de envío por dos métodos:
    
    **MÉTODO 1 - Código Postal (zonas):**
    - CABA (1001-1439): $1500
    - GBA (1600-1900): $2000
    - Interior BA (2000-7999): $3000
    - Resto del país (8000+): $5000
    
    **MÉTODO 2 - GPS (distancia real):**
    - 0-10 km: $1500
    - 10-30 km: $2500
    - 30-100 km: $4000
    - 100-300 km: $6000
    - +300 km: $8000
    
    Enviar **código postal** O **coordenadas (latitude, longitude)**`,
  })
  @ApiBody({
    type: CalculateShippingDto,
    examples: {
      gps: {
        summary: 'Por GPS (RECOMENDADO)',
        description: 'Cálculo preciso usando coordenadas GPS',
        value: {
          latitude: -34.6037,
          longitude: -58.3816,
        },
      },
      postalCode: {
        summary: 'Por Código Postal',
        description: 'Cálculo estimado por zonas',
        value: {
          postalCode: '1425',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Costo de envío calculado exitosamente',
    schema: {
      oneOf: [
        {
          title: 'Respuesta por GPS',
          example: {
            method: 'gps_distance',
            latitude: -34.6037,
            longitude: -58.3816,
            distance: '5.23 km',
            distanceInMeters: 5230,
            estimatedDuration: '15 minutos',
            zone: 'Zona cercana (0-10 km)',
            shippingCost: 1500,
            deliveryTime: '24-48 horas',
            currency: 'ARS',
            message: 'Costo de envío calculado por distancia real',
          },
        },
        {
          title: 'Respuesta por Código Postal',
          example: {
            method: 'postal_code',
            postalCode: '1425',
            zone: 'CABA',
            shippingCost: 1500,
            deliveryTime: '24-48 horas',
            currency: 'ARS',
            message: 'Costo de envío calculado por zona postal',
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Código postal inválido o coordenadas incorrectas',
  })
  @Post('calculate-shipping')
  calculateShipping(@Body() dto: CalculateShippingDto) {
    return this.saleOrdersService.calculateShipping(dto);
  }

  // ==================== ENDPOINT DE PRUEBA ====================

  @ApiOperation({
    summary: 'TEST: Completar orden manualmente',
    description:
      'Endpoint de prueba para marcar una orden como PAID sin pasar por MercadoPago',
  })
  @Get('test/complete-order/:orderId')
  async testCompleteOrder(@Param('orderId') orderId: string) {
    await this.saleOrdersService.updateOrderStatus(orderId, 'PAID');
    return { message: 'Orden actualizada a PAID' };
  }

  //==================== ENDPOINT DE STRIPE ====================

  @ApiOperation({
    summary: 'Procesar checkout con Stripe',
    description:
      'Convierte el carrito ACTIVE en PENDING y genera una sesión de pago en Stripe',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión de Stripe creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Carrito vacío o vencido' })
  @ApiResponse({ status: 404, description: 'No hay carrito activo' })
  @Post('checkout-stripe/:userId')
  checkoutWithStripe(
    @Param('userId') userId: string,
    @Body()
    checkoutDto: {
      success_url: string;
      cancel_url: string;
    },
  ) {
    return this.saleOrdersService.checkoutWithStripe(userId, checkoutDto);
  }
}
