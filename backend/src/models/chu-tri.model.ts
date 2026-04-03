import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('chu_tri')
export class ChuTri {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_chu_tri: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: '' })
  ghi_chu: string;
}
