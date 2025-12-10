import { PartialType } from '@nestjs/swagger';
import { CreateMedicalRecordsPetDto } from './create-medical-records-pet.dto';

export class UpdateMedicalRecordsPetDto extends PartialType(CreateMedicalRecordsPetDto) {}
