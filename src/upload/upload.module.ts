// src/upload/upload.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { StorageService } from '../supabase/storage.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';

@Module({
  imports: [
    SupabaseModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => VeterinariansModule),
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
