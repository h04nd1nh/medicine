import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  patientId: number;

  @Column({ type: 'date' })
  appointmentDate: string;

  @Column({ type: 'varchar', length: 10 })
  appointmentTime: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // PENDING, CONFIRMED, COMPLETED, CANCELLED

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
