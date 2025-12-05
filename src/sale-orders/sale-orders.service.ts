import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateSaleOrderDto } from './dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto';
import { SaleOrder, SaleOrderStatus } from './entities/sale-order.entity';
import { SaleOrderProduct } from './entities/sale-order-product.entity';
import { Users } from 'src/users/entities/user.entity';
import { Products } from 'src/products/entities/product.entity';
import { Branch } from 'src/branches/entities/branch.entity';

@Injectable()
export class SaleOrdersService {
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
  ) {}

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

      // Validar que el carrito no esté vencido
      if (cart.expiresAt && new Date() > cart.expiresAt) {
        throw new BadRequestException('El carrito ha expirado. Se creará uno nuevo.');
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

      // Verificar si el producto ya está en el carrito
      const existingItem = cart.items?.find(item => item.product.id === productId);

      if (existingItem) {
        // Actualizar cantidad existente
        const additionalQty = quantity;
        
        // Validar que hay stock para la cantidad adicional
        if (product.stock < additionalQty) {
          throw new BadRequestException(
            `Stock insuficiente. Ya tenés ${existingItem.quantity} en el carrito. Disponible: ${product.stock}`,
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

    // Verificar si expiró
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
        // Aumentar cantidad - necesita más stock
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
   * Obtener historial de órdenes pagadas del usuario
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
   * Se ejecuta automáticamente cada 2 horas
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async cancelExpiredCarts() {
    console.log('🕐 Ejecutando tarea programada: Cancelar carritos vencidos...');
    
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
}
