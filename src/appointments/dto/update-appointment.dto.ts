import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiProperty({
    description: 'Nueva fecha de la cita',
    example: '2025-12-15',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: Date;
  @ApiProperty({
    description: 'Nueva hora de la cita',
    example: '15:45:00',
    type: 'string',
    format: 'time',
    required: false,
  })
  @IsOptional()
  @IsString()
  time?: Date;
  @ApiProperty({
    description: 'Detalles actualizados de la cita',
    example: 'Revisión de vacunas y control general',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  detail?: string;
  @ApiProperty({
    description: 'Nuevo estado de la cita (activa/inactiva)',
    example: false,
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
