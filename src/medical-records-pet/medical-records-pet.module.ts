import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsPetService } from './medical-records-pet.service';
import { MedicalRecordsPetController } from './medical-records-pet.controller';
import { MedicalRecordsPet } from './entities/medical-records-pet.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { GeneralMedication } from 'src/general-medications/entities/general-medication.entity';
import { MedicationUsageHistory } from 'src/general-medications/entities/medication-usage-history.entity';
import { AdminNotification } from 'src/general-medications/entities/admin-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecordsPet,
      Pet,
      Veterinarian,
      GeneralMedication,
      MedicationUsageHistory,
      AdminNotification,
    ]),
  ],
  controllers: [MedicalRecordsPetController],
  providers: [MedicalRecordsPetService],
  exports: [MedicalRecordsPetService],
})
export class MedicalRecordsPetModule {}
