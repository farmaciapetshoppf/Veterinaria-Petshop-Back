import { PartialType } from '@nestjs/swagger';
import { CreateVeterinarianDto } from './create-veterinarian.dto';
import { IsOptional, IsString } from 'class-validator';
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
}
