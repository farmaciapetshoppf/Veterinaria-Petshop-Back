import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GeneralMedication } from './general-medication.entity';

@Entity('medication_usage_history')
export class MedicationUsageHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'medication_id' })
  medicationId: string;

  @ManyToOne(() => GeneralMedication)
  @JoinColumn({ name: 'medication_id' })
  medication: GeneralMedication;

  @Column({ type: 'uuid', name: 'veterinarian_id' })
  veterinarianId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'used_at' })
  usedAt: Date;
}
