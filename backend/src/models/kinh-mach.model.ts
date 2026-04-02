import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { HuyetVi } from './huyet-vi.model';

@Entity('kinh_mach')
export class KinhMach {
  @PrimaryGeneratedColumn({ name: 'id_kinh_mach' })
  idKinhMach: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ten_kinh_mach: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ten_viet_tat: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ky_hieu_quoc_te: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ngu_hanh: string;

  @Column({ type: 'int', nullable: true })
  tong_so_huyet: number;

  @OneToMany(() => HuyetVi, (h) => h.kinhMach)
  huyetViList: HuyetVi[];
}
