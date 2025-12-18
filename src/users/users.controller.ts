import {
  Controller,
  Get,
  Param,
  HttpCode,
  Patch,
  Body,
  UploadedFile,
  UseInterceptors,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from './entities/user.entity';
import { SupabaseService } from 'src/supabase/supabase.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @HttpCode(200)
  @ApiOperation({ summary: 'Get all users' })
  @Get()
  @Public()
  async getUsers() {
    const data = await this.usersService.getUsers();
    return { message: 'Users retrieved', data };
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del usuario',
  })
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
  async getUserById(@Param('id') id: string) {
    const data = await this.usersService.getUserById(id);
    return { message: `User ${id} retrieved`, data };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: String,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Raymond Weiler' },
        phone: { type: 'string', example: '+34123456789' },
        country: { type: 'string', example: 'Luxemburgo' },
        address: {
          type: 'string',
          example: '13 Place De Lhôtel De Ville, L-3590',
        },
        city: { type: 'string', example: 'Dudelange' },
        profileImage: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de perfil del usuario (opcional)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.User)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ): Promise<Users> {
    return this.usersService.updateUserComplete(
      id,
      updateUserDto,
      profileImage,
    );
  }

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
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  updateRole(@Param('id') id: string, @Body() updateRoleDto: { role: Role }) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @ApiOperation({ summary: 'Delete user' })
  @HttpCode(200)
  @Put(':id/delete')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @ApiOperation({ summary: 'Get pets of a user' })
  @Get(':id/pets')
  @ApiBearerAuth()
  getUserPets(@Param('id') id: string) {
    return this.usersService.getUserPets(id);
  }
}
