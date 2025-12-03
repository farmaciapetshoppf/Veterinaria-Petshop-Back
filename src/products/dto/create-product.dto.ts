import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto (debe ser único)',
    example: 'Alimento Premium para Perros',
    type: 'string',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example:
      'Alimento balanceado con nutrientes esenciales para el crecimiento y mantenimiento de perros adultos',
    type: 'string',
    required: false,
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Precio de venta del producto',
    example: 25.99,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Cantidad disponible en inventario',
    example: 100,
    type: 'integer',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'URL de la imagen del producto',
    example: 'https://example.com/images/alimento-perro.jpg',
    type: 'string',
    default: 'No image',
  })
  @IsString()
  imgUrl: string;

  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el producto',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
