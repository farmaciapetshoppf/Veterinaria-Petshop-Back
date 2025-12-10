import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ApiOperation, ApiTags, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

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
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @ApiOperation({ summary: 'Delete appointment' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
