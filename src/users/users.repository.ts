import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Role } from 'src/auth/enum/roles.enum';
// import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private supabaseService: SupabaseService,
  ) {}

  async getUsers(): Promise<Users[]> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.pets', 'pet')
      .leftJoinAndSelect('pet.mother', 'mother')
      .leftJoinAndSelect('mother.owner', 'motherOwner')
      .leftJoinAndSelect('pet.father', 'father')
      .leftJoinAndSelect('father.owner', 'fatherOwner')
      .leftJoinAndSelect('pet.appointments', 'appointment')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .leftJoinAndSelect('user.buyerSaleOrders', 'orders')
      .leftJoinAndSelect('orders.items', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'orderItemProduct')
      .getMany();

    // Remove sensitive fields from nested veterinarians
    users.forEach((u) => {
      if (u.pets) {
        u.pets.forEach((p) => {
          if (p.appointments) {
            p.appointments.forEach((a) => {
              if (a.veterinarian && (a.veterinarian as any).password) {
                delete (a.veterinarian as any).password;
              }
            });
          }
        });
      }
      // Opcional: ordenar órdenes por fecha descendente si están presentes
      if ((u as any).buyerSaleOrders) {
        (u as any).buyerSaleOrders = (u as any).buyerSaleOrders.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
    });

    return users;
  }

  async getUserById(id: string): Promise<Users> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.pets', 'pet')
      .leftJoinAndSelect('pet.mother', 'mother')
      .leftJoinAndSelect('mother.owner', 'motherOwner')
      .leftJoinAndSelect('pet.father', 'father')
      .leftJoinAndSelect('father.owner', 'fatherOwner')
      .leftJoinAndSelect('pet.appointments', 'appointment')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .leftJoinAndSelect('user.buyerSaleOrders', 'orders')
      .leftJoinAndSelect('orders.items', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'orderItemProduct')
      .where('user.id = :id', { id })
      .getOne();

    // Strip password from nested veterinarians
    if (user && user.pets) {
      user.pets.forEach((p) => {
        if (p.appointments) {
          p.appointments.forEach((a) => {
            if (a.veterinarian && (a.veterinarian as any).password) {
              delete (a.veterinarian as any).password;
            }
          });
        }
      });
    }
    // Ordenar órdenes del comprador por fecha descendente si están presentes
    if (user && (user as any).buyerSaleOrders) {
      (user as any).buyerSaleOrders = (user as any).buyerSaleOrders.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Error al eliminar usuario: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}