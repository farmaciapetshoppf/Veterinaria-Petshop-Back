import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GeneralMedication } from './general-medication.entity';

export enum RestockRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

@Entity('medication_restock_requests')
export class MedicationRestockRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'medication_id' })
  medicationId: string;

  @ManyToOne(() => GeneralMedication)
  @JoinColumn({ name: 'medication_id' })
  medication: GeneralMedication;

  @Column({ type: 'uuid', name: 'requested_by' })
  requestedBy: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: RestockRequestStatus.PENDING,
  })
  status: RestockRequestStatus;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
