// src/products/product-image.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from './entities/product-image.entity';
import { Products } from './entities/product.entity';
import { StorageService } from '../supabase/storage.service';

@Injectable()
export class ProductImageService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly storageService: StorageService,
  ) {}

  async createProductImage(
    imageUrl: string,
    product: Products,
    order: number = 0,
  ): Promise<ProductImage> {
    const productImage = this.productImageRepository.create({
      imageUrl,
      product,
      order,
    });

    return this.productImageRepository.save(productImage);
  }

  async deleteProductImage(id: string): Promise<void> {
    await this.productImageRepository.delete(id);
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    return this.productImageRepository.find({
      where: { product: { id: productId } },
      order: { order: 'ASC' },
    });
  }
}
