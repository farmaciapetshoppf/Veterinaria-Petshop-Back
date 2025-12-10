import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateMedicalRecordsPetDto {
  @ApiProperty({
    description: 'ID de la mascota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  petId: string;

  @ApiProperty({
    description: 'ID del veterinario que realiza la consulta',
    example: 'vet-123',
  })
  @IsString()
  @IsNotEmpty()
  veterinarianId: string;

  @ApiProperty({
    description: 'Diagnóstico de la consulta',
    example: 'Infección respiratoria leve',
  })
  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @ApiProperty({
    description: 'Tratamiento prescrito',
    example: 'Antibióticos por 7 días, reposo',
  })
  @IsString()
  @IsNotEmpty()
  treatment: string;

  @ApiProperty({
    description: 'Medicamentos recetados',
    example: 'Amoxicilina 500mg cada 12 horas',
    required: false,
  })
  @IsString()
  @IsOptional()
  medications?: string;

  @ApiProperty({
    description: 'Observaciones adicionales',
    example: 'El paciente mostró buen comportamiento durante el examen',
    required: false,
  })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({
    description: 'Vacunas aplicadas',
    example: 'Vacuna antirrábica refuerzo',
    required: false,
  })
  @IsString()
  @IsOptional()
  vaccinations?: string;

  @ApiProperty({
    description: 'Peso de la mascota en kilogramos',
    example: 12.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({
    description: 'Temperatura corporal en grados Celsius',
    example: 38.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({
    description: 'Fecha de la próxima cita recomendada (YYYY-MM-DD)',
    example: '2025-12-20',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  nextAppointment?: string;
}
