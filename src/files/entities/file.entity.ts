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

  @Column({ nullable: true, name: 'folderId' })
  folderId: string;

  @ManyToOne(() => FolderEntity, (folder) => folder.files, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'folderId' })
  folder: FolderEntity;

  @DeleteDateColumn()
  deletedAt?: string;

  @Column()
  path: string;

  @AfterLoad()
  generateUrl() {
    this.url = `${API_CONFIG.baseUrl}${API_CONFIG.uploadsPath}/${this.filename}`;
  }
}
