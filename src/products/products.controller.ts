import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

 @ApiOperation({ summary: 'Load product seeder' })
 @Get('seeder/load')
  seed(){
    return this.productsService.seeder();
  }
  
  @ApiOperation({ summary: 'Create new product' })
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
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