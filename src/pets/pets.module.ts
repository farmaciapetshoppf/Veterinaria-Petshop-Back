import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PetRepository } from './repositories/pet.repository';
import { Type } from 'class-transformer';
import { Pet } from './entities/pet.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Users } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pet,Users])],
  controllers: [PetsController],
  providers: [PetsService, PetRepository],
  exports: [PetsService],
})
export class PetsModule {}
