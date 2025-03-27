import { ClientEntity } from 'src/client/entities/client.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany, DeleteDateColumn, OneToOne } from 'typeorm';
import { FolderSettingsEntity } from 'src/folder-settings/entities/folder-settings.entity';

@Entity('folders')
export class FolderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  url: string;

  @ManyToOne(() => UserEntity, (user) => user.folders)
  user: UserEntity;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FileEntity, (file) => file.folder, {
    onDelete: 'CASCADE'  
  })
  files: FileEntity[];

  @OneToMany(() => ClientEntity, (client) => client.folder)
  clients: ClientEntity[];

  @OneToOne(() => FolderSettingsEntity, settings => settings.folder, { cascade: true })
  settings: FolderSettingsEntity;

  @DeleteDateColumn()
  deletedAt?: Date;
}