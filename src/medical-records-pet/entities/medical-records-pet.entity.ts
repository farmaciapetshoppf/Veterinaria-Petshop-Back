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

@Entity('medical_records_pet')
export class MedicalRecordsPet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con la mascota
  @ManyToOne(() => Pet, { nullable: false, eager: true })
  pet: Pet;

  // Relación con el veterinario que realizó la consulta
  @ManyToOne(() => Veterinarian, { nullable: false, eager: true })
  veterinarian: Veterinarian;

  // Diagnóstico
  @Column({ type: 'text', nullable: false })
  diagnosis: string;

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
