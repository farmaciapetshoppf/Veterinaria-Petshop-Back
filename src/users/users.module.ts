import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Pet } from 'src/pets/entities/pet.entity';
import { SaleOrder } from 'src/sale-orders/entities/sale-order.entity';



@Module({
  imports: [TypeOrmModule.forFeature([Users, Pet, SaleOrder])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, SupabaseService],
  exports: [UsersService],
})
export class UsersModule {}
