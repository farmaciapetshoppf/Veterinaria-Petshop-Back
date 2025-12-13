/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Role } from 'src/auth/enum/roles.enum';

export class CreateVeterinarianDto {
  @ApiProperty({
    description: 'Nombre completo del veterinario',
    example: 'Dr. Juan Pérez Rodríguez',
    type: 'string',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Correo electrónico del veterinario (debe ser único)',
    example: 'juan.perez@vetclinic.com',
    type: 'string',
    format: 'email',
    maxLength: 100,
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({
    description: 'Número de matrícula profesional (debe ser único)',
    example: 'VET-12345',
    type: 'string',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  matricula: string;

  @ApiProperty({
    description: 'Descripción profesional y especialidades del veterinario',
    example:
      'Especialista en medicina interna de pequeños animales con 10 años de experiencia en tratamientos de enfermedades crónicas.',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Número de teléfono de contacto (debe ser único)',
    example: '+34612345678',
    type: 'string',
    maxLength: 15,
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Fecha de disponibilidad o incorporación',
    example: '2025-12-01',
    type: 'string',
    format: 'date',
  })
  @IsNotEmpty()
  @IsDateString()
  time: string;

  @ApiProperty({
    description: 'Horario de atención del veterinario',
    example: '2025-12-11T09:00:00Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  horario_atencion?: string;

  @ApiProperty({
    description: 'Estado de actividad del veterinario',
    example: true,
    type: 'boolean',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Contraseña temporal generada por el frontend para enviar por email',
    example: 'TempPass123!',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  temporaryPassword?: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role = Role.Veterinarian;
}
