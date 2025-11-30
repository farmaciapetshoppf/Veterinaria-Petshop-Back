import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointments } from './entities/appointment.entity';
import { Users } from 'src/users/entities/user.entity';
import { Pet } from 'src/pets/entities/pet.entity';

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

  ) {}  

  async create(dto: CreateAppointmentDto) {
    // Try to find related entities; if they don't exist or id not provided, omit them
    const user = dto.userId ? await this.usersRepo.findOne({ where: { id: dto.userId } }) : null;
    const pet = dto.petId ? await this.petsRepo.findOne({ where: { id: dto.petId } }) : null;
    const vet = dto.veterinarianId ? await this.vetsRepo.findOne({ where: { id: dto.veterinarianId } }) : null;

    const appointmentData: Partial<Appointments> = {
      user: user ?? undefined,
      pet: pet ?? undefined,
      veterinarian: vet ?? undefined,
      date: dto.date,
      time: dto.time,
    };

    const appointment = this.appointmentsRepository.create(appointmentData);

    await this.appointmentsRepository.save(appointment);
    // strip veterinarian password if present
    if (appointment.veterinarian && (appointment.veterinarian as any).password) {
      delete (appointment.veterinarian as any).password;
    }
    return {
      message: 'Appointment created successfully',
      data: appointment,
    };
  }

  async findAll() {
    const appointments = await this.appointmentsRepository.find({
      relations: ['pet', 'pet.owner', 'veterinarian'],
    });
    appointments.forEach(a => {
      if (a.veterinarian && (a.veterinarian as any).password) {
        delete (a.veterinarian as any).password;
      }
    });
    return appointments;
  }

  async findOne(id: number) {
    const appointment = await this.appointmentsRepository.findOne({ where: { id: String(id) }, relations: ['pet', 'pet.owner', 'veterinarian'] });
    if (!appointment) return null;
    if (appointment.veterinarian && (appointment.veterinarian as any).password) {
      delete (appointment.veterinarian as any).password;
    }
    return appointment;
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    await this.appointmentsRepository.update(id, updateAppointmentDto as any);
    const updated = await this.findOne(id);
    return { message: `Appointment ${id} updated`, data: updated };
  }

  async remove(id: number) {
    const result = await this.appointmentsRepository.delete(id);
    if (result.affected && result.affected > 0) return { message: `Appointment ${id} removed` };
    return { message: `Appointment ${id} not found` };
  }
}
