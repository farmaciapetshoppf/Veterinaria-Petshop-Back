// create-review.dto.ts
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Calificación de la reseña',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Comentario de la reseña',
    example: 'Excelente servicio, muy recomendado',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({
    description: 'ID del veterinario',
    example: 'e9b5550e-5c32-4c33-9e5e-1c1d5d7f0e9b',
    format: 'uuid',
  })
  @IsUUID()
  veterinarianId: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: 'a7b5550e-5c32-4c33-9e5e-1c1d5d7f0e9b',
    format: 'uuid',
  })
  @IsUUID()
  userId: string;
}
