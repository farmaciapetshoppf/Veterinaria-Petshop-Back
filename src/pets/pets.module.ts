import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PetRepository } from './repositories/pet.repository';
import { Pet } from './entities/pet.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Users } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet, Users]),
    AuthModule,
    UsersModule,
    SupabaseModule,
  ],
  controllers: [PetsController],
  providers: [PetsService, PetRepository],
  exports: [PetsService],
})
export class PetsModule {}
