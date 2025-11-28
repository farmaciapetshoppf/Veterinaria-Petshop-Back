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
  constructor (
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>
  ) {  console.log('Products repository:', !!productsRepository);
}

  async create(createProductDto: CreateProductDto) {
    const category= await this.categoriesRepository.findOneBy({id: createProductDto.categoryId});
    if(!category) {
      throw new NotFoundException ('Category not found');
    }
    const product = this.productsRepository.create({
      ...createProductDto,
      category
    });
    return this.productsRepository.save(product);
  }

  async findAll() {
    return this.productsRepository.find({
      relations:['category'],
    });
  }

  async findOne(id: string) {
    const product= this.productsRepository.findOne({
      where: {id},
      relations: ['category']
    })
    if (!product) {
      throw new NotFoundException ('Product not found')
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product= await this.productsRepository.findOneOrFail({
      where: {id},
      relations: ['category'],
    });

    if (updateProductDto.categoryId) {
      const category = await this.categoriesRepository.findOneBy({
        id: updateProductDto.categoryId,
      });
      if (!category) {
        throw new NotFoundException('Category not found')
      }
      product.category = category;
    }

    Object.assign(product, updateProductDto)
    
    return this.productsRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.productsRepository.findOne({
      where: {id},
  });
    if(!product){
      throw new NotFoundException('Product not found')
    }
    await this.productsRepository.remove(product);
    return 'Product deleted';
  }

  async seeder(): Promise<string> {
    const categories = await this.categoriesRepository.find();

    if (!categories.length) {
      throw new Error('Primero hay que ejecutar el seeder de categorías');
    }

    let inserted = 0;

    for (const product of productsData as ProductSeed[]) {
      try {
       
        const category = categories.find(
          (cat) => cat.name.toLowerCase() === product.category.toLowerCase(),
        );
        if (!category) {
          console.warn(`Categoría no encontrada para: ${product.name}`);
          continue;
        }

       
        const exists = await this.productsRepository.findOne({
          where: { name: product.name },
        });
        if (exists) continue;

        const newProduct = this.productsRepository.create({
          name: product.name,
          description: product.description || 'Sin descripción',
          price: product.price,
          stock: product.stock,
          imgUrl: product.imgUrl || 'No image',
          category,
        });

        
        await this.productsRepository.save(newProduct);
        inserted++;
        console.log(`Producto insertado: ${product.name}`);
      } catch (err) {
        console.error('Error insertando producto:', product.name, err.message);
      }
    }

    console.log(`Total de productos insertados: ${inserted}`);
    return `${inserted} productos insertados`;
}
}
