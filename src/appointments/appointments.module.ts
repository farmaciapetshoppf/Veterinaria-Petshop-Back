import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointments } from './entities/appointment.entity';
import { UsersModule } from 'src/users/users.module';
import { PetsModule } from 'src/pets/pets.module';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';

@Module({
  imports:[TypeOrmModule.forFeature([Appointments]), UsersModule, PetsModule, VeterinariansModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
