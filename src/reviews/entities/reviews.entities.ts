import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Users } from 'src/users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', unsigned: true })
  rating: number; // 1 a 5

  @Column({ type: 'text' })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Veterinarian, { nullable: false })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian;

  @ManyToOne(() => Users, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
