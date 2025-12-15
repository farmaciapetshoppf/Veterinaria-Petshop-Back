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

  async getCount(): Promise<number> {
    return await this.veterinarianRepository.count();
  }

  async seed() {
    // Cargar veterinarios del JSON
    const veterinariansJson = require('./veterinarian.json');
    
    // Verificar cuáles ya existen
    const existingEmails = (await this.veterinarianRepository.find()).map(v => v.email);
    const veterinariansToCreate = veterinariansJson.filter(
      (vet: any) => !existingEmails.includes(vet.email)
    );
    
    if (veterinariansToCreate.length === 0) {
      console.log('🩺 Todos los veterinarios ya están cargados');
      return;
    }

    console.log(`👨‍⚕️ Creando ${veterinariansToCreate.length} veterinarios nuevos...`);
    
    const defaultProfileImage = 'https://hxjxhchzberrthphpsvo.supabase.co/storage/v1/object/public/veterinarians/1765297533360_pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg';
    
    const veterinarians = veterinariansToCreate.map((vet: any) => ({
      name: vet.name,
      email: vet.email,
      matricula: vet.matricula,
      description: vet.description,
      phone: vet.phone,
      horario_atencion: new Date(vet.horario_atencion),
      profileImageUrl: defaultProfileImage,
    }));

    // Generar contraseña temporal aleatoria con requisitos garantizados
    const generateTempPassword = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const special = '!@#$%&*';
      const allChars = uppercase + lowercase + numbers + special;
      
      // Array con caracteres garantizados: 2 de cada tipo + 2 aleatorios
      const guaranteedChars = [
        uppercase[Math.floor(Math.random() * uppercase.length)],
        uppercase[Math.floor(Math.random() * uppercase.length)],
        lowercase[Math.floor(Math.random() * lowercase.length)],
        lowercase[Math.floor(Math.random() * lowercase.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        special[Math.floor(Math.random() * special.length)],
        special[Math.floor(Math.random() * special.length)],
        allChars[Math.floor(Math.random() * allChars.length)],
        allChars[Math.floor(Math.random() * allChars.length)],
      ];
      
      // Fisher-Yates shuffle
      for (let i = guaranteedChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [guaranteedChars[i], guaranteedChars[j]] = [guaranteedChars[j], guaranteedChars[i]];
      }
      
      return guaranteedChars.join('') + '!!';
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
