// src/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { StorageService } from '../supabase/storage.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    SupabaseModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB límite de tamaño de imagen
      },
    }),
  ],
  controllers: [UploadController],
  providers: [StorageService],
  exports: [StorageService],
})
export class UploadModule {}
