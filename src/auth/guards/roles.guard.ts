/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { Role } from '../enum/roles.enum';
import { UsersService } from '../../users/users.service';
import { VeterinariansService } from '../../veterinarians/veterinarians.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
    private veterinariansService: VeterinariansService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    try {
      const dbUser = await this.usersService.getUserById(user.id);
      if (dbUser && requiredRoles.some((role) => dbUser.role === role)) {
        return true;
      }
    } catch (error) {
      console.log(
        'Usuario no encontrado en tabla de usuarios regulares, verificando veterinarios...',
      );
    }

    try {
      const veterinarian =
        await this.veterinariansService.fillByIdVeterinarians(user.id);
      if (veterinarian && requiredRoles.includes(Role.Veterinarian)) {
        return true;
      }
    } catch (error) {
      console.log('Usuario no encontrado en tabla de veterinarios');
    }

    throw new ForbiddenException(
      'No tienes permiso para acceder a este recurso',
    );
  }
}
