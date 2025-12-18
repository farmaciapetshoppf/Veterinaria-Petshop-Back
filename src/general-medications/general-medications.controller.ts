import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GeneralMedicationsService } from './general-medications.service';
import { UseMedicationDto } from './dto/use-medication.dto';
import { RequestRestockDto } from './dto/request-restock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../auth/enum/roles.enum';
import { RestockRequestStatus } from './entities/medication-restock-request.entity';

@ApiTags('General Medications')
@Controller('general-medications')
@UseGuards(AuthGuard, RolesGuard)
export class GeneralMedicationsController {
  constructor(private readonly medicationsService: GeneralMedicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los medicamentos generales' })
  @ApiResponse({ status: 200, description: 'Lista de medicamentos' })
  @ApiBearerAuth()
  @Roles(Role.Veterinarian, Role.Admin)
  async findAll() {
    return this.medicationsService.findAll();
  }

  @Get('controlled')
  @ApiOperation({ summary: 'Obtener solo medicamentos controlados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de medicamentos controlados',
  })
  @ApiBearerAuth()
  @Roles(Role.Veterinarian, Role.Admin)
  async findControlled() {
    return this.medicationsService.findControlled();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Obtener medicamentos con stock bajo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de medicamentos con stock bajo',
  })
  @ApiBearerAuth()
  @Roles(Role.Veterinarian, Role.Admin)
  async findLowStock() {
    return this.medicationsService.findLowStock();
  }

  @Get('controlled/low-stock')
  @ApiOperation({ summary: 'Obtener medicamentos controlados con stock bajo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de medicamentos controlados con stock bajo',
  })
  @ApiBearerAuth()
  @Roles(Role.Veterinarian, Role.Admin)
  async findControlledLowStock() {
    return this.medicationsService.findControlledLowStock();
  }

  @Post('use')
  @ApiOperation({ summary: 'Registrar uso de medicamento (solo veterinarios)' })
  @ApiResponse({ status: 200, description: 'Uso registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @ApiResponse({
    status: 403,
    description: 'Solo veterinarios pueden usar medicamentos',
  })
  @ApiBearerAuth()
  @Roles(Role.Veterinarian)
  async useMedication(@Request() req, @Body() dto: UseMedicationDto) {
    const userId = req.user.id;
    return this.medicationsService.useMedication(userId, dto);
  }

  @Post('request-restock')
  @ApiOperation({ summary: 'Solicitar reposición de medicamento' })
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  @ApiBearerAuth()
  @Roles(Role.Veterinarian, Role.Admin)
  async requestRestock(@Request() req, @Body() dto: RequestRestockDto) {
    const userId = req.user.id;
    return this.medicationsService.requestRestock(userId, dto);
  }

  @Get('requests')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Obtener todas las solicitudes de reposición' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RestockRequestStatus,
    description: 'Filtrar por estado',
  })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes' })
  @Roles(Role.Veterinarian, Role.Admin)
  async getRestockRequests(@Query('status') status?: RestockRequestStatus) {
    return this.medicationsService.getRestockRequests(status);
  }

  @Patch('requests/:id/approve')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Aprobar solicitud de reposición (solo admin)' })
  @ApiResponse({ status: 200, description: 'Solicitud aprobada' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @Roles(Role.Admin)
  async approveRestockRequest(@Request() req, @Param('id') requestId: string) {
    const adminId = req.user.id;
    return this.medicationsService.approveRestockRequest(requestId, adminId);
  }

  @Patch('requests/:id/reject')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Rechazar solicitud de reposición (solo admin)' })
  @ApiResponse({ status: 200, description: 'Solicitud rechazada' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @Roles(Role.Admin)
  async rejectRestockRequest(@Request() req, @Param('id') requestId: string) {
    const adminId = req.user.id;
    return this.medicationsService.rejectRestockRequest(requestId, adminId);
  }

  @Delete('requests/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar solicitud de reposición' })
  @ApiResponse({ status: 200, description: 'Solicitud eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @Roles(Role.Veterinarian, Role.Admin)
  async deleteRestockRequest(@Param('id') requestId: string) {
    return this.medicationsService.deleteRestockRequest(requestId);
  }

  @Patch('requests/:id/complete')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary:
      'Completar solicitud de reposición y actualizar stock (solo admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud completada y stock actualizado',
  })
  @ApiResponse({
    status: 400,
    description: 'La solicitud debe estar aprobada primero',
  })
  @Roles(Role.Admin)
  async completeRestockRequest(@Request() req, @Param('id') requestId: string) {
    const adminId = req.user.id;
    return this.medicationsService.completeRestockRequest(requestId, adminId);
  }

  @Patch(':id/stock')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar stock manualmente (solo admin)' })
  @ApiResponse({ status: 200, description: 'Stock actualizado' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  @Roles(Role.Admin)
  async updateStock(
    @Param('id') medicationId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.medicationsService.updateStock(medicationId, dto);
  }

  @Get('usage')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener historial de uso de todos los medicamentos',
  })
  @ApiResponse({ status: 200, description: 'Historial de uso' })
  @Roles(Role.Veterinarian, Role.Admin)
  async getUsageHistory() {
    return this.medicationsService.getUsageHistory();
  }

  @Get('usage/:medicationId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener historial de uso de un medicamento específico',
  })
  @ApiResponse({ status: 200, description: 'Historial de uso' })
  @Roles(Role.Veterinarian, Role.Admin)
  async getUsageHistoryByMedication(
    @Param('medicationId') medicationId: string,
  ) {
    return this.medicationsService.getUsageHistory(medicationId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Precargar medicamentos iniciales' })
  @ApiResponse({ status: 201, description: 'Medicamentos precargados' })
  async seedMedications() {
    return this.medicationsService.seedMedications();
  }

  @Get('stock-logs')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Obtener logs de auditoría de stock (Admin only)' })
  @ApiResponse({ status: 200, description: 'Logs de stock' })
  @ApiQuery({
    name: 'medicationId',
    required: false,
    description: 'Filtrar por ID de medicamento',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de resultados (default: 50)',
  })
  @Roles(Role.Admin)
  async getStockLogs(
    @Query('medicationId') medicationId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.medicationsService.getStockLogs(medicationId, limit || 50);
  }

  @Get('stock-logs/:medicationName')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener logs de stock por nombre de medicamento (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Logs de stock del medicamento' })
  @Roles(Role.Admin)
  async getStockLogsByMedication(
    @Param('medicationName') medicationName: string,
  ) {
    return this.medicationsService.getStockLogsByMedication(medicationName);
  }
}
