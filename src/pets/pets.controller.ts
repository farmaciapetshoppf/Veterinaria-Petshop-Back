import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Pet } from './entities/pet.entity';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enum/roles.enum';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.User, Role.Veterinarian)
@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @ApiOperation({ summary: 'Create new pet' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Firulais' },
        especie: {
          type: 'string',
          enum: ['PERRO', 'GATO', 'AVE', 'ROEDOR', 'REPTIL', 'OTRO'],
        },
        sexo: { type: 'string', enum: ['MACHO', 'HEMBRA'] },
        tamano: { type: 'string', enum: ['PEQUENO', 'MEDIANO', 'GRANDE'] },
        esterilizado: { type: 'string', enum: ['SI', 'NO'] },
        status: { type: 'string', enum: ['VIVO', 'FALLECIDO'] },
        fecha_nacimiento: { type: 'string', format: 'date' },
        fecha_fallecimiento: { type: 'string', format: 'date', nullable: true },
        breed: { type: 'string', nullable: true, example: 'Labrador' },
        ownerId: { type: 'string', nullable: true, example: 'UUID del dueño' },
        motherId: {
          type: 'string',
          nullable: true,
          example: 'UUID de la madre',
        },
        fatherId: { type: 'string', nullable: true, example: 'UUID del padre' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: [
        'nombre',
        'especie',
        'sexo',
        'tamano',
        'esterilizado',
        'status',
        'fecha_nacimiento',
      ],
    },
  })
  @Post('NewPet')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createPetDto: CreatePetDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const newPet = await this.petsService.create(createPetDto, image);
      return { message: 'Pet created successfully', newPet };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Error creating pet', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
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
    if (!id || id === 'undefined' || id === 'null') {
      throw new HttpException(
        'ID de mascota inválido o no proporcionado',
        HttpStatus.BAD_REQUEST,
      );
    }
    const data = await this.petsService.findOne(id);
    return { message: `Pet ${id} retrieved`, data };
  }

  @ApiOperation({ summary: 'Update pet' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Firulais' },
        especie: {
          type: 'string',
          enum: ['PERRO', 'GATO', 'AVE', 'ROEDOR', 'REPTIL', 'OTRO'],
        },
        sexo: { type: 'string', enum: ['MACHO', 'HEMBRA'] },
        tamano: { type: 'string', enum: ['PEQUENO', 'MEDIANO', 'GRANDE'] },
        esterilizado: { type: 'string', enum: ['SI', 'NO'] },
        status: { type: 'string', enum: ['VIVO', 'FALLECIDO'] },
        fecha_nacimiento: {
          type: 'string',
          format: 'date',
          example: '2020-05-15',
        },
        fecha_fallecimiento: { type: 'string', format: 'date', nullable: true },
        breed: { type: 'string', nullable: true, example: 'Labrador' },
        ownerId: { type: 'string', nullable: true, example: 'UUID del dueño' },
        motherId: {
          type: 'string',
          nullable: true,
          example: 'UUID de la madre',
        },
        fatherId: { type: 'string', nullable: true, example: 'UUID del padre' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Nueva imagen de la mascota (opcional)',
        },
      },
    },
  })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updatePetDto: UpdatePetDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const updatedPet = await this.petsService.update(id, updatePetDto, image);
      return {
        message: 'Pet updated successfully',
        updatedPet,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          message: 'Error updating pet',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: 'Soft delete by ID' })
  @Put(':id')
  remove(@Param('id') id: string) {
    return this.petsService.remove(id);
  }
}
