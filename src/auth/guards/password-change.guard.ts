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
      const allowedPaths = [
        '/veterinarians/change-password',
        '/auth/signout',
        '/auth/signin',
      ];

      // Permitir solo rutas específicas
      const currentPath = request.route.path;
      console.log('Current path:', request.route.path);
      // Usar request.originalUrl en lugar de request.route.path
      const currentUrl = request.originalUrl;
      if (!allowedPaths.some((path) => currentUrl.includes(path))) {
        throw new UnauthorizedException(
          'Debe cambiar su contraseña temporal antes de continuar',
        );
      }
    }

    return true;
  }
}
