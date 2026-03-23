import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
} from 'typeorm';
import { BenhTayY } from './benh-tay-y.model';

@Entity('phuong_thuoc')
export class PhuongThuoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_phuong_thuoc: string;

  @ManyToMany(() => BenhTayY, (b) => b.phuongThuocList)
  benhTayYList: BenhTayY[];
}
