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

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { name, email, password, user, phone, country, address, city } =
      signUpDto;

    try {
      const { data, error: authError } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email: email,
          password,
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

        return {
          message:
            'Usuario registrado correctamente. Revise su email para verificar.',
          user: newUser,
        };
      }

      return {
        message:
          'Registro de usuario iniciado. Revise su email para verificar.',
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error durante el registro: ${message}`);
    }
  }

  async signIn(signInDto: SignInDto, res: Response): Promise<any> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email: signInDto.email,
          password: signInDto.password,
        });

      if (error) throw new UnauthorizedException(error.message);

      if (!data.session) {
        throw new UnauthorizedException('No se devolvieron datos de sesión');
      }

      try {
        const user = await this.usersService.getUserById(data.user.id);

        res.cookie('access_token', data.session.access_token, {
          httpOnly: true,
          secure: false, //false en desarrollo para que funcione en localhost
          sameSite: 'lax' as const,
          path: '/',
          maxAge: 3600 * 1000, // 1 hora
          domain: 'localhost', // Especificar dominio para localhost
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      } catch (userError) {
        throw new NotFoundException(
          'La cuenta existe pero no tiene un perfil completo. Por favor, contacte al administrador o regístrese nuevamente.',
        );
      }
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

  // Método privado para procesar la sesión del usuario
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

      // Obtener el usuario desde la base de datos SQL
      const user = await this.usersService.getUserById(data.user.id);

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
        country: user.country,
        city: user.city,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
        pets: user.pets,
        // Puedes incluir más campos del usuario si es necesario
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
