import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('kieng_ky')
export class KiengKy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_kieng_ky: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: '' })
  ghi_chu: string;
}
