import { ApiProperty } from '@nestjs/swagger';

export class MetricsResponseDto {
  @ApiProperty({ example: 125000 })
  totalRevenue: number;

  @ApiProperty({ example: 450 })
  totalOrders: number;

  @ApiProperty({ example: 180 })
  totalCustomers: number;

  @ApiProperty({ example: 320 })
  totalAppointments: number;

  @ApiProperty({ example: 15.5 })
  revenueGrowth: number;

  @ApiProperty({ example: 12.3 })
  ordersGrowth: number;

  @ApiProperty({ example: 8.7 })
  customersGrowth: number;

  @ApiProperty({ example: 20.1 })
  appointmentsGrowth: number;
}

export class SalesDataDto {
  @ApiProperty({ example: '2025-12-01' })
  date: string;

  @ApiProperty({ example: 8500 })
  revenue: number;

  @ApiProperty({ example: 25 })
  orders: number;
}

export class TopProductDto {
  @ApiProperty({ example: 'Alimento Premium para Perros' })
  name: string;

  @ApiProperty({ example: 150 })
  sales: number;

  @ApiProperty({ example: 45000 })
  revenue: number;

  @ApiProperty({ example: 25 })
  currentStock: number;
}

export class CategoryStatsDto {
  @ApiProperty({ example: 'Alimentos' })
  name: string;

  @ApiProperty({ example: 85000 })
  value: number;

  @ApiProperty({ example: 45.5 })
  percentage: number;

  @ApiProperty({ example: 12 })
  productCount: number;
}

export class LowStockProductDto {
  @ApiProperty({ example: 'Pro Plan Sensitive Skin' })
  name: string;

  @ApiProperty({ example: 0 })
  stock: number;

  @ApiProperty({ example: 'Alimentos' })
  category: string;

  @ApiProperty({ example: 48000 })
  price: number;
}

export class VeterinarianStatsDto {
  @ApiProperty({ example: 'Dr. Juan Pérez' })
  name: string;

  @ApiProperty({ example: 45 })
  totalAppointments: number;

  @ApiProperty({ example: 12 })
  completedAppointments: number;

  @ApiProperty({ example: 5 })
  pendingAppointments: number;
}

export class DiagnosisRecurrenceDto {
  @ApiProperty({ example: 'Parvovirosis Canina' })
  diagnosis: string;

  @ApiProperty({ example: 12 })
  count: number;

  @ApiProperty({ example: 24.5 })
  percentage: number;
}
