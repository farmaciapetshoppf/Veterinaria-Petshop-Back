import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Pet } from 'src/pets/entities/pet.entity';
import { SaleOrder } from 'src/sale-orders/entities/sale-order.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import { StorageService } from 'src/supabase/storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { UsersSeeder } from './seed/users.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Pet, SaleOrder, Appointments]),
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // Limitar el tamaño a 50MB
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, SupabaseService, StorageService, UsersSeeder],
  exports: [UsersService],
})
export class UsersModule {}
