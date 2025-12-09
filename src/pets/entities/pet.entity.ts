import { Users } from 'src/users/entities/user.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';

export enum PetEspecies {
  PERRO = 'PERRO',
  GATO = 'GATO',
  AVE = 'AVE',
  ROEDOR = 'ROEDOR',
  REPTIL = 'REPTIL',
  OTRO = 'OTRO',
}

export enum PetSexo {
  MACHO = 'MACHO',
  HEMBRA = 'HEMBRA',
}

export enum PetTamano {
  PEQUENO = 'PEQUENO',
  MEDIANO = 'MEDIANO',
  GRANDE = 'GRANDE',
}

export enum PetEsterilizado {
  SI = 'SI',
  NO = 'NO',
  // cambiar a true o false
}

export enum PetStatus {
  VIVO = 'VIVO',
  FALLECIDO = 'FALLECIDO',
}

@Entity()
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //dueño del peludito
  @ManyToOne(() => Users, (user) => user.pets, { nullable: true })
  owner: Users | null;

  //informacion basica del peludito
  @Column()
  nombre: string;

  @Column({
    type: 'enum',
    enum: PetEspecies,
  })
  especie: PetEspecies;

  @Column({
    type: 'enum',
    enum: PetSexo,
  })
  sexo: PetSexo;

  @Column({
    type: 'enum',
    enum: PetTamano,
  })
  tamano: PetTamano;

  @Column({
    type: 'enum',
    enum: PetEsterilizado,
  })
  esterilizado: PetEsterilizado;

  @Column({
    type: 'enum',
    enum: PetStatus,
  })
  status: PetStatus;

  @Column({ type: 'date' })
  fecha_nacimiento: string;

  @Column({ type: 'date', nullable: true })
  fecha_fallecimiento: string | null | undefined;

  //raza del peludito
  @Column({ type: 'varchar', length: 100, nullable: true })
  breed: string | null;

  //imagen del peludito
  @Column({
    type: 'text',
    default:
      'https://hxjxhchzberrthphpsvo.supabase.co/storage/v1/object/public/pets/1765297411732_pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg',
  })
  image: string | null;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //relaciones familiares
  @ManyToOne(() => Pet, (pet) => pet.childrenAsMother, { nullable: true })
  mother?: Pet | null;

  @ManyToOne(() => Pet, (pet) => pet.childrenAsFather, { nullable: true })
  father?: Pet | null;

  @OneToMany(() => Pet, (pet) => pet.mother)
  childrenAsMother?: Pet[];

  @OneToMany(() => Pet, (pet) => pet.father)
  childrenAsFather?: Pet[];

  @OneToMany(() => Appointments, (appointment) => appointment.pet)
  appointments?: Appointments[];
}
