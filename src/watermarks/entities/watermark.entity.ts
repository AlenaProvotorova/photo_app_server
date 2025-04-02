import { UserEntity } from 'src/user/entities/user.entity';
import { API_CONFIG } from '../../config/api.config';
import { FolderEntity } from '../../folders/entities/folder.entity';
import {
  AfterLoad,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';


@Entity('watermarks')
export class WatermarkEntity {
  url: string; 

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  size: number;

  @Column()
  mimetype: string;

  @Column({ nullable: true, name: 'userId' })
  userId: number;
  
  @ManyToOne(() => UserEntity, user => user.watermarks, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @DeleteDateColumn()
  deletedAt?: string;

  @AfterLoad()
  generateUrl() {
    this.url = `${API_CONFIG.baseUrl}${API_CONFIG.watermarksPath}/${this.filename}`;
  }
}
