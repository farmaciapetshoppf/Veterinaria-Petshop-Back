import { PartialType } from '@nestjs/swagger';
import { CreateVeterinarianDto } from './create-veterinarian.dto';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVeterinarianDto extends PartialType(CreateVeterinarianDto) {
  @ApiProperty({
    description: 'Descripción profesional actualizada',
    example: 'Especialista en cirugía ortopédica',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Número de teléfono actualizado',
    example: '+34698765432',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Horario de atención actualizado',
    example: '2025-12-11T09:00:00Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  horario_atencion?: string;
}
