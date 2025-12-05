// categories.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { StorageService } from '../supabase/storage.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const categoryData: CreateCategoryDto = {
      ...createCategoryDto,
      imgUrl: 'No image',
    };

    if (file) {
      await this.validateImageFile(file);
      const imageUrl = await this.uploadCategoryImage(file);
      if (imageUrl) {
        categoryData.imgUrl = imageUrl;
      }
    }

    const category = this.categoryRepo.create(categoryData);
    return await this.categoryRepo.save(category);
  }

  async findAll() {
    return this.categoryRepo.find({
      relations: ['products'],
      withDeleted: false, // Esto es opcional, ya que es el comportamiento por defecto
    });
  }

  async findAllBasic() {
    return this.categoryRepo.find({
      select: ['id', 'name', 'imgUrl'],
    });
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const category = await this.findOne(id);

    const updateData: UpdateCategoryDto = { ...updateCategoryDto };

    if (file) {
      await this.validateImageFile(file);
      const imageUrl = await this.uploadCategoryImage(file);
      if (imageUrl) {
        updateData.imgUrl = imageUrl;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        'No se proporcionaron datos para actualizar',
      );
    }

    Object.assign(category, updateData);
    return this.categoryRepo.save(category);
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    await this.categoryRepo.softRemove(category);
    return { message: 'Categoría eliminada correctamente' };
  }

  private async validateImageFile(file: Express.Multer.File): Promise<void> {
    if (!file.mimetype.includes('image/')) {
      throw new BadRequestException(
        'El archivo debe ser una imagen (.jpg, .png, .webp)',
      );
    }
  }

  private async uploadCategoryImage(
    file: Express.Multer.File,
  ): Promise<string | null> {
    const result = await this.storageService.uploadFile(file, 'categories');

    if (!result) {
      throw new BadRequestException('Error al subir la imagen');
    }

    return result.publicUrl;
  }
}
