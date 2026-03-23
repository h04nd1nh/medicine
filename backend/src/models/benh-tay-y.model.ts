import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { ChungBenh } from './chung-benh.model';
import { PhuongThuoc } from './phuong-thuoc.model';
import { TrieuChung } from './trieu-chung.model';

@Entity('benh_tay_y')
export class BenhTayY {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_chung_benh' })
  idChungBenh: number;

  @Column({ type: 'varchar', length: 255 })
  ten_benh: string;

  @ManyToOne(() => ChungBenh, (c) => c.benhTayYList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_chung_benh' })
  chungBenh: ChungBenh;

  @ManyToMany(() => PhuongThuoc, (p) => p.benhTayYList)
  @JoinTable({
    name: 'quan_he_benh_phuong_thuoc',
    joinColumn: { name: 'id_benh_tay_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_phuong_thuoc', referencedColumnName: 'id' },
  })
  phuongThuocList: PhuongThuoc[];

  @ManyToMany(() => TrieuChung, (t) => t.benhTayYList)
  @JoinTable({
    name: 'quan_he_benh_trieu_chung',
    joinColumn: { name: 'id_benh_tay_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_trieu_chung', referencedColumnName: 'id' },
  })
  trieuChungList: TrieuChung[];
}
