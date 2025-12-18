import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentsAnalyticsSeeder } from './seed/appointments-analytics.seeder';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.User, Role.Veterinarian, Role.Admin)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly analyticsSeeder: AppointmentsAnalyticsSeeder,
  ) {}

  @ApiOperation({
    summary: 'Get availability of a veterinarian for a date',
    description:
      'Retorna los horarios disponibles de un veterinario para una fecha específica (slots de 30 minutos desde las 9:00 hasta las 18:00)',
  })
  @ApiParam({
    name: 'veterinarianId',
    description: 'ID del veterinario',
    example: 'vet-123',
  })
  @ApiQuery({
    name: 'date',
    description: 'Fecha a consultar (YYYY-MM-DD)',
    example: '2025-12-15',
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad obtenida',
    schema: {
      example: {
        date: '2025-12-15',
        veterinarianId: 'vet-123',
        slots: [
          { time: '09:00', available: true },
          { time: '09:30', available: true },
          { time: '10:00', available: false },
        ],
      },
    },
  })
  @Get('availability/:veterinarianId')
  getAvailability(
    @Param('veterinarianId', ParseUUIDPipe) vetId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailability(vetId, date);
  }

  @ApiOperation({
    summary: 'Create new appointment',
    description:
      'Crea un nuevo turno y envía automáticamente un email de confirmación al usuario con todos los detalles de la cita.',
  })
  @ApiResponse({
    status: 201,
    description: 'Turno creado exitosamente - email de confirmación enviado',
    schema: {
      example: {
        message: 'Appointment created successfully',
        data: {
          id: 'appt-123',
          date: '2025-12-15',
          time: '14:30',
          status: 'SCHEDULED',
          user: { name: 'Juan Pérez', email: 'juan@example.com' },
          pet: { nombre: 'Max' },
          veterinarian: { name: 'Dr. García' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o horario no disponible',
  })
  @Post('NewAppointment')
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @ApiOperation({ summary: 'Get all appointments' })
  @Get('AllAppointments')
  async findAll() {
    const data = await this.appointmentsService.findAll();
    return { message: 'Appointments retrieved', data };
  }

  @ApiOperation({ summary: 'Get appointment by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.appointmentsService.findOne(id);
    return { message: `Appointment ${id} retrieved`, data };
  }

  @ApiOperation({ summary: 'Update appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiBody({ type: UpdateAppointmentDto })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @ApiOperation({ summary: 'Delete appointment (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the appointment',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment successfully marked as deleted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Appointment 550e8400-e29b-41d4-a716-446655440000 removed',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Appointment 550e8400-e29b-41d4-a716-446655440000 not found',
        },
      },
    },
  })
  @Put(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @ApiOperation({
    summary: 'Complete appointment with medications',
    description:
      'Completa una consulta veterinaria, crea el registro médico, descuenta stock de medicamentos usados y genera notificaciones',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del turno a completar',
    example: 'uuid-turno-123',
  })
  @ApiBody({
    schema: {
      example: {
        diagnosis: 'GASTROENTERITIS',
        treatment: 'Dieta blanda por 3 días',
        observations: 'Control en 1 semana',
        nextAppointment: '2025-12-22',
        vaccinations: 'Antirrábica',
        weight: 15.5,
        temperature: 38.5,
        medicationsUsed: [
          {
            medicationId: 'uuid-medicamento-1',
            medicationType: 'GENERAL',
            quantity: 2,
            dosage: '1 comprimido cada 12 horas',
            duration: '7 días',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Consulta completada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Consulta completada exitosamente',
        data: {
          appointmentId: 'uuid',
          medicalRecordId: 'uuid',
          medicationsUsed: [
            {
              id: 'uuid-uso-1',
              medicationId: 'uuid-medicamento-1',
              medicationName: 'Omeprazol 20mg',
              quantity: 2,
              previousStock: 50,
              newStock: 48,
              usedAt: '2025-12-15T10:30:00Z',
            },
          ],
          notifications: [
            {
              type: 'LOW_STOCK',
              medicationId: 'uuid-medicamento-2',
              medicationName: 'Tramadol 50mg',
              currentStock: 5,
              minStock: 10,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o turno ya completado',
  })
  @ApiResponse({
    status: 404,
    description: 'Turno o medicamento no encontrado',
  })
  @Post(':id/complete')
  completeAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    return this.appointmentsService.completeAppointment(id, dto);
  }

  @ApiOperation({
    summary: 'Seeder para datos de analytics',
    description:
      'Crea 50 turnos distribuidos en la semana con registros médicos y diagnósticos para gráficas',
  })
  @ApiResponse({
    status: 200,
    description: 'Seeder ejecutado exitosamente',
    schema: {
      example: {
        appointments: 50,
        medicalRecords: 35,
        message: 'Datos de analytics creados',
      },
    },
  })
  @Get('seeder/analytics')
  async seedAnalytics() {
    return await this.analyticsSeeder.seed();
  }
}
