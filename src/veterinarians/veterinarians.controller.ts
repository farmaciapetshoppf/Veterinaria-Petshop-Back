import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';

@Controller('veterinarians')
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  @Post()
  create(@Body() createVeterinarianDto: CreateVeterinarianDto) {
    return this.veterinariansService.create(createVeterinarianDto);
  }

  @Get()
  findAll() {
    return this.veterinariansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.veterinariansService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVeterinarianDto: UpdateVeterinarianDto) {
    return this.veterinariansService.update(+id, updateVeterinarianDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.veterinariansService.remove(+id);
  }
}
