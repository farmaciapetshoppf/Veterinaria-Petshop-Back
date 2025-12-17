import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class ShippingItemDto {
  @ApiProperty({ example: 'abc123', description: 'ID del producto' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Cantidad de productos' })
  @IsNotEmpty()
  quantity: number;
}

export class CalculateShippingDto {
  @ApiProperty({ 
    example: '1425', 
    description: 'Código postal del destino (formato argentino)',
    required: false
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    example: -34.6037,
    description: 'Latitud de la dirección de entrega',
    required: false
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    example: -58.3816,
    description: 'Longitud de la dirección de entrega',
    required: false
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ 
    type: [ShippingItemDto], 
    required: false,
    description: 'Lista de productos (opcional, para cálculo por peso/volumen futuro)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingItemDto)
  items?: ShippingItemDto[];
}
