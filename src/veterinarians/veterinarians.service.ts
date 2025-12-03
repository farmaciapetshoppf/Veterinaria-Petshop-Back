import { Injectable } from '@nestjs/common';
import { VeterinariansRepository } from './vaterinarians.repository';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { ChangePasswordVeterinarianDto } from './dto/change-password-veterinarian.dto';

@Injectable()
export class VeterinariansService {
  constructor(
    private readonly veterinarianRepository: VeterinariansRepository,
  ) {}

  fillAllVeterinarians(onlyActive?: boolean) {
    return this.veterinarianRepository.fillAll(onlyActive);
  }

  fillByIdVeterinarians(id: string) {
    return this.veterinarianRepository.fillById(id);
  }

  createVeterinarian(createVeterinarian: CreateVeterinarianDto) {
    return this.veterinarianRepository.create(createVeterinarian);
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
}
