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
import * as fs from 'fs';
import * as path from 'path';
import { MailerService } from 'src/mailer/mailer.service';
import { CreateSaleOrderDto } from './dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { SaleOrder, SaleOrderStatus } from './entities/sale-order.entity';
import { SaleOrderProduct } from './entities/sale-order-product.entity';
import { Users } from 'src/users/entities/user.entity';
import { Products } from 'src/products/entities/product.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import { MercadoPagoService } from 'src/mercadopago/mercadopago.service';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class SaleOrdersService {
  private mercadoPagoClient: Preference;
  private logFile = path.join(process.cwd(), 'mercadopago-checkout.log');

  private logToFile(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n${'='.repeat(80)}\n`;
    fs.appendFileSync(this.logFile, logMessage);
    console.log(message, data || '');
  }

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
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly mailerService: MailerService,
    private readonly stripeService: StripeService,
  ) {
    // Inicializar MercadoPago
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
    );
    if (accessToken) {
      const client = new MercadoPagoConfig({
        accessToken,
        options: { timeout: 5000 },
      });
      this.mercadoPagoClient = new Preference(client);
    }
  }

  // ==================== CARRITO ACTIVO ====================

  /**
   * Agregar producto al carrito activo del usuario
   * - Busca o crea carrito ACTIVE
   * - NO descuenta stock (se descuenta al hacer checkout)
   * - Expira en 24hs
   */
  async addToCart(userId: string, productId: string, quantity: number) {
    return this.dataSource.transaction(async (manager) => {
      // Buscar carrito activo del usuario
      let cart = await manager.findOne(SaleOrder, {
        where: {
          buyer: { id: userId },
          status: SaleOrderStatus.ACTIVE,
        },
        relations: { items: { product: true } },
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

      // Validar que el carrito no esté vencido
      if (cart.expiresAt && new Date() > cart.expiresAt) {
        throw new BadRequestException(
          'El carrito ha expirado. Se creará uno nuevo.',
        );
      }

      // Buscar el producto
      const product = await manager.findOne(Products, {
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      // Validar stock disponible (sin descontar)
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${quantity}`,
        );
      }

      // Verificar si el producto ya está en el carrito
      const existingItem = cart.items?.find(
        (item) => item.product.id === productId,
      );

      console.log(
        `?? addToCart - Usuario: ${userId}, Producto: ${product.name} (${productId}), Cantidad: ${quantity}`,
      );
      console.log(
        `?? Items actuales en carrito:`,
        cart.items?.map((i) => `${i.product.name} x${i.quantity}`),
      );

      if (existingItem) {
        console.log(
          `?? Item YA existe en carrito, actualizando cantidad: ${existingItem.quantity} ? ${existingItem.quantity + quantity}`,
        );

        // Actualizar cantidad existente
        const newTotalQty = existingItem.quantity + quantity;

        // Validar que hay stock para la nueva cantidad total
        if (product.stock < newTotalQty) {
          throw new BadRequestException(
            `Stock insuficiente. Ya tenés ${existingItem.quantity} en el carrito. Disponible: ${product.stock}`,
          );
        }

        // Actualizar item del carrito (SIN descontar stock)
        existingItem.quantity = newTotalQty;
        await manager.save(SaleOrderProduct, existingItem);
      } else {
        console.log(`? Nuevo item, agregando al carrito`);

        // Agregar nuevo item al carrito
        // Descontar stock inmediatamente
        product.stock -= quantity;
        await manager.save(Products, product);

        // Agregar nuevo item al carrito (SIN descontar stock)
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
        relations: { items: { product: true }, buyer: true },
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
        status: SaleOrderStatus.ACTIVE,
      },
      relations: { items: { product: true }, buyer: true },
    });

    if (!cart) {
      return { message: 'No hay carrito activo', data: null };
    }

    // Verificar si expiró
    if (cart.expiresAt && new Date() > cart.expiresAt) {
      // Cancelar y restaurar stock
      await this.cancelExpiredCart(cart.id);
      return { message: 'El carrito ha expirado', data: null };
    }

    // ?? DEDUPLICAR items con el mismo producto (fix para llamadas duplicadas del front)
    const productMap = new Map<string, SaleOrderProduct>();
    const duplicates: SaleOrderProduct[] = [];

    for (const item of cart.items) {
      const productId = item.product.id;
      if (productMap.has(productId)) {
        // Si ya existe, sumar la cantidad al item existente
        const existing = productMap.get(productId)!;
        existing.quantity += item.quantity;
        duplicates.push(item);
        console.log(
          `?? Duplicado detectado: ${item.product.name} (qty: ${item.quantity})`,
        );
      } else {
        productMap.set(productId, item);
      }
    }

    // Eliminar duplicados de la BD si se encontraron
    if (duplicates.length > 0) {
      console.log(
        `??? Eliminando ${duplicates.length} items duplicados del carrito`,
      );
      await this.saleOrderProductRepository.remove(duplicates);

      // Actualizar items consolidados
      const consolidated = Array.from(productMap.values());
      for (const item of consolidated) {
        await this.saleOrderProductRepository.save(item);
      }

      cart.items = consolidated;

      // Recalcular total
      cart.total = cart.items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      );
      await this.saleOrderRepository.save(cart);

      console.log(
        `? Carrito consolidado: ${cart.items.length} items �nicos, total: $${cart.total}`,
      );
    }

    return { message: 'Carrito activo', data: cart };
  }

  /**
   * Actualizar cantidad de un producto en el carrito
   * Stock NO se modifica, solo se valida
   */
  async updateCartItem(userId: string, productId: string, newQuantity: number) {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(SaleOrder, {
        where: {
          buyer: { id: userId },
          status: SaleOrderStatus.ACTIVE,
        },
        relations: { items: { product: true } },
      });

      if (!cart) {
        throw new NotFoundException('No hay carrito activo');
      }

      const item = cart.items.find((i) => i.product.id === productId);
      if (!item) {
        throw new NotFoundException('Producto no encontrado en el carrito');
      }

      const product = await manager.findOne(Products, {
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      // Validar stock disponible para la nueva cantidad (sin descontar)
      if (newQuantity > 0 && product.stock < newQuantity) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${newQuantity}`,
        );
      }

      if (newQuantity === 0) {
        // Eliminar item del carrito
        await manager.remove(SaleOrderProduct, item);
      } else {
        // Actualizar cantidad (SIN modificar stock)
        item.quantity = newQuantity;
        await manager.save(SaleOrderProduct, item);
      }

      // Recalcular total
      const updatedCart = await manager.findOne(SaleOrder, {
        where: { id: cart.id },
        relations: { items: { product: true } },
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
   * Stock NO se restaura porque nunca se descont�
   */
  async clearCart(userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(SaleOrder, {
        where: {
          buyer: { id: userId },
          status: SaleOrderStatus.ACTIVE,
        },
        relations: { items: { product: true } },
      });

      if (!cart) {
        return { message: 'No hay carrito activo para vaciar', data: null };
      }

      // Eliminar carrito directamente (sin restaurar stock)
      await manager.remove(SaleOrder, cart);

      return { message: 'Carrito vaciado exitosamente', data: null };
    });
  }

  /**
   * Obtener historial de órdenes pagadas del usuario
   */
  async getOrderHistory(userId: string) {
    const orders = await this.saleOrderRepository.find({
      where: {
        buyer: { id: userId },
        status: SaleOrderStatus.PAID,
      },
      relations: { items: { product: true } },
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Historial de compras',
      data: orders,
    };
  }

  /**
   * Checkout: Crear preferencia de MercadoPago
   */
  async checkout(
    userId: string,
    checkoutDto: {
      success_url: string;
      failure_url: string;
      pending_url: string;
      auto_return?: 'approved' | 'all';
    },
  ) {
    if (!this.mercadoPagoClient) {
      throw new BadRequestException(
        'MercadoPago no está configurado. Verifica MERCADOPAGO_ACCESS_TOKEN en .env',
      );
    }

    // 1. Obtener carrito activo
    const cart = await this.saleOrderRepository.findOne({
      where: {
        buyer: { id: userId },
        status: SaleOrderStatus.ACTIVE,
      },
      relations: { items: { product: true }, buyer: true },
    });

    if (!cart) {
      throw new NotFoundException('No hay carrito activo para procesar');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // 2. Verificar que no esté vencido
    if (cart.expiresAt && new Date() > cart.expiresAt) {
      await this.cancelExpiredCart(cart.id);
      throw new BadRequestException('El carrito ha expirado');
    }

    try {
      // Configuración del backend
      const apiUrl =
        this.configService.get<string>('API_URL') ||
        'https://veterinaria-petshop-back.onrender.com';
      const accessToken = this.configService.get<string>(
        'MERCADOPAGO_ACCESS_TOKEN',
      );

      if (!accessToken) {
        throw new BadRequestException('Token de MercadoPago no configurado');
      }

      this.logToFile('🌐 Backend configurado:', {
        apiUrl,
        notificationUrl: `${apiUrl}/sale-orders/webhook`,
      });
      this.logToFile(
        '?? Access Token (prefijo):',
        accessToken?.substring(0, 20) + '...',
      );
      this.logToFile('?? CheckoutDto recibido desde el frontend:', checkoutDto);

      // Validar que el frontend envíe las URLs (son obligatorias)
      if (
        !checkoutDto?.success_url ||
        !checkoutDto?.failure_url ||
        !checkoutDto?.pending_url
      ) {
        throw new BadRequestException(
          'Las URLs de retorno (success_url, failure_url, pending_url) son obligatorias en el body',
        );
      }

      // Usar SOLO las URLs que vienen del frontend (sin fallback)
      const backUrls = {
        success: checkoutDto.success_url,
        failure: checkoutDto.failure_url,
        pending: checkoutDto.pending_url,
      };

      this.logToFile('?? Back URLs recibidas del frontend:', backUrls);

      // 3. Crear preferencia usando el SDK de MercadoPago
      const client = new MercadoPagoConfig({
        accessToken: accessToken,
        options: { timeout: 5000 },
      });

      const preference = new Preference(client);

      const preferenceBody: any = {
        items: cart.items.map((item) => ({
          id: String(item.product.id),
          title: item.product.name,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: 'ARS',
        })),
        back_urls: backUrls,
        notification_url: `${apiUrl}/sale-orders/webhook`,
        external_reference: String(cart.id),
        metadata: {
          order_id: cart.id,
          user_id: userId,
        },
        payer: {
          email: cart.buyer?.email || undefined,
        },
      };

      // Agregar auto_return solo si se proporciona
      if (checkoutDto?.auto_return) {
        preferenceBody.auto_return = checkoutDto.auto_return;
        this.logToFile('?? Auto return habilitado:', checkoutDto.auto_return);
      }

      const preferenceData = { body: preferenceBody };

      this.logToFile('?? Datos que se enviar�n al SDK:', preferenceData);

      const result = await preference.create(preferenceData);

      this.logToFile('? Respuesta COMPLETA de MercadoPago:', result);

      // 5. Guardar ID de preferencia en el carrito y cambiar estado a PENDING
      cart.mercadoPagoId = result.id;
      cart.status = SaleOrderStatus.PENDING;
      await this.saleOrderRepository.save(cart);

      return {
        message: 'Preferencia de pago creada exitosamente',
        data: {
          preferenceId: result.id,
          initPoint: result.init_point, // Este es el link de PRODUCCI�N
          sandboxInitPoint: result.sandbox_init_point, // Este es solo para testing
        },
      };
    } catch (error) {
      console.error('? Error creando preferencia de MercadoPago:', error);
      const err = error as any;
      const errorMessage =
        err?.response?.data || err?.message || 'Error desconocido';
      console.error(
        'Detalles del error:',
        JSON.stringify(errorMessage, null, 2),
      );
      throw new BadRequestException('Error al generar preferencia de pago');
    }
  }

  /**
   * Webhook de MercadoPago para recibir notificaciones de pago
   */
  async handleWebhook(body: any) {
    console.log(
      '?? Webhook recibido de MercadoPago:',
      JSON.stringify(body, null, 2),
    );

    try {
      const topic = body.type || body.topic;

      // Manejar merchant_order
      if (topic === 'merchant_order') {
        const merchantOrderId = body.data?.id || body['data.id'] || body.id;
        if (!merchantOrderId) {
          console.warn('?? Webhook merchant_order sin ID');
          return { message: 'Webhook recibido sin merchant_order ID' };
        }

        console.log('?? Procesando merchant_order:', merchantOrderId);

        const accessToken = this.configService.get<string>(
          'MERCADOPAGO_ACCESS_TOKEN',
        );
        const merchantOrderResponse = await axios.get(
          `https://api.mercadolibre.com/merchant_orders/${merchantOrderId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const merchantOrder = merchantOrderResponse.data;
        console.log(
          '?? Merchant Order:',
          JSON.stringify(merchantOrder, null, 2),
        );

        const orderId = merchantOrder.external_reference;
        if (!orderId) {
          console.warn('?? Merchant order sin external_reference');
          return { message: 'Merchant order sin external_reference' };
        }

        const order = await this.saleOrderRepository.findOne({
          where: { id: orderId },
        });

        if (!order) {
          console.warn(`?? Orden ${orderId} no encontrada`);
          return { message: 'Orden no encontrada' };
        }

        // Verificar si todos los pagos est�n aprobados
        const allPaid = merchantOrder.payments?.every(
          (p: any) => p.status === 'approved',
        );

        if (allPaid && merchantOrder.payments.length > 0) {
          order.status = SaleOrderStatus.PAID;
          order.mercadoPagoStatus = 'approved';
          await this.saleOrderRepository.save(order);
          console.log(`? Orden ${order.id} marcada como PAID`);
        } else {
          console.log(
            `? Orden ${order.id} tiene pagos pendientes o rechazados`,
          );
        }

        return { message: 'Webhook merchant_order procesado' };
      }

      // Manejar payment
      if (topic !== 'payment') {
        console.log(
          '?? Evento ignorado (topic no es payment ni merchant_order):',
          topic,
        );
        return { message: 'Evento ignorado' };
      }

      const paymentId = body.data?.id || body['data.id'];
      if (!paymentId) {
        console.warn('?? Webhook sin paymentId');
        return { message: 'Webhook recibido pero sin paymentId' };
      }

      const accessToken = this.configService.get<string>(
        'MERCADOPAGO_ACCESS_TOKEN',
      );
      if (!accessToken) {
        throw new BadRequestException(
          'MERCADOPAGO_ACCESS_TOKEN no configurado',
        );
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
          console.warn(
            `?? Payment ${paymentId} no encontrado (probablemente sandbox/test)`,
          );
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
        console.warn(
          `Orden ${orderId} no encontrada para payment ${paymentId}`,
        );
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
      console.log(
        `Orden ${order.id} actualizada a estado: ${order.status} (MP: ${payment.status})`,
      );

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
        relations: { items: { product: true } },
      });

      if (!cart) return;

      // Solo cambiar estado a CANCELLED (sin restaurar stock)
      cart.status = SaleOrderStatus.CANCELLED;
      await manager.save(SaleOrder, cart);

      return { message: 'Carrito cancelado' };
    });
  }

  /**
   * Tarea programada: Cancelar carritos vencidos
   * Se ejecuta automáticamente cada 2 horas
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async cancelExpiredCarts() {
    console.log(
      '🕐 Ejecutando tarea programada: Cancelar carritos vencidos...',
    );

    const expiredCarts = await this.saleOrderRepository.find({
      where: {
        status: SaleOrderStatus.ACTIVE,
      },
      relations: { items: { product: true } },
    });

    const now = new Date();
    const cancelled: string[] = [];

    for (const cart of expiredCarts) {
      if (cart.expiresAt && now > cart.expiresAt) {
        await this.cancelExpiredCart(cart.id);
        cancelled.push(cart.id);
      }
    }

    console.log(`✅ Tarea completada: ${cancelled.length} carritos cancelados`);

    return {
      message: `${cancelled.length} carritos vencidos cancelados`,
      data: cancelled,
    };
  }

  // ==================== MÉTODO ORIGINAL (DEPRECADO) ====================
  // Este método ya no se usa porque ahora el flujo es: addToCart → checkout → pago
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
      const mpItems: Array<{
        id: string;
        title: string;
        unit_price: number;
        quantity: number;
        currency_id: string;
      }> = []; // Items para MercadoPago

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

        // Agregar item para MercadoPago
        mpItems.push({
          id: product.id,
          title: product.name,
          unit_price: Number(product.price),
          quantity: item.quantity,
          currency_id: 'ARS',
        });
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

      // Generar preferencia de MercadoPago
      try {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        const backendUrl = this.configService.get<string>(
          'NEXT_PUBLIC_API_URL',
        );

        const preference = await this.mercadoPagoClient.create({
          body: {
            items: mpItems,
            payer: {
              name: buyer.name || 'Cliente',
              email: buyer.email,
            },
            back_urls: {
              success: `${frontendUrl}/checkout/success`,
              failure: `${frontendUrl}/checkout/failure`,
              pending: `${frontendUrl}/checkout/pending`,
            },
            notification_url: `${backendUrl}/api/mercadopago/webhook`,
            external_reference: saved.id,
            statement_descriptor: 'VETERINARIA PETSHOP',
          },
        });

        console.log('? MercadoPago preference created:', {
          preferenceId: preference.id,
          initPoint: preference.init_point,
          sandboxInitPoint: preference.sandbox_init_point,
        });

        // Load full order with relations for response
        const fullOrder = await manager.findOne(SaleOrder, {
          where: { id: saved.id },
          relations: { buyer: true, branch: true, items: { product: true } },
        });

        return {
          message: 'Sale order created successfully',
          data: {
            ...fullOrder,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            preferenceId: preference.id,
          },
        };
      } catch (error) {
        console.error('? Error creating MercadoPago preference:', error);
        throw new BadRequestException('Error al generar preferencia de pago');
      }
    });
  }

  async findAll() {
    const orders = await this.saleOrderRepository.find({
      relations: { buyer: true, branch: true, items: { product: true } },
      order: { createdAt: 'DESC' },
    });
    return { message: 'Sale orders retrieved', data: orders };
  }

  async findOne(id: number) {
    const order = await this.saleOrderRepository.findOne({
      where: { id: String(id) },
      relations: { buyer: true, branch: true, items: { product: true } },
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

  // ==================== MÉTODO DE PRUEBA ====================

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

  /**
   * Checkout con Stripe: Crear sesión de pago
   */
  async checkoutWithStripe(
    userId: string,
    checkoutDto: {
      success_url: string;
      cancel_url: string;
    },
  ) {
    // 1. Obtener carrito activo
    const cart = await this.saleOrderRepository.findOne({
      where: {
        buyer: { id: userId },
        status: SaleOrderStatus.ACTIVE,
      },
      relations: ['items', 'items.product', 'buyer'],
    });

    if (!cart) {
      throw new NotFoundException('No hay carrito activo para procesar');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // 2. Verificar que no esté vencido
    if (cart.expiresAt && new Date() > cart.expiresAt) {
      await this.cancelExpiredCart(cart.id);
      throw new BadRequestException('El carrito ha expirado');
    }

    try {
      // Validar que el frontend envíe las URLs (son obligatorias)
      if (!checkoutDto?.success_url || !checkoutDto?.cancel_url) {
        throw new BadRequestException(
          'Las URLs de retorno (success_url, cancel_url) son obligatorias en el body',
        );
      }

      // Crear sesión de checkout con Stripe
      const session = await this.stripeService.createCheckoutSession(
        cart.items,
        cart.id,
        cart.buyer?.email || 'cliente@ejemplo.com',
        checkoutDto.success_url,
        checkoutDto.cancel_url,
      );

      // Guardar ID de sesión en el carrito y cambiar estado a PENDING
      cart.stripeSessionId = session.id;
      cart.status = SaleOrderStatus.PENDING;
      await this.saleOrderRepository.save(cart);

      return {
        message: 'Sesión de pago creada exitosamente',
        data: {
          sessionId: session.id,
          checkoutUrl: session.url,
        },
      };
    } catch (error) {
      console.error('❌ Error creando sesión de Stripe:', error);
      throw new BadRequestException('Error al generar sesión de pago');
    }
  }

  /**
   * Procesar webhook de Stripe
   */
  async handleStripeWebhook(event: any) {
    console.log('🔔 Webhook de Stripe recibido:', event.type);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const orderId =
            session.metadata?.order_id || session.client_reference_id;

          if (!orderId) {
            console.warn('⚠️ Sesión sin ID de orden');
            return { message: 'Sesión sin ID de orden' };
          }

          const order = await this.saleOrderRepository.findOne({
            where: { id: orderId },
            relations: ['items'], // Asegúrate de cargar las relaciones necesarias
          });

          if (!order) {
            console.warn(`⚠️ Orden ${orderId} no encontrada`);
            return { message: 'Orden no encontrada' };
          }

          // Actualizar estado de la orden
          order.status = SaleOrderStatus.PAID;
          order.stripeStatus = 'completed';
          await this.saleOrderRepository.save(order);

          console.log(`✅ Orden ${order.id} marcada como PAID (Stripe)`);

          // Enviar correo de confirmación
          await this.mailerService.sendPurchaseConfirmation({
            to: session.customer_email,
            userName: order.buyer.name, // Ajusta según tus datos
            orderId: order.id,
            items: order.items.map((item) => ({
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toFixed(2),
              subtotal: (item.quantity * item.unitPrice).toFixed(2),
            })),
            total: order.total.toFixed(2),
          });

          break;
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata?.order_id;

          if (!orderId) {
            console.warn('⚠️ PaymentIntent sin ID de orden');
            return { message: 'PaymentIntent sin ID de orden' };
          }

          const order = await this.saleOrderRepository.findOne({
            where: { id: orderId },
            relations: ['items'],
          });

          if (!order) {
            console.warn(`⚠️ Orden ${orderId} no encontrada`);
            return { message: 'Orden no encontrada' };
          }

          // Actualizar estado de la orden
          order.status = SaleOrderStatus.PAID;
          order.stripePaymentIntentId = paymentIntent.id;
          order.stripeStatus = 'succeeded';
          await this.saleOrderRepository.save(order);

          console.log(
            `✅ Orden ${order.id} marcada como PAID (Stripe PaymentIntent)`,
          );

          // Enviar correo de confirmación
          await this.mailerService.sendPurchaseConfirmation({
            to: paymentIntent.receipt_email,
            userName: order.buyer.name,
            orderId: order.id,
            items: order.items.map((item) => ({
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toFixed(2),
              subtotal: (item.quantity * item.unitPrice).toFixed(2),
            })),
            total: order.total.toFixed(2),
          });

          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata?.order_id;

          if (!orderId) return { message: 'PaymentIntent sin ID de orden' };

          const order = await this.saleOrderRepository.findOne({
            where: { id: orderId },
          });

          if (!order) return { message: 'Orden no encontrada' };

          // Actualizar estado de la orden
          order.status = SaleOrderStatus.CANCELLED;
          order.stripePaymentIntentId = paymentIntent.id;
          order.stripeStatus = 'failed';
          await this.saleOrderRepository.save(order);

          console.log(
            `❌ Orden ${order.id} marcada como CANCELLED (Stripe PaymentIntent failed)`,
          );
          break;
        }
      }

      return { message: 'Webhook procesado correctamente' };
    } catch (error) {
      console.error('Error procesando webhook de Stripe:', error);
      throw new BadRequestException('Error procesando webhook de Stripe');
    }
  }
  // ==================== CALCULAR COSTO DE ENV�O ====================

  /**
   * Calcular costo de env�o basado en c�digo postal O coordenadas GPS
   *
   * M�todo 1 (c�digo postal): L�gica por zonas predefinidas
   * M�todo 2 (lat/lng): C�lculo por distancia real usando MapTiler API
   *
   * Tarifas por distancia (basadas en Correo Argentino):
   * - 0-10 km: $1500 (entrega en 24-48hs)
   * - 10-30 km: $2500 (entrega en 2-3 d�as)
   * - 30-100 km: $4000 (entrega en 3-5 d�as)
   * - 100-300 km: $6000 (entrega en 5-7 d�as)
   * - +300 km: $8000 (entrega en 7-10 d�as)
   */
  async calculateShipping(dto: CalculateShippingDto) {
    // Si se proporcionan coordenadas, calcular por distancia real
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      return this.calculateShippingByDistance(dto.latitude, dto.longitude);
    }

    // Si solo se proporciona c�digo postal, usar m�todo por zonas
    if (dto.postalCode) {
      return this.calculateShippingByPostalCode(dto.postalCode);
    }

    throw new BadRequestException(
      'Debe proporcionar c�digo postal o coordenadas (latitude, longitude)',
    );
  }

  /**
   * Calcular env�o por c�digo postal (m�todo simplificado por zonas)
   */
  private calculateShippingByPostalCode(postalCodeStr: string) {
    const postalCode = parseInt(postalCodeStr, 10);

    if (isNaN(postalCode) || postalCode < 1000 || postalCode > 9999) {
      throw new BadRequestException(
        'C�digo postal inv�lido. Debe ser un n�mero de 4 d�gitos.',
      );
    }

    let shippingCost: number;
    let zone: string;
    let deliveryTime: string;

    // Determinar zona y costo
    if (postalCode >= 1001 && postalCode <= 1439) {
      zone = 'CABA';
      shippingCost = 1500;
      deliveryTime = '24-48 horas';
    } else if (postalCode >= 1600 && postalCode <= 1900) {
      zone = 'GBA (Gran Buenos Aires)';
      shippingCost = 2000;
      deliveryTime = '2-3 d�as h�biles';
    } else if (postalCode >= 2000 && postalCode <= 7999) {
      zone = 'Interior Buenos Aires';
      shippingCost = 3000;
      deliveryTime = '3-5 d�as h�biles';
    } else {
      zone = 'Resto del pa�s';
      shippingCost = 5000;
      deliveryTime = '5-7 d�as h�biles';
    }

    return {
      method: 'postal_code',
      postalCode: postalCodeStr,
      zone,
      shippingCost,
      deliveryTime,
      currency: 'ARS',
      message: 'Costo de env�o calculado por zona postal',
    };
  }

  /**
   * Calcular env�o por distancia real usando f�rmula de Haversine
   * (distancia en l�nea recta entre dos puntos GPS)
   */
  private async calculateShippingByDistance(
    clientLat: number,
    clientLng: number,
  ) {
    try {
      // Obtener coordenadas del local desde variables de entorno
      const localLatStr = this.configService.get<string>('LOCAL_LATITUD');
      const localLngStr = this.configService.get<string>('LOCAL_LONGITUD');

      if (!localLatStr || !localLngStr) {
        throw new BadRequestException(
          'Configuraci�n de ubicaci�n del local incompleta',
        );
      }

      const localLat = parseFloat(localLatStr);
      const localLng = parseFloat(localLngStr);

      // Calcular distancia usando f�rmula de Haversine (distancia en l�nea recta)
      const distanceInKm = this.calculateHaversineDistance(
        localLat,
        localLng,
        clientLat,
        clientLng,
      );

      const distanceInMeters = distanceInKm * 1000;

      // Estimar duraci�n aproximada (asumiendo 40 km/h promedio en ciudad, 60 km/h en ruta)
      const avgSpeed = distanceInKm < 30 ? 40 : 60; // km/h
      const durationInMinutes = Math.round((distanceInKm / avgSpeed) * 60);

      // Calcular costo y tiempo de entrega basado en distancia
      let shippingCost: number;
      let deliveryTime: string;
      let zone: string;

      if (distanceInMeters <= 10000) {
        // 0-10 km
        zone = 'Zona cercana (0-10 km)';
        shippingCost = 1500;
        deliveryTime = '24-48 horas';
      } else if (distanceInMeters <= 30000) {
        // 10-30 km
        zone = 'Zona metropolitana (10-30 km)';
        shippingCost = 2500;
        deliveryTime = '2-3 d�as h�biles';
      } else if (distanceInMeters <= 100000) {
        // 30-100 km
        zone = 'Zona provincial (30-100 km)';
        shippingCost = 4000;
        deliveryTime = '3-5 d�as h�biles';
      } else if (distanceInMeters <= 300000) {
        // 100-300 km
        zone = 'Zona regional (100-300 km)';
        shippingCost = 6000;
        deliveryTime = '5-7 d�as h�biles';
      } else {
        // +300 km
        zone = 'Zona nacional (+300 km)';
        shippingCost = 8000;
        deliveryTime = '7-10 d�as h�biles';
      }

      return {
        method: 'gps_distance',
        latitude: clientLat,
        longitude: clientLng,
        distance: `${distanceInKm.toFixed(2)} km`,
        distanceInMeters: Math.round(distanceInMeters),
        estimatedDuration: `${durationInMinutes} minutos`,
        zone,
        shippingCost,
        deliveryTime,
        currency: 'ARS',
        message: 'Costo de env�o calculado por distancia GPS',
      };
    } catch (error) {
      console.error('Error calculando env�o por distancia:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Error al calcular la distancia. Verifique las coordenadas proporcionadas.',
      );
    }
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distancia en km

    return distance;
  }

  /**
   * Convertir grados a radianes
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getOrderDetails(orderId: string) {
    try {
      const order = await this.saleOrderRepository.findOne({
        where: { id: orderId },
        relations: ['items', 'items.product', 'buyer'],
      });

      if (!order) {
        console.warn(`Orden ${orderId} no encontrada para enviar correo`);
        return null;
      }

      return order;
    } catch (error) {
      console.error('Error obteniendo detalles de la orden:', error);
      return null;
    }
  }
}
