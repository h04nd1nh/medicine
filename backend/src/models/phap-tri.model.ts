import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { BaiThuoc } from './bai-thuoc.model';
import type { BaiThuocPhapTri } from './bai-thuoc-phap-tri.model';
import { NhomDuocLyNho } from './nhom-duoc-ly-nho.model';
import { KinhMach } from './kinh-mach.model';
import { MeridianSyndrome } from './meridian-syndrome.model';
import { TrieuChung } from './trieu-chung.model';

@Entity('phap_tri')
export class PhapTri {
  @PrimaryGeneratedColumn()
  id: number;

  /** Thể bệnh (legacy API vẫn dùng key chung_trang) — chỉ lưu text */
  @Column({ name: 'the_benh', type: 'text', nullable: true })
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

  /** Cột bảng luận trị TCM (mẫu Excel/UI) */
  @Column({ type: 'text', nullable: true })
  am_duong: string | null;

  @Column({ type: 'text', nullable: true })
  ton_thuong: string | null;

  @Column({ type: 'text', nullable: true })
  tac_nhan: string | null;

  @Column({ type: 'text', nullable: true })
  ban_chat: string | null;

  @Column({ type: 'text', nullable: true })
  vi_tri_tien_trinh: string | null;

  @Column({ type: 'text', nullable: true })
  mach_chan: string | null;

  @Column({ type: 'text', nullable: true })
  chat_luoi: string | null;

  @Column({ type: 'text', nullable: true })
  nguyen_nhan: string | null;

  @Column({ type: 'text', nullable: true })
  trieu_chung_mo_ta: string | null;

  @ManyToOne(() => BaiThuoc, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_bai_thuoc' })
  bai_thuoc: BaiThuoc | null;

  /** Nhiều bài thuốc tham chiếu (bảng bai_thuoc_phap_tri); id_bai_thuoc trùng bài đầu tiên để tương thích. */
  @OneToMany('BaiThuocPhapTri', 'phapTri')
  bai_thuoc_links: BaiThuocPhapTri[];

  @ManyToOne(() => NhomDuocLyNho, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_nhom_duoc_ly_nho' })
  nhom_duoc_ly_nho: NhomDuocLyNho | null;

  /** Cho phép gắn nhiều nhóm nhỏ. */
  @ManyToMany(() => NhomDuocLyNho)
  @JoinTable({
    name: 'phap_tri_nhom_duoc_ly_nho',
    joinColumn: { name: 'id_phap_tri', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_nhom_duoc_ly_nho', referencedColumnName: 'id' },
  })
  nhom_duoc_ly_nho_list: NhomDuocLyNho[];

  /** Một pháp trị có thể gắn nhiều bệnh Đông y (many-to-many). */
  @ManyToMany(() => MeridianSyndrome, (b) => b.phap_tri_list)
  @JoinTable({
    name: 'benh_dong_y_phap_tri',
    joinColumn: { name: 'id_phap_tri', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_benh_dong_y', referencedColumnName: 'id' },
  })
  benh_dong_y_list: MeridianSyndrome[];

  @ManyToMany(() => KinhMach)
  @JoinTable({
    name: 'phap_tri_kinh_mach',
    joinColumn: { name: 'id_phap_tri', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_kinh_mach', referencedColumnName: 'idKinhMach' },
  })
  kinh_mach_list: KinhMach[];

  /** Liên kết cứng tới bảng trieu_chung; trieu_chung_mo_ta được đồng bộ từ tên (và phần không khớp vẫn giữ trong text). */
  @ManyToMany(() => TrieuChung)
  @JoinTable({
    name: 'phap_tri_trieu_chung',
    joinColumn: { name: 'id_phap_tri', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_trieu_chung', referencedColumnName: 'id' },
  })
  trieu_chung_list: TrieuChung[];
}
