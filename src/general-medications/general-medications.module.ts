import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralMedicationsController } from './general-medications.controller';
import { GeneralMedicationsService } from './general-medications.service';
import { GeneralMedication } from './entities/general-medication.entity';
import { MedicationRestockRequest } from './entities/medication-restock-request.entity';
import { MedicationUsageHistory } from './entities/medication-usage-history.entity';
import { Users } from '../users/entities/user.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { VeterinariansModule } from '../veterinarians/veterinarians.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneralMedication,
      MedicationRestockRequest,
      MedicationUsageHistory,
      Users,
      Veterinarian,
    ]),
    AuthModule,
    UsersModule,
    VeterinariansModule,
  ],
  controllers: [GeneralMedicationsController],
  providers: [GeneralMedicationsService],
  exports: [GeneralMedicationsService],
})
export class GeneralMedicationsModule {}
