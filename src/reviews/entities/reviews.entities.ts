// reviews.entity.ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Users } from 'src/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('reviews')
export class Review {
  @ApiProperty({
    description: 'Identificador único de la reseña',
    example: 'e9b5550e-5c32-4c33-9e5e-1c1d5d7f0e9b',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Calificación de la reseña (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @Column({ type: 'int', unsigned: true })
  rating: number; // 1 a 5

  @ApiProperty({
    description: 'Comentario de la reseña',
    example: 'Excelente servicio, muy recomendado',
  })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty({
    description: 'Fecha de creación de la reseña',
    example: '2023-12-09T12:00:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de eliminación (para borrado lógico)',
    example: '2023-12-10T12:00:00Z',
    nullable: true,
  })
  @DeleteDateColumn()
  deletedAt: Date;

  @ApiProperty({
    description: 'Veterinario al que pertenece la reseña',
    type: () => Veterinarian,
  })
  @ManyToOne(() => Veterinarian, { nullable: false })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian;

  @ApiProperty({
    description: 'Usuario que creó la reseña',
    type: () => Users,
  })
  @ManyToOne(() => Users, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
