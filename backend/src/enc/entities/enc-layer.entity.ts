import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('enc_layers')
export class EncLayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'layer_type' })
  layerType: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
