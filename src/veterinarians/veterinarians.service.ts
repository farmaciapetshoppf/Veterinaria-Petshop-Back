import { Injectable } from '@nestjs/common';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';

@Injectable()
export class VeterinariansService {
  create(createVeterinarianDto: CreateVeterinarianDto) {
    return 'This action adds a new veterinarian';
  }

  findAll() {
    return `This action returns all veterinarians`;
  }

  findOne(id: number) {
    return `This action returns a #${id} veterinarian`;
  }

  update(id: number, updateVeterinarianDto: UpdateVeterinarianDto) {
    return `This action updates a #${id} veterinarian`;
  }

  remove(id: number) {
    return `This action removes a #${id} veterinarian`;
  }
}
