import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SaleOrder } from 'src/sale-orders/entities/sale-order.entity';
import { Users } from 'src/users/entities/user.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import { Products } from 'src/products/entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { MedicalRecordsPet } from 'src/medical-records-pet/entities/medical-records-pet.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleOrder,
      Users,
      Appointments,
      Products,
      Category,
      Veterinarian,
      MedicalRecordsPet,
    ]),
    forwardRef(() => AuthModule),
    UsersModule,
    VeterinariansModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
