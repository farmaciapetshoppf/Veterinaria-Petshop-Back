import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
  Query,
  Patch,
} from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { ChangePasswordVeterinarianDto } from './dto/change-password-veterinarian.dto';

@Controller('veterinarians')
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  @Get()
  fillAllVeterinarians(@Query('onlyActive') onlyActive?: string) {
    const active = onlyActive === undefined ? true : onlyActive === 'true';
    return this.veterinariansService.fillAllVeterinarians(active);
  }

  @Get(':id')
  fillByIdVeterinarians(@Param('id', ParseUUIDPipe) id: string) {
    return this.veterinariansService.fillByIdVeterinarians(id);
  }

  @Post()
  createVeterinarian(@Body() createVeterinarian: CreateVeterinarianDto) {
    return this.veterinariansService.createVeterinarian(createVeterinarian);
  }

  @Patch(':id/deactivate')
  deleteVeterinarian(@Param('id', ParseUUIDPipe) id: string) {
    return this.veterinariansService.deleteVeterinarian(id);
  }

  @Patch('change-password')
  changePassword(@Body() body: ChangePasswordVeterinarianDto) {
    return this.veterinariansService.changePassword(body);
  }
}
