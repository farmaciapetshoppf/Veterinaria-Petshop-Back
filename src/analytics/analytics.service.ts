import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { SaleOrder } from 'src/sale-orders/entities/sale-order.entity';
import { Users } from 'src/users/entities/user.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import { Products } from 'src/products/entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { MedicalRecordsPet } from 'src/medical-records-pet/entities/medical-records-pet.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(SaleOrder)
    private readonly saleOrderRepo: Repository<SaleOrder>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    @InjectRepository(Appointments)
    private readonly appointmentsRepo: Repository<Appointments>,
    @InjectRepository(Products)
    private readonly productsRepo: Repository<Products>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Veterinarian)
    private readonly veterinariansRepo: Repository<Veterinarian>,
    @InjectRepository(MedicalRecordsPet)
    private readonly medicalRecordsRepo: Repository<MedicalRecordsPet>,
  ) {}

  /**
   * Obtener métricas generales del dashboard
   */
  async getMetrics() {
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Período actual
    const currentOrders = await this.saleOrderRepo.find({
      where: {
        createdAt: MoreThanOrEqual(firstDayCurrentMonth),
      },
    });

    // Período anterior
    const previousOrders = await this.saleOrderRepo.find({
      where: {
        createdAt: Between(firstDayPreviousMonth, lastDayPreviousMonth),
      },
    });

    const currentRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    const totalCustomers = await this.usersRepo.count();
    const currentAppointments = await this.appointmentsRepo.count({
      where: {
        date: MoreThanOrEqual(firstDayCurrentMonth) as any,
      },
    });
    const previousAppointments = await this.appointmentsRepo.count({
      where: {
        date: Between(firstDayPreviousMonth, lastDayPreviousMonth) as any,
      },
    });

    // Calcular crecimientos
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const ordersGrowth = previousOrders.length > 0 
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100 
      : 0;
    const appointmentsGrowth = previousAppointments > 0 
      ? ((currentAppointments - previousAppointments) / previousAppointments) * 100 
      : 0;

    return {
      totalRevenue: Math.round(currentRevenue),
      totalOrders: currentOrders.length,
      totalCustomers,
      totalAppointments: currentAppointments,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10,
      customersGrowth: 8.7, // Calculable si tienes fecha de registro
      appointmentsGrowth: Math.round(appointmentsGrowth * 10) / 10,
    };
  }

  /**
   * Obtener datos de ventas por período
   */
  async getSalesByPeriod(period: 'day' | 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;
    let groupFormat: string;
    let daysBack: number;

    switch (period) {
      case 'day':
        daysBack = 30;
        startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        groupFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        daysBack = 84; // 12 semanas
        startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        groupFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        daysBack = 365; // 12 meses
        startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        groupFormat = 'YYYY-MM';
        break;
      case 'year':
        daysBack = 1825; // 5 años
        startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        groupFormat = 'YYYY';
        break;
      default:
        daysBack = 30;
        startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        groupFormat = 'YYYY-MM-DD';
    }

    const orders = await this.saleOrderRepo.find({
      where: {
        createdAt: MoreThanOrEqual(startDate),
      },
      order: {
        createdAt: 'ASC',
      },
    });

    // Agrupar por período
    const groupedData = new Map<string, { revenue: number; orders: number }>();

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      let key: string;

      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekNum = this.getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        key = date.getFullYear().toString();
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, { revenue: 0, orders: 0 });
      }

      const current = groupedData.get(key)!;
      current.revenue += Number(order.total || 0);
      current.orders += 1;
    });

    // Convertir a array
    const result = Array.from(groupedData.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    }));

    return result;
  }

  /**
   * Top productos más vendidos
   */
  async getTopProducts(limit: number = 10) {
    // Simulación con datos del seeder
    // En producción esto debería venir de order_items
    const products = await this.productsRepo.find({
      relations: {
        category: true,
      },
      order: {
        stock: 'DESC', // Productos con menos stock = más vendidos (simulación)
      },
      take: limit,
    });

    return products.map((product, index) => ({
      name: product.name,
      sales: 150 - index * 10, // Simulación de ventas
      revenue: (150 - index * 10) * Number(product.price),
      currentStock: product.stock,
    }));
  }

  /**
   * Estadísticas por categoría
   */
  async getCategoryStats() {
    const categories = await this.categoriesRepo.find({
      relations: {
        products: true,
      },
    });

    const stats = await Promise.all(
      categories.map(async (category) => {
        const products = await this.productsRepo.find({
          where: { category: { id: category.id } },
        });

        // Simulación de ventas por categoría
        const totalRevenue = products.reduce((sum, p) => {
          const simulatedSales = Math.max(0, 50 - p.stock); // Menos stock = más ventas
          return sum + simulatedSales * Number(p.price);
        }, 0);

        return {
          name: category.name,
          value: Math.round(totalRevenue),
          productCount: products.length,
        };
      }),
    );

    // Calcular porcentajes
    const totalValue = stats.reduce((sum, s) => sum + s.value, 0);
    const result = stats.map((s) => ({
      ...s,
      percentage: totalValue > 0 ? Math.round((s.value / totalValue) * 1000) / 10 : 0,
    }));

    return result.sort((a, b) => b.value - a.value);
  }

  /**
   * Productos con stock bajo (< 5 unidades)
   */
  async getLowStockProducts() {
    const products = await this.productsRepo.find({
      where: [
        { stock: 0 },
        { stock: 1 },
        { stock: 2 },
        { stock: 3 },
        { stock: 4 },
      ],
      relations: {
        category: true,
      },
      order: {
        stock: 'ASC',
      },
    });

    return products.map((product) => ({
      name: product.name,
      stock: product.stock,
      category: product.category?.name || 'Sin categoría',
      price: Number(product.price),
    }));
  }

  /**
   * Estadísticas por veterinario
   */
  async getVeterinarianStats() {
    const veterinarians = await this.veterinariansRepo.find({
      relations: {
        appointments: true,
      },
    });

    const stats = await Promise.all(
      veterinarians.map(async (vet) => {
        const appointments = await this.appointmentsRepo.find({
          where: { veterinarian: { id: vet.id } },
        });

        const completed = appointments.filter((a) => !a.status).length;
        const pending = appointments.filter((a) => a.status).length;

        return {
          name: vet.name,
          totalAppointments: appointments.length,
          completedAppointments: completed,
          pendingAppointments: pending,
        };
      }),
    );

    return stats.sort((a, b) => b.totalAppointments - a.totalAppointments);
  }

  /**
   * Diagnósticos más recurrentes
   */
  async getDiagnosisRecurrence() {
    const records = await this.medicalRecordsRepo.find({
      select: ['diagnosis'],
    });

    // Contar diagnósticos
    const diagnosisCounts = new Map<string, number>();
    records.forEach((record) => {
      const count = diagnosisCounts.get(record.diagnosis) || 0;
      diagnosisCounts.set(record.diagnosis, count + 1);
    });

    const total = records.length;

    // Convertir a array y calcular porcentajes
    const result = Array.from(diagnosisCounts.entries())
      .map(([diagnosis, count]) => ({
        diagnosis,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    return result;
  }

  /**
   * Helper: Obtener número de semana del año
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
