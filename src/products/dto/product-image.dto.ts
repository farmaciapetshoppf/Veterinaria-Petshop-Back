import { ApiProperty } from '@nestjs/swagger';

export class ProductImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Imagen del producto',
  })
  image: any;
}
