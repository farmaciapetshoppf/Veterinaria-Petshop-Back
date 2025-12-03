import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VeterinariansRepository {
  constructor(
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
  ) {}
  private generateTempPassword(length = 10): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  }

  async fillAll(onlyActive?: boolean) {
    const relations = [
      'appointments',
      'appointments.pet',
      'appointments.pet.owner',
    ];

    if (onlyActive === false) {
      const vets = await this.veterinarianRepository.find({ relations });
      vets.forEach(v => { if ((v as any).password) delete (v as any).password; });
      return vets;
    }

    const vets = await this.veterinarianRepository.find({
      where: { isActive: true },
      relations,
    });
    vets.forEach(v => { if ((v as any).password) delete (v as any).password; });
    return vets;
  }

  async fillById(id: string) {
    const relations = [
      'appointments',
      'appointments.pet',
      'appointments.pet.owner',
    ];

    const findById = await this.veterinarianRepository.findOne({ where: { id }, relations });
    if (!findById) throw new NotFoundException('Veterinario no encontrado');
    if ((findById as any).password) delete (findById as any).password;
    return findById;
  }

  async create(createVeterinarianDto: CreateVeterinarianDto) {
    const TempPassword = this.generateTempPassword();

    const hashedPassword = await bcrypt.hash(TempPassword, 10);
    const vet = this.veterinarianRepository.create({
      ...createVeterinarianDto,
      time: new Date(createVeterinarianDto.time),
      password: hashedPassword,
    });
    try {
      const saved = await this.veterinarianRepository.save(vet);
      const { name: name, email: email } = saved;
      return {
        message:
          `Veterinario creado con éxito. Ingrese con ${email}. Contraseña temporal: ${TempPassword}`,
        data: saved,
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (error as any).code === '23505'
      ) {
        throw new ConflictException(
          'Email, matrícula o teléfono ya están registrados',
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const veterinarian = await this.veterinarianRepository.findOneBy({ id });
    if (!veterinarian) throw new NotFoundException('Veterinario no encontrado');
    veterinarian.isActive = false;
    await this.veterinarianRepository.save(veterinarian);
    return { message: 'Veterinario eliminado correctamente' };
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
    repeatNewPassword: string,
  ) {
    if (newPassword !== repeatNewPassword)
      throw new BadRequestException('Contraseñas no coinciden');

    const findEmail = await this.veterinarianRepository.findOne({
      where: { email },
    });
    if (!findEmail) throw new NotFoundException('Veterinario no encotrado');

    const isMatch = await bcrypt.compare(currentPassword, findEmail.password);
    if (!isMatch) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    findEmail.password = await bcrypt.hash(newPassword, 10);
    await this.veterinarianRepository.save(findEmail);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
