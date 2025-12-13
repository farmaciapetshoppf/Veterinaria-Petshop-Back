// password-change.guard.ts
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

    // Si no hay usuario o es admin, permitir acceso
    if (!user || user.role === Role.Admin) {
      return true;
    }

    // Solo verificar requirePasswordChange para veterinarios
    if (
      user.role === Role.Veterinarian &&
      user.requirePasswordChange === true
    ) {
      const allowedPaths = [
        '/veterinarians/change-password',
        '/auth/signout',
        '/auth/signin',
      ];

      const currentUrl = request.originalUrl;
      console.log('Current path:', currentUrl);

      if (!allowedPaths.some((path) => currentUrl.includes(path))) {
        throw new UnauthorizedException(
          'Debe cambiar su contraseña temporal antes de continuar',
        );
      }
    }

    return true;
  }
}
