import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GeneralMedication } from './general-medication.entity';

export enum StockLogAction {
  RESTOCK = 'RESTOCK',
  USAGE = 'USAGE',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('stock_logs')
export class StockLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'medication_id' })
  medicationId: string;

  @ManyToOne(() => GeneralMedication)
  @JoinColumn({ name: 'medication_id' })
  medication: GeneralMedication;

  @Column({ type: 'varchar', length: 255, name: 'medication_name' })
  medicationName: string;

  @Column({
    type: 'enum',
    enum: StockLogAction,
  })
  action: StockLogAction;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', name: 'previous_stock' })
  previousStock: number;

  @Column({ type: 'int', name: 'new_stock' })
  newStock: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 255, name: 'performed_by' })
  performedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
