import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('thiet_chan')
export class ThietChan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_thiet_chan: string;
}
