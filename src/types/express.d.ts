import { User } from '../users/entities/user.entity'; // Ajusta la ruta según tu estructura

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
