import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Estado de actividad del veterinario',
    example: true,
    type: 'boolean',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
