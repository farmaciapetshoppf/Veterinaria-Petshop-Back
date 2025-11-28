import { Role } from 'src/auth/enum/roles.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Pet } from 'src/pets/entities/pet.entity';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  email: string;
  @Column({ type: 'varchar', length: 50, nullable: false })
  user: string;
  @Column({ type: 'varchar', nullable: true })
  phone: string;
  @Column({ type: 'varchar', length: 50, nullable: true })
  country: string;
  @Column({ type: 'text', nullable: true })
  address: string;
  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string;
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  role: Role;

  //@OneToMany(() => Orders, orders => orders.user,{
  //onDelete: 'CASCADE'} )
  //orders: Orders[]
  
  @OneToMany(() => Pet, pets => pets.owner,{
  onDelete: 'CASCADE'} )
  pets: Pet[]
}
