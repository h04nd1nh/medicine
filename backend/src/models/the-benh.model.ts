import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MeridianSyndrome } from './meridian-syndrome.model';

// Lazy import để tránh circular dependency
@Entity('the_benh')
export class TheBenh {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_benh' })
  idBenh: number;

  @Column({ type: 'int', name: 'parent_id', nullable: true })
  parentId: number | null;

  @Column({ type: 'varchar', length: 255 })
  ten_the_benh: string;

  @Column({ type: 'text', nullable: true })
  mo_ta: string;

  @Column({ type: 'int', default: 0 })
  thu_tu: number;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => MeridianSyndrome, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_benh' })
  benh: MeridianSyndrome;

  @ManyToOne(() => TheBenh, (tb) => tb.dieuKienPhu, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: TheBenh | null;

  @OneToMany(() => TheBenh, (tb) => tb.parent)
  dieuKienPhu: TheBenh[];
}
