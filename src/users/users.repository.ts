/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Role } from 'src/auth/enum/roles.enum';
import { generateShortUuid } from 'src/utils/uuid.utils';
import { UpdateUserDto } from './dto/update-user.dto';
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

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    const { name, phone, country, address, city } = updateUserDto;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (country !== undefined) user.country = country;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;

    const supabasePayload: any = {};
    if (phone !== undefined) supabasePayload.phone = phone;
    if (name !== undefined) {
      supabasePayload.user_metadata = {
        ...(user as any).user_metadata,
        name,
      };
    }

    if (Object.keys(supabasePayload).length > 0) {
      const client = this.supabaseService.getClient();
      let result: any;
      let error: any;

      if (client.auth?.admin?.updateUserById) {
        result = await client.auth.admin.updateUserById(id, supabasePayload);
      } else {
        result = await (client.auth.admin as any).updateUser(
          id,
          supabasePayload,
        );
      }

      ({ error } = result);
      if (error) {
        throw new Error(
          `Error updating Supabase user: ${error.message ?? error}`,
        );
      }
    }

    return this.usersRepository.save(user);
  }

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
      const userToDelete = await this.usersRepository.findOne({
        where: { id },
      });

      if (!userToDelete) {
        const { error } = await this.supabaseService
          .getClient()
          .auth.admin.deleteUser(id);

        if (error && error.message.includes('User not found')) {
          return { message: `El usuario con id: '${id}' no existe` };
        }
      } else {
        await this.usersRepository.delete(id);
      }

      const { error } = await this.supabaseService
        .getClient()
        .auth.admin.deleteUser(id);

      if (error) {
        if (error.message.includes('User not found')) {
          return {
            message:
              'Usuario borrado correctamente de la base de datos SQL, pero no se encontró en Supabase',
          };
        }
        throw new Error(
          `Error al eliminar usuario de Supabase: ${error.message}`,
        );
      }

      return { message: 'Usuario borrado correctamente' };
    } catch (error) {
      console.error('Error en deleteUser:', error);

      if (
        error instanceof Error &&
        error.message &&
        error.message.includes('User not found')
      ) {
        return { message: `El usuario con id: '${id}' no existe` };
      }
      throw new Error(
        `Error al eliminar usuario: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
