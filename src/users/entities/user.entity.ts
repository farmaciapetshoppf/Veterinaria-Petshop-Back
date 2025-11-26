import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  @Column({ type: 'int', nullable: true })
  phone: number;
  @Column({ type: 'varchar', length: 50, nullable: true })
  country: string;
  @Column({ type: 'text', nullable: true })
  address: string;
  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string;
  @Column({ default: false })
  isAdmin: boolean;

  //orders: Orders[]
  //pets: Pets[]
}
