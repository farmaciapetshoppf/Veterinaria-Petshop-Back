import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('branches')
export class Branch {
  @ApiProperty({
    description: 'uuid v4 generado por la BBDD',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Debe ser un string de maximo 100 caracteres',
  })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({
    description: 'Debe ser un string de maximo 200 caracteres, opcional',
  })
  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string;

  @ApiProperty({
    description: 'Debe ser un string de maximo 100 caracteres, opcional',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;
}
