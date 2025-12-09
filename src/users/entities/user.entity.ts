import { Role } from 'src/auth/enum/roles.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Pet } from 'src/pets/entities/pet.entity';
import { Appointments } from 'src/appointments/entities/appointment.entity';
import { SaleOrder } from 'src/sale-orders/entities/sale-order.entity';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true, nullable: true })
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
    type: 'text',
    nullable: true,
    default:
      'https://hxjxhchzberrthphpsvo.supabase.co/storage/v1/object/public/users/1765290549781_pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg',
  })
  profileImageUrl: string;
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

  @OneToMany(() => SaleOrder, (saleOrder) => saleOrder.buyer, {
    onDelete: 'CASCADE',
  })
  buyerSaleOrders: SaleOrder[];

  @OneToMany(() => Pet, (pets) => pets.owner, {
    onDelete: 'CASCADE',
  })
  pets: Pet[];

  @OneToMany(() => Appointments, (appointment) => appointment.user, {
    onDelete: 'CASCADE',
  })
  appointments: Appointments[];
}
