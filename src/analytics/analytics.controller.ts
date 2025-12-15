import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';
import {
  MetricsResponseDto,
  SalesDataDto,
  TopProductDto,
  CategoryStatsDto,
  LowStockProductDto,
  VeterinarianStatsDto,
  DiagnosisRecurrenceDto,
} from './dto/analytics-response.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({
    summary: 'Get dashboard metrics (Admin only)',
    description: 'Obtiene métricas generales del dashboard con indicadores de crecimiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas exitosamente',
    type: MetricsResponseDto,
  })
  @Get('metrics')
  async getMetrics() {
    return await this.analyticsService.getMetrics();
  }

  @ApiOperation({
    summary: 'Get sales data by period (Admin only)',
    description: 'Obtiene datos de ventas agrupados por el período seleccionado',
  })
  @ApiQuery({
    name: 'period',
    enum: ['day', 'week', 'month', 'year'],
    required: false,
    description: 'Período de agrupación de datos',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos de ventas obtenidos',
    type: [SalesDataDto],
  })
  @Get('sales')
  async getSales(@Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month') {
    return await this.analyticsService.getSalesByPeriod(period);
  }

  @ApiOperation({
    summary: 'Get top selling products (Admin only)',
    description: 'Obtiene los productos más vendidos con stock actual',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Número de productos a retornar (por defecto 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top productos obtenidos',
    type: [TopProductDto],
  })
  @Get('top-products')
  async getTopProducts(@Query('limit') limit: string = '10') {
    return await this.analyticsService.getTopProducts(parseInt(limit));
  }

  @ApiOperation({
    summary: 'Get category statistics (Admin only)',
    description: 'Obtiene estadísticas de ventas por categoría con porcentajes',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas por categoría obtenidas',
    type: [CategoryStatsDto],
  })
  @Get('categories')
  async getCategoryStats() {
    return await this.analyticsService.getCategoryStats();
  }

  @ApiOperation({
    summary: 'Get low stock products (Admin only)',
    description: 'Obtiene productos con stock bajo (< 5 unidades) para alertas',
  })
  @ApiResponse({
    status: 200,
    description: 'Productos con stock bajo obtenidos',
    type: [LowStockProductDto],
  })
  @Get('low-stock')
  async getLowStockProducts() {
    return await this.analyticsService.getLowStockProducts();
  }

  @ApiOperation({
    summary: 'Get veterinarian statistics (Admin only)',
    description: 'Obtiene estadísticas de turnos por veterinario',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de veterinarios obtenidas',
    type: [VeterinarianStatsDto],
  })
  @Get('veterinarians')
  async getVeterinarianStats() {
    return await this.analyticsService.getVeterinarianStats();
  }

  @ApiOperation({
    summary: 'Get diagnosis recurrence (Admin only)',
    description: 'Obtiene los diagnósticos médicos más recurrentes',
  })
  @ApiResponse({
    status: 200,
    description: 'Diagnósticos recurrentes obtenidos',
    type: [DiagnosisRecurrenceDto],
  })
  @Get('diagnosis-recurrence')
  async getDiagnosisRecurrence() {
    return await this.analyticsService.getDiagnosisRecurrence();
  }
}
