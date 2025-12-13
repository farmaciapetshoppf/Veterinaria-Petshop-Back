import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Veterinarian } from '../entities/veterinarian.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { Role } from 'src/auth/enum/roles.enum';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class VeterinariansSeeder {
  constructor(
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
    private readonly mailerService: MailerService,
  ) {}

  async seed() {
    const count = await this.veterinarianRepository.count();
    
    if (count > 0) {
      console.log('🩺 Veterinarios ya cargados, saltando seeder');
      return;
    }

    const veterinarians = [
      {
        name: 'Abigail Brea',
        email: 'abiiibreazuuu@gmail.com',
        matricula: 'VET-2018-001',
        description: 'Especialista en cirugía veterinaria con más de 10 años de experiencia. Me apasiona cuidar de tus mascotas y brindarles la mejor atención médica.',
        phone: '11-2345-6789',
        horario_atencion: new Date('2025-12-11T09:00:00'),
        profileImageUrl: 'https://hxjxhchzberrthphpsvo.supabase.co/storage/v1/object/public/veterinarians/1765297533360_pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg',
      },
      {
        name: 'Adrián Espíndola',
        email: 'adrianmespindola@gmail.com',
        matricula: 'VET-2019-002',
        description: 'Veterinario especializado en animales exóticos y felinos. Dedico mi carrera a mejorar la calidad de vida de nuestros amigos peludos.',
        phone: '11-3456-7890',
        horario_atencion: new Date('2025-12-11T14:00:00'),
        profileImageUrl: 'https://hxjxhchzberrthphpsvo.supabase.co/storage/v1/object/public/veterinarians/1765297533360_pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg',
      },
    ];

    // Generar contraseña temporal aleatoria
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    for (const vetData of veterinarians) {
      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const veterinarian = this.veterinarianRepository.create({
        id: uuid(),
        ...vetData,
        password: hashedPassword,
        role: Role.Veterinarian,
        isActive: true,
        time: new Date(),
      });

      await this.veterinarianRepository.save(veterinarian);

      // Enviar email con contraseña temporal
      try {
        await this.mailerService.sendWelcomeEmail({
          to: vetData.email,
          userName: vetData.name,
          temporaryPassword: tempPassword,
        });
        console.log(`✅ Email de bienvenida enviado a ${vetData.email}`);
      } catch (error) {
        console.error(`❌ Error enviando email a ${vetData.email}:`, error);
      }
    }

    console.log('🩺✨ Veterinarios cargados exitosamente');
  }
}
