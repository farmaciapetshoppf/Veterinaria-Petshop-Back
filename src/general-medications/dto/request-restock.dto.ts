import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestRestockDto {
  @ApiProperty({
    description: 'ID del medicamento a reponer',
    example: 'uuid',
  })
  @IsUUID()
  medicationId: string;

  @ApiProperty({
    description: 'Cantidad a solicitar',
    example: 50,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
