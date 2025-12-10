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
import { ApiOperation, ApiTags, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Sale Orders')
@Controller('sale-orders')
export class SaleOrdersController {
  constructor(private readonly saleOrdersService: SaleOrdersService) {}

  // ==================== ENDPOINTS DE CARRITO ====================
  
  @ApiOperation({ 
    summary: 'Agregar producto al carrito activo',
    description: 'Agrega un producto al carrito del usuario. El stock se descuenta inmediatamente y el carrito expira en 24hs.'
  })
  @ApiBody({
    description: 'Datos del producto a agregar',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '84ef5839-2fc2-4689-a203-cf7bb25074d0', description: 'ID del usuario' },
        productId: { type: 'string', example: 'abc123', description: 'ID del producto' },
        quantity: { type: 'number', example: 2, description: 'Cantidad a agregar' }
      },
      required: ['userId', 'productId', 'quantity']
    }
  })
  @ApiResponse({ status: 200, description: 'Producto agregado exitosamente al carrito' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o carrito vencido' })
  @ApiResponse({ status: 404, description: 'Usuario o producto no encontrado' })
  @Post('cart/add')
  addToCart(
    @Body() body: { userId: string; productId: string; quantity: number },
  ) {
    console.log('🛒 Request para agregar al carrito:', {
      userId: body.userId,
      productId: body.productId,
      quantity: body.quantity,
      tipo: typeof body.quantity
    });
    return this.saleOrdersService.addToCart(
      body.userId,
      body.productId,
      body.quantity,
    );
  }

  @ApiOperation({ 
    summary: 'Obtener carrito activo del usuario',
    description: 'Retorna el carrito en estado ACTIVE con todos sus productos.'
  })
  @ApiParam({ 
    name: 'userId', 
    type: 'string', 
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario'
  })
  @ApiResponse({ status: 200, description: 'Carrito encontrado' })
  @ApiResponse({ status: 200, description: 'No hay carrito activo (data: null)' })
  @Get('cart/:userId')
  getActiveCart(@Param('userId') userId: string) {
    return this.saleOrdersService.getActiveCart(userId);
  }

  @ApiOperation({ 
    summary: 'Actualizar cantidad de producto en carrito',
    description: 'Modifica la cantidad de un producto. Si quantity=0, elimina el producto del carrito.'
  })
  @ApiBody({
    description: 'Datos para actualizar',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '84ef5839-2fc2-4689-a203-cf7bb25074d0', description: 'ID del usuario' },
        productId: { type: 'string', example: 'abc123', description: 'ID del producto' },
        quantity: { type: 'number', example: 5, description: 'Nueva cantidad (0 para eliminar)' }
      },
      required: ['userId', 'productId', 'quantity']
    }
  })
  @ApiResponse({ status: 200, description: 'Cantidad actualizada exitosamente' })
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
    description: 'Elimina un producto del carrito y restaura su stock.'
  })
  @ApiBody({
    description: 'IDs del usuario y producto',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '84ef5839-2fc2-4689-a203-cf7bb25074d0', description: 'ID del usuario' },
        productId: { type: 'string', example: 'abc123', description: 'ID del producto a eliminar' }
      },
      required: ['userId', 'productId']
    }
  })
  @ApiResponse({ status: 200, description: 'Producto eliminado del carrito' })
  @ApiResponse({ status: 404, description: 'Carrito o producto no encontrado' })
  @Delete('cart/remove')
  removeFromCart(
    @Body() body: { userId: string; productId: string },
  ) {
    return this.saleOrdersService.removeFromCart(body.userId, body.productId);
  }

  @ApiOperation({ 
    summary: 'Vaciar carrito completo',
    description: 'Elimina todos los productos del carrito y restaura el stock.'
  })
  @ApiParam({ 
    name: 'userId', 
    type: 'string', 
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario'
  })
  @ApiResponse({ status: 200, description: 'Carrito vaciado exitosamente' })
  @ApiResponse({ status: 200, description: 'No hay carrito activo para vaciar' })
  @Delete('cart/clear/:userId')
  clearCart(@Param('userId') userId: string) {
    return this.saleOrdersService.clearCart(userId);
  }

  @ApiOperation({ 
    summary: 'Obtener historial de compras',
    description: 'Retorna todas las órdenes pagadas (PAID) del usuario.'
  })
  @ApiParam({ 
    name: 'userId', 
    type: 'string', 
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario'
  })
  @ApiResponse({ status: 200, description: 'Historial de compras obtenido' })
  @Get('history/:userId')
  getOrderHistory(@Param('userId') userId: string) {
    return this.saleOrdersService.getOrderHistory(userId);
  }

  @ApiOperation({ 
    summary: 'Procesar checkout y crear preferencia de MercadoPago',
    description: 'Convierte el carrito ACTIVE en PENDING y genera una preferencia de pago en MercadoPago. Opcionalmente recibe back_urls personalizadas.'
  })
  @ApiParam({ 
    name: 'userId', 
    type: 'string', 
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0',
    description: 'ID del usuario'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Preferencia creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Preferencia de pago creada exitosamente' },
        data: {
          type: 'object',
          properties: {
            preferenceId: { type: 'string', example: '123456789-abcd-1234-5678-123456789abc' },
            initPoint: { type: 'string', example: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...' },
            sandboxInitPoint: { type: 'string', example: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Carrito vacío o vencido' })
  @ApiResponse({ status: 404, description: 'No hay carrito activo' })
  @Post('checkout/:userId')
  checkout(
    @Param('userId') userId: string,
    @Body() checkoutDto: CheckoutDto,
  ) {
    return this.saleOrdersService.checkout(userId, checkoutDto);
  }

  @ApiOperation({ 
    summary: 'Webhook de MercadoPago',
    description: 'Endpoint para recibir notificaciones de pago de MercadoPago. Este endpoint es llamado automáticamente por MercadoPago cuando hay cambios en el estado del pago.'
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado correctamente' })
  @Post('webhook')
  handleWebhook(@Body() body: any) {
    return this.saleOrdersService.handleWebhook(body);
  }

  @ApiOperation({ 
    summary: 'Cancelar carritos vencidos (CRON JOB)',
    description: 'Busca y cancela todos los carritos ACTIVE que hayan superado las 24hs de vida. Restaura el stock. Este endpoint se ejecuta automáticamente cada 2 horas, pero puede ser invocado manualmente.'
  })
  @ApiResponse({ status: 200, description: 'Carritos vencidos cancelados exitosamente' })
  @Post('cron/cancel-expired')
  cancelExpiredCarts() {
    return this.saleOrdersService.cancelExpiredCarts();
  }

  // ==================== CHECKOUT Y MERCADO PAGO ====================

  @ApiOperation({
    summary: 'Iniciar checkout con Mercado Pago',
    description: 'Cambia el carrito de ACTIVE a PENDING y genera el link de pago de Mercado Pago. Retorna la URL para redirigir al usuario al checkout.'
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario',
    example: '84ef5839-2fc2-4689-a203-cf7bb25074d0'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Checkout iniciado - retorna link de pago',
    schema: {
      example: {
        message: 'Checkout exitoso',
        checkoutUrl: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abc...'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Carrito vacío o vencido' })
  @ApiResponse({ status: 404, description: 'No hay carrito activo' })
  @Post('checkout/:userId')
  checkout(@Param('userId') userId: string) {
    return this.saleOrdersService.checkout(userId);
  }

  @ApiOperation({
    summary: 'Webhook de Mercado Pago',
    description: 'Endpoint para recibir notificaciones de pago de Mercado Pago. Actualiza el estado de la orden según el pago (approved -> PAID con email de confirmación, rejected/cancelled -> CANCELLED con stock restaurado).'
  })
  @ApiBody({
    description: 'Notificación de Mercado Pago',
    schema: {
      example: {
        action: 'payment.updated',
        data: {
          id: '1234567890'
        },
        type: 'payment'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado correctamente' })
  @Post('webhook')
  handleWebhook(@Body() body: any) {
    return this.saleOrdersService.handleWebhook(body);
  }

  // ==================== ENDPOINTS ORIGINALES ====================

  @ApiOperation({ summary: 'Create new sale order (DEPRECADO - usar cart/add)' })
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

  // ==================== ENDPOINT DE PRUEBA ====================
  
  @ApiOperation({ 
    summary: 'TEST: Completar orden manualmente',
    description: 'Endpoint de prueba para marcar una orden como PAID sin pasar por MercadoPago'
  })
  @Get('test/complete-order/:orderId')
  async testCompleteOrder(@Param('orderId') orderId: string) {
    await this.saleOrdersService.updateOrderStatus(orderId, 'PAID');
    return { message: 'Orden actualizada a PAID' };
  }
}
