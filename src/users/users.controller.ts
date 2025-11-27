import {
  Controller,
  Get,
  Param,
  Delete,
  HttpCode,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
// import { AuthGuard } from 'src/auth/guards/auth.guard';
// import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';
// import { RolesGuard } from 'src/auth/guards/roles.guard';

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

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: { role: Role }) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @HttpCode(200)
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
