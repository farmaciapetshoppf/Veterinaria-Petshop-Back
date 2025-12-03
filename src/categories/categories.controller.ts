import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, }from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

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

@Patch(':id')
update(
  @Param('id', new ParseUUIDPipe()) id: string,
  @Body() updateCategoryDto: UpdateCategoryDto
) {
  return this.categoriesService.update(id, updateCategoryDto);
}


 @Delete(':id')
remove(@Param('id', new ParseUUIDPipe()) id: string) {
  return this.categoriesService.remove(id);
}

}
