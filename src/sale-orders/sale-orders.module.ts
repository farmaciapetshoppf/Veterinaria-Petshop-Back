import { Module } from '@nestjs/common';
import { SaleOrdersService } from './sale-orders.service';
import { SaleOrdersController } from './sale-orders.controller';

@Module({
  controllers: [SaleOrdersController],
  providers: [SaleOrdersService],
})
export class SaleOrdersModule {}
