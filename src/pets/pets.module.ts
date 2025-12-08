import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PetRepository } from './repositories/pet.repository';
import { Pet } from './entities/pet.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Users } from 'src/users/entities/user.entity';
import { StorageService } from 'src/supabase/storage.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet, Users]),
    SupabaseModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // Limitar el tamaño a 50MB
      },
    }),
  ],
  controllers: [PetsController],
  providers: [PetsService, PetRepository, StorageService],
  exports: [PetsService],
})
export class PetsModule {}
