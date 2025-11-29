import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Role } from 'src/auth/enum/roles.enum';
import { generateShortUuid } from 'src/utils/uuid.utils';
import { v4 as uuidv4 } from 'uuid';
// import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private supabaseService: SupabaseService,
  ) {}

  async getUsers(): Promise<Users[]> {
    return this.usersRepository.find({ where: { isDeleted: false } });
  }

  async getUserById(id: string): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  createUser(createUserDto: CreateUserDto): Promise<Users> {
    const newUser = this.usersRepository.create({
      ...createUserDto,
      uid: generateShortUuid(12),
    });
    return this.usersRepository.save(newUser);
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

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .auth.admin.deleteUser(id);

      if (error) {
        throw new Error(`Error al eliminar usuario: ${error.message}`);
      }

      return { message: 'Usuario borrado correctamente' };
    } catch (error) {
      console.error('Error en deleteUser:', error);
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }
}
