// veterinarians.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansRepository } from './vaterinarians.repository';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { StorageService } from 'src/supabase/storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { VeterinariansSeeder } from './seed/veterinarians.seed';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Veterinarian]),
    SupabaseModule,
    MailerModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // Limitar el tamaño a 50MB
      },
    }),
  ],
  controllers: [VeterinariansController],
  providers: [VeterinariansService, VeterinariansRepository, StorageService, VeterinariansSeeder],
  exports: [VeterinariansService, VeterinariansSeeder],
})
export class VeterinariansModule {}
