import { Injectable } from '@nestjs/common';
import { Users } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';

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

  deleteUser(id: string) {
    return this.usersRepository.deleteUser(id);
  }
}
