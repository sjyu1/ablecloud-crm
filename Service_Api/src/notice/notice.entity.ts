import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('notice')
export class Notice {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true
  })
  content: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  writer: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  level: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @DeleteDateColumn()
  removed: Date;
}