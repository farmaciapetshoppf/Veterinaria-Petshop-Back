import { IsEnum, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator'
import { PetEspecies, PetSexo, PetTamano, PetEsterilizado, PetStatus, } from '../entities/pet.entity';



export class CreatePetDto {
  @IsString()
  nombre: string;

  @IsEnum(PetEspecies)
  especie: PetEspecies;

  @IsEnum(PetSexo)
  sexo: PetSexo;

  @IsEnum(PetTamano)
  tamano: PetTamano;

  @IsEnum(PetEsterilizado)
  esterilizado: PetEsterilizado;

  @IsEnum(PetStatus)
  status: PetStatus;

  @IsDateString()
  fecha_nacimiento: string;

  @IsOptional()
  @IsDateString()
  fecha_fallecimiento?: string | null;

  @IsOptional()
  @IsString()
  breed?: string | null;

  @IsOptional()
  @IsUUID()
  motherId?: string | null;

  @IsOptional()
  @IsUUID()
  fatherId?: string | null;

  @IsOptional()
  @IsString()
  image?: string | null;

  @IsOptional()
  @IsUUID()
  ownerId?: string | null;
}

