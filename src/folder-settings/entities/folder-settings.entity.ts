import { FolderEntity } from 'src/folders/entities/folder.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';

@Entity('folder_settings')
export class FolderSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  folderId: number;

  @Column({ default: false })
  showSelectAllDigital: boolean;

  @Column({ default: false })
  showPhotoOne: boolean;

  @Column({ default: false })
  showPhotoTwo: boolean;

  @Column({ default: false })
  showSize1: boolean;

  @Column({ default: false })
  showSize2: boolean;

  @Column({ default: false })
  showSize3: boolean;

  @Column({ nullable: true })
  sizeDescription1: string;

  @Column({ nullable: true })
  sizeDescription2: string;

  @Column({ nullable: true })
  sizeDescription3: string;

  @OneToOne(() => FolderEntity)
  @JoinColumn({ name: 'folderId' })
  folder: FolderEntity;
}