import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { CreateMedicalRecordsPetDto } from './dto/create-medical-records-pet.dto';
import { UpdateMedicalRecordsPetDto } from './dto/update-medical-records-pet.dto';
import { MedicalRecordsPet } from './entities/medical-records-pet.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { GeneralMedication } from 'src/general-medications/entities/general-medication.entity';
import { MedicationUsageHistory } from 'src/general-medications/entities/medication-usage-history.entity';
import { AdminNotification } from 'src/general-medications/entities/admin-notification.entity';

@Injectable()
export class MedicalRecordsPetService {
  constructor(
    @InjectRepository(MedicalRecordsPet)
    private readonly medicalRecordsRepository: Repository<MedicalRecordsPet>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
    @InjectRepository(GeneralMedication)
    private readonly medicationsRepo: Repository<GeneralMedication>,
    @InjectRepository(MedicationUsageHistory)
    private readonly usageHistoryRepo: Repository<MedicationUsageHistory>,
    @InjectRepository(AdminNotification)
    private readonly notificationsRepo: Repository<AdminNotification>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crear un nuevo registro médico con manejo de medicamentos
   */
  async create(createMedicalRecordsPetDto: CreateMedicalRecordsPetDto) {
    const { petId, veterinarianId, nextAppointment, medicationsUsed, ...recordData } =
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

    // Si hay medicamentos, procesarlos en transacción
    if (medicationsUsed && medicationsUsed.length > 0) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Crear el registro médico
        const medicalRecord = queryRunner.manager.create(MedicalRecordsPet, {
          ...recordData,
          pet,
          veterinarian,
          nextAppointment: nextAppointment ? new Date(nextAppointment) : undefined,
        });
        const savedRecord = await queryRunner.manager.save(medicalRecord);

        const medicationsUsedResult: any[] = [];
        const notifications: any[] = [];

        // Procesar cada medicamento
        for (const medUsed of medicationsUsed) {
          const medication = await queryRunner.manager.findOne(GeneralMedication, {
            where: { id: medUsed.medicationId },
          });

          if (!medication) {
            throw new NotFoundException(
              `Medicamento ${medUsed.medicationName} no encontrado`,
            );
          }

          // Validar stock suficiente
          if (medication.stock < medUsed.quantity) {
            throw new BadRequestException(
              `Stock insuficiente de ${medication.name}. Disponible: ${medication.stock}, solicitado: ${medUsed.quantity}`,
            );
          }

          // Decrementar stock
          medication.stock -= medUsed.quantity;
          await queryRunner.manager.save(GeneralMedication, medication);

          // Crear registro de uso
          const usageHistory = queryRunner.manager.create(MedicationUsageHistory, {
            medicationId: medication.id,
            veterinarianId: veterinarian.id,
            petId: pet.id,
            quantity: medUsed.quantity,
            dosage: medUsed.dosage,
            duration: medUsed.duration,
            prescriptionNotes: medUsed.prescriptionNotes,
            medicationType: medUsed.medicationType,
            usedAt: new Date(),
          });
          await queryRunner.manager.save(usageHistory);

          medicationsUsedResult.push({
            medicationId: medication.id,
            name: medication.name,
            quantity: medUsed.quantity,
            remainingStock: medication.stock,
          });

          // Crear notificación si stock bajo
          if (medication.stock < medication.minStock) {
            const notification = queryRunner.manager.create(AdminNotification, {
              type: 'LOW_STOCK',
              medicationId: medication.id,
              message: `Stock bajo de ${medication.name}. Stock actual: ${medication.stock}, mínimo: ${medication.minStock}`,
              isRead: false,
            });
            const savedNotification = await queryRunner.manager.save(notification);
            notifications.push(savedNotification);
          }
        }

        await queryRunner.commitTransaction();

        return {
          message: 'Registro médico creado exitosamente',
          data: {
            medicalRecordId: savedRecord.id,
            medicationsUsed: medicationsUsedResult,
            notifications: notifications.length > 0 ? notifications : undefined,
          },
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else {
      // Sin medicamentos, crear registro normal
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
  }

  /**
   * Obtener todos los registros médicos con paginación
   */
  async findAll(page: number = 1, limit: number = 20) {
    const [records, total] = await this.medicalRecordsRepository.findAndCount({
      relations: {
        pet: {
          owner: true,
        },
        veterinarian: true,
      },
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
      relations: {
        owner: true,
      },
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
      relations: {
        veterinarian: true,
      },
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
      relations: {
        pet: {
          owner: true,
        },
        veterinarian: true,
      },
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
