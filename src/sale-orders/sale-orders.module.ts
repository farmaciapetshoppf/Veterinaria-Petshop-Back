import { forwardRef, Module } from '@nestjs/common';
import { SaleOrdersService } from './sale-orders.service';
import { SaleOrdersController } from './sale-orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleOrder } from './entities/sale-order.entity';
import { ProductsModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { SaleOrderProduct } from './entities/sale-order-product.entity';
import { Products } from 'src/products/entities/product.entity';
import { Users } from 'src/users/entities/user.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import { MercadoPagoModule } from 'src/mercadopago/mercadopago.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { SaleOrdersAnalyticsSeeder } from './seed/sale-orders-analytics.seeder';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleOrder,
      SaleOrderProduct,
      Products,
      Users,
      Branch,
    ]),
    ProductsModule,
    UsersModule,
    MercadoPagoModule,
    forwardRef(() => AuthModule),
    MailerModule,
    forwardRef(() => StripeModule),
  ],
  controllers: [SaleOrdersController],
  providers: [SaleOrdersService, SaleOrdersAnalyticsSeeder],
  exports: [SaleOrdersService, SaleOrdersAnalyticsSeeder],
})
export class SaleOrdersModule {}
