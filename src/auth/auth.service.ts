import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    const { data, error: authError } = await this.supabaseService
      .getClient()
      .auth.signUp({
        email: email,
        password,
      });

    if (authError) {
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
      message: 'Registro de usuario iniciado. Revise su email para verificar.',
    };
  }

  async signIn(signInDto: SignInDto, res: Response): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword({
        email: signInDto.email,
        password: signInDto.password,
      });

    if (error) throw new UnauthorizedException(error.message);

    if (!data.session) {
      throw new UnauthorizedException('No se devolvieron datos de sesion');
    }

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
      throw new Error('Fallo al cerrar sesion: ' + error.message);
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
