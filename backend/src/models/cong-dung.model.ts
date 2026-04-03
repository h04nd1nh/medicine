import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cong_dung')
export class CongDung {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_cong_dung: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: '' })
  ghi_chu: string;
}
