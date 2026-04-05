import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { BaiThuoc } from './bai-thuoc.model';
import { NhomDuocLyNho } from './nhom-duoc-ly-nho.model';
import { KinhMach } from './kinh-mach.model';
import { MeridianSyndrome } from './meridian-syndrome.model';

@Entity('phap_tri')
export class PhapTri {
  @PrimaryGeneratedColumn()
  id: number;

  /** Chứng trạng (tiểu kết) — chỉ lưu text */
  @Column({ type: 'text', nullable: true })
  chung_trang: string | null;

  @Column({ type: 'text', nullable: true })
  nguyen_tac: string | null;

  @Column({ type: 'text', nullable: true })
  y_nghia_co_che: string | null;

  /** Giá trị nhiều mục, lưu chuỗi phân tách bằng dấu phẩy */
  @Column({ type: 'text', nullable: true })
  bat_phap: string | null;

  @Column({ type: 'text', nullable: true })
  bat_cuong: string | null;

  @Column({ type: 'text', nullable: true })
  luc_dam: string | null;

  @Column({ type: 'text', nullable: true })
  trieu_chung_mo_ta: string | null;

  @ManyToOne(() => BaiThuoc, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_bai_thuoc' })
  bai_thuoc: BaiThuoc | null;

  @ManyToOne(() => NhomDuocLyNho, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_nhom_duoc_ly_nho' })
  nhom_duoc_ly_nho: NhomDuocLyNho | null;

  @ManyToOne(() => MeridianSyndrome, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_benh_dong_y' })
  benh_dong_y: MeridianSyndrome | null;

  @ManyToMany(() => KinhMach)
  @JoinTable({
    name: 'phap_tri_kinh_mach',
    joinColumn: { name: 'id_phap_tri', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_kinh_mach', referencedColumnName: 'idKinhMach' },
  })
  kinh_mach_list: KinhMach[];
}
