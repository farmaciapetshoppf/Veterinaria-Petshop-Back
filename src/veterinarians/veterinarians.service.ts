/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { VeterinariansRepository } from './vaterinarians.repository';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { ChangePasswordVeterinarianDto } from './dto/change-password-veterinarian.dto';
import { Veterinarian } from './entities/veterinarian.entity';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import data from './seed/veterinarian.json';
import { Role } from 'src/auth/enum/roles.enum';

@Injectable()
export class VeterinariansService {
  constructor(
    private readonly veterinarianRepository: VeterinariansRepository,
  ) {}

  fillAllVeterinarians() {
    return this.veterinarianRepository.fillAll();
  }

  fillByIdVeterinarians(id: string) {
    return this.veterinarianRepository.fillById(id);
  }

  createVeterinarian(createVeterinarian: CreateVeterinarianDto) {
    return this.veterinarianRepository.create(createVeterinarian);
  }

  updateVeterinarianProfile(
    id: string,
    updateVeterinarianDto: UpdateVeterinarianDto,
    file?: Express.Multer.File,
  ) {
    return this.veterinarianRepository.updateProfile(
      id,
      updateVeterinarianDto,
      file,
    );
  }

  deleteVeterinarian(id: string) {
    return this.veterinarianRepository.remove(id);
  }

  changePassword(dto: ChangePasswordVeterinarianDto) {
    return this.veterinarianRepository.changePassword(
      dto.email,
      dto.currentPassword,
      dto.newPassword,
      dto.repeatNewPassword,
    );
  }

  getVeterinarianByEmail(email: string): Promise<Veterinarian> {
    return this.veterinarianRepository.getVeterinarianByEmail(email);
  }

  async seeder() {
    let created = 0;
    let skipped = 0;

    for (const veterinarian of data) {
      try {
        const dto: CreateVeterinarianDto = {
          ...veterinarian,
          role: Role.Veterinarian,
        };
        await this.createVeterinarian(dto);
        created++;
      } catch (error) {
        skipped++;
      }
    }

    return {
      message: 'Seeder ejecutado',
      created,
      skipped,
      total: created + skipped,
    };
  }
}
