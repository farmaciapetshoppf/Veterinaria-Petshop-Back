import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
  Query,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { ChangePasswordVeterinarianDto } from './dto/change-password-veterinarian.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';

@ApiTags('Veterinarians')
@Controller('veterinarians')
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  
 @Get('seeder')
  seeder(){
    return this.veterinariansService.seeder();
  }
  @ApiOperation({ summary: 'Get all veterinarians (optionally filter active)' })
  @Get()
  async fillAllVeterinarians(@Query('onlyActive') onlyActive?: string) {
    const active = onlyActive === undefined ? true : onlyActive === 'true';
    const data = await this.veterinariansService.fillAllVeterinarians(active);
    return { message: 'Veterinarians retrieved', data };
  }

  @ApiOperation({ summary: 'Get veterinarian by ID' })
  @Get(':id')
  fillByIdVeterinarians(@Param('id', ParseUUIDPipe) id: string) {
    // service returns single veterinarian (password already stripped for GET)
    return this.veterinariansService
      .fillByIdVeterinarians(id)
      .then((data) => ({ message: `Veterinarian ${id} retrieved`, data }));
  }

 

  @ApiOperation({ summary: 'Create new veterinarian' })
  @Post()
  createVeterinarian(@Body() createVeterinarian: CreateVeterinarianDto) {
    return this.veterinariansService.createVeterinarian(createVeterinarian);
  }

  @ApiOperation({ summary: 'Update veterinarian profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          example: 'Especialista en medicina felina con 5 años de experiencia',
        },
        phone: { type: 'string', example: '+542966777777' },
        profileImage: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de perfil del veterinario (.jpg, .png, .webp)',
        },
      },
    },
  })
  @Patch(':id/profile')
  @UseInterceptors(FileInterceptor('profileImage'))
  updateVeterinarianProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVeterinarianDto: UpdateVeterinarianDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.veterinariansService.updateVeterinarianProfile(
      id,
      updateVeterinarianDto,
      file,
    );
  }

  @ApiOperation({ summary: 'Deactivate veterinarian' })
  @Patch(':id/deactivate')
  deleteVeterinarian(@Param('id', ParseUUIDPipe) id: string) {
    return this.veterinariansService.deleteVeterinarian(id);
  }

  @ApiOperation({ summary: 'Change veterinarian password' })
  @Patch('change-password')
  changePassword(@Body() body: ChangePasswordVeterinarianDto) {
    return this.veterinariansService.changePassword(body);
  }
}
