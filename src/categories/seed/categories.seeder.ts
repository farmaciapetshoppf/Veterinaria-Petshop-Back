import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CategoriesSeeder implements OnModuleInit {

  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count > 0) return;

    const filePath = path.join(process.cwd(), 'src', 'categories', 'seed', 'categories.json');
    const file = fs.readFileSync(filePath, 'utf8');
    const categories = JSON.parse(file);

    await this.repo.save(categories);

    console.log('✅ Categorías cargadas desde JSON');
  }
}
