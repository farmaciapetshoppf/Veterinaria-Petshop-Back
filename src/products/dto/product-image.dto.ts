// src/products/dto/product-image.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductImageDto {
  @ApiProperty({
    description: 'URL de la imagen del producto',
    example: 'https://example.com/images/product-1.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: 'Orden de visualización de la imagen',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  order?: number;
}
