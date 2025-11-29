import { Controller, Get, Param, HttpCode, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
// import { AuthGuard } from 'src/auth/guards/auth.guard';
// import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
// import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(200)
  @ApiOperation({ summary: 'Obtener lista de usuarios' })
  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Obtener usuarios por id' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del usuario',
  })
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  // @HttpCode(200)
  // @Put(':id')
  // updateUser(@Param('id') id: string) {
  //   return this.usersService.updateUser(id);
  // }

  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del usuario',
  })
  @ApiBody({
    description: 'Objeto con el nuevo rol del usuario',
    type: 'object',
    schema: {
      properties: {
        role: {
          type: 'string',
          example: 'veterinarian',
          description: 'Rol a asignar al usuario',
        },
      },
    },
  })
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: { role: Role }) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @HttpCode(200)
  @Patch(':id/delete')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
