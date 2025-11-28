/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { Repository } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import productsData from './seed/products.json';
import { ProductSeed } from './interfaces/product-seed.interface';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const category = await this.categoriesRepository.findOneBy({
      id: createProductDto.categoryId,
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const product = this.productsRepository.create({
      ...createProductDto,
      category,
    });
    return this.productsRepository.save(product);
  }

  async findAll() {
    return this.productsRepository.find({
      relations: ['category'],
    });
  }

  async findOne(id: string) {
    const product = this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productsRepository.findOneOrFail({
      where: { id },
      relations: ['category'],
    });

    if (updateProductDto.categoryId) {
      const category = await this.categoriesRepository.findOneBy({
        id: updateProductDto.categoryId,
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      product.category = category;
    }

    Object.assign(product, updateProductDto);

    return this.productsRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.productsRepository.findOne({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.productsRepository.remove(product);
    return 'Product deleted';
  }

  async seeder(): Promise<string> {
    const categories = await this.categoriesRepository.find();

    if (!categories.length) {
      throw new Error('Primero hay que ejecutar el seeder de categorías');
    }

    const categoryMap = new Map(
      categories.map((cat) => [cat.name.toLowerCase(), cat]),
    );

    const existingProducts = await this.productsRepository.find();
    const existingProductNames = new Set(existingProducts.map((p) => p.name));

    interface ProductToInsert {
      name: string;
      description: string;
      price: number;
      stock: number;
      imgUrl: string;
      category: any;
    }

    const productsToInsert: ProductToInsert[] = [];

    for (const product of productsData as ProductSeed[]) {
      const category = categoryMap.get(product.category.toLowerCase());

      if (!category) {
        console.warn(`Categoría no encontrada para: ${product.name}`);
        continue;
      }

      if (existingProductNames.has(product.name)) {
        console.log(`Producto ya existe: ${product.name}`);
        continue;
      }

      productsToInsert.push({
        name: product.name,
        description: product.description || 'Sin descripción',
        price: product.price,
        stock: product.stock,
        imgUrl: product.imgUrl || 'No image',
        category: category,
      });
    }

    if (!productsToInsert.length) {
      return 'No hay nuevos productos para insertar';
    }

    let inserted = 0;

    for (const productData of productsToInsert) {
      try {
        const newProduct = this.productsRepository.create(productData);
        await this.productsRepository.save(newProduct);
        inserted++;
      } catch (err) {
        console.error(
          `Error insertando producto: ${productData.name}`,
          err.message,
        );
      }
    }

    console.log(`Total de productos insertados: ${inserted}`);
    return `${inserted} productos insertados`;
  }
}
