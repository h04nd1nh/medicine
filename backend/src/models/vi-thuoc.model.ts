import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaiThuocChiTiet } from './bai-thuoc-chi-tiet.model';
import { ViThuocNhomNho } from './vi-thuoc-nhom-nho.model';

/** Bảng vị thuốc — nghiệp vụ + id; nhóm dược lý gán qua bảng vi_thuoc_nhom_nho. */
@Entity('vi_thuoc')
export class ViThuoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_vi_thuoc: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  ten_goi_khac: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tinh: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vi: string;

  @Column({ type: 'text', nullable: true })
  quy_kinh: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lieu_dung: string;

  @Column({ type: 'text', nullable: true })
  cong_dung: string;

  @Column({ type: 'text', nullable: true })
  chu_tri: string;

  @Column({ type: 'text', nullable: true })
  kieng_ky: string;

  @OneToMany(() => BaiThuocChiTiet, (detail) => detail.viThuoc)
  baiThuocDetails: BaiThuocChiTiet[];

  @OneToMany(() => ViThuocNhomNho, (link) => link.viThuoc)
  nhomLinks: ViThuocNhomNho[];
}
