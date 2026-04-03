import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ViThuoc } from './vi-thuoc.model';
import { NhomDuocLyNho } from './nhom-duoc-ly-nho.model';

@Entity('vi_thuoc_nhom_nho')
export class ViThuocNhomNho {
  @PrimaryColumn({ name: 'id_vi_thuoc' })
  idViThuoc: number;

  @PrimaryColumn({ name: 'id_nhom_nho' })
  idNhomNho: number;

  @ManyToOne(() => ViThuoc, (v) => v.nhomLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_vi_thuoc' })
  viThuoc: ViThuoc;

  @ManyToOne(() => NhomDuocLyNho, (n) => n.viLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_nhom_nho' })
  nhomNho: NhomDuocLyNho;
}
