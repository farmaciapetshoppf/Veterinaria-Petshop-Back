// auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { VeterinariansService } from '../../veterinarians/veterinarians.service';
import { Role } from '../enum/roles.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private veterinariansService: VeterinariansService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Intentar obtener el token de múltiples fuentes
    let token: string | undefined;
    
    // 1. Buscar en cookies
    token = request.cookies?.['access_token'];
    
    // 2. Si no está en cookies, buscar en header Authorization (Bearer token)
    if (!token) {
      const authHeader = request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remover "Bearer "
      }
    }
    
    // 3. Si no está en Bearer, buscar en header access_token directo
    if (!token) {
      token = request.headers['access_token'] as string;
    }

    if (!token) {
      throw new UnauthorizedException('No tiene token de autorización. Por favor envíe el token en cookies (access_token), header Authorization (Bearer token) o header access_token.');
    }

    try {
      // Verificar el token con Supabase
      const supabaseUser = await this.authService.verifyToken(token);

      if (!supabaseUser || !supabaseUser.email) {
        throw new UnauthorizedException(
          'Token inválido o usuario no encontrado',
        );
      }

      // Objeto base de usuario para adjuntar al request
      const userObject = {
        ...supabaseUser,
        role: null,
      };

      // Intentar obtener de la tabla de usuarios regulares
      try {
        const dbUser = await this.usersService.getUserByEmail(
          supabaseUser.email,
        );
        if (dbUser) {
          userObject.role = dbUser.role;
          // No agregamos requirePasswordChange para usuarios regulares
        }
      } catch (error) {
        // Si no está en usuarios, verificar en veterinarios
        try {
          const veterinarian =
            await this.veterinariansService.getVeterinarianByEmail(
              supabaseUser.email,
            );
          if (veterinarian) {
            userObject.role = Role.Veterinarian;
            // Solo agregar requirePasswordChange si es veterinario
            userObject['requirePasswordChange'] =
              veterinarian.requirePasswordChange || false;

            // También podemos agregar otros campos específicos de veterinarios si es necesario
            userObject['matricula'] = veterinarian.matricula;
            userObject['isActive'] = veterinarian.isActive;
          }
        } catch (vetError) {
          console.log('Usuario no encontrado en ninguna tabla:', vetError);
        }
      }

      // Si no se encontró el rol, usar un valor predeterminado o lanzar un error
      if (!userObject.role) {
        console.warn(
          `No se pudo determinar el rol para el usuario ${supabaseUser.email}`,
        );
        userObject.role = Role.User; // Valor por defecto, o podrías lanzar un error si prefieres
      }

      // Adjuntar el usuario enriquecido al request
      (request as any).user = userObject;

      return true;
    } catch (error) {
      console.error('Error de autenticación:', error);
      throw new UnauthorizedException('Token expirado o inválido');
    }
  }
}
