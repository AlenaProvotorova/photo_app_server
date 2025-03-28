import { ClientEntity } from 'src/client/entities/client.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FolderEntity } from 'src/folders/entities/folder.entity';
import { SizeEntity } from 'src/sizes/entities/size.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'fileId' })
  fileId: number;

  @ManyToOne(() => FileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: FileEntity;


  @Column({ name: 'sizeId' })
  sizeId: number;

  @ManyToOne(() => SizeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sizeId' })
  size: SizeEntity;

  @Column()
  count: number;

  @Column({ name: 'clientId' })
  clientId: number;

  @ManyToOne(() => ClientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity;

  @Column({ name: 'folderId' })
  folderId: string;

  @ManyToOne(() => FolderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folderId' })
  folder: FolderEntity;
}