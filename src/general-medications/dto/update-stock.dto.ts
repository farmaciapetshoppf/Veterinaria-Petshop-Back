import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
  @ApiProperty({
    description: 'Cantidad a sumar (positivo) o restar (negativo) del stock',
    example: 20,
  })
  @IsInt()
  quantity: number;
}
