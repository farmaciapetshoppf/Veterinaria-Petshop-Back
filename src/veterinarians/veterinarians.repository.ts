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
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class VeterinariansRepository {
  constructor(
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
    private readonly supabaseService: SupabaseService,
    private readonly storageService: StorageService,
    private readonly mailerService: MailerService,
  ) {}

  private generateTempPassword(): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*';
    
    // Crear array con caracteres garantizados: 2 de cada tipo
    const guaranteedChars = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
      special[Math.floor(Math.random() * special.length)],
    ];
    
    // Agregar 2 caracteres aleatorios más para llegar a 10
    const allChars = uppercase + lowercase + numbers + special;
    guaranteedChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    guaranteedChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    
    // Mezclar usando Fisher-Yates shuffle
    for (let i = guaranteedChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [guaranteedChars[i], guaranteedChars[j]] = [guaranteedChars[j], guaranteedChars[i]];
    }
    
    const password = guaranteedChars.join('') + '!!';
    
    // Log para verificar
    console.log('🔑 Contraseña temporal veterinario generada:', password);
    console.log('   - Mayúsculas:', (password.match(/[A-Z]/g) || []).length);
    console.log('   - Minúsculas:', (password.match(/[a-z]/g) || []).length);
    console.log('   - Números:', (password.match(/[0-9]/g) || []).length);
    console.log('   - Especiales:', (password.match(/[!@#$%&*]/g) || []).length);
    
    return password;
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
    // Usar contraseña del frontend si viene, sino generar una
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
      // Crear usuario en Supabase Auth con email confirmado automáticamente
      const { data, error: authError } = await this.supabaseService
        .getClient()
        .auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
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
        horario_atencion: createVeterinarianDto.horario_atencion
          ? new Date(createVeterinarianDto.horario_atencion)
          : undefined,
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

    if (updateVeterinarianDto.horario_atencion !== undefined) {
      updateData.horario_atencion = new Date(
        updateVeterinarianDto.horario_atencion,
      );
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

  async recreateSupabaseUser(email: string) {
    try {
      // Buscar el veterinario en la BD
      const vet = await this.veterinarianRepository.findOne({ where: { email } });
      
      if (!vet) {
        throw new NotFoundException(`Veterinario con email ${email} no encontrado`);
      }

      console.log(`📋 Veterinario encontrado: ${vet.name} (ID actual en BD: ${vet.id})`);

      // Generar nueva contraseña temporal
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      console.log(`🔑 Nueva contraseña generada: ${tempPassword}`);

      // Crear usuario en Supabase Auth con email confirmado
      const { data: newUser, error: createError } = await this.supabaseService
        .getClient()
        .auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
        });

      if (createError) {
        console.error(`❌ Error creando usuario en Supabase:`, createError.message);
        throw new InternalServerErrorException(`Error en Supabase: ${createError.message}`);
      }

      console.log(`✅ Usuario creado en Supabase con ID: ${newUser.user.id}`);

      // Actualizar el ID en la base de datos
      vet.id = newUser.user.id;
      vet.password = hashedPassword;
      vet.requirePasswordChange = true;
      await this.veterinarianRepository.save(vet);

      console.log(`✅ Veterinario actualizado en BD con nuevo ID de Supabase`);

      // Enviar email con la nueva contraseña
      await this.mailerService.sendWelcomeEmail({
        to: vet.email,
        userName: vet.name,
        temporaryPassword: tempPassword,
      });

      console.log(`✅ Email enviado a ${vet.email}`);

      return {
        message: 'Usuario recreado exitosamente en Supabase',
        email: vet.email,
        name: vet.name,
        newSupabaseId: newUser.user.id,
        temporaryPassword: tempPassword,
      };
    } catch (error) {
      console.error('❌ Error en recreateSupabaseUser:', error);
      throw error;
    }
  }

  async resetPasswordsAndSendEmails() {
    try {
      const veterinarians = await this.veterinarianRepository.find();
      
      const results: Array<{
        email: string;
        name: string;
        success: boolean;
        temporaryPassword?: string;
        error?: string;
      }> = [];

      for (const vet of veterinarians) {
        try {
          // Generar nueva contraseña temporal
          const tempPassword = this.generateTempPassword();
          console.log(`📧 Contraseña que se enviará a ${vet.email}: ${tempPassword}`);
          
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          // Actualizar contraseña en Supabase
          console.log(`🔄 Actualizando contraseña en Supabase para ${vet.email} (ID: ${vet.id})`);
          console.log(`🔑 Nueva contraseña para Supabase: ${tempPassword}`);
          
          const { data: updateData, error: supabaseError } = await this.supabaseService
            .getClient()
            .auth.admin.updateUserById(vet.id, {
              password: tempPassword,
            });

          if (supabaseError) {
            console.error(`❌ Error actualizando en Supabase para ${vet.email}:`, supabaseError.message);
            throw new Error(`Error en Supabase: ${supabaseError.message}`);
          }
          
          console.log(`✅ Contraseña actualizada en Supabase para ${vet.email}`);

          // Actualizar en la base de datos
          vet.password = hashedPassword;
          vet.requirePasswordChange = true;
          await this.veterinarianRepository.save(vet);

          // Enviar email con la nueva contraseña
          console.log(`📨 Enviando email a ${vet.email} con contraseña: ${tempPassword}`);
          await this.mailerService.sendWelcomeEmail({
            to: vet.email,
            userName: vet.name,
            temporaryPassword: tempPassword,
          });

          results.push({
            email: vet.email,
            name: vet.name,
            success: true,
            temporaryPassword: tempPassword,
          });

          console.log(`✅ Contraseña reseteada y email enviado a ${vet.email} - Contraseña final: ${tempPassword}`);
        } catch (error) {
          console.error(`❌ Error procesando veterinario ${vet.email}:`, error);
          results.push({
            email: vet.email,
            name: vet.name,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      }

      return {
        message: 'Proceso completado',
        total: veterinarians.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('❌ Error en resetPasswordsAndSendEmails:', error);
      throw new InternalServerErrorException('Error al resetear contraseñas');
    }
  }

  /**
   * Reenvía los emails de bienvenida con las contraseñas actuales (sin cambiarlas)
   */
  async resendWelcomeEmails() {
    try {
      console.log('📧 Iniciando reenvío de emails de bienvenida...');
      
      const veterinarians = await this.veterinarianRepository.find();
      const results: Array<{
        email: string;
        name: string;
        success: boolean;
        temporaryPassword?: string;
        error?: string;
      }> = [];

      for (const vet of veterinarians) {
        try {
          // Obtener los datos del usuario de Supabase para mostrar la contraseña actual
          const { data: supabaseUser } = await this.supabaseService
            .getClient()
            .auth.admin.getUserById(vet.id);

          if (!supabaseUser) {
            console.warn(`⚠️ Usuario no encontrado en Supabase: ${vet.email}`);
            results.push({
              email: vet.email,
              name: vet.name,
              success: false,
              error: 'Usuario no encontrado en Supabase',
            });
            continue;
          }

          // Para reenviar necesitamos obtener la contraseña actual desde PostgreSQL
          // Como está hasheada, vamos a generar una nueva y actualizarla
          const tempPassword = this.generateTempPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          // Actualizar en Supabase
          const { error: supabaseError } = await this.supabaseService
            .getClient()
            .auth.admin.updateUserById(vet.id, {
              password: tempPassword,
            });

          if (supabaseError) {
            console.error(`❌ Error actualizando contraseña en Supabase para ${vet.email}:`, supabaseError.message);
            throw new Error(`Error en Supabase: ${supabaseError.message}`);
          }

          // Actualizar en PostgreSQL
          vet.password = hashedPassword;
          await this.veterinarianRepository.save(vet);

          // Enviar email con la nueva contraseña
          console.log(`📨 Enviando email a ${vet.email} con contraseña: ${tempPassword}`);
          await this.mailerService.sendWelcomeEmail({
            to: vet.email,
            userName: vet.name,
            temporaryPassword: tempPassword,
          });

          results.push({
            email: vet.email,
            name: vet.name,
            success: true,
            temporaryPassword: tempPassword,
          });

          console.log(`✅ Email enviado a ${vet.email} con contraseña: ${tempPassword}`);
        } catch (error) {
          console.error(`❌ Error procesando veterinario ${vet.email}:`, error);
          results.push({
            email: vet.email,
            name: vet.name,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      }

      return {
        message: 'Reenvío de emails completado',
        total: veterinarians.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('❌ Error en resendWelcomeEmails:', error);
      throw new InternalServerErrorException('Error al reenviar emails');
    }
  }

  /**
   * Elimina completamente todos los veterinarios de Supabase Auth y de la base de datos
   */
  async deleteAllVeterinarians() {
    try {
      const veterinarians = await this.veterinarianRepository.find();
      
      let deletedCount = 0;
      let errorCount = 0;

      for (const vet of veterinarians) {
        try {
          // Intentar eliminar de Supabase Auth
          if (vet.id) {
            const { error } = await this.supabaseService
              .getClient()
              .auth.admin.deleteUser(vet.id);
            
            if (error) {
              console.warn(`⚠️ Error eliminando veterinario ${vet.email} de Supabase:`, error.message);
            }
          }

          // Eliminar de la base de datos
          await this.veterinarianRepository.remove(vet);
          deletedCount++;
          console.log(`✅ Veterinario ${vet.email} eliminado completamente`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Error eliminando veterinario ${vet.email}:`, error);
        }
      }

      return {
        message: 'Proceso de eliminación completado',
        deletedCount,
        errorCount,
        total: veterinarians.length,
      };
    } catch (error) {
      console.error('❌ Error en deleteAllVeterinarians:', error);
      throw new InternalServerErrorException('Error al eliminar veterinarios');
    }
  }
}
