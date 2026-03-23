import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaiThuoc } from './bai-thuoc.model';
import { ViThuoc } from './vi-thuoc.model';

@Entity('bai_thuoc_chi_tiet')
export class BaiThuocChiTiet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_bai_thuoc' })
  idBaiThuoc: number;

  @Column({ name: 'id_vi_thuoc' })
  idViThuoc: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lieu_luong: string; // "12g", "bán tiền"...

  @Column({ type: 'varchar', length: 100, nullable: true })
  vai_tro: string; // Quân, Thần, Tá, Sứ...

  @Column({ type: 'text', nullable: true })
  ghi_chu: string; // Tẩm rượu, sao vàng...

  @ManyToOne(() => BaiThuoc, (bt) => bt.chiTietViThuoc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_bai_thuoc' })
  baiThuoc: BaiThuoc;

  @ManyToOne(() => ViThuoc, (vt) => vt.baiThuocDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;
}
