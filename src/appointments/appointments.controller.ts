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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
