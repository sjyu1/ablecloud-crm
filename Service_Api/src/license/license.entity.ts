import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('license')
export class License {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column({ unique: true })
  license_key: string

  @Column()
  issued: string

  @Column()
  expired: string

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'expired'

  @Column({
    type: 'int',
    nullable: true
  })
  company_id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true
  })
  approve_user: string;

  @Column({
    type: 'datetime',
    nullable: true
  })
  approved: string;

  @Column({
    type: 'int',
    nullable: true
  })
  business_id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  issued_id: string;

  @Column({
    type: 'tinyint'
  })
  trial: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  oem: string;

  @CreateDateColumn()
  created: string

  @UpdateDateColumn()
  updated: string

  @DeleteDateColumn()
  removed: string
}