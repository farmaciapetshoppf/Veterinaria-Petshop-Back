import { Module } from '@nestjs/common';
import { SaleOrdersService } from './sale-orders.service';
import { SaleOrdersController } from './sale-orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleOrder } from './entities/sale-order.entity';
import { ProductsModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { SaleOrderProduct } from './entities/sale-order-product.entity';

@Module({
  imports:[ TypeOrmModule.forFeature([SaleOrder, SaleOrderProduct ]),
  ProductsModule,
  UsersModule],
  controllers: [SaleOrdersController],
  providers: [SaleOrdersService],
})
export class SaleOrdersModule {}
