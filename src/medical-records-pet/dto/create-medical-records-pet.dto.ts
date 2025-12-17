import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DiagnosisType {
  PARVOVIROSIS = 'Parvovirosis Canina',
  MOQUILLO = 'Moquillo',
  DERMATITIS_ALERGICA = 'Dermatitis Alérgica',
  GASTROENTERITIS = 'Gastroenteritis',
  OTITIS_EXTERNA = 'Otitis Externa',
  ENFERMEDAD_PERIODONTAL = 'Enfermedad Periodontal',
  CONJUNTIVITIS = 'Conjuntivitis',
  PARASITOS_INTESTINALES = 'Parásitos Intestinales',
  ARTROSIS = 'Artrosis',
  CONTROL_RUTINA = 'Control de Rutina',
  INFECCION_RESPIRATORIA = 'Infección Respiratoria',
  FRACTURA = 'Fractura',
  OBESIDAD = 'Obesidad',
  INSUFICIENCIA_RENAL = 'Insuficiencia Renal',
  DIABETES = 'Diabetes',
  ALERGIAS_ALIMENTARIAS = 'Alergias Alimentarias',
  PROBLEMAS_CARDIACOS = 'Problemas Cardíacos',
  EPILEPSIA = 'Epilepsia',
  INFECCION_URINARIA = 'Infección Urinaria',
  TRAUMATISMO = 'Traumatismo',
  INTOXICACION = 'Intoxicación',
  OTRO = 'Otro',
}

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
    description: 'Diagnóstico de la consulta (enum predefinido para analytics)',
    enum: DiagnosisType,
    example: DiagnosisType.CONTROL_RUTINA,
  })
  @IsEnum(DiagnosisType)
  @IsNotEmpty()
  diagnosis: DiagnosisType;

  @ApiProperty({
    description: 'Detalles adicionales del diagnóstico (requerido si diagnosis es "Otro")',
    example: 'Conjuntivitis bacteriana con secreción purulenta',
    required: false,
  })
  @IsString()
  @IsOptional()
  diagnosisDetails?: string;

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

  @ApiProperty({
    description: 'Medicamentos utilizados en la consulta con tracking de stock',
    required: false,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        medicationId: { type: 'string', format: 'uuid' },
        medicationName: { type: 'string' },
        medicationType: { type: 'string', enum: ['GENERAL', 'CONTROLLED'] },
        quantity: { type: 'number', minimum: 1 },
        dosage: { type: 'string' },
        duration: { type: 'string' },
        prescriptionNotes: { type: 'string' },
      },
    },
    example: [
      {
        medicationId: '123e4567-e89b-12d3-a456-426614174000',
        medicationName: 'Amoxicilina 500mg',
        medicationType: 'GENERAL',
        quantity: 10,
        dosage: '1 comprimido cada 12 horas',
        duration: '7 días',
        prescriptionNotes: 'Tomar con alimentos',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MedicationUsedDto)
  medicationsUsed?: MedicationUsedDto[];
}

export enum MedicationType {
  GENERAL = 'GENERAL',
  CONTROLLED = 'CONTROLLED',
}

export class MedicationUsedDto {
  @ApiProperty({
    description: 'ID del medicamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty({
    description: 'Nombre del medicamento',
    example: 'Amoxicilina 500mg',
  })
  @IsString()
  @IsNotEmpty()
  medicationName: string;

  @ApiProperty({
    description: 'Tipo de medicamento',
    enum: MedicationType,
    example: MedicationType.GENERAL,
  })
  @IsEnum(MedicationType)
  @IsNotEmpty()
  medicationType: MedicationType;

  @ApiProperty({
    description: 'Cantidad utilizada',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'Dosis prescrita',
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
    example: 'Tomar con alimentos',
    required: false,
  })
  @IsString()
  @IsOptional()
  prescriptionNotes?: string;
}
