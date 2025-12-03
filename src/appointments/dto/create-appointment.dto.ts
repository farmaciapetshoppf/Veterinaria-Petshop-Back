import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID del usuario que solicita la cita',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'ID de la mascota para la que se agenda la cita',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  petId?: string;

  @ApiProperty({
    description: 'ID del veterinario que atenderá la cita',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

  @ApiProperty({
    description: 'Fecha de la cita',
    example: '2025-11-30',
    type: 'string',
    format: 'date',
  })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  @IsDateString()
  date: Date;

  @ApiProperty({
    description: 'Hora de la cita',
    example: '14:30:00',
    type: 'string',
    format: 'time',
  })
  @IsString()
  @IsNotEmpty({ message: 'La hora es obligatoria' })
  time: Date;

  @ApiProperty({
    description: 'Detalles adicionales proporcionados por el usuario',
    example: 'Información complementaria sobre el turno, es un campo opcional',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiProperty({
    description: 'Estado del turno',
    example: true,
    type: 'boolean',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
