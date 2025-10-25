import { FolderEntity } from 'src/folders/entities/folder.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { SettingField } from '../interfaces/setting-field.interface';

@Entity('folder_settings')
export class FolderSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  folderId: number;

  @Column('jsonb')
  showSelectAllDigital: SettingField;

  @Column('jsonb')
  photoOne: SettingField;

  @Column('jsonb')
  photoTwo: SettingField;
 
  @Column('jsonb')
  photoThree: SettingField;

  @Column('jsonb')
  sizeOne: SettingField;

  @Column('jsonb')
  sizeTwo: SettingField;

  @Column('jsonb')
  sizeThree: SettingField;

  @Column({ type: 'timestamp', nullable: true })
  dateSelectTo: Date;

  @OneToOne(() => FolderEntity)
  @JoinColumn({ name: 'folderId' })
  folder: FolderEntity;
}