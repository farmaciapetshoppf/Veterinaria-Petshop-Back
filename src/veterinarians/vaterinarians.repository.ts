/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { Role } from 'src/auth/enum/roles.enum';
import { StorageService } from 'src/supabase/storage.service';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';

@Injectable()
export class VeterinariansRepository {
  constructor(
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
    private readonly supabaseService: SupabaseService,
    private readonly storageService: StorageService,
  ) {}

  private generateTempPassword(length = 8): string {
    // Aseguramos que la longitud sea al menos 8
    const finalLength = Math.max(length, 8);

    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_-+=<>?';

    // Aseguramos que tenga al menos uno de cada tipo
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Completamos el resto de la contraseña
    const allChars = lowercase + uppercase + numbers + special;
    const remainingLength = finalLength - 4;

    for (let i = 0; i < remainingLength; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mezclamos los caracteres para que no queden en orden predecible
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  async fillAll() {
    const relations = [
      'appointments',
      'appointments.pet',
      'appointments.pet.owner',
    ];

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

    const rawEmail =
      (createVeterinarianDto as any).email ??
      (createVeterinarianDto as any).mail;

    if (!rawEmail) {
      throw new BadRequestException(
        'El veterinario debe tener un email válido',
      );
    }

    const email = rawEmail.trim().toLowerCase();
    const matricula = createVeterinarianDto.matricula; // Asegúrate de que la matricula esté en el DTO

    // Verificar si el email o la matrícula ya existen en la base de datos
    const existingVeterinarianByEmail =
      await this.veterinarianRepository.findOne({ where: { email } });
    if (existingVeterinarianByEmail) {
      throw new ConflictException('El email ya está registrado.');
    }

    const existingVeterinarianByMatricula =
      await this.veterinarianRepository.findOne({ where: { matricula } });
    if (existingVeterinarianByMatricula) {
      throw new ConflictException('La matrícula ya está registrada.');
    }

    try {
      // Crear usuario en Supabase Auth
      const { data, error: authError } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email,
          password: tempPassword,
        });

      if (authError) {
        const errorMessage = authError.message.toLowerCase();
        const errorCode = (authError as any).code;

        if (errorCode === 'email_address_invalid') {
          throw new BadRequestException(
            'El email ingresado no tiene un formato válido.',
          );
        }

        if (errorCode === 'over_email_send_rate_limit') {
          throw new BadRequestException(
            'Estás intentando crear cuentas demasiado rápido. Esperá unos segundos e intentá de nuevo.',
          );
        }

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

      const vet = this.veterinarianRepository.create({
        id: data?.user?.id || '',
        ...createVeterinarianDto,
        time: new Date(createVeterinarianDto.time),
        password: hashedPassword,
        role: Role.Veterinarian,
        requirePasswordChange: true,
      });

      await this.veterinarianRepository.save(vet);

      return {
        message:
          'Veterinario creado con éxito. ' +
          `La contraseña temporal es: ${tempPassword}`,
      };
    } catch (error) {
      console.error('Error al crear veterinario:', error);

      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        const detail: string = (error as any).detail ?? '';

        if (detail.includes('(phone)=')) {
          throw new ConflictException('El teléfono ya está registrado.');
        }

        throw new ConflictException(
          'Ya existe un veterinario con datos únicos repetidos.',
        );
      }

      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Ocurrió un error al crear el veterinario',
      );
    }
  }

  // veterinarians.repository.ts
  async updateProfile(
    id: string,
    updateVeterinarianDto: UpdateVeterinarianDto,
    file?: Express.Multer.File,
  ) {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    // Crear un objeto vacío para las actualizaciones y solo agregar las propiedades que queremos actualizar
    const updateData: Partial<Veterinarian> = {};

    // Agregar solo las propiedades que están en el DTO
    if (updateVeterinarianDto.description !== undefined) {
      updateData.description = updateVeterinarianDto.description;
    }

    if (updateVeterinarianDto.phone !== undefined) {
      updateData.phone = updateVeterinarianDto.phone;
    }

    // Manejar la imagen por separado
    if (file) {
      await this.validateImageFile(file);
      const imageUrl = await this.uploadVeterinarianImage(file);
      if (imageUrl) {
        updateData.profileImageUrl = imageUrl;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        'No se proporcionaron datos para actualizar',
      );
    }

    // Actualizar solo las propiedades que hemos definido explícitamente
    Object.assign(veterinarian, updateData);
    await this.veterinarianRepository.save(veterinarian);

    // Eliminamos la contraseña antes de devolver el veterinario actualizado
    const { password, ...result } = veterinarian;

    return {
      message: 'Perfil de veterinario actualizado correctamente',
      result,
    };
  }

  private async validateImageFile(file: Express.Multer.File): Promise<void> {
    if (!file.mimetype.includes('image/')) {
      throw new BadRequestException(
        'El archivo debe ser una imagen (.jpg, .png, .webp)',
      );
    }
  }

  private async uploadVeterinarianImage(
    file: Express.Multer.File,
  ): Promise<string | null> {
    const result = await this.storageService.uploadFile(file, 'veterinarians');

    if (!result) {
      throw new BadRequestException('Error al subir la imagen');
    }

    return result.publicUrl;
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
    if (!findEmail) throw new NotFoundException('Veterinario no encontrado');

    try {
      // Verificamos la contraseña actual con bcrypt
      const isMatch = await bcrypt.compare(currentPassword, findEmail.password);
      if (!isMatch) {
        throw new BadRequestException('Contraseña actual incorrecta');
      }

      // Actualizamos en Supabase
      const { error: updateError } = await this.supabaseService
        .getClient()
        .auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw new InternalServerErrorException(
          'Error al actualizar la contraseña en Supabase',
        );
      }

      // Actualizamos en nuestra base de datos
      findEmail.password = await bcrypt.hash(newPassword, 10);
      findEmail.requirePasswordChange = false;
      await this.veterinarianRepository.save(findEmail);

      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al cambiar la contraseña');
    }
  }

  async getVeterinarianByEmail(email: string): Promise<Veterinarian> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { email },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado.');
    }
    return veterinarian;
  }
}
