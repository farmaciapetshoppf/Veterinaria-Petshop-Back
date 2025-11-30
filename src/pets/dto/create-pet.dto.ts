import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PetEspecies,
  PetSexo,
  PetTamano,
  PetEsterilizado,
  PetStatus,
} from '../entities/pet.entity';

export class CreatePetDto {
  @ApiProperty({
    description: 'Nombre de la mascota',
    example: 'Firulais',
    type: 'string',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Especie de la mascota',
    enum: PetEspecies,
    example: PetEspecies.PERRO,
  })
  @IsEnum(PetEspecies)
  especie: PetEspecies;

  @ApiProperty({
    description: 'Sexo de la mascota',
    enum: PetSexo,
    example: PetSexo.MACHO,
  })
  @IsEnum(PetSexo)
  sexo: PetSexo;

  @ApiProperty({
    description: 'Tamaño de la mascota',
    enum: PetTamano,
    example: PetTamano.MEDIANO,
  })
  @IsEnum(PetTamano)
  tamano: PetTamano;

  @ApiProperty({
    description: 'Indica si la mascota está esterilizada',
    enum: PetEsterilizado,
    example: PetEsterilizado.SI,
  })
  @IsEnum(PetEsterilizado)
  esterilizado: PetEsterilizado;

  @ApiProperty({
    description: 'Estado actual de la mascota',
    enum: PetStatus,
    example: PetStatus.VIVO,
  })
  @IsEnum(PetStatus)
  status: PetStatus;

  @ApiProperty({
    description: 'Fecha de nacimiento de la mascota',
    example: '2020-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fecha_nacimiento: string;

  @ApiProperty({
    description: 'Fecha de fallecimiento de la mascota (si aplica)',
    example: '2025-10-20',
    type: 'string',
    format: 'date',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  fecha_fallecimiento?: string | null;

  @ApiProperty({
    description: 'Raza de la mascota',
    example: 'Labrador Retriever',
    type: 'string',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  breed?: string | null;

  @ApiProperty({
    description: 'ID de la madre de la mascota (si se conoce)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  motherId?: string | null;

  @ApiProperty({
    description: 'ID del padre de la mascota (si se conoce)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  fatherId?: string | null;

  @ApiProperty({
    description: 'URL de la imagen de la mascota',
    example: 'https://example.com/images/firulais.jpg',
    type: 'string',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiProperty({
    description: 'ID del propietario de la mascota',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string | null;
}
