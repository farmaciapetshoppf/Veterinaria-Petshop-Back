import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { SaleOrderProduct } from 'src/sale-orders/entities/sale-order-product.entity';
import { CategoriesModule } from 'src/categories/categories.module';
import { Category } from 'src/categories/entities/category.entity';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { StorageService } from 'src/supabase/storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { ProductImage } from './entities/product-image.entity';
import { ProductImageService } from './products-image.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Products,
      ProductImage,
      Category,
      SaleOrderProduct,
    ]),
    CategoriesModule,
    forwardRef(() => AuthModule),
    forwardRef(() => VeterinariansModule),
    forwardRef(() => UsersModule),
    SupabaseModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // Limitar el tamaño a 50MB
      },
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductImageService, StorageService],
  exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
