import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeormConfig } from './config/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { VeterinariansModule } from './veterinarians/veterinarians.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BranchesModule } from './branches/branches.module';
import { SaleOrdersModule } from './sale-orders/sale-orders.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync(typeormConfig),
    UsersModule,
    PetsModule,
    VeterinariansModule,
    AppointmentsModule,
    ProductsModule,
    CategoriesModule,
    BranchesModule,
    SaleOrdersModule,
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
