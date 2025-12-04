import { Module } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansRepository } from './vaterinarians.repository';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [TypeOrmModule.forFeature([Veterinarian]), SupabaseModule],
  controllers: [VeterinariansController],
  providers: [VeterinariansService, VeterinariansRepository],
  exports: [VeterinariansService],
})
export class VeterinariansModule {}
