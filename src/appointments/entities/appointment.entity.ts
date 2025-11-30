import { ApiProperty } from '@nestjs/swagger';
import { Pet } from 'src/pets/entities/pet.entity';
import { Users } from 'src/users/entities/user.entity';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'APPOINTMENTS' })
export class Appointments {
  @ApiProperty({
    description: 'uuid v4 generado por la BBDD',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Users, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Pet, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Veterinarian, { nullable: true })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian;

  @ApiProperty({
    description: 'Fecha para sacar turno',
  })
  @Column({
    type: 'date',
    nullable: false,
  })
  date: Date;

  @ApiProperty({
    description: 'Hora para sacar turno',
  })
  @Column({
    type: 'time',
    nullable: false,
  })
  time: Date;

  @ApiProperty({
    description: 'Estado del turno, automaticamente activo',
  })
  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  status: boolean;
}
