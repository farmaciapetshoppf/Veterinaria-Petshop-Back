import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import axios from 'axios';
import { CreateSaleOrderDto } from './dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto';
import { SaleOrder, SaleOrderStatus } from './entities/sale-order.entity';
import { SaleOrderProduct } from './entities/sale-order-product.entity';
import { Users } from 'src/users/entities/user.entity';
import { Products } from 'src/products/entities/product.entity';
import { Branch } from 'src/branches/entities/branch.entity';

@Injectable()
export class SaleOrdersService {
  private mercadoPagoClient: Preference;

  constructor(
    @InjectRepository(SaleOrder)
    private readonly saleOrderRepository: Repository<SaleOrder>,
    @InjectRepository(SaleOrderProduct)
    private readonly saleOrderProductRepository: Repository<SaleOrderProduct>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    // Inicializar MercadoPago
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (accessToken) {
      const client = new MercadoPagoConfig({ 
        accessToken,
        options: { timeout: 5000 }
      });
      this.mercadoPagoClient = new Preference(client);
    }
  }

  // ==================== CARRITO ACTIVO ====================
  
  /**
   * Agregar producto al carrito activo del usuario
   * - Busca o crea carrito ACTIVE
   * - Descuenta stock inmediatamente
   * - Expira en 24hs
   */
  async addToCart(userId: string, productId: string, quantity: number) {
    return this.dataSource.transaction(async (manager) => {
      // Buscar carrito activo del usuario
      let cart = await manager.findOne(SaleOrder, {
        where: { 
          buyer: { id: userId }, 
          status: SaleOrderStatus.ACTIVE
        },
        relations: ['items', 'items.product'],
      });

      const buyer = await manager.findOne(Users, { where: { id: userId } });
      if (!buyer) throw new NotFoundException(`User ${userId} not found`);

      // Si no existe carrito, crear uno nuevo
      if (!cart) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24hs desde ahora

        cart = manager.create(SaleOrder, {
          buyer,
          status: SaleOrderStatus.ACTIVE,
          total: 0,
          expiresAt,
          items: [],
        });
        cart = await manager.save(SaleOrder, cart);
      }

      // Validar que el carrito no estÃ© vencido
      if (cart.expiresAt && new Date() > cart.expiresAt) {
        throw new BadRequestException('El carrito ha expirado. Se crearÃ¡ uno nuevo.');
      }

      // Buscar el producto
      const product = await manager.findOne(Products, {
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      // Validar stock disponible
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${quantity}`,
        );
      }

      // Verificar si el producto ya estÃ¡ en el carrito
      const existingItem = cart.items?.find(item => item.product.id === productId);

      if (existingItem) {
        // Actualizar cantidad existente
        const additionalQty = quantity;
        
        // Validar que hay stock para la cantidad adicional
        if (product.stock < additionalQty) {
          throw new BadRequestException(
            `Stock insuficiente. Ya tenÃ©s ${existingItem.quantity} en el carrito. Disponible: ${product.stock}`,
          );
        }

        // Descontar stock adicional
        product.stock -= additionalQty;
        await manager.save(Products, product);

        // Actualizar item del carrito
        existingItem.quantity += additionalQty;
        await manager.save(SaleOrderProduct, existingItem);
      } else {
        // Agregar nuevo item al carrito
        // Descontar stock inmediatamente
        product.stock -= quantity;
        await manager.save(Products, product);

        const newItem = manager.create(SaleOrderProduct, {
          order: cart,
          product,
          quantity,
          unitPrice: product.price,
        });
        await manager.save(SaleOrderProduct, newItem);
      }

      // Recalcular total del carrito
      const updatedCart = await manager.findOne(SaleOrder, {
        where: { id: cart.id },
        relations: ['items', 'items.product'],
      });

      if (updatedCart) {
        updatedCart.total = updatedCart.items.reduce(
          (sum, item) => sum + Number(item.unitPrice) * item.quantity,
          0,
        );
        await manager.save(SaleOrder, updatedCart);
      }

      return {
        message: 'Producto agregado al carrito',
        data: updatedCart,
      };
    });
  }

  /**
   * Obtener carrito activo del usuario
   */
  async getActiveCart(userId: string) {
    const cart = await this.saleOrderRepository.findOne({
      where: { 
        buyer: { id: userId }, 
        status: SaleOrderStatus.ACTIVE
      },
      relations: ['items', 'items.product', 'buyer'],
    });

    if (!cart) {
      return { message: 'No hay carrito activo', data: null };
    }

    // Verificar si expirÃ³
    if (cart.expiresAt && new Date() > cart.expiresAt) {
      // Cancelar y restaurar stock
      await this.cancelExpiredCart(cart.id);
      return { message: 'El carrito ha expirado', data: null };
    }

    return { message: 'Carrito activo', data: cart };
  }

  /**
   * Actualizar cantidad de un producto en el carrito
   */
  async updateCartItem(userId: string, productId: string, newQuantity: number) {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(SaleOrder, {
        where: { 
          buyer: { id: userId }, 
          status: SaleOrderStatus.ACTIVE
        },
        relations: ['items', 'items.product'],
      });

      if (!cart) {
        throw new NotFoundException('No hay carrito activo');
      }

      const item = cart.items.find(i => i.product.id === productId);
      if (!item) {
        throw new NotFoundException('Producto no encontrado en el carrito');
      }

      const product = await manager.findOne(Products, {
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const currentQuantity = item.quantity;
      const difference = newQuantity - currentQuantity;

      if (difference > 0) {
        // Aumentar cantidad - necesita mÃ¡s stock
        if (product.stock < difference) {
          throw new BadRequestException(
            `Stock insuficiente. Disponible: ${product.stock}`,
          );
        }
        product.stock -= difference;
      } else if (difference < 0) {
        // Reducir cantidad - devolver stock
        product.stock += Math.abs(difference);
      }

      await manager.save(Products, product);

      if (newQuantity === 0) {
        // Eliminar item del carrito
        await manager.remove(SaleOrderProduct, item);
      } else {
        // Actualizar cantidad
        item.quantity = newQuantity;
        await manager.save(SaleOrderProduct, item);
      }

      // Recalcular total
      const updatedCart = await manager.findOne(SaleOrder, {
        where: { id: cart.id },
        relations: ['items', 'items.product'],
      });

      if (updatedCart) {
        updatedCart.total = updatedCart.items.reduce(
          (sum, i) => sum + Number(i.unitPrice) * i.quantity,
          0,
        );
        await manager.save(SaleOrder, updatedCart);
      }

      return {
        message: 'Carrito actualizado',
        data: updatedCart,
      };
    });
  }

  /**
   * Eliminar producto del carrito
   */
  async removeFromCart(userId: string, productId: string) {
    return this.updateCartItem(userId, productId, 0);
  }

  /**
   * Vaciar carrito completo
   */
  async clearCart(userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(SaleOrder, {
        where: { 
          buyer: { id: userId }, 
          status: SaleOrderStatus.ACTIVE
        },
        relations: ['items', 'items.product'],
      });

      if (!cart) {
        return { message: 'No hay carrito activo para vaciar', data: null };
      }

      // Restaurar stock de todos los productos
      for (const item of cart.items) {
        const product = await manager.findOne(Products, {
          where: { id: item.product.id },
        });
        if (product) {
          product.stock += item.quantity;
          await manager.save(Products, product);
        }
      }

      // Eliminar carrito
      await manager.remove(SaleOrder, cart);

      return { message: 'Carrito vaciado exitosamente', data: null };
    });
  }

  /**
   * Obtener historial de Ã³rdenes pagadas del usuario
   */
  async getOrderHistory(userId: string) {
    const orders = await this.saleOrderRepository.find({
      where: { 
        buyer: { id: userId },
        status: SaleOrderStatus.PAID
      },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });

    return { 
      message: 'Historial de compras', 
      data: orders 
    };
  }

  /**
   * Checkout: Crear preferencia de MercadoPago
   */
  async checkout(userId: string) {
    if (!this.mercadoPagoClient) {
      throw new BadRequestException('MercadoPago no estÃ¡ configurado. Verifica MERCADOPAGO_ACCESS_TOKEN en .env');
    }

    // 1. Obtener carrito activo
    const cart = await this.saleOrderRepository.findOne({
      where: { 
        buyer: { id: userId }, 
        status: SaleOrderStatus.ACTIVE
      },
      relations: ['items', 'items.product', 'buyer'],
    });

    if (!cart) {
      throw new NotFoundException('No hay carrito activo para procesar');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('El carrito estÃ¡ vacÃ­o');
    }

    // 2. Verificar que no estÃ© vencido
    if (cart.expiresAt && new Date() > cart.expiresAt) {
      await this.cancelExpiredCart(cart.id);
      throw new BadRequestException('El carrito ha expirado');
    }

    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
      const ngrokUrl = this.configService.get<string>('NGROK_URL');
      const publicBackendUrl = ngrokUrl || 
        this.configService.get<string>('BACKEND_PUBLIC_URL') ||
        this.configService.get<string>('API_URL') ||
        'http://localhost:3000';
      const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');

      console.log('URLs configuradas:', { frontendUrl, publicBackendUrl, notificationUrl: `${publicBackendUrl}/sale-orders/webhook` });
      console.log('Access Token (prefijo):', accessToken?.substring(0, 20) + '...');

      // 3. Crear preferencia usando axios directamente
      const response = await axios.post(
        'https://api.mercadopago.com/checkout/preferences',
        {
          items: cart.items.map(item => ({
            id: String(item.product.id),
            title: item.product.name,
            quantity: item.quantity,
            unit_price: Number(item.unitPrice),
            currency_id: 'ARS',
          })),
          back_urls: {
            success: `${frontendUrl}/dashboard`,
            failure: `${frontendUrl}/checkout/failure`,
            pending: `${frontendUrl}/dashboard`,
          },
          auto_return: 'approved',
          notification_url: `${publicBackendUrl}/sale-orders/webhook`,
          external_reference: String(cart.id),
          metadata: {
            orderId: cart.id,
            userId: userId,
          },
          payer: {
            email: cart.buyer?.email || undefined,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const result = response.data;

      console.log('âœ… Respuesta de MercadoPago:', JSON.stringify(result, null, 2));

      // 5. Guardar ID de preferencia en el carrito y cambiar estado a PENDING
      cart.mercadoPagoId = result.id;
      cart.status = SaleOrderStatus.PENDING;
      await this.saleOrderRepository.save(cart);

      return {
        message: 'Preferencia de pago creada exitosamente',
        data: {
          preferenceId: result.id,
          initPoint: result.init_point,
          sandboxInitPoint: result.sandbox_init_point,
        },
      };
    } catch (error) {
      console.error('âŒ Error creando preferencia de MercadoPago:', error);
      const err = error as any;
      const errorMessage = err?.response?.data || err?.message || 'Error desconocido';
      console.error('Detalles del error:', JSON.stringify(errorMessage, null, 2));
      throw new BadRequestException('Error al crear la preferencia de pago: ' + JSON.stringify(errorMessage));
    }
  }

  /**
   * Webhook de MercadoPago para recibir notificaciones de pago
   */
  async handleWebhook(body: any) {
    console.log('🔔 Webhook recibido de MercadoPago:', JSON.stringify(body, null, 2));

    try {
      const topic = body.type || body.topic;
      
      // Manejar merchant_order
      if (topic === 'merchant_order') {
        const merchantOrderId = body.data?.id || body['data.id'] || body.id;
        if (!merchantOrderId) {
          console.warn('⚠️ Webhook merchant_order sin ID');
          return { message: 'Webhook recibido sin merchant_order ID' };
        }

        console.log('📦 Procesando merchant_order:', merchantOrderId);
        
        const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
        const merchantOrderResponse = await axios.get(
          `https://api.mercadolibre.com/merchant_orders/${merchantOrderId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const merchantOrder = merchantOrderResponse.data;
        console.log('📋 Merchant Order:', JSON.stringify(merchantOrder, null, 2));

        const orderId = merchantOrder.external_reference;
        if (!orderId) {
          console.warn('⚠️ Merchant order sin external_reference');
          return { message: 'Merchant order sin external_reference' };
        }

        const order = await this.saleOrderRepository.findOne({
          where: { id: orderId },
        });

        if (!order) {
          console.warn(`⚠️ Orden ${orderId} no encontrada`);
          return { message: 'Orden no encontrada' };
        }

        // Verificar si todos los pagos están aprobados
        const allPaid = merchantOrder.payments?.every((p: any) => p.status === 'approved');
        
        if (allPaid && merchantOrder.payments.length > 0) {
          order.status = SaleOrderStatus.PAID;
          order.mercadoPagoStatus = 'approved';
          await this.saleOrderRepository.save(order);
          console.log(`✅ Orden ${order.id} marcada como PAID`);
        } else {
          console.log(`⏳ Orden ${order.id} tiene pagos pendientes o rechazados`);
        }

        return { message: 'Webhook merchant_order procesado' };
      }
      
      // Manejar payment
      if (topic !== 'payment') {
        console.log('ℹ️ Evento ignorado (topic no es payment ni merchant_order):', topic);
        return { message: 'Evento ignorado' };
      }

      const paymentId = body.data?.id || body['data.id'];
      if (!paymentId) {
        console.warn('⚠️ Webhook sin paymentId');
        return { message: 'Webhook recibido pero sin paymentId' };
      }

      const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
      if (!accessToken) {
        throw new BadRequestException('MERCADOPAGO_ACCESS_TOKEN no configurado');
      }

      let payment;
      try {
        const paymentResponse = await axios.get(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        payment = paymentResponse.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn(`⚠️ Payment ${paymentId} no encontrado (probablemente sandbox/test)`);
          return { message: 'Payment no encontrado' };
        }
        throw error;
      }
      const orderId = payment.metadata?.orderId || payment.external_reference;

      if (!orderId) {
        console.warn('Pago sin orderId en metadata/external_reference');
        return { message: 'Webhook recibido sin orderId' };
      }

      const order = await this.saleOrderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        console.warn(`Orden ${orderId} no encontrada para payment ${paymentId}`);
        return { message: 'Orden no encontrada' };
      }

      const statusMap: Record<string, SaleOrderStatus> = {
        approved: SaleOrderStatus.PAID,
        rejected: SaleOrderStatus.CANCELLED,
        in_process: SaleOrderStatus.PENDING,
        pending: SaleOrderStatus.PENDING,
        cancelled: SaleOrderStatus.CANCELLED,
        refunded: SaleOrderStatus.CANCELLED,
        charged_back: SaleOrderStatus.CANCELLED,
      };

      order.mercadoPagoStatus = payment.status;
      order.mercadoPagoId = paymentId;
      order.status = statusMap[payment.status] || order.status;

      await this.saleOrderRepository.save(order);
      console.log(`Orden ${order.id} actualizada a estado: ${order.status} (MP: ${payment.status})`);

      return { message: 'Webhook procesado correctamente' };
    } catch (error) {
      console.error('Error procesando webhook:', error);
      throw new BadRequestException('Error procesando webhook');
    }
  }

  /**
   * Cancelar carrito vencido y restaurar stock
   */
  async cancelExpiredCart(cartId: string) {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(SaleOrder, {
        where: { id: cartId },
        relations: ['items', 'items.product'],
      });

      if (!cart) return;

      // Restaurar stock de todos los productos
      for (const item of cart.items) {
        const product = await manager.findOne(Products, {
          where: { id: item.product.id },
        });
        if (product) {
          product.stock += item.quantity;
          await manager.save(Products, product);
        }
      }

      // Cambiar estado a CANCELLED
      cart.status = SaleOrderStatus.CANCELLED;
      await manager.save(SaleOrder, cart);

      return { message: 'Carrito cancelado y stock restaurado' };
    });
  }

  /**
   * Tarea programada: Cancelar carritos vencidos
   * Se ejecuta automÃ¡ticamente cada 2 horas
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async cancelExpiredCarts() {
    console.log('ðŸ• Ejecutando tarea programada: Cancelar carritos vencidos...');
    
    const expiredCarts = await this.saleOrderRepository.find({
      where: {
        status: SaleOrderStatus.ACTIVE,
      },
      relations: ['items', 'items.product'],
    });

    const now = new Date();
    const cancelled: string[] = [];

    for (const cart of expiredCarts) {
      if (cart.expiresAt && now > cart.expiresAt) {
        await this.cancelExpiredCart(cart.id);
        cancelled.push(cart.id);
      }
    }

    console.log(`âœ… Tarea completada: ${cancelled.length} carritos cancelados`);
    
    return {
      message: `${cancelled.length} carritos vencidos cancelados`,
      data: cancelled,
    };
  }

  // ==================== MÃ‰TODO ORIGINAL (DEPRECADO) ====================
  // Este mÃ©todo ya no se usa porque ahora el flujo es: addToCart â†’ checkout â†’ pago
  async create(dto: CreateSaleOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      // Validar comprador (buyer)
      const buyer = await manager.findOne(Users, { where: { id: dto.userId } });
      if (!buyer) throw new NotFoundException(`User ${dto.userId} not found`);

      // Validate branch if provided
      let branch: Branch | undefined = undefined;
      if (dto.branchId) {
        const foundBranch = await manager.findOne(Branch, {
          where: { id: dto.branchId },
        });
        if (!foundBranch)
          throw new NotFoundException(`Branch ${dto.branchId} not found`);
        branch = foundBranch;
      }

      // Validate products and stock
      const orderItems: SaleOrderProduct[] = [];
      let total = 0;

      for (const item of dto.items) {
        const product = await manager.findOne(Products, {
          where: { id: item.productId },
        });
        if (!product)
          throw new NotFoundException(`Product ${item.productId} not found`);

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
          );
        }

        // Decrement stock
        product.stock -= item.quantity;
        await manager.save(Products, product);

        // Calculate line total
        const lineTotal = Number(product.price) * item.quantity;
        total += lineTotal;

        // Create order item (will be saved with cascade)
        const orderItem = manager.create(SaleOrderProduct, {
          product,
          quantity: item.quantity,
          unitPrice: product.price,
        });
        orderItems.push(orderItem);
      }

      // Create sale order
      const saleOrder = manager.create(SaleOrder, {
        buyer,
        branch: branch ?? undefined,
        items: orderItems,
        total,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
      });

      const saved = await manager.save(SaleOrder, saleOrder);

      // Load full order with relations for response
      const fullOrder = await manager.findOne(SaleOrder, {
        where: { id: saved.id },
        relations: ['buyer', 'branch', 'items', 'items.product'],
      });

      return {
        message: 'Sale order created successfully',
        data: fullOrder,
      };
    });
  }

  async findAll() {
    const orders = await this.saleOrderRepository.find({
      relations: ['buyer', 'branch', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
    return { message: 'Sale orders retrieved', data: orders };
  }

  async findOne(id: number) {
    const order = await this.saleOrderRepository.findOne({
      where: { id: String(id) },
      relations: ['buyer', 'branch', 'items', 'items.product'],
    });
    if (!order) throw new NotFoundException(`Sale order ${id} not found`);
    return { message: `Sale order ${id} retrieved`, data: order };
  }

  async update(id: number, updateSaleOrderDto: UpdateSaleOrderDto) {
    await this.saleOrderRepository.update(id, updateSaleOrderDto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.saleOrderRepository.delete(id);
    if (result.affected && result.affected > 0)
      return { message: `Sale order ${id} removed` };
    throw new NotFoundException(`Sale order ${id} not found`);
  }

  // ==================== MÃ‰TODO DE PRUEBA ====================
  
  /**
   * Actualizar estado de una orden manualmente (para testing)
   */
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.saleOrderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Orden ${orderId} no encontrada`);
    }

    order.status = status as SaleOrderStatus;
    await this.saleOrderRepository.save(order);

    return {
      message: `Orden actualizada a estado ${status}`,
      data: order,
    };
  }
}












