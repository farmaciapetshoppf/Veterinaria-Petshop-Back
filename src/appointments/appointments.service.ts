import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Repository, MoreThanOrEqual, LessThan, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointments } from './entities/appointment.entity';
import { Users } from 'src/users/entities/user.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointments)
    private readonly appointmentsRepository: Repository<Appointments>,

    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,

    @InjectRepository(Pet)
    private readonly petsRepo: Repository<Pet>,

    @InjectRepository(Veterinarian)
    private readonly vetsRepo: Repository<Veterinarian>,

    private readonly mailerService: MailerService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const user = dto.userId
      ? await this.usersRepo.findOne({ where: { id: dto.userId } })
      : null;

    const pet = dto.petId
      ? await this.petsRepo.findOne({ where: { id: dto.petId } })
      : null;

    const vet = dto.veterinarianId
      ? await this.vetsRepo.findOne({ where: { id: dto.veterinarianId } })
      : null;

    if (dto.veterinarianId && !vet) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    if (dto.veterinarianId) {
      const existing = await this.appointmentsRepository.findOne({
        where: {
          veterinarian: { id: dto.veterinarianId },
          date: dto.date as any,
          time: dto.time as any,
          status: true,
        },
        relations: ['veterinarian'],
      });

      if (existing) {
        throw new BadRequestException(
          'El veterinario ya tiene un turno asignado en esa fecha y horario',
        );
      }
    }

    const appointmentData: Partial<Appointments> = {
      user: user ?? undefined,
      pet: pet ?? undefined,
      veterinarian: vet ?? undefined,
      date: dto.date,
      time: dto.time,
      status: dto.status ?? true,
      ...(dto.detail ? { detail: dto.detail } : {}),
    };

    const appointment = this.appointmentsRepository.create(appointmentData);
    const savedAppointment = await this.appointmentsRepository.save(appointment);

    // Cargar las relaciones completas para el email
    const appointmentWithRelations = await this.appointmentsRepository.findOne({
      where: { id: savedAppointment.id },
      relations: ['user', 'pet', 'veterinarian'],
    });

    if (
      appointmentWithRelations &&
      appointmentWithRelations.veterinarian &&
      (appointmentWithRelations.veterinarian as any).password
    ) {
      delete (appointmentWithRelations.veterinarian as any).password;
    }

    // Enviar email de confirmación de forma asíncrona (no bloquear la respuesta)
    if (appointmentWithRelations) {
      this.sendAppointmentConfirmation(appointmentWithRelations).catch((err) =>
        console.error('Error enviando email de confirmación:', err),
      );
    }

    return {
      message: 'Appointment created successfully',
      data: appointmentWithRelations,
    };
  }

  async findAll() {
    const appointments = await this.appointmentsRepository.find({
      relations: ['pet', 'pet.owner', 'veterinarian'],
    });
    appointments.forEach((a) => {
      if (a.veterinarian && (a.veterinarian as any).password) {
        delete (a.veterinarian as any).password;
      }
    });
    return appointments;
  }

  async findOne(id: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: String(id) },
      relations: ['pet', 'pet.owner', 'veterinarian'],
      withDeleted: false,
    });

    if (!appointment) return null;

    if (
      appointment.veterinarian &&
      (appointment.veterinarian as any).password
    ) {
      delete (appointment.veterinarian as any).password;
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const existingAppointment = await this.findOne(id);

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    await this.appointmentsRepository.update(id, {
      ...(updateAppointmentDto.date && { date: updateAppointmentDto.date }),
      ...(updateAppointmentDto.time && { time: updateAppointmentDto.time }),
      ...(updateAppointmentDto.detail !== undefined && {
        detail: updateAppointmentDto.detail,
      }),
      ...(updateAppointmentDto.status !== undefined && {
        status: updateAppointmentDto.status,
      }),
    });

    const updated = await this.findOne(id);
    return { message: `Appointment ${id} updated`, updated };
  }

  async remove(id: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      withDeleted: false,
    });

    if (!appointment) {
      return { message: `Appointment ${id} not found` };
    }

    await this.appointmentsRepository.softDelete(id);
    return { message: `Appointment ${id} removed` };
  }

  async getAvailability(vetId: string, date: string) {
    if (!date) {
      throw new BadRequestException(
        'La fecha es obligatoria (formato: YYYY-MM-DD)',
      );
    }

    const vet = await this.vetsRepo.findOne({
      where: { id: vetId },
    });
    if (!vet) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const newDate = new Date(date);

    if (Number.isNaN(newDate.getTime())) {
      throw new BadRequestException('Fecha invalida, use formato YYYY-MM-DD');
    }

    const appointment = await this.appointmentsRepository.find({
      where: {
        veterinarian: { id: vetId },
        date: date as any,
        status: true,
      },
    });

    const taken = new Set(
      appointment.map((a) => {
        const t = a.time as unknown as string; // 'HH:MM:SS' viene de Postgres
        return t.slice(0, 5); // 'HH:MM'
      }),
    );

    const slots: { time: string; available: boolean }[] = [];

    const startHour = 9;
    const endHour = 16;
    const slotMinutes = 30;

    const base = new Date(date + 'T00:00:00');
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotMinutes) {
        const slotDate = new Date(base);
        slotDate.setHours(hour, minute, 0, 0);

        const hh = String(slotDate.getHours()).padStart(2, '0');
        const mm = String(slotDate.getMinutes()).padStart(2, '0');
        const label = `${hh}:${mm}`;

        slots.push({
          time: label,
          available: !taken.has(label),
        });
      }
    }

    return {
      date: date,
      veterinarianId: vetId,
      slots,
    };
  }

  // ==================== CRON JOBS ====================

  /**
   * Enviar recordatorios de turnos 24 horas antes
   * Se ejecuta todos los días a las 9:00 AM
   */
  @Cron('0 9 * * *')
  async sendAppointmentReminders() {
    console.log('🔔 Ejecutando cron: Recordatorios de turnos');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Buscar turnos para mañana
    const appointments = await this.appointmentsRepository.find({
      where: {
        date: Between(tomorrow, dayAfterTomorrow),
      },
      relations: ['user', 'pet', 'veterinarian'],
    });

    console.log(`📅 Turnos para mañana: ${appointments.length}`);

    for (const appointment of appointments) {
      if (!appointment.user?.email) {
        console.log(`⚠️ Turno ${appointment.id} sin email de usuario`);
        continue;
      }

      try {
        const appointmentDate = new Date(appointment.date);
        const dateStr = appointmentDate.toLocaleDateString('es-AR');

        await this.mailerService.sendAppointmentReminder({
          to: appointment.user.email,
          userName: appointment.user.name || 'Cliente',
          appointmentDate: dateStr,
          appointmentTime: appointment.time instanceof Date ? appointment.time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : String(appointment.time),
          petName: appointment.pet?.nombre || 'N/A',
          veterinarianName: appointment.veterinarian?.name || 'N/A',
          reason: (appointment as any).reason || 'Consulta general',
        });

        console.log(`✅ Recordatorio enviado a ${appointment.user.email}`);
      } catch (error) {
        console.error(
          `❌ Error enviando recordatorio para turno ${appointment.id}:`,
          error,
        );
      }
    }

    console.log('✅ Cron de recordatorios completado');
  }

  /**
   * Enviar email de confirmación cuando se crea un turno
   */
  async sendAppointmentConfirmation(appointment: Appointments) {
    if (!appointment.user?.email) {
      console.log('⚠️ No se puede enviar confirmación: usuario sin email');
      return;
    }

    try {
      const appointmentDate = new Date(appointment.date);
      const dateStr = appointmentDate.toLocaleDateString('es-AR');
      const timeStr = appointment.time instanceof Date ? appointment.time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : String(appointment.time);

      // Enviar confirmación al cliente
      await this.mailerService.sendAppointmentConfirmation({
        to: appointment.user.email,
        userName: appointment.user.name || 'Cliente',
        appointmentDate: dateStr,
        appointmentTime: timeStr,
        petName: appointment.pet?.nombre || 'N/A',
        veterinarianName: appointment.veterinarian?.name || 'N/A',
        reason: (appointment as any).reason || 'Consulta general',
      });

      // Enviar notificación al veterinario
      if (appointment.veterinarian?.email) {
        await this.mailerService.sendVeterinarianAppointmentAssigned({
          to: appointment.veterinarian.email,
          veterinarianName: appointment.veterinarian.name,
          date: dateStr,
          time: timeStr,
          reason: (appointment as any).reason || 'Consulta general',
          status: String(appointment.status || 'Pendiente'),
          petName: appointment.pet?.nombre || 'N/A',
          ownerName: appointment.user.name || 'N/A',
          ownerPhone: appointment.user.phone || 'No especificado',
          ownerEmail: appointment.user.email,
          notes: (appointment as any).notes,
        });
      }
    } catch (error) {
      console.error('❌ Error enviando confirmación de turno:', error);
    }
  }
}
