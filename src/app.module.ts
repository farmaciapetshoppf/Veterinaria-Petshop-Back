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
import { ProductsService } from './products/products.service';
import { AppointmentsAnalyticsSeeder } from './appointments/seed/appointments-analytics.seeder';
import { VeterinariansSeeder } from './veterinarians/seed/veterinarians.seed';
import { SaleOrdersAnalyticsSeeder } from './sale-orders/seed/sale-orders-analytics.seeder';
import { UsersSeeder } from './users/seed/users.seeder';
import { CategoriesSeeder } from './categories/seed/categories.seeder';
import { GeneralMedicationsSeeder } from './general-medications/seed/general-medications.seeder';
import { MailerModule } from './mailer/mailer.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadModule } from './upload/upload.module';
import { MedicalRecordsPetModule } from './medical-records-pet/medical-records-pet.module';
import { ChatModule } from './chat/chat.module';
import { SupabaseModule } from './supabase/supabase.module';
import { MapsModule } from './maps/maps.module';
import { StripeModule } from './stripe/stripe.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GeneralMedicationsModule } from './general-medications/general-medications.module';

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
    ChatModule,
    MapsModule,
    StripeModule,
    AnalyticsModule,
    GeneralMedicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesSeeder: CategoriesSeeder,
    private readonly usersSeeder: UsersSeeder,
    private readonly veterinariansSeeder: VeterinariansSeeder,
    private readonly medicationsSeeder: GeneralMedicationsSeeder,
    private readonly appointmentsSeeder: AppointmentsAnalyticsSeeder,
    private readonly saleOrdersSeeder: SaleOrdersAnalyticsSeeder,
  ) {}
  async onApplicationBootstrap() {
    console.log('🚀 Aplicación inicializada correctamente');
    console.log('📦 Iniciando carga automática de seeders...');
    console.log('═'.repeat(50));
    
    // 1. Categorías (primero, porque productos las necesitan)
    console.log('\n📂 [1/7] Verificando categorías...');
    await this.categoriesSeeder.onModuleInit();
    
    // 2. Productos (necesitan categorías)
    console.log('\n🛍️  [2/7] Verificando productos...');
    await this.productsService.seeder();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Usuarios (antes que veterinarios porque pueden ser admins)
    console.log('\n👥 [3/7] Verificando usuarios...');
    await this.usersSeeder.onModuleInit();
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 4. Veterinarios (necesitan usuarios para crear cuentas)
    console.log('\n🩺 [4/7] Verificando veterinarios...');
    const existingVets = await this.veterinariansSeeder.getCount();
    if (existingVets < 6) {
      console.log('👨‍⚕️ Cargando veterinarios...');
      await this.veterinariansSeeder.seed();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      console.log(`✅ Ya existen ${existingVets} veterinarios`);
    }
    
    // 5. Medicamentos (antes de turnos porque pueden ser usados en consultas)
    console.log('\n💊 [5/7] Verificando medicamentos...');
    const medicationsResult = await this.medicationsSeeder.seed();
    if (medicationsResult) {
      if (medicationsResult.message === 'Medicamentos ya existentes') {
        console.log(`✅ ${medicationsResult.medications} medicamentos ya existentes`);
      } else {
        console.log(`✅ ${medicationsResult.medications} medicamentos cargados`);
        const lowStock = medicationsResult.lowStockControlled || 0;
        if (lowStock > 0) {
          console.log(`⚠️  ${lowStock} medicamentos controlados con stock bajo`);
        }
      }
    }
    
    // 6. Turnos con diagnósticos (necesitan veterinarios, usuarios y mascotas)
    console.log('\n📅 [6/7] Verificando turnos de analytics...');
    const appointmentsResult = await this.appointmentsSeeder.seed();
    if (appointmentsResult) {
      if (appointmentsResult.message === 'Turnos ya existentes') {
        console.log(`✅ ${appointmentsResult.appointments} turnos ya existentes`);
      } else {
        console.log(`✅ ${appointmentsResult.appointments} turnos y ${appointmentsResult.medicalRecords} registros médicos creados`);
      }
    }

    // 7. Órdenes de compra (necesitan usuarios y productos)
    console.log('\n🛒 [7/7] Verificando órdenes de compra para analytics...');
    const salesResult = await this.saleOrdersSeeder.seed();
    if (salesResult && salesResult.revenue !== undefined) {
      console.log(`✅ ${salesResult.orders} órdenes creadas - Ingresos: $${salesResult.revenue.toFixed(2)}`);
    } else if (salesResult) {
      console.log(`✅ ${salesResult.orders} órdenes ya existentes`);
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 Todos los seeders completados exitosamente');
    console.log('✨ Sistema listo para usar\n');
  }
}
