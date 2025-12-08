// veterinarians.module.ts
import { Module } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansRepository } from './vaterinarians.repository';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { StorageService } from 'src/supabase/storage.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([Veterinarian]),
    SupabaseModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // Limitar el tamaño a 50MB
      },
    }),
  ],
  controllers: [VeterinariansController],
  providers: [VeterinariansService, VeterinariansRepository, StorageService],
  exports: [VeterinariansService],
})
export class VeterinariansModule {}
