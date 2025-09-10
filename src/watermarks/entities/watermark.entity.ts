import { UserEntity } from 'src/user/entities/user.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('watermarks')
export class WatermarkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  fileSize: number;

  @Column()
  mimetype: string;

  @Column({ nullable: true, name: 'userId' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.watermarks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @DeleteDateColumn()
  deletedAt?: string;

  @Column()
  url: string;

  @Column()
  path: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'float', default: 0.5 })
  opacity: number;

  @Column({ default: 'center' })
  position: string;

  @Column({ type: 'float', default: 0.1 })
  size: number; 
}
