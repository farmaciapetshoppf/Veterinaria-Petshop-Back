/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class VeterinariansRepository {
  constructor(
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
    private readonly supabaseService: SupabaseService,
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
      vets.forEach((v) => {
        if ((v as any).password) delete (v as any).password;
      });
      return vets;
    }

    const vets = await this.veterinarianRepository.find({
      where: { isActive: true },
      relations,
    });
    vets.forEach((v) => {
      if ((v as any).password) delete (v as any).password;
    });
    return vets;
  }

  async fillById(id: string) {
    const relations = [
      'appointments',
      'appointments.pet',
      'appointments.pet.owner',
    ];

    const findById = await this.veterinarianRepository.findOne({
      where: { id },
      relations,
    });
    if (!findById) throw new NotFoundException('Veterinario no encontrado');
    if ((findById as any).password) delete (findById as any).password;
    return findById;
  }

  async create(createVeterinarianDto: CreateVeterinarianDto) {
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 1) Tomamos el email del DTO y lo normalizamos
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rawEmail =
      (createVeterinarianDto as any).email ??
      (createVeterinarianDto as any).mail;

    if (!rawEmail) {
      throw new BadRequestException(
        'El veterinario debe tener un email válido',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const email = rawEmail.trim().toLowerCase();

    try {
      // 2) Crear usuario en Supabase Auth
      const { data, error: authError } = await this.supabaseService
        .getClient()
        .auth.signUp({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          email,
          password: tempPassword,
        });

      if (authError) {
        const errorMessage = authError.message.toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorCode = (authError as any).code;

        // ⛔ email inválido
        if (errorCode === 'email_address_invalid') {
          throw new BadRequestException(
            'El email ingresado no tiene un formato válido.',
          );
        }

        // 🕒 te pasaste del límite de envíos de email
        if (errorCode === 'over_email_send_rate_limit') {
          throw new BadRequestException(
            'Estás intentando crear cuentas demasiado rápido. Esperá unos segundos e intentá de nuevo.',
          );
        }

        // 🟡 usuario ya registrado
        if (
          errorMessage.includes('user') &&
          (errorMessage.includes('already') ||
            errorMessage.includes('exist') ||
            errorMessage.includes('registered'))
        ) {
          throw new ConflictException(
            'El email ingresado ya está registrado en el sistema.',
          );
        }

        console.error('Error de Supabase al crear veterinario:', authError);

        throw new InternalServerErrorException(
          'Error de autenticación con Supabase',
        );
      }

      // 3) Crear entidad Veterinarian en nuestra BD
      const vet = this.veterinarianRepository.create({
        ...createVeterinarianDto,
        time: new Date(createVeterinarianDto.time),
        password: hashedPassword,
        supabaseUserId: data?.user?.id ?? null,
      });

      await this.veterinarianRepository.save(vet);

      return {
        message:
          'Veterinario creado con éxito. ' +
          `La contraseña temporal es: ${tempPassword}`,
      };
    } catch (error) {
      console.error('Error al crear veterinario:', error);

      // 🔁 errores de unicidad en la base de datos
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const detail: string = (error as any).detail ?? '';

        if (detail.includes('(email)=')) {
          throw new ConflictException('El email ya está registrado.');
        }

        if (detail.includes('(matricula)=')) {
          throw new ConflictException('La matrícula ya está registrada.');
        }

        if (detail.includes('(phone)=')) {
          throw new ConflictException('El teléfono ya está registrado.');
        }

        // fallback genérico
        throw new ConflictException(
          'Ya existe un veterinario con datos únicos repetidos.',
        );
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Ocurrió un error al crear el veterinario',
      );
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
