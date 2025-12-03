import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create new category' })
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @ApiOperation({ summary: 'Get all categories' })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('basic')
  findAllBasic(){
    return this.categoriesService.findAllBasic();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update category by ID' })
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @ApiOperation({ summary: 'Delete category by ID' })
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoriesService.remove(id);
  }
}
