import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getUsers() {
    return `This action returns all users`;
  }

  getUserById(id: number) {
    return `This action returns a #${id} user`;
  }

  createUser() {
    return 'This action adds a new user';
  }

  updateUser(id: number) {
    return `This action updates a #${id} user`;
  }

  deleteUser(id: number) {
    return `This action removes a #${id} user`;
  }
}
