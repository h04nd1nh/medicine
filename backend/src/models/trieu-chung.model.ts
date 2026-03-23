import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
} from 'typeorm';
import { BenhTayY } from './benh-tay-y.model';

@Entity('trieu_chung')
export class TrieuChung {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_trieu_chung: string;

  @ManyToMany(() => BenhTayY, (b) => b.trieuChungList)
  benhTayYList: BenhTayY[];
}
