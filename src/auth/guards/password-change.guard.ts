// src/auth/guards/password-change.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from '../enum/roles.enum';

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role === Role.Admin) {
      return true;
    }

    if (
      user.role === Role.Veterinarian &&
      user.requirePasswordChange === true
    ) {
      const allowedPaths = ['/veterinarians/change-password', '/auth/signout'];

      // Permitir solo rutas específicas
      const currentPath = request.route.path;
      if (!allowedPaths.some((path) => currentPath.includes(path))) {
        throw new UnauthorizedException(
          'Debe cambiar su contraseña temporal antes de continuar',
        );
      }
    }

    return true;
  }
}
