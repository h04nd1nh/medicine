import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('nhom_duoc_ly')
export class NhomDuocLy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_nhom: string;
}
