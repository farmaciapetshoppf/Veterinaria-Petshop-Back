/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from './dto/singup.dto';
import { SignInDto } from './dto/signin.dto';
import { Role } from './enum/roles.enum';
import { Response } from 'express';
import { MailerService } from 'src/mailer/mailer.service';
import { VeterinariansService } from 'src/veterinarians/veterinarians.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly veterinariansService: VeterinariansService,
  ) {}

  /**
   * Genera una contraseña aleatoria de 10 caracteres
   * Garantiza: 2 mayúsculas, 2 minúsculas, 2 números, 2 caracteres especiales
   */
  private generateRandomPassword(): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*';
    
    let password = '';
    
    // Asegurar 2 mayúsculas
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    
    // Asegurar 2 minúsculas
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    
    // Asegurar 2 números
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    // Asegurar 2 caracteres especiales
    password += special[Math.floor(Math.random() * special.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Completar hasta 10 caracteres con caracteres aleatorios
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 8; i < 10; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar los caracteres usando Fisher-Yates shuffle
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    return passwordArray.join('');
  }

  async signUp(signUpDto: SignUpDto) {
    const { name, email, password, user, phone, country, address, city } =
      signUpDto;

    try {
      // Los usuarios COMUNES usan la contraseña que eligieron al registrarse
      // Solo los veterinarios (creados por admin) reciben contraseña temporal
      console.log('📝 Registrando usuario común con contraseña elegida');
      
      const { data, error: authError } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email: email,
          password: password, // ✅ Usar la contraseña que el usuario eligió
        });

      if (authError) {
        const errorMessage = authError.message.toLowerCase();

        if (
          errorMessage.includes('user') &&
          (errorMessage.includes('already') ||
            errorMessage.includes('exist') ||
            errorMessage.includes('registered'))
        ) {
          return {
            error: 'Bad Request',
            message: 'El email ingresado ya está registrado en el sistema.',
            statusCode: 400,
          };
        }

        throw new Error(`Error de autenticación: ${authError.message}`);
      }

      if (data && data.user) {
        const newUser = await this.usersService.createUser({
          id: data.user.id,
          email,
          name,
          user,
          phone,
          country,
          address,
          city,
          role: Role.User,
        });

        // Enviar email de bienvenida SIN contraseña temporal (usuarios comunes)
        try {
          await this.mailerService.sendWelcomeEmail({
            to: email,
            userName: name,
          });
          console.log(`✅ Email de bienvenida enviado a ${email}`);
        } catch (mailError) {
          const errorMessage =
            mailError instanceof Error
              ? mailError.message
              : 'Error desconocido al enviar el correo.';

          console.warn(
            `[Mailer Warning]: Fallo el envío de correo a ${email}. Causa: ${errorMessage}`,
          );
        }
      }

      return {
        message:
          'Registro exitoso. ¡Bienvenido a Huellitas Pet!',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: name,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error durante el registro: ${message}`);
    }
  }

  async signIn(signInDto: SignInDto, res: Response): Promise<any> {
    try {
      console.log('🔐 Intento de login para:', signInDto.email);
      console.log('🔑 Contraseña recibida:', signInDto.password);
      
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email: signInDto.email,
          password: signInDto.password,
        });

      if (error) {
        console.error('❌ Error de Supabase en signIn:', error.message);
        console.error('❌ Código de error:', error.status);
        throw new UnauthorizedException('Invalid login credentials');
      }

      if (!data.session) {
        console.error('❌ No hay sesión devuelta por Supabase');
        throw new UnauthorizedException('No se devolvieron datos de sesión');
      }
      
      console.log('✅ Login exitoso en Supabase para:', signInDto.email);

      // ✅ Enviar email de bienvenida sin bloquear el login
      this.mailerService
        .sendWelcomeEmail(signInDto.email)
        .catch((e) => {
          console.warn(
            `⚠️  Fallo el envío de correo a ${signInDto.email}. Causa: ${e.message}`,
          );
        });

      const email = data.user.email;
      if (!email) {
        throw new UnauthorizedException('El email no está disponible.');
      }

      let user;
      let userType;

      // Intentar obtener el usuario de la tabla de usuarios comunes
      try {
        user = await this.usersService.getUserByEmail(email);
        userType = 'regular';
      } catch {
        // Si no está en usuarios, buscar en veterinarios
        try {
          user = await this.veterinariansService.getVeterinarianByEmail(email);
          userType = 'veterinarian';
        } catch {
          throw new NotFoundException(
            'Usuario no encontrado en ninguna tabla.',
          );
        }
      }

      res.cookie('access_token', data.session.access_token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 24 * 3600 * 1000, // 24 horas
        domain: 'localhost',
      });

      let responsePayload: any;

      if (userType === 'veterinarian') {
        // Para veterinarios: devolver solo campos que existen en la entidad
        responsePayload = {
          id: user.supabaseUserId || user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: '',
          role: 'veterinarian',
          user: user.email, // Usar email como fallback
          country: '',
          city: '',
          isDeleted: false,
          deletedAt: null,
          pets: [],
          // Agregar flag para que el frontend sepa que debe cambiar contraseña
          requirePasswordChange: user.requirePasswordChange || false,
        };
      } else {
        // Para usuarios regulares: usar todos los campos normalmente
        responsePayload = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          address: user.address || null,
          role: user.role || userType,
          user: user.user,
          country: user.country,
          city: user.city,
          isDeleted: user.isDeleted,
          deletedAt: user.deletedAt,
          pets: user.pets || [],
        };
      }

      // Agregar campos específicos para veterinarios si aplica
      if (userType === 'veterinarian') {
        responsePayload.matricula = user.matricula;
        responsePayload.description = user.description;
        responsePayload.time = user.time;
        responsePayload.isActive = user.isActive;
      }

      return {
        ...responsePayload,
        token: data.session.access_token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error en el proceso de inicio de sesión',
      );
    }
  }

  async signOut(res: Response): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabaseService.getClient().auth.signOut();

      if (error) {
        console.error('Error cerrando sesion desde supabase:', error);
      }

      const cookieOptions = {
        httpOnly: true,
        secure: false, // ✅ false en desarrollo
        sameSite: 'lax' as const,
        path: '/',
        domain: 'localhost', // ✅ Especificar dominio
        expires: new Date(0),
      };

      res.clearCookie('access_token', cookieOptions);

      return {
        success: true,
        message: 'Sesion cerrada correctamente.',
      };
    } catch (error) {
      console.error('Error durante el cierre de sesion:', error);
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error('Fallo al cerrar sesion: ' + message);
    }
  }

  async verifyToken(token: string): Promise<any> {
    if (!token) {
      throw new UnauthorizedException('No se entro el token');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .auth.getUser(token);

    if (error) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    return data.user;
  }

  async getGoogleAuthURL(): Promise<{ url: string }> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${process.env.FRONTEND_URL}/auth-callback`,
          },
        });

      if (error) throw new Error(error.message);

      if (!data || !data.url) {
        throw new Error('No se pudo generar la URL de autenticación');
      }

      return { url: data.url };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new InternalServerErrorException(
        `Error al generar URL de autenticación de Google: ${message}`,
      );
    }
  }

  // Nuevo método para manejar el callback con el código o hash de la URL
  async handleAuthCallback(urlFragment: string, res: Response): Promise<any> {
    try {
      // Verificar si es un código o un hash de sesión
      let session;

      if (urlFragment.startsWith('#')) {
        // Es un hash de sesión (formato antiguo)
        const hashParams = new URLSearchParams(urlFragment.substring(1));
        const accessToken = hashParams.get('access_token');

        if (!accessToken) {
          throw new UnauthorizedException(
            'No se encontró el token de acceso en la URL',
          );
        }

        // Procesar la sesión directamente con el token
        return this.processUserSession(accessToken, res);
      } else {
        // Intentar procesar como un código de autorización
        const { data, error } = await this.supabaseService
          .getClient()
          .auth.exchangeCodeForSession(urlFragment);

        if (error) {
          throw new UnauthorizedException(error.message);
        }

        if (!data || !data.session) {
          throw new UnauthorizedException('No se pudo obtener la sesión');
        }

        const accessToken = data.session.access_token;
        return this.processUserSession(accessToken, res);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new InternalServerErrorException(
        `Error al procesar el callback de autenticación: ${message}`,
      );
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    return await this.usersService.getUserById(userId);
  }

  private async processUserSession(
    accessToken: string,
    res: Response,
  ): Promise<any> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.getUser(accessToken);

      if (error) throw new UnauthorizedException(error.message);

      if (!data.user) {
        throw new UnauthorizedException(
          'No se pudo obtener información del usuario',
        );
      }

      let user;

      // Intentar obtener el usuario de la base de datos SQL
      try {
        user = await this.usersService.getUserById(data.user.id);
      } catch (userError) {
        // Si el usuario no existe en la base de datos SQL, crearlo
        if (userError instanceof NotFoundException) {
          // Obtener datos adicionales del perfil del usuario de Google desde Supabase
          const userMetadata = data.user.user_metadata || {};

          // Verificar que el email existe
          if (!data.user.email) {
            throw new UnauthorizedException(
              'El usuario no tiene un correo electrónico válido',
            );
          }

          const emailPrefix = data.user.email.split('@')[0];

          // Crear el usuario en la base de datos SQL con valores compatibles con el DTO
          user = await this.usersService.createUser({
            id: data.user.id,
            email: data.user.email,
            name: userMetadata.full_name || userMetadata.name || emailPrefix,
            user: userMetadata.name || emailPrefix,
            // Para los campos opcionales, usamos undefined en lugar de null
            phone: undefined,
            country: undefined,
            address: undefined,
            city: undefined,
            role: Role.User,
          });
        } else {
          throw userError; // Re-lanzar otros tipos de errores
        }
      }

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: false, // ✅ false en desarrollo para que funcione en localhost
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 3600 * 1000, // 1 hora
        domain: 'localhost', // ✅ Especificar dominio para localhost
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        address: user.address || null,
        role: user.role,
        uid: user,
        user: user.user,
        country: user.country || null,
        city: user.city || null,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
        pets: user.pets,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new InternalServerErrorException(
        `Error al procesar la sesión: ${message}`,
      );
    }
  }

  // Mantener el método handleSession para compatibilidad, pero ahora delegará al processUserSession
  async handleSession(accessToken: string, res: Response): Promise<any> {
    return this.processUserSession(accessToken, res);
  }

  requestPasswordReset() {
    return 'Request password reset (send email)';
  }

  resetPassword() {
    return 'Change to new password';
  }

  updatePassword() {
    return 'Update new password';
  }
}
