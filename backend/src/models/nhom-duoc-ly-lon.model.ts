import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { NhomDuocLyNho } from './nhom-duoc-ly-nho.model';

@Entity('nhom_duoc_ly_lon')
export class NhomDuocLyLon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_nhom_lon', type: 'varchar', length: 255 })
  ten_nhom_lon: string;

  @OneToMany(() => NhomDuocLyNho, (n) => n.nhomLon)
  nhomNhoList: NhomDuocLyNho[];
}
