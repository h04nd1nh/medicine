import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TheBenh } from './the-benh.model';
import { HuyetVi } from './huyet-vi.model';

@Entity('the_benh_phuong_huyet')
export class TheBenhPhuongHuyet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_the_benh' })
  idTheBenh: number;

  @Column({ type: 'int', name: 'id_huyet', nullable: true })
  idHuyet: number | null; // null = thuần ghi chú, không có huyệt cụ thể

  @Column({ type: 'varchar', length: 50, nullable: true })
  phuong_phap: string; // Bổ / Tả / Cứu bổ / Châm tả / Không châm

  @Column({ type: 'varchar', length: 100, nullable: true })
  vai_tro: string; // Chính / Phụ / Cấp cứu

  @Column({ type: 'text', nullable: true })
  ghi_chu: string; // "Sau đó dùng toàn bộ phương huyệt kể trên"

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => TheBenh, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_the_benh' })
  theBenh: TheBenh;

  @ManyToOne(() => HuyetVi, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'id_huyet' })
  huyetVi: HuyetVi | null;
}
