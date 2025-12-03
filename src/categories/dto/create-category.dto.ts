// create-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Debe ser un string de 3 caracteres mínimo',
    example: 'Collar',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, {
    message: 'El nombre de la categoría debe tener al menos 3 caracteres',
  })
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  imgUrl?: string;
}
