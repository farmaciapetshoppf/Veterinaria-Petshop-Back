import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointments,
      Veterinarian,
      Users,
      Pet,
      MedicalRecordsPet,
    ]),
    UsersModule,
    PetsModule,
    MailerModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsAnalyticsSeeder],
  exports: [AppointmentsService, AppointmentsAnalyticsSeeder],
})
export class AppointmentsModule {}
