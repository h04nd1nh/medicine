import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('mach_chan')
export class MachChan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_mach_chan: string;
}
