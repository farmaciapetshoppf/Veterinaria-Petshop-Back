import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Pet } from './entities/pet.entity';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post('NewPet')
  async create(@Body() createPetDto: CreatePetDto) {
    try {
      const NewPet = await this.petsService.create(createPetDto);
      return {
        message: 'Pet created successfully',
        data: NewPet,
      };
    } catch (error :any) {
      throw new HttpException({
        message: 'Error creating pet',
        error: error.message,
      }, HttpStatus.BAD_REQUEST);
    }
  }
  

  @Get()
  findAll() {
    return this.petsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePetDto: UpdatePetDto) {
    return this.petsService.update(+id, updatePetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petsService.remove(+id);
  }
}
