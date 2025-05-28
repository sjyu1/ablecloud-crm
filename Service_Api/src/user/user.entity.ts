import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('USER_ENTITY')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  username: string;
}