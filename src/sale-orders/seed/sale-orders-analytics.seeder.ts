import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleOrder, SaleOrderStatus } from '../entities/sale-order.entity';
import { SaleOrderProduct } from '../entities/sale-order-product.entity';
import { Users } from 'src/users/entities/user.entity';
import { Products } from 'src/products/entities/product.entity';
import { Branch } from 'src/branches/entities/branch.entity';

@Injectable()
export class SaleOrdersAnalyticsSeeder {
  constructor(
    @InjectRepository(SaleOrder)
    private readonly saleOrderRepo: Repository<SaleOrder>,
    @InjectRepository(SaleOrderProduct)
    private readonly saleOrderProductRepo: Repository<SaleOrderProduct>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    @InjectRepository(Products)
    private readonly productsRepo: Repository<Products>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async seed() {
    console.log('🛒 Iniciando seeder de compras para analytics...');

    // Verificar órdenes existentes
    const existingOrders = await this.saleOrderRepo.count();
    if (existingOrders >= 100) {
      console.log(`⏭️  Ya hay ${existingOrders} órdenes cargadas, saltando seeder`);
      return {
        orders: existingOrders,
        message: 'Órdenes ya existentes'
      };
    }

    const ordersToCreate = 100 - existingOrders;
    console.log(`📊 Creando ${ordersToCreate} órdenes adicionales...`);

    // Obtener datos necesarios
    const users = await this.usersRepo.find();
    const products = await this.productsRepo.find();
    const branches = await this.branchRepo.find();

    if (users.length === 0 || products.length === 0) {
      console.log('❌ Se necesitan usuarios y productos para crear órdenes');
      return;
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const paymentMethods = ['Mercado Pago', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Efectivo', 'Transferencia'];

    let ordersCreated = 0;
    let totalRevenue = 0;

    // Crear órdenes faltantes distribuidas en los últimos 30 días
    for (let i = 0; i < ordersToCreate; i++) {
      // Generar fecha aleatoria en los últimos 30 días
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - randomDaysAgo);
      orderDate.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8am y 8pm
      orderDate.setMinutes(Math.floor(Math.random() * 60));

      // Seleccionar usuario aleatorio
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // Seleccionar sucursal aleatoria (si hay)
      const randomBranch = branches.length > 0 ? branches[Math.floor(Math.random() * branches.length)] : null;

      // Seleccionar método de pago aleatorio
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      // 95% de las órdenes están pagadas (PAID), 5% pendientes o canceladas
      const randomStatus = Math.random();
      let status: SaleOrderStatus;
      if (randomStatus < 0.95) {
        status = SaleOrderStatus.PAID;
      } else if (randomStatus < 0.98) {
        status = SaleOrderStatus.PENDING;
      } else {
        status = SaleOrderStatus.CANCELLED;
      }

      // Crear la orden
      const newOrder = this.saleOrderRepo.create({
        buyer: randomUser,
        branch: randomBranch || undefined,
        status: status,
        paymentMethod: paymentMethod,
        total: 0, // Se calculará después
        mercadoPagoStatus: status === SaleOrderStatus.PAID ? 'approved' : status === SaleOrderStatus.PENDING ? 'pending' : 'cancelled',
      });

      // Asignar la fecha manualmente después de crear
      newOrder.createdAt = orderDate;

      const savedOrder = await this.saleOrderRepo.save(newOrder);

      // Agregar productos a la orden (entre 1 y 5 productos por orden)
      const numProducts = Math.floor(Math.random() * 5) + 1;
      let orderTotal = 0;

      // Crear un Set para evitar productos duplicados en la misma orden
      const selectedProducts = new Set<string>();
      
      for (let j = 0; j < numProducts; j++) {
        let randomProduct = products[Math.floor(Math.random() * products.length)];
        
        // Asegurar que no se repita el producto en la misma orden
        let attempts = 0;
        while (selectedProducts.has(randomProduct.id) && attempts < 10) {
          randomProduct = products[Math.floor(Math.random() * products.length)];
          attempts++;
        }
        
        if (selectedProducts.has(randomProduct.id)) continue;
        selectedProducts.add(randomProduct.id);

        const quantity = Math.floor(Math.random() * 3) + 1; // Entre 1 y 3 unidades
        const unitPrice = Number(randomProduct.price);

        const orderProduct = new SaleOrderProduct();
        orderProduct.order = savedOrder;
        orderProduct.product = randomProduct;
        orderProduct.quantity = quantity;
        orderProduct.unitPrice = unitPrice;

        await this.saleOrderProductRepo.save(orderProduct);

        orderTotal += unitPrice * quantity;
      }

      // Actualizar el total de la orden
      savedOrder.total = orderTotal;
      await this.saleOrderRepo.save(savedOrder);

      if (status === SaleOrderStatus.PAID) {
        totalRevenue += orderTotal;
      }

      ordersCreated++;
    }

    console.log(`✅ ${ordersCreated} órdenes de compra creadas`);
    console.log(`💰 Ingresos totales generados: $${totalRevenue.toFixed(2)}`);

    // Guardar valores para retornar
    const finalOrdersCount = ordersCreated;
    const finalRevenue = totalRevenue;

    // Mostrar estadísticas por producto
    await this.showProductStats();

    // Mostrar estadísticas por período
    await this.showPeriodStats();

    console.log('🎉 Seeder de compras completado');
    return {
      orders: finalOrdersCount,
      revenue: finalRevenue,
      message: 'Datos de compras creados exitosamente'
    };
  }

  private async showProductStats() {
    const productStats = await this.saleOrderProductRepo
      .createQueryBuilder('sop')
      .select('p.name', 'productName')
      .addSelect('SUM(sop.quantity)', 'totalSold')
      .addSelect('SUM(sop.quantity * sop.unitPrice)', 'totalRevenue')
      .innerJoin('sop.product', 'p')
      .innerJoin('sop.order', 'o')
      .where('o.status = :status', { status: SaleOrderStatus.PAID })
      .groupBy('p.id')
      .addGroupBy('p.name')
      .orderBy('SUM(sop.quantity)', 'DESC')
      .limit(10)
      .getRawMany();

    console.log('📦 Top 10 productos más vendidos:');
    productStats.forEach((stat, index) => {
      console.log(`   ${index + 1}. ${stat.productName}: ${stat.totalSold} unidades ($${Number(stat.totalRevenue).toFixed(2)})`);
    });
  }

  private async showPeriodStats() {
    const today = new Date();
    
    // Estadísticas de hoy
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayOrders = await this.saleOrderRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: SaleOrderStatus.PAID })
      .andWhere('o.createdAt >= :start', { start: todayStart })
      .getMany();
    
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total), 0);

    // Estadísticas de esta semana
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekOrders = await this.saleOrderRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: SaleOrderStatus.PAID })
      .andWhere('o.createdAt >= :start', { start: weekStart })
      .getMany();
    
    const weekRevenue = weekOrders.reduce((sum, order) => sum + Number(order.total), 0);

    // Estadísticas de este mes
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthOrders = await this.saleOrderRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: SaleOrderStatus.PAID })
      .andWhere('o.createdAt >= :start', { start: monthStart })
      .getMany();
    
    const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.total), 0);

    console.log('📊 Estadísticas de ventas por período:');
    console.log(`   📅 Hoy: ${todayOrders.length} órdenes - $${todayRevenue.toFixed(2)}`);
    console.log(`   📅 Esta semana: ${weekOrders.length} órdenes - $${weekRevenue.toFixed(2)}`);
    console.log(`   📅 Este mes: ${monthOrders.length} órdenes - $${monthRevenue.toFixed(2)}`);
    
    console.log('🎉 Seeder de órdenes de compra completado');
  }
}
