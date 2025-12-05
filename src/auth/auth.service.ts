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

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
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

        try {
            const subject = '👋 ¡Bienvenido a Huellitas Pet 🐾!';
            const htmlContent = `
                <h1>Hola, ${name}!</h1>
                <p>¡Gracias por registrarte! Estamos listos para ayudarte con tus mascotas.</p>
                <p>Tu cuenta ya está activa.</p>
            `;
            await this.mailerService.sendMail(email, subject, htmlContent);
            console.log(`Correo de bienvenida enviado a ${email}`);
        } catch (mailError) {

          const errorMessage = mailError instanceof Error ? mailError.message : 'Error desconocido al enviar el correo.';
         
            console.warn(`[Mailer Warning]: Fallo el envío de correo a ${email}. Causa: ${errorMessage}`);
        }
      }

      return {
        message:
          'Registro de usuario iniciado. Revise su email para verificar.',
          user: newUser,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
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
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
          maxAge: 3600 * 1000,
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        expires: new Date(0),
      };

      res.clearCookie('access_token', cookieOptions);

      return {
        success: true,
        message: 'Sesion cerrada correctamente.',
      };
    } catch (error) {
      console.error('Error durante el cierre de sesion:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
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
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new InternalServerErrorException(
        `Error al generar URL de autenticación de Google: ${message}`,
      );
    }
  }

  async handleSession(accessToken: string, res: Response): Promise<any> {
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
      try {
        user = await this.usersService.getUserById(data.user.id);
      } catch (userError) {
        const userName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          (data.user.email ? data.user.email.split('@')[0] : 'user');

        const userUsername =
          data.user.user_metadata?.name ||
          (data.user.email ? data.user.email.split('@')[0] : 'user');

        user = await this.usersService.createUser({
          id: data.user.id,
          email: data.user.email || 'no-email@example.com',
          name: userName,
          user: userUsername,
          role: Role.User,
        });
      }

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 3600 * 1000,
      });

      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new InternalServerErrorException(
        `Error al procesar la sesión: ${message}`,
      );
    }
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