import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaiThuoc } from './bai-thuoc.model';
import { PhapTri } from './phap-tri.model';

@Entity('bai_thuoc_phap_tri')
export class BaiThuocPhapTri {
  @PrimaryColumn({ name: 'id_bai_thuoc' })
  idBaiThuoc: number;

  @PrimaryColumn({ name: 'id_phap_tri' })
  idPhapTri: number;

  @Column({ name: 'doan_chung_trang', type: 'text', nullable: true })
  doanChungTrang: string | null;

  @Column({ name: 'thu_tu', type: 'smallint', default: 0 })
  thuTu: number;

  @ManyToOne(() => BaiThuoc, (bt) => bt.phapTriLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_bai_thuoc' })
  baiThuoc: BaiThuoc;

  @ManyToOne(() => PhapTri, (pt) => pt.bai_thuoc_links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_phap_tri' })
  phapTri: PhapTri;
}
