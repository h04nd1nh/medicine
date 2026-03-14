import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn
} from 'typeorm';

@Entity('examinations')
export class Examination {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  patientId: number;

  @Column({ type: 'jsonb' })
  inputData: Record<string, number>;

  @Column({ type: 'varchar', length: 50 })
  amDuong: string;

  @Column({ type: 'varchar', length: 50 })
  khi: string;

  @Column({ type: 'varchar', length: 50 })
  huyet: string;

  @Column({ type: 'jsonb' })
  flags: Array<{
    channelIndex: number;
    channelName: string;
    L: number;
    R: number;
    Avg: number;
    c8: number;
    c10: number;
    c11: number;
    c12: number;
  }>;

  @Column({ type: 'jsonb', default: [] })
  syndromes: Array<Record<string, any>>;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
