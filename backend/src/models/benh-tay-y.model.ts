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
import { TrieuChung } from './trieu-chung.model';
import { BaiThuoc } from './bai-thuoc.model';

@Entity('benh_tay_y')
export class BenhTayY {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_chung_benh' })
  idChungBenh: number;

  @Column({ type: 'varchar', length: 255 })
  ten_benh: string;

  @Column({ type: 'text', nullable: true })
  thiet_chan: string;

  @Column({ type: 'text', nullable: true })
  mach_chan: string;

  @ManyToOne(() => ChungBenh, (c) => c.benhTayYList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_chung_benh' })
  chungBenh: ChungBenh;

  @ManyToMany(() => BaiThuoc)
  @JoinTable({
    name: 'benh_tay_y_bai_thuoc',
    joinColumn: { name: 'id_benh_tay_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_bai_thuoc', referencedColumnName: 'id' },
  })
  baiThuocList: BaiThuoc[];

  @ManyToMany(() => TrieuChung, (t) => t.benhTayYList)
  @JoinTable({
    name: 'quan_he_benh_trieu_chung',
    joinColumn: { name: 'id_benh_tay_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_trieu_chung', referencedColumnName: 'id' },
  })
  trieuChungList: TrieuChung[];
}
