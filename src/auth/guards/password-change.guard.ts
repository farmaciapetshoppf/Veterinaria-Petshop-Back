import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si el usuario es veterinario y requiere cambio de contraseña
    if (user?.role === 'veterinarian' && user?.requirePasswordChange) {
      // Solo permitir acceso a la ruta de cambio de contraseña
      if (request.route.path !== '/veterinarians/change-password') {
        throw new UnauthorizedException(
          'Debe cambiar su contraseña temporal antes de continuar',
        );
      }
    }

    return true;
  }
}
