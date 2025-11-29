import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Pet } from './entities/pet.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @ApiOperation({ summary: 'Create new pet' })
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
  

  @ApiOperation({ summary: 'Get all pets' })
  @Get('AllPets')
  async findAll() {
    const data = await this.petsService.findAll();
    return { message: 'Pets retrieved', data };
  }

  @ApiOperation({ summary: 'Get pet by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.petsService.findOne(+id);
    return { message: `Pet ${id} retrieved`, data };
  }

  @ApiOperation({ summary: 'Update pet' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePetDto: UpdatePetDto) {
    return this.petsService.update(+id, updatePetDto);
  }

  @ApiOperation({ summary: 'Delete pet' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petsService.remove(+id);
  }
}
