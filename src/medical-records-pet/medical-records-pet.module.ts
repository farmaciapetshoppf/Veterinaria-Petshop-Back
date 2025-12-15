import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsPetService } from './medical-records-pet.service';
import { MedicalRecordsPetController } from './medical-records-pet.controller';
import { MedicalRecordsPet } from './entities/medical-records-pet.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecordsPet, Pet, Veterinarian])],
  controllers: [MedicalRecordsPetController],
  providers: [MedicalRecordsPetService],
  exports: [MedicalRecordsPetService],
})
export class MedicalRecordsPetModule {}
