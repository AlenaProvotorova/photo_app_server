import { API_CONFIG } from 'api.config';
import { UserEntity } from 'src/user/entities/user.entity';
import {
  AfterLoad,
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum FileType {
  PHOTOS = 'photos',
  TRASH = 'trash',
}

@Entity('files')
export class FileEntity {
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

  @ManyToOne(() => UserEntity, (user) => user.files)
  user: UserEntity;

  @DeleteDateColumn()
  deletedAt?: string;

  @AfterLoad()
  generateUrl() {
    this.url = `${API_CONFIG.baseUrl}${API_CONFIG.uploadsPath}/${this.filename}`;
  }
}
