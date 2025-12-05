import { ApiProperty } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class CreateProductWithImageDto extends CreateProductDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Imagen del producto',
    required: false,
  })
  image?: any;
}
