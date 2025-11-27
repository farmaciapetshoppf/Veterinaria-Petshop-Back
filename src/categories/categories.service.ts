import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category)
  private readonly categoryRepo: Repository<Category>){}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepo.create(createCategoryDto)
    return await this.categoryRepo.save(category);
  }

  async findAll() {
    return this.categoryRepo.find({relations: ['products'] });
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findOne({where: {id}});

    if (!category){
      throw new NotFoundException ('Categoría no encontrada')
    };
      
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category= await this.findOne(id);
    Object.assign(category, updateCategoryDto)
    return this.categoryRepo.save(category);

  }

  async remove(id: string) {
    const category= await this.findOne(id)
    return this.categoryRepo.delete(category);
  }
}
