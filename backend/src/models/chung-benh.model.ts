import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { BenhTayY } from './benh-tay-y.model';

@Entity('chung_benh')
export class ChungBenh {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ten_chung_benh: string;

  @OneToMany(() => BenhTayY, (b) => b.chungBenh)
  benhTayYList: BenhTayY[];
}
