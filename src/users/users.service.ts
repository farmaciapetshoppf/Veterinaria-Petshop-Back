import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Users } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from 'src/auth/enum/roles.enum';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.usersRepository.updateUser(id, updateUserDto);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error updating user',
      );
    }
  }

  async updateUserProfileImage(
    id: string,
    file: Express.Multer.File,
  ): Promise<Users> {
    return this.usersRepository.updateUserProfileImage(id, file);
  }

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
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'An error occurred',
      );
    }
  }

  async getUserPets(id: string) {
    const user = await this.usersRepository.getUserById(id);
    if (!user) {
      throw new NotFoundException('No existe el usuario');
    }
    return user.pets;
  }
}
