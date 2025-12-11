import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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
import { SupabaseModule } from './supabase/supabase.module';
import { ProductsService } from './products/products.service';
import { MailerModule } from './mailer/mailer.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadModule } from './upload/upload.module';
import { MedicalRecordsPetModule } from './medical-records-pet/medical-records-pet.module';
import { MapsModule } from './maps/maps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(), // Habilita tareas programadas (CRON jobs)

    TypeOrmModule.forRootAsync(typeormConfig),
    UsersModule,
    SupabaseModule,
    PetsModule,
    UploadModule,
    VeterinariansModule,
    AppointmentsModule,
    ProductsModule,
    CategoriesModule,
    BranchesModule,
    SaleOrdersModule,
    DatabaseModule,
    AuthModule,
    MailerModule,
    ReviewsModule,
    MedicalRecordsPetModule,
    MapsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly productsService: ProductsService) {}
  async onApplicationBootstrap() {
    console.log('Aplicación inicializada correctamente');
    await this.productsService.seeder();
    console.log('Productos cargados');
  }
}
