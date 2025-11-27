import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('veterinarians')
export class Veterinarian {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  matricula: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'varchar', length: 15, nullable: false, unique: true })
  phone: string;

  @Column({ type: 'date', nullable: false })
  time: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;
}
