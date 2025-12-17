import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Pet } from 'src/pets/entities/pet.entity';
import { SaleOrder } from 'src/sale-orders/entities/sale-order.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import { StorageService } from 'src/supabase/storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { UsersSeeder } from './seed/users.seeder';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      Pet,
      SaleOrder,
      Appointments,
      Veterinarian,
    ]),
    forwardRef(() => VeterinariansModule),
    forwardRef(() => AuthModule),
    MailerModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // Limitar el tamaño a 50MB
      },
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    SupabaseService,
    StorageService,
    UsersSeeder,
  ],
  exports: [UsersService, UsersSeeder],
})
export class UsersModule {}
