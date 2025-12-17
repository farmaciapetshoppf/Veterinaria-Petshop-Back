import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordsPetService } from './medical-records-pet.service';
import { MedicalRecordsPetController } from './medical-records-pet.controller';
import { MedicalRecordsPet } from './entities/medical-records-pet.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { GeneralMedication } from 'src/general-medications/entities/general-medication.entity';
import { MedicationUsageHistory } from 'src/general-medications/entities/medication-usage-history.entity';
import { AdminNotification } from 'src/general-medications/entities/admin-notification.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';

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
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => VeterinariansModule),
  ],
  controllers: [MedicalRecordsPetController],
  providers: [MedicalRecordsPetService],
  exports: [MedicalRecordsPetService],
})
export class MedicalRecordsPetModule {}
