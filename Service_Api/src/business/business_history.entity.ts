import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('business_history')
export class Business_history {
  @PrimaryGeneratedColumn('increment')
  id: number;

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
  issue: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  solution: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  status: string;

  @Column()
  issued: string

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false
  })
  created: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: false
  })
  updated: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true
  })
  removed: Date | null;
}