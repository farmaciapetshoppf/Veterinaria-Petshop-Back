/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../supabase/storage.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  @ApiOperation({ summary: 'Load product seeder' })
  @Get('seeder/load')
  seed() {
    return this.productsService.seeder();
  }

  @ApiOperation({ summary: 'Create new product with image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Alimento Premium para Perros' },
        description: {
          type: 'string',
          example:
            'Alimento balanceado con nutrientes esenciales para perros adultos',
        },
        price: { type: 'number', example: 25.99 },
        stock: { type: 'integer', example: 100 },
        categoryId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Imagen del producto (.jpg, .png, .webp)',
        },
      },
      required: ['name', 'price', 'stock', 'image'],
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDtoRaw: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('La imagen del producto es obligatoria');
    }

    if (!file.mimetype.includes('image/')) {
      throw new BadRequestException(
        'El archivo debe ser una imagen (.jpg, .png, .webp)',
      );
    }

    const createProductDto: CreateProductDto = {
      ...createProductDtoRaw,
      price: Number(createProductDtoRaw.price),
      stock: Number(createProductDtoRaw.stock),
    };

    const result = await this.storageService.uploadFile(file, 'products');

    if (!result) {
      throw new BadRequestException('Error al subir la imagen');
    }

    createProductDto.imgUrl = result.publicUrl;

    return this.productsService.create(createProductDto);
  }

  @ApiOperation({ summary: 'Update product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Nueva imagen del producto (.jpg, .png, .webp)',
        },
      },
    },
  })
  @Patch(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  async updateProductImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado una imagen');
    }

    if (!file.mimetype.includes('image/')) {
      throw new BadRequestException(
        'El archivo debe ser una imagen (.jpg, .png, .webp)',
      );
    }

    const product = await this.productsService.findOne(id);

    const result = await this.storageService.uploadFile(file, 'products');

    if (!result) {
      throw new BadRequestException('Error al subir la imagen');
    }

    const updateDto: UpdateProductDto = {
      imgUrl: result.publicUrl,
    };

    return this.productsService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Get all products' })
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update product' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @ApiOperation({ summary: 'Delete product' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
