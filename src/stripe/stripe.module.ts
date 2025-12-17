import { forwardRef, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { SaleOrdersModule } from 'src/sale-orders/sale-orders.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => SaleOrdersModule),
    MailerModule,
    forwardRef(() => AuthModule),
  ],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
