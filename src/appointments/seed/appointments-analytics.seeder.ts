import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointments } from '../entities/appointment.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { Users } from 'src/users/entities/user.entity';
import { MedicalRecordsPet } from 'src/medical-records-pet/entities/medical-records-pet.entity';
import { DiagnosisType } from 'src/medical-records-pet/dto/create-medical-records-pet.dto';

@Injectable()
export class AppointmentsAnalyticsSeeder {
  constructor(
    @InjectRepository(Appointments)
    private readonly appointmentsRepo: Repository<Appointments>,
    @InjectRepository(Veterinarian)
    private readonly veterinariansRepo: Repository<Veterinarian>,
    @InjectRepository(Pet)
    private readonly petsRepo: Repository<Pet>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    @InjectRepository(MedicalRecordsPet)
    private readonly medicalRecordsRepo: Repository<MedicalRecordsPet>,
  ) {}

  async seed(force: boolean = false) {
    console.log('🩺 Iniciando seeder de turnos para analytics...');

    // BORRAR turnos y registros médicos existentes
    const existingAppointments = await this.appointmentsRepo.count();
    if (existingAppointments > 0) {
      console.log(`🗑️  Borrando ${existingAppointments} turnos existentes...`);
      
      // Borrar registros médicos primero (tienen FK a turnos)
      const allMedicalRecords = await this.medicalRecordsRepo.find();
      if (allMedicalRecords.length > 0) {
        await this.medicalRecordsRepo.remove(allMedicalRecords);
      }
      
      // Borrar turnos
      const allAppointments = await this.appointmentsRepo.find();
      if (allAppointments.length > 0) {
        await this.appointmentsRepo.remove(allAppointments);
      }
      
      console.log('✅ Turnos y registros médicos eliminados');
    }

    // Obtener veterinarios, mascotas y usuarios existentes
    const veterinarians = await this.veterinariansRepo.find();
    const pets = await this.petsRepo.find({ relations: { owner: true } });
    const users = await this.usersRepo.find();

    if (veterinarians.length === 0 || pets.length === 0 || users.length === 0) {
      console.log('❌ Se necesitan veterinarios, mascotas y usuarios para crear turnos');
      return;
    }
    
    console.log(`📊 Distribuyendo 50 turnos entre ${veterinarians.length} veterinarios...`);

    // Obtener fecha actual y preparar las fechas de la semana
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo

    // Diagnósticos comunes para gráficas de recurrencia
    const commonDiagnoses = [
      {
        diagnosis: DiagnosisType.PARVOVIROSIS,
        treatment: 'Fluidoterapia intensiva, antibióticos, antivirales',
        medications: 'Amoxicilina 500mg, Metronidazol 250mg',
        observations: 'Mantener hidratación constante, aislamiento',
      },
      {
        diagnosis: DiagnosisType.MOQUILLO,
        treatment: 'Cuidados de soporte, control de convulsiones',
        medications: 'Fenobarbital 60mg, Vitaminas del complejo B',
        observations: 'Pronóstico reservado, seguimiento neurológico',
      },
      {
        diagnosis: DiagnosisType.DERMATITIS_ALERGICA,
        treatment: 'Corticoides, antihistamínicos, dieta hipoalergénica',
        medications: 'Prednisona 5mg, Cetirizina 10mg',
        observations: 'Evitar contacto con alérgenos conocidos',
      },
      {
        diagnosis: DiagnosisType.GASTROENTERITIS,
        treatment: 'Ayuno de 12 horas, rehidratación oral, dieta blanda',
        medications: 'Metoclopramida 10mg, Ranitidina 150mg',
        observations: 'Controlar vómitos y diarrea, evaluar deshidratación',
      },
      {
        diagnosis: DiagnosisType.OTITIS_EXTERNA,
        treatment: 'Limpieza de oído, gotas óticas, antibióticos',
        medications: 'Gentamicina gotas óticas, Cefalexina 500mg',
        observations: 'Limpiar diariamente, evitar humedad',
      },
      {
        diagnosis: DiagnosisType.ENFERMEDAD_PERIODONTAL,
        treatment: 'Limpieza dental profesional, extracción de piezas',
        medications: 'Amoxicilina 500mg, Meloxicam 7.5mg',
        observations: 'Cepillado dental diario, dieta específica',
      },
      {
        diagnosis: DiagnosisType.CONJUNTIVITIS,
        treatment: 'Colirio antibiótico, limpieza ocular',
        medications: 'Tobramicina colirio, Lágrimas artificiales',
        observations: 'Aplicar cada 8 horas, evitar rascado',
      },
      {
        diagnosis: DiagnosisType.PARASITOS_INTESTINALES,
        treatment: 'Desparasitación completa, repetir en 15 días',
        medications: 'Albendazol 400mg, Ivermectina',
        observations: 'Recolectar materia fecal para análisis',
      },
      {
        diagnosis: DiagnosisType.ARTROSIS,
        treatment: 'Condroprotectores, analgésicos, fisioterapia',
        medications: 'Glucosamina 500mg, Meloxicam 7.5mg',
        observations: 'Ejercicio moderado, control de peso',
      },
      {
        diagnosis: DiagnosisType.CONTROL_RUTINA,
        treatment: 'Vacunación y desparasitación al día',
        medications: 'No requiere',
        observations: 'Estado general excelente, continuar controles',
      },
    ];

    // Horarios disponibles
    const availableTimes = [
      '09:00:00',
      '10:00:00',
      '11:00:00',
      '12:00:00',
      '14:00:00',
      '15:00:00',
      '16:00:00',
      '17:00:00',
      '18:00:00',
    ];

    let appointmentsCreated = 0;
    let medicalRecordsCreated = 0;

    // Crear 50 turnos distribuidos en la semana
    for (let i = 0; i < 50; i++) {
      // Distribuir turnos en los 7 días de la semana
      const appointmentDate = new Date(startOfWeek);
      appointmentDate.setDate(startOfWeek.getDate() + (i % 7));

      // Seleccionar veterinario de forma equitativa (distribución circular)
      const vetIndex = i % veterinarians.length;
      const assignedVet = veterinarians[vetIndex];
      const randomPet = pets[Math.floor(Math.random() * pets.length)];
      
      // Si la mascota no tiene dueño, saltear
      if (!randomPet.owner) continue;
      
      const petOwner = randomPet.owner; // Variable temporal para TypeScript
      const randomTime = availableTimes[Math.floor(Math.random() * availableTimes.length)];
      const randomDiagnosis = commonDiagnoses[Math.floor(Math.random() * commonDiagnoses.length)];

      // 80% de los turnos están completados (status false) - más registros médicos
      const isCompleted = Math.random() < 0.8;

      const newAppointment = this.appointmentsRepo.create({
        user: petOwner,
        pet: randomPet,
        veterinarian: assignedVet,
        date: appointmentDate,
        time: new Date(`2000-01-01T${randomTime}`),
        status: !isCompleted, // true = pendiente, false = completado
      });

      await this.appointmentsRepo.save(newAppointment);
      appointmentsCreated++;

      // Si el turno está completado, crear registro médico
      if (isCompleted) {
        const newRecord = this.medicalRecordsRepo.create({
          pet: randomPet,
          veterinarian: assignedVet,
          diagnosis: randomDiagnosis.diagnosis,
          treatment: randomDiagnosis.treatment,
          medications: randomDiagnosis.medications,
          observations: randomDiagnosis.observations,
          weight: Math.round((Math.random() * 30 + 5) * 100) / 100, // Peso entre 5 y 35 kg
          temperature: Math.round((Math.random() * 2 + 37) * 10) / 10, // Temperatura entre 37 y 39°C
        });

        await this.medicalRecordsRepo.save(newRecord);
        medicalRecordsCreated++;
      }
    }

    console.log(`✅ ${appointmentsCreated} turnos creados para analytics`);
    console.log(`✅ ${medicalRecordsCreated} registros médicos creados`);
    
    // Mostrar diagnósticos creados
    const medicalRecords = await this.medicalRecordsRepo.find();
    const diagnosisCounts = new Map<string, number>();
    
    medicalRecords.forEach(record => {
      const count = diagnosisCounts.get(record.diagnosis) || 0;
      diagnosisCounts.set(record.diagnosis, count + 1);
    });
    
    console.log('📋 Diagnósticos creados:');
    Array.from(diagnosisCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([diagnosis, count]) => {
        console.log(`   ✓ ${diagnosis}: ${count} casos`);
      });

    // Agregar solicitudes de medicamentos controlados a algunos veterinarios
    await this.addControlledMedicationsRequests(veterinarians);

    console.log('🎉 Seeder de analytics completado');
    return {
      appointments: appointmentsCreated,
      medicalRecords: medicalRecordsCreated,
      message: 'Datos de analytics creados exitosamente'
    };
  }

  private async addControlledMedicationsRequests(veterinarians: Veterinarian[]) {
    const controlledMeds = [
      { nombre: 'Tramadol 50mg', cantidad: 20, urgencia: 'alta' },
      { nombre: 'Morfina 10mg', cantidad: 10, urgencia: 'media' },
      { nombre: 'Ketamina 100mg', cantidad: 5, urgencia: 'baja' },
      { nombre: 'Diazepam 10mg', cantidad: 30, urgencia: 'media' },
      { nombre: 'Fentanilo 100mcg', cantidad: 15, urgencia: 'alta' },
    ];

    // Asignar a 3 veterinarios aleatorios
    for (let i = 0; i < 3 && i < veterinarians.length; i++) {
      const vet = veterinarians[i];
      const numRequests = Math.floor(Math.random() * 3) + 1;
      const requests: any[] = [];

      for (let j = 0; j < numRequests; j++) {
        const med = controlledMeds[Math.floor(Math.random() * controlledMeds.length)];
        requests.push({
          nombre: med.nombre,
          cantidad: med.cantidad,
          urgencia: med.urgencia,
          fechaSolicitud: new Date().toISOString(),
          estado: ['pendiente', 'aprobado', 'rechazado'][Math.floor(Math.random() * 3)],
        });
      }

      vet.medicamentosControlados = requests;
      await this.veterinariansRepo.save(vet);
    }

    console.log('✅ Solicitudes de medicamentos controlados agregadas');
  }
}
