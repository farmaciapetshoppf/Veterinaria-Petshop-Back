import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UsersService } from '../users.service';
import { Role } from 'src/auth/enum/roles.enum';
import { Pet, PetEspecies, PetSexo, PetTamano, PetEsterilizado, PetStatus } from 'src/pets/entities/pet.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { VeterinariansSeeder } from 'src/veterinarians/seed/veterinarians.seed';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class UsersSeeder implements OnModuleInit {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly veterinariansSeeder: VeterinariansSeeder,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Appointments)
    private readonly appointmentRepository: Repository<Appointments>,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
  ) {}

  async onModuleInit() {
    // Primero cargar veterinarios
    await this.veterinariansSeeder.seed();

    // Verificar si ya hay usuarios en la base de datos
    const existingUsers = await this.usersService.getUsers();
    if (existingUsers && existingUsers.length > 0) {
      console.log('⏭️  Usuarios ya cargados, saltando seeder');
      return;
    }

    console.log('🌱 Iniciando seeder de usuarios...');

    // Obtener veterinarios para asignar turnos
    const veterinarians = await this.veterinarianRepository.find();
    
    if (veterinarians.length === 0) {
      console.error('❌ No hay veterinarios disponibles para asignar turnos');
      return;
    }

    const abiVet = veterinarians.find(v => v.email === 'abiiibreazuuu@gmail.com');
    const adrianVet = veterinarians.find(v => v.email === 'adrianmespindola@gmail.com');

    // Datos de usuarios hardcodeados
    const usersData = [
      // Administradores
      {
        name: 'Emanuel Moya',
        email: 'emanuelmoya11@gmail.com',
        user: 'emanuelmoya',
        phone: '11-1111-1111',
        country: 'Argentina',
        address: 'Av. Corrientes 1234',
        city: 'Buenos Aires',
        role: Role.Admin,
        password: 'Admin123!',
      },
      {
        name: 'Matías Fernández',
        email: 'matifb22@gmail.com',
        user: 'matifb22',
        phone: '11-2222-2222',
        country: 'Argentina',
        address: 'Av. Santa Fe 5678',
        city: 'Buenos Aires',
        role: Role.Admin,
        password: 'Admin123!',
      },
      // Clientes con mascotas
      {
        name: 'Ani Calvo',
        email: 'ani.calvo.97@gmail.com',
        user: 'anicalvo',
        phone: '11-3333-3333',
        country: 'Argentina',
        address: 'Calle Florida 910',
        city: 'Buenos Aires',
        role: Role.User,
        password: 'User123!',
        pets: [
          {
            nombre: 'Max',
            especie: PetEspecies.PERRO,
            breed: 'Labrador',
            fecha_nacimiento: '2020-05-15',
            sexo: PetSexo.MACHO,
            tamano: PetTamano.GRANDE,
          },
          {
            nombre: 'Luna',
            especie: PetEspecies.GATO,
            breed: 'Siamés',
            fecha_nacimiento: '2021-03-20',
            sexo: PetSexo.HEMBRA,
            tamano: PetTamano.PEQUENO,
          },
        ],
      },
      {
        name: 'Tomás Covas',
        email: 'tomascovas496@gmail.com',
        user: 'tomascovas',
        phone: '11-4444-4444',
        country: 'Argentina',
        address: 'Av. Rivadavia 2345',
        city: 'Buenos Aires',
        role: Role.User,
        password: 'User123!',
        pets: [
          {
            nombre: 'Rocky',
            especie: PetEspecies.PERRO,
            breed: 'Bulldog',
            fecha_nacimiento: '2019-08-10',
            sexo: PetSexo.MACHO,
            tamano: PetTamano.MEDIANO,
          },
        ],
      },
    ];

    for (const userData of usersData) {
      try {
        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await this.supabaseService
          .getClient()
          .auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
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
          role: userData.role,
        });

        console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);

        // Enviar reporte diario a administradores
        if (userData.role === Role.Admin) {
          try {
            // Obtener turnos del día
            const today = new Date();
            const appointments = await this.appointmentRepository.find({
              where: { date: today },
              relations: ['pet', 'user', 'veterinarian'],
            });

            // Obtener productos con stock bajo (menos de 10 unidades)
            const { data: products, error: productsError } = await this.supabaseService
              .getClient()
              .from('products')
              .select('*')
              .lt('stock', 10);

            // Obtener veterinarios recientes (últimos 7 días)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentVets = await this.veterinarianRepository
              .createQueryBuilder('vet')
              .where('vet.time >= :date', { date: sevenDaysAgo })
              .getMany();

            await this.mailerService.sendAdminDailyReport({
              to: userData.email,
              adminName: userData.name,
              date: today.toLocaleDateString('es-AR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              totalAppointments: appointments.length,
              lowStockProducts: products?.length || 0,
              newVeterinarians: recentVets.length,
              appointments: appointments.map(apt => ({
                petName: apt.pet?.nombre || 'Sin mascota',
                ownerName: apt.user?.name || 'Sin dueño',
                veterinarianName: apt.veterinarian?.name || 'Sin veterinario',
                time: apt.time.toString().substring(0, 5),
                reason: 'Consulta general',
                status: apt.status ? 'Confirmado' : 'Pendiente',
              })),
              products: products?.map(p => ({
                name: p.name,
                stock: p.stock,
                critical: p.stock < 5,
              })) || [],
              veterinarians: recentVets.map(vet => ({
                name: vet.name,
                email: vet.email,
                phone: vet.phone,
                matricula: vet.matricula,
              })),
            });
            console.log(`    📊 Reporte diario enviado a ${userData.email}`);
          } catch (emailError) {
            console.error(`    ❌ Error enviando reporte diario:`, emailError);
          }
        }

        // Crear mascotas y turnos para usuarios normales
        if (userData.pets && userData.pets.length > 0) {
          for (const petData of userData.pets) {
            try {
              const newPet = this.petRepository.create({
                ...petData,
                esterilizado: PetEsterilizado.NO,
                status: PetStatus.VIVO,
                owner: newUser,
              });

              const savedPet = await this.petRepository.save(newPet);
              console.log(`  🐾 Mascota creada: ${petData.nombre} (${petData.especie})`);

              // Crear turnos para cada mascota
              const appointmentDate = new Date();
              appointmentDate.setDate(appointmentDate.getDate() + 7); // Turno en 7 días

              const veterinarian = abiVet || veterinarians[0];

              const newAppointment = this.appointmentRepository.create({
                user: newUser,
                pet: savedPet,
                veterinarian: veterinarian,
                date: appointmentDate,
                time: new Date(`2000-01-01T14:30:00`),
                status: true,
              });

              await this.appointmentRepository.save(newAppointment);
              console.log(`    📅 Turno creado para ${petData.nombre} con ${veterinarian.name}`);

              // Enviar email de confirmación de turno
              try {
                await this.mailerService.sendAppointmentConfirmation({
                  to: userData.email,
                  userName: userData.name,
                  appointmentDate: appointmentDate.toLocaleDateString('es-AR'),
                  appointmentTime: '14:30',
                  petName: petData.nombre,
                  veterinarianName: veterinarian.name,
                  reason: 'Consulta general',
                });
                console.log(`    ✉️  Email de confirmación enviado a ${userData.email}`);
              } catch (emailError) {
                console.error(`    ❌ Error enviando email:`, emailError);
              }
            } catch (petError) {
              const errorMsg = petError instanceof Error ? petError.message : 'Error desconocido';
              console.error(`  ❌ Error creando mascota ${petData.nombre}:`, errorMsg);
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
