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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @ApiOperation({ summary: 'Get availability of a veterinarian for a date' })
  @Get('availability/:veterinarianId')
  getAvailability(
    @Param('veterinarianId', ParseUUIDPipe) vetId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailability(vetId, date);
  }

  @ApiOperation({ summary: 'Create new appointment' })
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
}
