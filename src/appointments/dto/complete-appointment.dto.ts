import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { DiagnosisType } from 'src/medical-records-pet/dto/create-medical-records-pet.dto';

export enum MedicationType {
  GENERAL = 'GENERAL',
  CONTROLLED = 'CONTROLLED',
}

export class MedicationUsedDto {
  @ApiProperty({
    description: 'ID del medicamento usado',
    example: 'uuid-medicamento-1',
  })
  @IsUUID()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty({
    description: 'Tipo de medicamento',
    enum: MedicationType,
    example: 'GENERAL',
  })
  @IsEnum(MedicationType)
  @IsNotEmpty()
  medicationType: MedicationType;

  @ApiProperty({
    description: 'Cantidad usada',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'Dosificación prescrita',
    example: '1 comprimido cada 12 horas',
  })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({
    description: 'Duración del tratamiento',
    example: '7 días',
  })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({
    description: 'Notas adicionales de la prescripción',
    example: 'Observar efectos secundarios',
    required: false,
  })
  @IsString()
  @IsOptional()
  prescriptionNotes?: string;
}

export class CompleteAppointmentDto {
  @ApiProperty({
    description: 'Diagnóstico de la consulta',
    enum: DiagnosisType,
    example: 'GASTROENTERITIS',
  })
  @IsEnum(DiagnosisType)
  @IsNotEmpty()
  diagnosis: DiagnosisType;

  @ApiProperty({
    description: 'Tratamiento prescrito',
    example: 'Dieta blanda por 3 días',
  })
  @IsString()
  @IsNotEmpty()
  treatment: string;

  @ApiProperty({
    description: 'Observaciones adicionales',
    example: 'Control en 1 semana',
  })
  @IsString()
  @IsNotEmpty()
  observations: string;

  @ApiProperty({
    description: 'Fecha de próximo turno',
    example: '2025-12-22',
    required: false,
  })
  @IsString()
  @IsOptional()
  nextAppointment?: string;

  @ApiProperty({
    description: 'Vacunas aplicadas',
    example: 'Antirrábica',
    required: false,
  })
  @IsString()
  @IsOptional()
  vaccinations?: string;

  @ApiProperty({
    description: 'Peso de la mascota en kg',
    example: 15.5,
  })
  @IsNumber()
  @IsNotEmpty()
  weight: number;

  @ApiProperty({
    description: 'Temperatura en °C',
    example: 38.5,
  })
  @IsNumber()
  @IsNotEmpty()
  temperature: number;

  @ApiProperty({
    description: 'Lista de medicamentos usados en la consulta',
    type: [MedicationUsedDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationUsedDto)
  @IsOptional()
  medicationsUsed?: MedicationUsedDto[];
}
