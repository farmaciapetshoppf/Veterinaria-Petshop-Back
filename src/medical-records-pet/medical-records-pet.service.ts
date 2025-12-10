import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CreateMedicalRecordsPetDto } from './dto/create-medical-records-pet.dto';
import { UpdateMedicalRecordsPetDto } from './dto/update-medical-records-pet.dto';
import { MedicalRecordsPet } from './entities/medical-records-pet.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';

@Injectable()
export class MedicalRecordsPetService {
  constructor(
    @InjectRepository(MedicalRecordsPet)
    private readonly medicalRecordsRepository: Repository<MedicalRecordsPet>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
  ) {}

  /**
   * Crear un nuevo registro médico
   */
  async create(createMedicalRecordsPetDto: CreateMedicalRecordsPetDto) {
    const { petId, veterinarianId, nextAppointment, ...recordData } =
      createMedicalRecordsPetDto;

    // Buscar la mascota
    const pet = await this.petRepository.findOne({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    // Buscar el veterinario
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId },
    });
    if (!veterinarian) {
      throw new NotFoundException(
        `Veterinario con ID ${veterinarianId} no encontrado`,
      );
    }

    // Crear el registro médico
    const medicalRecord = this.medicalRecordsRepository.create({
      ...recordData,
      pet,
      veterinarian,
      nextAppointment: nextAppointment ? new Date(nextAppointment) : undefined,
    } as any);

    const saved = await this.medicalRecordsRepository.save(medicalRecord);

    return {
      message: 'Registro médico creado exitosamente',
      data: saved,
    };
  }

  /**
   * Obtener todos los registros médicos con paginación
   */
  async findAll(page: number = 1, limit: number = 20) {
    const [records, total] = await this.medicalRecordsRepository.findAndCount({
      relations: ['pet', 'pet.owner', 'veterinarian'],
      order: { consultationDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      message: 'Registros médicos obtenidos',
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar mascotas por nombre para el searchbar
   */
  async searchPets(searchTerm: string) {
    const pets = await this.petRepository.find({
      where: { nombre: Like(`%${searchTerm}%`) },
      relations: ['owner'],
      take: 10,
    });

    return {
      message: 'Mascotas encontradas',
      data: pets,
    };
  }

  /**
   * Obtener historial médico completo de una mascota
   */
  async findByPet(petId: string) {
    const records = await this.medicalRecordsRepository.find({
      where: { pet: { id: petId } },
      relations: ['veterinarian'],
      order: { consultationDate: 'DESC' },
    });

    if (records.length === 0) {
      return {
        message: 'No hay registros médicos para esta mascota',
        data: [],
      };
    }

    return {
      message: 'Historial médico obtenido',
      data: records,
    };
  }

  /**
   * Obtener un registro médico específico
   */
  async findOne(id: string) {
    const record = await this.medicalRecordsRepository.findOne({
      where: { id },
      relations: ['pet', 'pet.owner', 'veterinarian'],
    });

    if (!record) {
      throw new NotFoundException(
        `Registro médico con ID ${id} no encontrado`,
      );
    }

    return {
      message: 'Registro médico encontrado',
      data: record,
    };
  }

  /**
   * Actualizar un registro médico
   */
  async update(id: string, updateMedicalRecordsPetDto: UpdateMedicalRecordsPetDto) {
    const record = await this.medicalRecordsRepository.findOne({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(
        `Registro médico con ID ${id} no encontrado`,
      );
    }

    const { nextAppointment, ...updateData } = updateMedicalRecordsPetDto;

    Object.assign(record, updateData);

    if (nextAppointment) {
      record.nextAppointment = new Date(nextAppointment);
    }

    const updated = await this.medicalRecordsRepository.save(record);

    return {
      message: 'Registro médico actualizado',
      data: updated,
    };
  }

  /**
   * Eliminar un registro médico
   */
  async remove(id: string) {
    const record = await this.medicalRecordsRepository.findOne({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(
        `Registro médico con ID ${id} no encontrado`,
      );
    }

    await this.medicalRecordsRepository.remove(record);

    return {
      message: 'Registro médico eliminado',
    };
  }
}
