import { forwardRef, Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointments } from './entities/appointment.entity';
import { UsersModule } from 'src/users/users.module';
import { PetsModule } from 'src/pets/pets.module';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Users } from 'src/users/entities/user.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { MailerModule } from 'src/mailer/mailer.module';
import { MedicalRecordsPet } from 'src/medical-records-pet/entities/medical-records-pet.entity';
import { AppointmentsAnalyticsSeeder } from './seed/appointments-analytics.seeder';
import { GeneralMedicationsModule } from 'src/general-medications/general-medications.module';
import { GeneralMedication } from 'src/general-medications/entities/general-medication.entity';
import { MedicationUsageHistory } from 'src/general-medications/entities/medication-usage-history.entity';
import { AdminNotification } from 'src/general-medications/entities/admin-notification.entity';
import { AuthModule } from 'src/auth/auth.module';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointments,
      Veterinarian,
      Users,
      Pet,
      MedicalRecordsPet,
      GeneralMedication,
      MedicationUsageHistory,
      AdminNotification,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => VeterinariansModule),
    PetsModule,
    MailerModule,
    GeneralMedicationsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsAnalyticsSeeder],
  exports: [AppointmentsService, AppointmentsAnalyticsSeeder],
})
export class AppointmentsModule {}
