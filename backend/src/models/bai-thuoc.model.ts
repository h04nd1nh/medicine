import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaiThuocChiTiet } from './bai-thuoc-chi-tiet.model';

@Entity('bai_thuoc')
export class BaiThuoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_bai_thuoc: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nguon_goc: string; // Tên tác giả hoặc cổ phương

  @Column({ type: 'text', nullable: true })
  cong_dung: string;

  @Column({ type: 'text', nullable: true })
  cach_dung: string;

  @Column({ type: 'text', nullable: true })
  ghi_chu: string;

  @OneToMany(() => BaiThuocChiTiet, (detail) => detail.baiThuoc)
  chiTietViThuoc: BaiThuocChiTiet[];
}
