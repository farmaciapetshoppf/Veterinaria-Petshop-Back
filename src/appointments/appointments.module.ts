import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointments } from './entities/appointment.entity';
import { UsersModule } from 'src/users/users.module';
import { PetsModule } from 'src/pets/pets.module';
// import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';
// import { Pet } from 'src/pets/entities/pet.entity';
// import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Users } from 'src/users/entities/user.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Appointments, Users, ]), UsersModule, PetsModule, ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
