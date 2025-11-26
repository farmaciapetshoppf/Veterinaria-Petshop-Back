import { PartialType } from '@nestjs/mapped-types';
import { CreateVeterinarianDto } from './create-veterinarian.dto';

export class UpdateVeterinarianDto extends PartialType(CreateVeterinarianDto) {}
