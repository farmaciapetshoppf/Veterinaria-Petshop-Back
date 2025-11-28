import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Role } from 'src/auth/enum/roles.enum';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private supabaseService: SupabaseService,
  ) {}

  async getUsers(): Promise<Users[]> {
    return this.usersRepository.find();
  }

  async getUserById(id: string): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  createUser(createUserDto: CreateUserDto): Promise<Users> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  // async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<Users> {
  //   await this.findOne(id);
  //   await this.usersRepository.update(id, updateUserDto);
  //   return this.findOne(id);
  // }

  async updateRole(id: string, role: Role): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    user.role = role;
    return this.usersRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
      const { error } = await this.supabaseService
        .getClient()
        .auth.admin.deleteUser(id);
      if (error && !error.message.includes('User not found')) {
        throw new Error(
          `Error al eliminar usuario de Supabase Auth: ${error.message}`,
        );
      }
      const result = await this.usersRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Error al eliminar usuario de PostgreSQL`);
      }
    } catch (error : any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Error durante la eliminación del usuario: ${error.message}`,
      );
    }
  }
}
