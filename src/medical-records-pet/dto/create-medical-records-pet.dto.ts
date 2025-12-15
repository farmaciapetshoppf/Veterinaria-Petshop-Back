import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  IsEnum,
} from 'class-validator';

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
}
