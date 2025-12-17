import { forwardRef, Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesSeeder } from './seed/categories.seeder';
import { SupabaseModule } from '../supabase/supabase.module';
import { StorageService } from '../supabase/storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    SupabaseModule,
    forwardRef(() => AuthModule),
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // Limitar el tamaño a 50MB
      },
    }),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesSeeder, StorageService],
  exports: [TypeOrmModule, CategoriesSeeder],
})
export class CategoriesModule {}
