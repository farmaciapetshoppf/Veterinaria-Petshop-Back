import { Controller, Get, Param, Delete, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(200)
  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @HttpCode(200)
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  // @HttpCode(200)
  // @Put(':id')
  // updateUser(@Param('id') id: string) {
  //   return this.usersService.updateUser(id);
  // }

  @HttpCode(200)
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
