import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, Min } from 'class-validator';

export enum UrgencyLevel {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
}

export class CreateControlledMedRequestDto {
  @ApiProperty({
    description: 'Nombre del medicamento controlado',
    example: 'Ketamina 100mg',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Cantidad solicitada',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({
    description: 'Nivel de urgencia de la solicitud',
    enum: UrgencyLevel,
    example: UrgencyLevel.MEDIA,
  })
  @IsEnum(UrgencyLevel)
  urgencia: UrgencyLevel;

  @ApiProperty({
    description: 'Justificación de la solicitud',
    example: 'Procedimientos quirúrgicos programados para la próxima semana',
    required: false,
  })
  @IsString()
  justificacion?: string;
}
