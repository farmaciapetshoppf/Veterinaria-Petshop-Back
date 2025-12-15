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
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentsAnalyticsSeeder } from './seed/appointments-analytics.seeder';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly analyticsSeeder: AppointmentsAnalyticsSeeder,
  ) {}

  @ApiOperation({ 
    summary: 'Get availability of a veterinarian for a date',
    description: 'Retorna los horarios disponibles de un veterinario para una fecha específica (slots de 30 minutos desde las 9:00 hasta las 18:00)'
  })
  @ApiParam({
    name: 'veterinarianId',
    description: 'ID del veterinario',
    example: 'vet-123'
  })
  @ApiQuery({
    name: 'date',
    description: 'Fecha a consultar (YYYY-MM-DD)',
    example: '2025-12-15'
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
          { time: '10:00', available: false }
        ]
      }
    }
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
    description: 'Crea un nuevo turno y envía automáticamente un email de confirmación al usuario con todos los detalles de la cita.'
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
          veterinarian: { name: 'Dr. García' }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o horario no disponible' })
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
    summary: 'Seeder para datos de analytics',
    description: 'Crea 50 turnos distribuidos en la semana con registros médicos y diagnósticos para gráficas'
  })
  @ApiResponse({
    status: 200,
    description: 'Seeder ejecutado exitosamente',
    schema: {
      example: {
        appointments: 50,
        medicalRecords: 35,
        message: 'Datos de analytics creados'
      }
    }
  })
  @Get('seeder/analytics')
  async seedAnalytics() {
    return await this.analyticsSeeder.seed();
  }
}
