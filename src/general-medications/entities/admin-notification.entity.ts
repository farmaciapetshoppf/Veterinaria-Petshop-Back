import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GeneralMedication } from './general-medication.entity';

@Entity('admin_notifications')
export class AdminNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'LOW_STOCK', 'RESTOCK_REQUEST', 'MEDICATION_USED', etc.

  @Column({ type: 'uuid', name: 'medication_id', nullable: true })
  medicationId: string;

  @ManyToOne(() => GeneralMedication, { nullable: true })
  @JoinColumn({ name: 'medication_id' })
  medication: GeneralMedication;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
