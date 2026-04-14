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
import { ThietChan } from './thiet-chan.model';
import { MachChan } from './mach-chan.model';
import { PhapTri } from './phap-tri.model';

@Entity('benh_tay_y')
export class BenhTayY {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_chung_benh' })
  idChungBenh: number;

  @Column({ type: 'varchar', length: 255 })
  ten_benh: string;

  @ManyToMany(() => ThietChan)
  @JoinTable({
    name: 'benh_tay_y_thiet_chan',
    joinColumn: { name: 'id_benh_tay_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_thiet_chan', referencedColumnName: 'id' },
  })
  thietChanList: ThietChan[];

  @ManyToMany(() => MachChan)
  @JoinTable({
    name: 'benh_tay_y_mach_chan',
    joinColumn: { name: 'id_benh_tay_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_mach_chan', referencedColumnName: 'id' },
  })
  machChanList: MachChan[];

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

  @ManyToMany(() => PhapTri)
  @JoinTable({
    name: 'benh_tay_y_phap_tri',
    joinColumn: { name: 'id_benh_tay_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_phap_tri', referencedColumnName: 'id' },
  })
  phapTriList: PhapTri[];
}
