import { Column, PrimaryGeneratedColumn } from 'typeorm';

export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  mail: string;
  @Column({ type: 'varchar', length: 50, nullable: false })
  user: string;
  @Column({ type: 'varchar', length: 60, nullable: false })
  password: string;
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
}
