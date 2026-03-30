import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaiThuocChiTiet } from './bai-thuoc-chi-tiet.model';

@Entity('vi_thuoc')
export class ViThuoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_vi_thuoc: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ten_khoa_hoc: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ten_goi_khac: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bo_phan_dung: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tinh_vi: string; // Cũ – giữ để tương thích

  @Column({ type: 'varchar', length: 100, nullable: true })
  tinh: string; // Tính: Hàn, Nhiệt, Ôn, Lương, Bình

  @Column({ type: 'varchar', length: 100, nullable: true })
  vi: string; // Vị: Chua, Đắng, Ngọt, Cay, Mặn, Nhạt

  @Column({ type: 'varchar', length: 512, nullable: true })
  quy_kinh: string; // Quy vào kinh nào: Phế, Can, Tỳ... (chọn nhiều cách nhau bởi dấu phẩy)

  @Column({ type: 'text', nullable: true })
  cong_dung: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lieu_dung: string;

  @Column({ type: 'text', nullable: true })
  luu_y: string;

  @OneToMany(() => BaiThuocChiTiet, (detail) => detail.viThuoc)
  baiThuocDetails: BaiThuocChiTiet[];
}
