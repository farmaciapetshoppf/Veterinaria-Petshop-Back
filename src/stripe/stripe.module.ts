import { forwardRef, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { SaleOrdersModule } from 'src/sale-orders/sale-orders.module';

@Module({
  imports: [forwardRef(() => SaleOrdersModule)],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
