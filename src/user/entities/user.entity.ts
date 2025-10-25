import { WatermarkEntity } from 'src/watermarks/entities/watermark.entity';
import { FolderEntity } from '../../folders/entities/folder.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ default: true })
  isAdmin: boolean;

  @Column({ default: false })
  isSuperUser: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FolderEntity, (folder) => folder.user)
  folders: FolderEntity[];

  @OneToMany(() => WatermarkEntity, (watermark) => watermark.user)
  watermarks: WatermarkEntity[];
}
