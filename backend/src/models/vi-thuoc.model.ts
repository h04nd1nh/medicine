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

  // ── YHCT Pharmacology Fields (for radar chart analysis) ──

  @Column({ type: 'varchar', length: 100, nullable: true })
  nhom_duoc_ly: string; // Nhóm dược lý: Tiêu thực, Bổ khí, Thanh nhiệt...

  @Column({ type: 'float', nullable: true, default: 0 })
  tu_khi: number; // Tứ khí: -2 (Đại hàn) → 0 (Bình) → 2 (Nhiệt)

  @Column({ type: 'float', nullable: true, default: 0 })
  vi_toan: number; // Ngũ vị – Chua (0–5)

  @Column({ type: 'float', nullable: true, default: 0 })
  vi_khu: number; // Ngũ vị – Đắng (0–5)

  @Column({ type: 'float', nullable: true, default: 0 })
  vi_cam: number; // Ngũ vị – Ngọt (0–5)

  @Column({ type: 'float', nullable: true, default: 0 })
  vi_tan: number; // Ngũ vị – Cay (0–5)

  @Column({ type: 'float', nullable: true, default: 0 })
  vi_ham: number; // Ngũ vị – Mặn (0–5)

  @Column({ type: 'float', nullable: true, default: 3 })
  huong_tgpt: number; // Hướng vận động: 1 (Giáng mạnh) → 3 (Bình) → 5 (Thăng mạnh)

  @Column({ type: 'varchar', length: 255, nullable: true })
  tac_dung_chinh: string; // Tác dụng chính (dùng để xác định Quân-Thần-Tá-Sứ)

  @OneToMany(() => BaiThuocChiTiet, (detail) => detail.viThuoc)
  baiThuocDetails: BaiThuocChiTiet[];
}
