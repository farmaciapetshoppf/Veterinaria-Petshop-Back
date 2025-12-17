import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MedicalRecordsPetService } from './medical-records-pet.service';
import { CreateMedicalRecordsPetDto } from './dto/create-medical-records-pet.dto';
import { UpdateMedicalRecordsPetDto } from './dto/update-medical-records-pet.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';

@ApiTags('Medical Records Pet')
@Controller('medical-records-pet')
export class MedicalRecordsPetController {
  constructor(
    private readonly medicalRecordsPetService: MedicalRecordsPetService,
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin)
  @ApiOperation({
    summary: 'Crear registro médico',
    description:
      'El veterinario registra los detalles de la consulta en el historial médico de la mascota',
  })
  @Post()
  create(@Body() createMedicalRecordsPetDto: CreateMedicalRecordsPetDto) {
    return this.medicalRecordsPetService.create(createMedicalRecordsPetDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin, Role.User)
  @ApiOperation({
    summary: 'Obtener todos los registros médicos',
    description: 'Lista paginada de todos los registros médicos',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Registros por página',
    example: 20,
  })
  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.medicalRecordsPetService.findAll(page, limit);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin)
  @ApiOperation({
    summary: 'Buscar mascotas',
    description:
      'Buscar mascotas por nombre para el searchbar (todas las mascotas de la veterinaria)',
  })
  @ApiQuery({
    name: 'search',
    required: true,
    description: 'Término de búsqueda',
    example: 'Max',
  })
  @Get('search/pets')
  searchPets(@Query('search') searchTerm: string) {
    return this.medicalRecordsPetService.searchPets(searchTerm);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin, Role.User)
  @ApiOperation({
    summary: 'Obtener historial médico de una mascota',
    description:
      'Retorna todos los registros médicos de una mascota específica',
  })
  @ApiParam({
    name: 'petId',
    description: 'ID de la mascota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Get('pet/:petId')
  findByPet(@Param('petId') petId: string) {
    return this.medicalRecordsPetService.findByPet(petId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin, Role.User)
  @ApiOperation({
    summary: 'Obtener un registro médico específico',
    description: 'Retorna los detalles de un registro médico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del registro médico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalRecordsPetService.findOne(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin)
  @ApiOperation({
    summary: 'Actualizar registro médico',
    description: 'Modifica los datos de un registro médico existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del registro médico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMedicalRecordsPetDto: UpdateMedicalRecordsPetDto,
  ) {
    return this.medicalRecordsPetService.update(id, updateMedicalRecordsPetDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin)
  @ApiOperation({
    summary: 'Eliminar registro médico',
    description: 'Elimina un registro médico del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del registro médico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicalRecordsPetService.remove(id);
  }
}
