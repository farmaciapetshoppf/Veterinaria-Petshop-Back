import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { SaleOrderProduct } from 'src/sale-orders/entities/sale-order-product.entity';
import { CategoriesModule } from 'src/categories/categories.module';
import { Category } from 'src/categories/entities/category.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Products, Category ,SaleOrderProduct]),
   CategoriesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule]
})
export class ProductsModule {}
