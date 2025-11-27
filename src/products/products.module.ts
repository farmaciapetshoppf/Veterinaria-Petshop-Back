import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { Categories } from 'src/categories/entities/category.entity';
import { SaleOrderProduct } from 'src/sale-orders/entities/sale-order-product.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Products, Categories, SaleOrderProduct])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule]
})
export class ProductsModule {}
