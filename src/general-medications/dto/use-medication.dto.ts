import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseMedicationDto {
  @ApiProperty({
    description: 'ID del medicamento a usar',
    example: 'uuid',
  })
  @IsUUID()
  medicationId: string;

  @ApiProperty({
    description: 'Cantidad a usar',
    example: 5,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Notas opcionales sobre el uso',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
