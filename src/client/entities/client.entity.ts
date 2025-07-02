import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FolderEntity } from '../../folders/entities/folder.entity';

@Entity('clients')
export class ClientEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true, name: 'folderId' })
  folderId: number;

  @ManyToOne(() => FolderEntity, folder => folder.clients)
  @JoinColumn({ name: 'folderId' })
  folder: FolderEntity;

  @Column({ type: 'boolean', default: false })
  orderDigital: boolean;

  @Column({ type: 'boolean', nullable: true, default: null })
  orderAlbum: boolean;
}