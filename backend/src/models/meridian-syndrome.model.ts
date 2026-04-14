import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaiThuoc } from './bai-thuoc.model';
import { TrieuChung } from './trieu-chung.model';
import type { PhapTri } from './phap-tri.model';

@Entity('benh_dong_y')
export class MeridianSyndrome {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  nhomid: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tieuket: string;

  @Column({ type: 'text', nullable: true })
  trieuchung: string;

  @Column({ type: 'text', nullable: true })
  benhly: string;

  @Column({ type: 'text', nullable: true })
  phuyet_chamcuu: string;

  @Column({ type: 'text', nullable: true })
  giainghia_phuyet: string;

  @Column({ type: 'text', nullable: true })
  bai_thuoc: string;

  @Column({ type: 'text', nullable: true })
  chung_trang: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  duyet: string;

  // Kênh 1: Tiểu trường
  @Column({ type: 'smallint', default: 0 })
  tieutruong_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  tieutruong: number;
  
  @Column({ type: 'smallint', default: 0 })
  tieutruong_c11: number;

  // Kênh 2: Tâm
  @Column({ type: 'smallint', default: 0 })
  tam_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  tam: number;
  
  @Column({ type: 'smallint', default: 0 })
  tam_c11: number;

  // Kênh 3: Tam tiêu
  @Column({ type: 'smallint', default: 0 })
  tamtieu_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  tamtieu: number;
  
  @Column({ type: 'smallint', default: 0 })
  tamtieu_c11: number;

  // Kênh 4: Tâm bào
  @Column({ type: 'smallint', default: 0 })
  tambao_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  tambao: number;
  
  @Column({ type: 'smallint', default: 0 })
  tambao_c11: number;

  // Kênh 5: Đại tràng
  @Column({ type: 'smallint', default: 0 })
  daitrang_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  daitrang: number;
  
  @Column({ type: 'smallint', default: 0 })
  daitrang_c11: number;

  // Kênh 6: Phế
  @Column({ type: 'smallint', default: 0 })
  phe_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  phe: number;
  
  @Column({ type: 'smallint', default: 0 })
  phe_c11: number;

  // Kênh 7: Bàng quang
  @Column({ type: 'smallint', default: 0 })
  bangquang_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  bangquang: number;
  
  @Column({ type: 'smallint', default: 0 })
  bangquang_c11: number;

  // Kênh 8: Thận
  @Column({ type: 'smallint', default: 0 })
  than_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  than: number;
  
  @Column({ type: 'smallint', default: 0 })
  than_c11: number;

  // Kênh 9: Đảm
  @Column({ type: 'smallint', default: 0 })
  dam_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  dam: number;
  
  @Column({ type: 'smallint', default: 0 })
  dam_c11: number;

  // Kênh 10: Vị
  @Column({ type: 'smallint', default: 0 })
  vi_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  vi: number;
  
  @Column({ type: 'smallint', default: 0 })
  vi_c11: number;

  // Kênh 11: Can
  @Column({ type: 'smallint', default: 0 })
  can_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  can: number;
  
  @Column({ type: 'smallint', default: 0 })
  can_c11: number;

  // Kênh 12: Tỳ
  @Column({ type: 'smallint', default: 0 })
  ty_c8: number;
  
  @Column({ type: 'smallint', default: 0 })
  ty: number;
  
  @Column({ type: 'smallint', default: 0 })
  ty_c11: number;

  /** Nhiều pháp trị gắn qua phap_tri.id_benh_dong_y (không còn UNIQUE trên cột này). */
  @OneToMany('PhapTri', 'benh_dong_y')
  phap_tri_list: PhapTri[];

  @ManyToMany(() => BaiThuoc)
  @JoinTable({
    name: 'benh_dong_y_bai_thuoc',
    joinColumn: { name: 'id_benh_dong_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_bai_thuoc', referencedColumnName: 'id' },
  })
  baiThuocList: BaiThuoc[];

  @ManyToMany(() => TrieuChung)
  @JoinTable({
    name: 'benh_dong_y_trieu_chung',
    joinColumn: { name: 'id_benh_dong_y', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_trieu_chung', referencedColumnName: 'id' },
  })
  trieuChungList: TrieuChung[];
}
