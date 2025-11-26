import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludePasswordInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        // Si es un arreglo (lista de usuarios)
        if (Array.isArray(data)) {
          return data.map((item) => this.removePassword(item));
        }

        // Si es un objeto individual
        return this.removePassword(data);
      }),
    );
  }

  private removePassword(obj: any) {
    if (obj && typeof obj === 'object' && 'password' in obj) {
      const { password, ...rest } = obj;
      return rest;
    }
    return obj;
  }
}
