// veterinarians.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansRepository } from './veterinarians.repository';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { StorageService } from 'src/supabase/storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { VeterinariansSeeder } from './seed/veterinarians.seed';
import { MailerModule } from 'src/mailer/mailer.module';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Veterinarian]),
    SupabaseModule,
    MailerModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // Limitar el tamaño a 50MB
      },
    }),
  ],
  controllers: [VeterinariansController],
  providers: [
    VeterinariansService,
    VeterinariansRepository,
    StorageService,
    VeterinariansSeeder,
    RolesGuard,
  ],
  exports: [VeterinariansService, VeterinariansSeeder],
})
export class VeterinariansModule {}
