/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { VeterinariansRepository } from './veterinarians.repository';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { ChangePasswordVeterinarianDto } from './dto/change-password-veterinarian.dto';
import { Veterinarian } from './entities/veterinarian.entity';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import data from './seed/veterinarian.json';
import { Role } from 'src/auth/enum/roles.enum';
import { CreateControlledMedRequestDto } from './dto/create-controlled-med-request.dto';
import {
  UpdateMedRequestStatusDto,
  RequestStatus,
} from './dto/update-med-request-status.dto';
import { CONTROLLED_MEDICATIONS_CATALOG } from './dto/controlled-medications-catalog.dto';
import { MailerService } from 'src/mailer/mailer.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralMedication } from 'src/general-medications/entities/general-medication.entity';
import { StockLog, StockLogAction } from 'src/general-medications/entities/stock-log.entity';

@Injectable()
export class VeterinariansService {
  constructor(
    private readonly veterinarianRepository: VeterinariansRepository,
    private readonly mailerService: MailerService,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepo: Repository<Veterinarian>,
    @InjectRepository(GeneralMedication)
    private readonly medicationRepo: Repository<GeneralMedication>,
    @InjectRepository(StockLog)
    private readonly stockLogRepo: Repository<StockLog>,
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

  /**
   * Resetea todos los veterinarios: elimina completamente y recrea desde el seeder
   */
  async resetAllVeterinarians() {
    console.log('🔄 Iniciando reset de veterinarios...');
    
    // Paso 1: Eliminar todos los veterinarios
    const deleteResult = await this.veterinarianRepository.deleteAllVeterinarians();
    console.log('🗑️ Veterinarios eliminados:', deleteResult);
    
    // Paso 2: Ejecutar seeder para recrearlos
    const seederResult = await this.seeder();
    console.log('✅ Veterinarios recreados:', seederResult);
    
    return {
      message: 'Reset completado exitosamente',
      deleted: deleteResult,
      created: seederResult,
    };
  }

  /**
   * Resetea las contraseñas de todos los veterinarios existentes y envía emails
   */
  async resetPasswordsAndSendEmails() {
    console.log('🔄 Reseteando contraseñas de veterinarios existentes...');
    return await this.veterinarianRepository.resetPasswordsAndSendEmails();
  }

  /**
   * Reenvía los emails de bienvenida con las contraseñas actuales
   */
  async resendWelcomeEmails() {
    console.log('📧 Reenviando emails de bienvenida...');
    return await this.veterinarianRepository.resendWelcomeEmails();
  }

  /**
   * Recrea el usuario en Supabase para un veterinario específico
   */
  async recreateSupabaseUser(email: string) {
    console.log(`🔄 Recreando usuario en Supabase para ${email}...`);
    return await this.veterinarianRepository.recreateSupabaseUser(email);
  }

  // ============ MEDICAMENTOS CONTROLADOS ============

  /**
   * Obtener catálogo de medicamentos controlados disponibles
   */
  getControlledMedicationsCatalog() {
    return {
      total: CONTROLLED_MEDICATIONS_CATALOG.length,
      medications: CONTROLLED_MEDICATIONS_CATALOG,
      message:
        'Catálogo de medicamentos controlados disponibles para solicitud',
    };
  }

  /**
   * Veterinario solicita medicamentos controlados
   */
  async requestControlledMedications(
    veterinarianId: string,
    dto: CreateControlledMedRequestDto,
  ) {
    const veterinarian = await this.veterinarianRepo.findOne({
      where: { id: veterinarianId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    // Inicializar array si no existe
    if (!veterinarian.medicamentosControlados) {
      veterinarian.medicamentosControlados = [];
    }

    // Crear nueva solicitud
    const newRequest = {
      nombre: dto.nombre,
      cantidad: dto.cantidad,
      urgencia: dto.urgencia,
      justificacion: dto.justificacion || '',
      fechaSolicitud: new Date().toISOString(),
      estado: RequestStatus.PENDIENTE,
      veterinarioNombre: veterinarian.name,
      veterinarioEmail: veterinarian.email,
      veterinarioMatricula: veterinarian.matricula,
    };

    veterinarian.medicamentosControlados.push(newRequest);
    await this.veterinarianRepo.save(veterinarian);

    // Enviar email al admin
    try {
      await this.mailerService.sendControlledMedRequestToAdmin({
        veterinarian: {
          name: veterinarian.name,
          email: veterinarian.email,
          licenseNumber: veterinarian.matricula,
        },
        medication: dto.nombre,
        quantity: dto.cantidad,
        urgency: dto.urgencia,
        justification: dto.justificacion || 'Sin justificación específica',
        requestDate: new Date().toLocaleDateString('es-AR'),
      });
    } catch (emailError) {
      console.error('Error enviando email al admin:', emailError);
      // No fallar la solicitud si el email falla
    }

    return {
      message: 'Solicitud de medicamento controlado creada exitosamente',
      request: newRequest,
      totalRequests: veterinarian.medicamentosControlados.length,
    };
  }

  /**
   * Veterinario obtiene sus propias solicitudes
   */
  async getMyControlledMedRequests(veterinarianId: string) {
    const veterinarian = await this.veterinarianRepo.findOne({
      where: { id: veterinarianId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    return {
      veterinarian: {
        id: veterinarian.id,
        name: veterinarian.name,
        email: veterinarian.email,
        licenseNumber: veterinarian.matricula,
      },
      requests: veterinarian.medicamentosControlados || [],
      total: veterinarian.medicamentosControlados?.length || 0,
    };
  }

  /**
   * Admin obtiene todas las solicitudes de todos los veterinarios
   */
  async getAllControlledMedRequests() {
    const veterinarians = await this.veterinarianRepo.find({
      select: ['id', 'name', 'email', 'matricula', 'medicamentosControlados'],
    });

    const allRequests: any[] = [];
    veterinarians.forEach((vet) => {
      if (vet.medicamentosControlados && vet.medicamentosControlados.length > 0) {
        vet.medicamentosControlados.forEach((request: any, index: number) => {
          allRequests.push({
            ...request,
            veterinarianId: vet.id,
            requestIndex: index,
          });
        });
      }
    });

    // Ordenar por fecha más reciente primero
    allRequests.sort(
      (a: any, b: any) =>
        new Date(b.fechaSolicitud).getTime() -
        new Date(a.fechaSolicitud).getTime(),
    );

    return {
      total: allRequests.length,
      requests: allRequests,
      pending: allRequests.filter((r: any) => r.estado === RequestStatus.PENDIENTE)
        .length,
      approved: allRequests.filter((r: any) => r.estado === RequestStatus.APROBADO)
        .length,
      rejected: allRequests.filter((r: any) => r.estado === RequestStatus.RECHAZADO)
        .length,
    };
  }

  /**
   * Admin actualiza estado de una solicitud
   */
  async updateControlledMedRequestStatus(dto: UpdateMedRequestStatusDto) {
    const veterinarian = await this.veterinarianRepo.findOne({
      where: { id: dto.veterinarianId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    if (
      !veterinarian.medicamentosControlados ||
      !veterinarian.medicamentosControlados[dto.requestIndex]
    ) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const request = veterinarian.medicamentosControlados[dto.requestIndex];

    // VALIDACIONES DE SEGURIDAD
    // Validación 1: Evitar múltiples entregas de la misma solicitud
    if (dto.estado === RequestStatus.ENTREGADO && request.estado === RequestStatus.ENTREGADO) {
      throw new BadRequestException('Esta solicitud ya fue marcada como entregada anteriormente');
    }

    // Validación 2: La solicitud debe estar aprobada antes de entregar
    if (dto.estado === RequestStatus.ENTREGADO && request.estado !== RequestStatus.APROBADO) {
      throw new BadRequestException(
        `Solo se pueden marcar como entregadas las solicitudes previamente aprobadas. Estado actual: ${request.estado}`
      );
    }

    // Validación 3: Verificar que la cantidad sea válida
    if (request.cantidad <= 0) {
      throw new BadRequestException('La cantidad de la solicitud debe ser mayor a 0');
    }

    // LÓGICA DE ACTUALIZACIÓN DE STOCK
    let stockUpdate: {
      medication: string;
      quantityAdded: number;
      previousStock: number;
      newStock: number;
    } | null = null;

    if (dto.estado === RequestStatus.ENTREGADO && request.estado !== RequestStatus.ENTREGADO) {
      // Buscar el medicamento en el inventario
      const medication = await this.medicationRepo.findOne({
        where: { name: request.nombre },
      });

      if (!medication) {
        throw new NotFoundException(
          `Medicamento "${request.nombre}" no encontrado en el inventario`
        );
      }

      // Incrementar el stock
      const previousStock = medication.stock;
      medication.stock += request.cantidad;
      await this.medicationRepo.save(medication);

      console.log(`✅ Stock actualizado: ${medication.name}`);
      console.log(`   Anterior: ${previousStock} | Nuevo: ${medication.stock} (+${request.cantidad})`);

      stockUpdate = {
        medication: medication.name,
        quantityAdded: request.cantidad,
        previousStock: previousStock,
        newStock: medication.stock,
      };

      // Crear log de auditoría
      try {
        await this.stockLogRepo.save({
          medicationId: medication.id,
          medicationName: medication.name,
          action: StockLogAction.RESTOCK,
          quantity: request.cantidad,
          previousStock: previousStock,
          newStock: medication.stock,
          reason: `Solicitud entregada - RequestIndex: ${dto.requestIndex} - Veterinario: ${veterinarian.name} (${veterinarian.email})`,
          performedBy: 'admin', // TODO: Obtener del contexto de autenticación
        });
        console.log(`📝 Log de stock creado para ${medication.name}`);
      } catch (logError) {
        console.error('❌ Error creando log de stock:', logError);
        // No lanzar error, el log es opcional
      }
    }

    // Actualizar estado de la solicitud
    veterinarian.medicamentosControlados[dto.requestIndex].estado = dto.estado;
    veterinarian.medicamentosControlados[dto.requestIndex].comentarioAdmin =
      dto.comentarioAdmin || '';
    veterinarian.medicamentosControlados[dto.requestIndex].fechaRespuesta =
      new Date().toISOString();

    await this.veterinarianRepo.save(veterinarian);

    // Enviar email al veterinario notificando el cambio
    try {
      await this.mailerService.sendMedRequestStatusUpdate({
        to: veterinarian.email,
        veterinarianName: veterinarian.name,
        medication:
          veterinarian.medicamentosControlados[dto.requestIndex].nombre,
        quantity:
          veterinarian.medicamentosControlados[dto.requestIndex].cantidad,
        status: dto.estado,
        comment: dto.comentarioAdmin || 'Sin comentarios adicionales',
      });
    } catch (emailError) {
      console.error('❌ Error enviando email al veterinario:', emailError);
    }

    // Construir respuesta mejorada
    const responseMessage = dto.estado === RequestStatus.ENTREGADO && stockUpdate
      ? `Estado actualizado a entregado. Stock incrementado en ${stockUpdate.quantityAdded} unidades (${stockUpdate.medication})`
      : 'Estado de solicitud actualizado';

    return {
      message: responseMessage,
      request: veterinarian.medicamentosControlados[dto.requestIndex],
      stockUpdate: stockUpdate,
    };
  }

  /**
   * Veterinario cancela su propia solicitud
   */
  async cancelMyControlledMedRequest(
    veterinarianId: string,
    requestIndex: number,
  ) {
    const veterinarian = await this.veterinarianRepo.findOne({
      where: { id: veterinarianId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    if (
      !veterinarian.medicamentosControlados ||
      !veterinarian.medicamentosControlados[requestIndex]
    ) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const request = veterinarian.medicamentosControlados[requestIndex];

    // Solo se puede cancelar si está pendiente
    if (request.estado !== RequestStatus.PENDIENTE) {
      throw new BadRequestException(
        `No se puede cancelar una solicitud con estado: ${request.estado}`,
      );
    }

    request.estado = RequestStatus.CANCELADO;
    request.fechaRespuesta = new Date().toISOString();

    await this.veterinarianRepo.save(veterinarian);

    return {
      message: 'Solicitud cancelada exitosamente',
      request,
    };
  }
}
