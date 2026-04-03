import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { NhomDuocLyLon } from './nhom-duoc-ly-lon.model';
import { ViThuocNhomNho } from './vi-thuoc-nhom-nho.model';

@Entity('nhom_duoc_ly_nho')
export class NhomDuocLyNho {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_nhom_lon', nullable: true })
  id_nhom_lon: number | null;

  @ManyToOne(() => NhomDuocLyLon, (lon) => lon.nhomNhoList, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_nhom_lon' })
  nhomLon: NhomDuocLyLon | null;

  @Column({ name: 'ten_nhom_nho', type: 'varchar', length: 255 })
  ten_nhom_nho: string;

  @Column({ type: 'text', nullable: true })
  mo_ta: string | null;

  @OneToMany(() => ViThuocNhomNho, (l) => l.nhomNho)
  viLinks: ViThuocNhomNho[];
}
