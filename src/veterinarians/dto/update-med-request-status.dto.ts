import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';

export enum RequestStatus {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

export class UpdateMedRequestStatusDto {
  @ApiProperty({
    description: 'ID del veterinario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  veterinarianId: string;

  @ApiProperty({
    description: 'Índice de la solicitud en el array',
    example: 0,
  })
  @IsNumber()
  requestIndex: number;

  @ApiProperty({
    description: 'Nuevo estado de la solicitud',
    enum: RequestStatus,
    example: RequestStatus.APROBADO,
  })
  @IsEnum(RequestStatus)
  estado: RequestStatus;

  @ApiProperty({
    description: 'Comentario del administrador',
    example: 'Aprobado - disponible en almacén',
    required: false,
  })
  @IsString()
  @IsOptional()
  comentarioAdmin?: string;
}
