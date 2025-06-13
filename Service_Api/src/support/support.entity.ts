import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('support')
export class Support {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
    nullable: true
  })
  customer_id: string;

  @Column({
    type: 'int',
    nullable: true
  })
  business_id: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    default: ''
  })
  issued: string;

  @Column({
    type: 'enum',
    enum: ['poc', 'consult', 'technical', 'other', 'incident'],
    default: 'consult'
  })
  type: 'poc' | 'consult' | 'technical' | 'other' | 'incident';

  @Column({
    type: 'text',
    nullable: true
  })
  issue: string;

  @Column({
    type: 'text',
    nullable: true
  })
  solution: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    default: ''
  })
  actioned: string;

  @Column({
    type: 'enum',
    enum: ['mail', 'remote', 'phone', 'site'],
    default: 'remote'
  })
  action_type: 'mail' | 'remote' | 'phone' | 'site';

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  manager: string;

  @Column({
    type: 'enum',
    enum: ['processing', 'complete'],
    default: 'processing'
  })
  status: 'processing' | 'complete';

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  requester: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  requester_telnum: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  requester_email: string;

  @Column({
    type: 'text',
    nullable: true
  })
  note: string;

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