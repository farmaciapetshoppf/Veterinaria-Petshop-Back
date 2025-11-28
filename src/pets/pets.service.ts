import { Injectable } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { Users } from 'src/users/entities/user.entity';
import { UsersRepository } from 'src/users/users.repository';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}


  
  async create(dto: CreatePetDto) {
  const pet = this.petRepository.create({
    nombre: dto.nombre,
    especie: dto.especie,
    sexo: dto.sexo,
    tamano: dto.tamano,
    esterilizado: dto.esterilizado,
    status: dto.status,
    fecha_nacimiento: dto.fecha_nacimiento,
    fecha_fallecimiento: dto.fecha_fallecimiento,
    breed: dto.breed,
    image: dto.image,
  });

  // dueño
  if (dto.ownerId) {
    pet.owner = await this.usersRepository.findOneBy( { id: dto.ownerId  });
  }

  // madre
  if (dto.motherId) {
    pet.mother = await this.petRepository.findOne({ where: { id: dto.motherId } });
  }

  // padre
  if (dto.fatherId) {
    pet.father = await this.petRepository.findOne({ where: { id: dto.fatherId } });
  }

  return this.petRepository.save(pet);
}


  findAll() {
    return `This action returns all pets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pet`;
  }

  update(id: number, updatePetDto: UpdatePetDto) {
    return `This action updates a #${id} pet`;
  }

  remove(id: number) {
    return `This action removes a #${id} pet`;
  }
}
