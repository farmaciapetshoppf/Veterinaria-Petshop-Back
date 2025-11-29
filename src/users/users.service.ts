import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Users } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from 'src/auth/enum/roles.enum';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getUsers(): Promise<Users[]> {
    return this.usersRepository.getUsers();
  }

  getUserById(id: string): Promise<Users> {
    return this.usersRepository.getUserById(id);
  }

  createUser(createUserDto: CreateUserDto): Promise<Users> {
    return this.usersRepository.createUser(createUserDto);
  }

  // updateUser(id: string) {
  //   return this.usersRepository.updateUser();
  // }

  updateRole(id: string, role: Role) {
    return this.usersRepository.updateRole(id, role);
  }

  deleteUser(id: string) {
    try {
      return this.usersRepository.deleteUser(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }
  }
}
