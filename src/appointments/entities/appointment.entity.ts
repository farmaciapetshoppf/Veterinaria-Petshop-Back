import { Pet } from "src/pets/entities/pet.entity";
import { Users } from "src/users/entities/user.entity";
import { Veterinarian } from "src/veterinarians/entities/veterinarian.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'APPOINTMENTS' })
export class Appointments {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Relación temporal sin inverseSide para evitar error
   * Cuando User tenga @OneToMany('appointments'), agregar:
   * user => user.appointments
   */
  @ManyToOne(() => Users, { nullable: true, onDelete: 'CASCADE' })
  @ManyToOne(() => Users, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;
  user: Users;

  /**
   * Relación temporal sin inverseSide
   * Cuando Pet tenga @OneToMany('appointments'), agregar:
   * pet => pet.appointments
   */
  // @ManyToOne(() => Pet, { nullable: true, onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'pet_id' })
  // pet: Pet;

  /**
   * Relación temporal sin inverseSide
   * Cuando Veterinarian tenga @OneToMany('appointments'), agregar:
   * vet => vet.appointments
   */
  // @ManyToOne(() => Veterinarian, { nullable: true })
  // @JoinColumn({ name: 'veterinarian_id' })
  // veterinarian: Veterinarian;

  @Column({
    type: 'date',
    nullable: false
  })
  date: Date;

  @Column({
    type: 'time',
    nullable: false
  })
  time: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true
  })
  status: boolean;

}
