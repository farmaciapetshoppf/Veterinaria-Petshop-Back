import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('branches')
export class Branch {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 100 })
	name: string;

	@Column({ type: 'varchar', length: 200, nullable: true })
	address?: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	city?: string;
}
