import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from 'src/pets/entities/pet.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { DiagnosisType } from '../dto/create-medical-records-pet.dto';

@Entity('medical_records_pet')
export class MedicalRecordsPet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con la mascota
  @ManyToOne(() => Pet, { nullable: false })
  pet: Pet;

  // Relación con el veterinario que realizó la consulta
  @ManyToOne(() => Veterinarian, { nullable: false })
  veterinarian: Veterinarian;

  // Diagnóstico (enum para analytics)
  @Column({ 
    type: 'enum', 
    enum: DiagnosisType,
    nullable: false 
  })
  diagnosis: DiagnosisType;

  // Detalles adicionales del diagnóstico (cuando se elige "Otro")
  @Column({ type: 'text', nullable: true })
  diagnosisDetails: string;

  // Tratamiento
  @Column({ type: 'text', nullable: false })
  treatment: string;

  // Medicamentos recetados
  @Column({ type: 'text', nullable: true })
  medications: string;

  // Observaciones adicionales
  @Column({ type: 'text', nullable: true })
  observations: string;

  // Vacunas aplicadas
  @Column({ type: 'text', nullable: true })
  vaccinations: string;

  // Peso de la mascota (en kg)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  // Temperatura (en °C)
  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  // Próxima cita recomendada
  @Column({ type: 'date', nullable: true })
  nextAppointment: Date;

  // Fecha de la consulta
  @CreateDateColumn()
  consultationDate: Date;

  // Última actualización del registro
  @UpdateDateColumn()
  updatedAt: Date;
}
