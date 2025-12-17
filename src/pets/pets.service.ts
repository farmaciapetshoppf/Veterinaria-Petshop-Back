import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { Users } from 'src/users/entities/user.entity';
import { UsersRepository } from 'src/users/users.repository';
import { StorageService } from 'src/supabase/storage.service';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreatePetDto, image: Express.Multer.File) {
    const pet = this.petRepository.create(dto);
    if (dto.ownerId) {
      pet.owner = await this.usersRepository.findOne({
        where: { id: dto.ownerId },
      });
    }
    if (dto.motherId) {
      pet.mother = await this.petRepository.findOne({
        where: { id: dto.motherId },
      });
    }
    if (dto.fatherId) {
      pet.father = await this.petRepository.findOne({
        where: { id: dto.fatherId },
      });
    }
    if (image) {
      const result = await this.storageService.uploadFile(image, 'pets');
      if (result) {
        pet.image = result.publicUrl;
      }
    }
    return this.petRepository.save(pet);
  }

  findAll() {
    return this.petRepository
      .find({
        relations: {
          owner: true,
          mother: true,
          father: true,
          appointments: {
            veterinarian: true,
          },
        },
      })
      .then((pets) => {
        pets.forEach((p) => {
          if (p.appointments) {
            p.appointments.forEach((a) => {
              if (a.veterinarian && (a.veterinarian as any).password) {
                delete (a.veterinarian as any).password;
              }
            });
          }
        });
        return pets;
      });
  }

  findOne(id: string) {
    return this.petRepository
      .findOne({
        where: { id: String(id) },
        relations: {
          owner: true,
          mother: true,
          father: true,
          appointments: {
            veterinarian: true,
          },
        },
        withDeleted: false, // Excluir mascotas eliminadas
      })
      .then((p) => {
        if (!p) throw new NotFoundException(`Pet with id ${id} not found`);
        if (p.appointments) {
          p.appointments.forEach((a) => {
            if (a.veterinarian && (a.veterinarian as any).password) {
              delete (a.veterinarian as any).password;
            }
          });
        }
        return p;
      });
  }

  async update(
    id: string,
    updatePetDto: UpdatePetDto,
    image: Express.Multer.File,
  ) {
    const pet = await this.petRepository.findOne({ where: { id } });
    if (!pet) {
      throw new NotFoundException(`Pet with id ${id} not found`);
    }
    Object.assign(pet, updatePetDto);
    if (image) {
      const result = await this.storageService.uploadFile(image, 'pets');
      if (result) {
        pet.image = result.publicUrl;
      }
    }
    return this.petRepository.save(pet);
  }

  async remove(id: string) {
    const pet = await this.findOne(id);
    await this.petRepository.softRemove(pet);
    return { message: 'Mascota eliminada correctamente' };
  }
}
