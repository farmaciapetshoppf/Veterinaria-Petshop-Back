/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Put,
  UploadedFiles,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { StorageService } from '../supabase/storage.service';
import { ProductImageService } from './products-image.service';
import { ProductImage } from './entities/product-image.entity';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
    private readonly productImageService: ProductImageService,
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Load product seeder' })
  @Get('seeder/load')
  seed() {
    return this.productsService.seeder();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create new product with multiple images' })
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
        mainImage: {
          type: 'string',
          format: 'binary',
          description: 'Imagen principal del producto (.jpg, .png, .webp)',
        },
        additionalImages: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Imágenes adicionales del producto (.jpg, .png, .webp)',
        },
      },
      required: ['name', 'price', 'stock', 'mainImage'],
    },
  })
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'additionalImages', maxCount: 3 },
    ]),
  )
  async create(
    @Body() createProductDtoRaw: any,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      additionalImages?: Express.Multer.File[];
    },
  ) {
    const mainImage = files.mainImage?.[0];
    const additionalImages = files.additionalImages;

    if (!mainImage) {
      throw new BadRequestException(
        'La imagen principal del producto es obligatoria',
      );
    }

    if (!mainImage.mimetype.includes('image/')) {
      throw new BadRequestException(
        'El archivo debe ser una imagen (.jpg, .png, .webp)',
      );
    }

    const createProductDto: CreateProductDto = {
      ...createProductDtoRaw,
      price: Number(createProductDtoRaw.price),
      stock: Number(createProductDtoRaw.stock),
    };

    // Sube la imagen principal
    const mainImageResult = await this.storageService.uploadFile(
      mainImage,
      'products',
    );
    if (!mainImageResult) {
      throw new BadRequestException('Error al subir la imagen principal');
    }
    createProductDto.imgUrl = mainImageResult.publicUrl;

    // Crea el producto
    const product = await this.productsService.create(createProductDto);

    // Sube las imágenes adicionales
    if (additionalImages && additionalImages.length > 0) {
      const productImages: ProductImage[] = [];
      for (let i = 0; i < additionalImages.length; i++) {
        const file = additionalImages[i];
        if (file.mimetype.includes('image/')) {
          const result = await this.storageService.uploadFile(file, 'products');
          if (result) {
            const productImage =
              await this.productImageService.createProductImage(
                result.publicUrl,
                product.data,
                i + 1,
              );
            productImages.push(productImage);
          }
        }
      }
      product.data.images = productImages;
    }

    return product;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Actualizar un producto existente' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Alimento Premium para Perros' },
        description: {
          type: 'string',
          example: 'Alimento balanceado con nutrientes esenciales',
        },
        price: { type: 'number', example: 25.99 },
        stock: { type: 'integer', example: 100 },
        categoryId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        mainImage: {
          type: 'string',
          format: 'binary',
          description: 'Imagen principal (opcional)',
        },
        additionalImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Imágenes adicionales (máximo 5)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado correctamente',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'additionalImages', maxCount: 3 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDtoRaw: any,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      additionalImages?: Express.Multer.File[];
    },
  ) {
    const mainImage = files?.mainImage?.[0];
    const additionalImages = files?.additionalImages;

    // Procesa la imagen principal si se proporciona
    if (mainImage) {
      if (!mainImage.mimetype.includes('image/')) {
        throw new BadRequestException(
          'El archivo debe ser una imagen (.jpg, .png, .webp)',
        );
      }

      const result = await this.storageService.uploadFile(
        mainImage,
        'products',
      );
      if (!result) {
        throw new BadRequestException('Error al subir la imagen principal');
      }

      updateProductDtoRaw.imgUrl = result.publicUrl;
    }

    // Conversión de tipos
    const updateProductDto: UpdateProductDto = {
      ...updateProductDtoRaw,
      price: updateProductDtoRaw.price
        ? Number(updateProductDtoRaw.price)
        : undefined,
      stock: updateProductDtoRaw.stock
        ? Number(updateProductDtoRaw.stock)
        : undefined,
    };

    // Actualiza el producto
    const updatedProduct = await this.productsService.update(
      id,
      updateProductDto,
    );

    // Procesa imágenes adicionales si se proporcionan
    if (additionalImages && additionalImages.length > 0) {
      // Obtener el producto actualizado para asociar las imágenes
      const productEntity = await this.productsService.findOneForUpdate(id);

      // Obtener el orden máximo actual de las imágenes existentes
      const existingImages =
        await this.productImageService.getProductImages(id);
      let maxOrder = 0;
      if (existingImages && existingImages.length > 0) {
        maxOrder = Math.max(...existingImages.map((img) => img.order || 0));
      }

      for (let i = 0; i < additionalImages.length; i++) {
        const file = additionalImages[i];
        if (file.mimetype.includes('image/')) {
          const result = await this.storageService.uploadFile(file, 'products');
          if (result) {
            await this.productImageService.createProductImage(
              result.publicUrl,
              productEntity,
              maxOrder + i + 1, // Incrementar el orden a partir del máximo existente
            );
          }
        }
      }
    }

    // Obtener producto actualizado con todas sus imágenes
    const product = await this.productsService.findOne(id);
    return product;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin, Role.User)
  @ApiOperation({ summary: 'Get all products' })
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin, Role.User)
  @ApiOperation({ summary: 'Get product by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Soft delete product by ID' })
  @Put(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Add image to product' })
  @ApiConsumes('multipart/form-data')
  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image'))
  async addProductImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('order') order?: number,
  ) {
    if (!file) {
      throw new BadRequestException('La imagen es obligatoria');
    }

    if (!file.mimetype.includes('image/')) {
      throw new BadRequestException(
        'El archivo debe ser una imagen (.jpg, .png, .webp)',
      );
    }

    const product = await this.productsService.findOneForUpdate(id);

    const result = await this.storageService.uploadFile(file, 'products');
    if (!result) {
      throw new BadRequestException('Error al subir la imagen');
    }

    const productImage = await this.productImageService.createProductImage(
      result.publicUrl,
      product,
      order || 0,
    );

    return {
      message: 'Imagen añadida correctamente',
      productImage,
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete product image' })
  @Delete('images/:imageId')
  async deleteProductImage(@Param('imageId') imageId: string) {
    await this.productImageService.deleteProductImage(imageId);
    return {
      message: 'Imagen eliminada correctamente',
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get product images' })
  @Get(':id/images')
  async getProductImages(@Param('id') id: string) {
    const images = await this.productImageService.getProductImages(id);
    return {
      message: 'Imágenes recuperadas correctamente',
      images,
    };
  }
}
