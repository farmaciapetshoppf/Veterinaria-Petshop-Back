import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UsersService } from '../users.service';
import { Role } from 'src/auth/enum/roles.enum';
import { Pet, PetEspecies, PetSexo, PetTamano, PetEsterilizado, PetStatus } from 'src/pets/entities/pet.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import * as fs from 'fs';
import * as path from 'path';

interface AppointmentSeed {
  date: string;
  time: string;
  reason: string;
}

interface PetSeed {
  name: string;
  species: string;
  breed: string;
  birthdate: string;
  weight: number;
  appointments: AppointmentSeed[];
}

interface UserSeed {
  name: string;
  email: string;
  user: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  role: 'admin' | 'user';
  pets?: PetSeed[];
}

@Injectable()
export class UsersSeeder implements OnModuleInit {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Appointments)
    private readonly appointmentRepository: Repository<Appointments>,
  ) {}

  async onModuleInit() {
    // Verificar si ya hay usuarios en la base de datos
    const existingUsers = await this.usersService.getUsers();
    if (existingUsers && existingUsers.length > 0) {
      console.log('⏭️  Usuarios ya cargados, saltando seeder');
      return;
    }

    const filePath = path.join(
      process.cwd(),
      'src',
      'users',
      'seed',
      'users.json',
    );
    const file = fs.readFileSync(filePath, 'utf8');
    const users: UserSeed[] = JSON.parse(file);

    console.log('🌱 Iniciando seeder de usuarios...');

    for (const userData of users) {
      try {
        // Crear usuario en Supabase Auth con email y contraseña
        const { data: authData, error: authError } = await this.supabaseService
          .getClient()
          .auth.admin.createUser({
            email: userData.email,
            password: 'Pargento123', // Contraseña por defecto para el seeder
            email_confirm: true, // Auto-confirmar el email
          });

        if (authError) {
          console.error(`❌ Error creando usuario en Supabase Auth: ${userData.email}`, authError.message);
          continue;
        }

        if (!authData.user) {
          console.error(`❌ No se pudo crear el usuario en Supabase: ${userData.email}`);
          continue;
        }

        // Crear usuario en la base de datos SQL
        const newUser = await this.usersService.createUser({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          user: userData.user,
          phone: userData.phone,
          country: userData.country,
          address: userData.address,
          city: userData.city,
          role: userData.role === 'admin' ? Role.Admin : Role.User,
        });

        console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);

        // Crear mascotas si las tiene
        if (userData.pets && userData.pets.length > 0) {
          for (const petData of userData.pets) {
            try {
              // Mapear especie a enum
              const especieMap: { [key: string]: PetEspecies } = {
                'Perro': PetEspecies.PERRO,
                'Gato': PetEspecies.GATO,
                'Ave': PetEspecies.AVE,
                'Conejo': PetEspecies.ROEDOR,
              };

              const newPet = this.petRepository.create({
                nombre: petData.name,
                especie: especieMap[petData.species] || PetEspecies.OTRO,
                breed: petData.breed,
                fecha_nacimiento: petData.birthdate,
                sexo: PetSexo.MACHO, // Por defecto
                tamano: petData.weight > 20 ? PetTamano.GRANDE : petData.weight > 10 ? PetTamano.MEDIANO : PetTamano.PEQUENO,
                esterilizado: PetEsterilizado.NO,
                status: PetStatus.VIVO,
                owner: newUser,
              });

              const savedPet = await this.petRepository.save(newPet);
              console.log(`  🐾 Mascota creada: ${petData.name} (${petData.species})`);

              // Crear turnos si los tiene
              if (petData.appointments && petData.appointments.length > 0) {
                for (const appointmentData of petData.appointments) {
                  const newAppointment = this.appointmentRepository.create({
                    user: newUser,
                    pet: savedPet,
                    date: new Date(appointmentData.date),
                    time: new Date(`2000-01-01T${appointmentData.time}:00`),
                    status: true,
                  });

                  await this.appointmentRepository.save(newAppointment);
                  console.log(`    📅 Turno creado: ${appointmentData.date} ${appointmentData.time}`);
                }
              }
            } catch (petError) {
              const errorMsg = petError instanceof Error ? petError.message : 'Error desconocido';
              console.error(`  ❌ Error creando mascota ${petData.name}:`, errorMsg);
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Error procesando usuario ${userData.email}:`, errorMessage);
      }
    }

    console.log('🎉 Seeder de usuarios completado');
  }
}
