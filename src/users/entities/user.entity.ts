import { Role } from 'src/auth/enum/roles.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  uid: string;
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
  @Column({ default: false })
  isDeleted: boolean;
  @Column({ nullable: true })
  deletedAt: Date;

  //@OneToMany(() => Orders, orders => orders.user,{
  //onDelete: 'CASCADE'} )
  //orders: Orders[]
  //@OneToMany(() => Pets, pets => pets.user,{
  //onDelete: 'CASCADE'} )
  //pets: Pets[]
}
