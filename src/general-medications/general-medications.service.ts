import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralMedication } from './entities/general-medication.entity';
import {
  MedicationRestockRequest,
  RestockRequestStatus,
} from './entities/medication-restock-request.entity';
import { MedicationUsageHistory } from './entities/medication-usage-history.entity';
import { StockLog } from './entities/stock-log.entity';
import { Users } from '../users/entities/user.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { UseMedicationDto } from './dto/use-medication.dto';
import { RequestRestockDto } from './dto/request-restock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class GeneralMedicationsService {
  constructor(
    @InjectRepository(GeneralMedication)
    private medicationRepo: Repository<GeneralMedication>,
    @InjectRepository(MedicationRestockRequest)
    private restockRequestRepo: Repository<MedicationRestockRequest>,
    @InjectRepository(MedicationUsageHistory)
    private usageHistoryRepo: Repository<MedicationUsageHistory>,
    @InjectRepository(StockLog)
    private stockLogRepo: Repository<StockLog>,
    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
    @InjectRepository(Veterinarian)
    private veterinarianRepo: Repository<Veterinarian>,
  ) {}

  // Obtener todos los medicamentos
  async findAll(): Promise<any[]> {
    const medications = await this.medicationRepo.find({
      order: { name: 'ASC' },
    });

    return medications.map((med) => ({
      id: med.id,
      name: med.name,
      description: med.category,
      stock: med.stock,
      minStock: med.minStock,
      unit: med.unit,
    }));
  }

  // Obtener solo medicamentos controlados
  async findControlled(): Promise<GeneralMedication[]> {
    return this.medicationRepo
      .createQueryBuilder('med')
      .where('med.category LIKE :pattern', { pattern: '%controlado%' })
      .orderBy('med.name', 'ASC')
      .getMany();
  }

  // Obtener medicamentos con stock bajo
  async findLowStock(): Promise<GeneralMedication[]> {
    return this.medicationRepo
      .createQueryBuilder('med')
      .where('med.stock <= med.min_stock')
      .orderBy('med.stock', 'ASC')
      .getMany();
  }

  // Obtener medicamentos controlados con stock bajo
  async findControlledLowStock(): Promise<GeneralMedication[]> {
    return this.medicationRepo
      .createQueryBuilder('med')
      .where('med.stock < med.min_stock')
      .andWhere('med.category LIKE :pattern', { pattern: '%controlado%' })
      .orderBy('med.stock', 'ASC')
      .getMany();
  }

  // Registrar uso de medicamento
  async useMedication(
    userId: string,
    dto: UseMedicationDto,
  ): Promise<MedicationUsageHistory> {
    // Verificar que sea veterinario
    const isVet = await this.veterinarianRepo.findOne({
      where: { id: userId },
    });
    if (!isVet) {
      throw new ForbiddenException('Solo veterinarios pueden usar medicamentos');
    }

    // Verificar medicamento existe
    const medication = await this.medicationRepo.findOne({
      where: { id: dto.medicationId },
    });
    if (!medication) {
      throw new NotFoundException('Medicamento no encontrado');
    }

    // Verificar stock suficiente
    if (medication.stock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${medication.stock}, solicitado: ${dto.quantity}`,
      );
    }

    // Restar del stock
    medication.stock -= dto.quantity;
    await this.medicationRepo.save(medication);

    // Registrar uso
    const usage = this.usageHistoryRepo.create({
      medicationId: dto.medicationId,
      veterinarianId: userId,
      quantity: dto.quantity,
      notes: dto.notes,
    });

    return this.usageHistoryRepo.save(usage);
  }

  // Solicitar reposición
  async requestRestock(
    userId: string,
    dto: RequestRestockDto,
  ): Promise<any> {
    // Verificar medicamento existe
    const medication = await this.medicationRepo.findOne({
      where: { id: dto.medicationId },
    });
    if (!medication) {
      throw new NotFoundException('Medicamento no encontrado');
    }

    // Crear solicitud
    const request = this.restockRequestRepo.create({
      medicationId: dto.medicationId,
      requestedBy: userId,
      quantity: dto.quantity,
      status: RestockRequestStatus.PENDING,
    });

    const savedRequest = await this.restockRequestRepo.save(request);

    // Obtener información del usuario que solicita
    const requesterInfo = await this.getUserInfo(userId);

    // Devolver respuesta enriquecida
    return {
      id: savedRequest.id,
      medicationId: savedRequest.medicationId,
      medicationName: medication.name,
      quantity: savedRequest.quantity,
      status: savedRequest.status,
      requestedBy: savedRequest.requestedBy,
      veterinarianName: requesterInfo?.name || 'Desconocido',
      approvedBy: null,
      approverName: null,
      createdAt: savedRequest.createdAt,
    };
  }

  // Obtener todas las solicitudes de reposición
  async getRestockRequests(
    status?: RestockRequestStatus,
  ): Promise<any[]> {
    const query = this.restockRequestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.medication', 'medication')
      .orderBy('request.created_at', 'DESC');

    if (status) {
      query.where('request.status = :status', { status });
    }

    const requests = await query.getMany();

    // Enriquecer con información de usuarios/veterinarios
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const requesterInfo = await this.getUserInfo(request.requestedBy);
        let approverInfo: { id: string; name: string; email: string } | null = null;
        if (request.approvedBy) {
          approverInfo = await this.getUserInfo(request.approvedBy);
        }

        return {
          id: request.id,
          medicationId: request.medicationId,
          medicationName: request.medication.name,
          quantity: request.quantity,
          status: request.status,
          requestedBy: request.requestedBy,
          veterinarianName: requesterInfo?.name || 'Desconocido',
          approvedBy: request.approvedBy,
          approverName: approverInfo?.name || null,
          createdAt: request.createdAt,
        };
      }),
    );

    return enrichedRequests;
  }

  // Aprobar solicitud de reposición
  async approveRestockRequest(
    requestId: string,
    adminId: string,
  ): Promise<MedicationRestockRequest> {
    const request = await this.restockRequestRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.status !== RestockRequestStatus.PENDING) {
      throw new BadRequestException(
        `No se puede aprobar una solicitud en estado: ${request.status}`,
      );
    }

    request.status = RestockRequestStatus.APPROVED;
    request.approvedBy = adminId;
    request.approvedAt = new Date();

    return this.restockRequestRepo.save(request);
  }

  // Rechazar solicitud de reposición
  async rejectRestockRequest(
    requestId: string,
    adminId: string,
  ): Promise<MedicationRestockRequest> {
    const request = await this.restockRequestRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.status !== RestockRequestStatus.PENDING) {
      throw new BadRequestException(
        `No se puede rechazar una solicitud en estado: ${request.status}`,
      );
    }

    request.status = RestockRequestStatus.REJECTED;
    request.approvedBy = adminId;
    request.approvedAt = new Date();

    return this.restockRequestRepo.save(request);
  }

  // Eliminar solicitud de reposición
  async deleteRestockRequest(requestId: string): Promise<{ message: string }> {
    const request = await this.restockRequestRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    await this.restockRequestRepo.remove(request);

    return {
      message: 'Solicitud eliminada exitosamente',
    };
  }

  // Completar solicitud de reposición
  async completeRestockRequest(
    requestId: string,
    adminId: string,
  ): Promise<{ request: MedicationRestockRequest; medication: GeneralMedication }> {
    const request = await this.restockRequestRepo.findOne({
      where: { id: requestId },
      relations: ['medication'],
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.status !== RestockRequestStatus.APPROVED) {
      throw new BadRequestException(
        `Solo se pueden completar solicitudes aprobadas. Estado actual: ${request.status}`,
      );
    }

    // Sumar al stock
    request.medication.stock += request.quantity;
    await this.medicationRepo.save(request.medication);

    // Actualizar solicitud
    request.status = RestockRequestStatus.COMPLETED;
    request.completedAt = new Date();
    const savedRequest = await this.restockRequestRepo.save(request);

    return {
      request: savedRequest,
      medication: request.medication,
    };
  }

  // Actualizar stock manualmente
  async updateStock(
    medicationId: string,
    dto: UpdateStockDto,
  ): Promise<GeneralMedication> {
    const medication = await this.medicationRepo.findOne({
      where: { id: medicationId },
    });

    if (!medication) {
      throw new NotFoundException('Medicamento no encontrado');
    }

    medication.stock += dto.quantity;

    if (medication.stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }

    return this.medicationRepo.save(medication);
  }

  // Obtener historial de uso
  async getUsageHistory(medicationId?: string): Promise<any[]> {
    const query = this.usageHistoryRepo
      .createQueryBuilder('usage')
      .leftJoinAndSelect('usage.medication', 'medication')
      .orderBy('usage.used_at', 'DESC');

    if (medicationId) {
      query.where('usage.medication_id = :medicationId', { medicationId });
    }

    const usageRecords = await query.getMany();

    // Enriquecer con información de veterinarios
    const enrichedRecords = await Promise.all(
      usageRecords.map(async (usage) => {
        const vetInfo = await this.getUserInfo(usage.veterinarianId);

        return {
          id: usage.id,
          medicationId: usage.medicationId,
          medicationName: usage.medication.name,
          veterinarianId: usage.veterinarianId,
          veterinarianName: vetInfo?.name || 'Desconocido',
          quantity: usage.quantity,
          usedAt: usage.usedAt,
          notes: usage.notes,
        };
      }),
    );

    return enrichedRecords;
  }

  // Método auxiliar para obtener información de usuario/veterinario
  private async getUserInfo(
    userId: string,
  ): Promise<{ id: string; name: string; email: string } | null> {
    // Buscar en usuarios
    let user = await this.usersRepo.findOne({ where: { id: userId } });
    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }

    // Buscar en veterinarios
    let vet = await this.veterinarianRepo.findOne({ where: { id: userId } });
    if (vet) {
      return {
        id: vet.id,
        name: vet.name,
        email: vet.email,
      };
    }

    return null;
  }

  // Seed inicial de medicamentos
  async seedMedications(): Promise<{ message: string; count: number }> {
    const existingCount = await this.medicationRepo.count();
    
    if (existingCount > 0) {
      return {
        message: 'Medicamentos ya cargados',
        count: existingCount,
      };
    }

    const medications = [
      {
        name: 'Amoxicilina 500mg',
        category: 'Antibiótico',
        stock: 100,
        minStock: 20,
        unit: 'comprimidos',
      },
      {
        name: 'Meloxicam 2mg',
        category: 'Antiinflamatorio',
        stock: 80,
        minStock: 15,
        unit: 'comprimidos',
      },
      {
        name: 'Paracetamol 500mg',
        category: 'Analgésico',
        stock: 120,
        minStock: 30,
        unit: 'comprimidos',
      },
      {
        name: 'Dipirona 500mg',
        category: 'Analgésico',
        stock: 90,
        minStock: 20,
        unit: 'ml',
      },
      {
        name: 'Doxiciclina 100mg',
        category: 'Antibiótico',
        stock: 60,
        minStock: 15,
        unit: 'comprimidos',
      },
      {
        name: 'Cefalexina 500mg',
        category: 'Antibiótico',
        stock: 70,
        minStock: 15,
        unit: 'comprimidos',
      },
      {
        name: 'Omeprazol 20mg',
        category: 'Protector gástrico',
        stock: 50,
        minStock: 10,
        unit: 'comprimidos',
      },
      {
        name: 'Ranitidina 150mg',
        category: 'Protector gástrico',
        stock: 45,
        minStock: 10,
        unit: 'comprimidos',
      },
      {
        name: 'Metronidazol 250mg',
        category: 'Antibiótico',
        stock: 55,
        minStock: 10,
        unit: 'comprimidos',
      },
      {
        name: 'Ivermectina 1%',
        category: 'Antiparasitario',
        stock: 40,
        minStock: 10,
        unit: 'ml',
      },
      {
        name: 'Albendazol 400mg',
        category: 'Antiparasitario',
        stock: 35,
        minStock: 10,
        unit: 'comprimidos',
      },
      {
        name: 'Prednisona 5mg',
        category: 'Corticoide',
        stock: 60,
        minStock: 15,
        unit: 'comprimidos',
      },
      {
        name: 'Dexametasona 4mg',
        category: 'Corticoide',
        stock: 50,
        minStock: 10,
        unit: 'ml',
      },
      {
        name: 'Furosemida 40mg',
        category: 'Diurético',
        stock: 40,
        minStock: 10,
        unit: 'comprimidos',
      },
      {
        name: 'Enalapril 10mg',
        category: 'Antihipertensivo',
        stock: 45,
        minStock: 10,
        unit: 'comprimidos',
      },
      {
        name: 'Clorfenamina 4mg',
        category: 'Antihistamínico',
        stock: 50,
        minStock: 10,
        unit: 'comprimidos',
      },
      {
        name: 'Butilhioscina 10mg',
        category: 'Antiespasmódico',
        stock: 40,
        minStock: 10,
        unit: 'comprimidos',
      },
      {
        name: 'Complejo B inyectable',
        category: 'Vitamina',
        stock: 30,
        minStock: 10,
        unit: 'ampollas',
      },
      {
        name: 'Suero oral rehidratante',
        category: 'Electrolitos',
        stock: 25,
        minStock: 5,
        unit: 'sobres',
      },
      {
        name: 'Carbón activado',
        category: 'Antitóxico',
        stock: 20,
        minStock: 5,
        unit: 'comprimidos',
      },
    ];

    const created = await this.medicationRepo.save(medications);

    return {
      message: '✅ Medicamentos generales cargados exitosamente',
      count: created.length,
    };
  }

  // Obtener logs de stock (para auditoría)
  async getStockLogs(medicationId?: string, limit: number = 50) {
    const query = this.stockLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.medication', 'medication')
      .orderBy('log.createdAt', 'DESC')
      .take(limit);

    if (medicationId) {
      query.where('log.medicationId = :medicationId', { medicationId });
    }

    return query.getMany();
  }

  // Obtener logs de stock por medicamento específico
  async getStockLogsByMedication(medicationName: string) {
    return this.stockLogRepo
      .createQueryBuilder('log')
      .where('log.medicationName = :name', { name: medicationName })
      .orderBy('log.createdAt', 'DESC')
      .take(100)
      .getMany();
  }
}
