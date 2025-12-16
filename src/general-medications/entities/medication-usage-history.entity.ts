import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GeneralMedication } from './general-medication.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import { Pet } from 'src/pets/entities/pet.entity';

@Entity('medication_usage_history')
export class MedicationUsageHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'medication_id' })
  medicationId: string;

  @ManyToOne(() => GeneralMedication)
  @JoinColumn({ name: 'medication_id' })
  medication: GeneralMedication;

  @Column({ type: 'uuid', name: 'appointment_id', nullable: true })
  appointmentId: string;

  @ManyToOne(() => Appointments, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointments;

  @Column({ type: 'uuid', name: 'veterinarian_id' })
  veterinarianId: string;

  @ManyToOne(() => Veterinarian)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian;

  @Column({ type: 'uuid', name: 'pet_id', nullable: true })
  petId: string;

  @ManyToOne(() => Pet, { nullable: true })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dosage: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string;

  @Column({ type: 'text', nullable: true, name: 'prescription_notes' })
  prescriptionNotes: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 20, default: 'GENERAL' })
  medicationType: string;

  @CreateDateColumn({ name: 'used_at' })
  usedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
