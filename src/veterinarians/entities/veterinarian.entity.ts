import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import { Role } from 'src/auth/enum/roles.enum';

@Entity('veterinarians')
export class Veterinarian {
  @PrimaryColumn()
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

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Veterinarian,
  })
  role: Role;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default:
      'https://hxjxhchzberrthphpsvo.supabase.co/storage/v1/object/public/veterinarians/1765297533360_pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg',
  })
  profileImageUrl: string;

  @OneToMany(() => Appointments, (appointment) => appointment.veterinarian)
  appointments?: Appointments[];
}
