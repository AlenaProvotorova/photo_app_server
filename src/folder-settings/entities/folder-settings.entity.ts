import { FolderEntity } from 'src/folders/entities/folder.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';

@Entity('folder_settings')
export class FolderSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  folderId: number;

  @Column('jsonb')
  showSelectAllDigital: object;

  @Column('jsonb')
  photoOne: object;

  @Column('jsonb')
  photoTwo: object;
 
  @Column('jsonb')
  photoThree: object;

  @Column('jsonb')
  sizeOne: object;

  @Column('jsonb')
  sizeTwo: object;

  @Column('jsonb')
  sizeThree: object;

  @OneToOne(() => FolderEntity)
  @JoinColumn({ name: 'folderId' })
  folder: FolderEntity;
}