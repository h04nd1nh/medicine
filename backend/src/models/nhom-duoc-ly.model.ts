import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('nhom_duoc_ly')
export class NhomDuocLy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ten_nhom: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nhom_lon: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nhom_con: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nhom_nho: string | null;

  @Column({ type: 'text', nullable: true })
  mo_ta: string | null;
}
