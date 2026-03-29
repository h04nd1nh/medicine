import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../models/appointment.model';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../models/appointment.dto';
import { FirebaseService } from './firebase.controller';
import { PatientsService } from './patient.controller';

export interface PaginatedAppointments {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly firebaseService: FirebaseService,
    private readonly patientsService: PatientsService,
  ) {}

  findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({ order: { appointmentDate: 'ASC', appointmentTime: 'ASC' } });
  }

  async findMy(patientId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { patientId },
      order: { appointmentDate: 'DESC', appointmentTime: 'DESC' },
    });
  }

  async findPaginated(page: number = 1, limit: number = 10): Promise<PaginatedAppointments> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.appointmentRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOneBy({ id });
    if (!appointment) {
      throw new NotFoundException(`Lịch hẹn #${id} không tồn tại`);
    }
    return appointment;
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment[]> {
    const isWeekly = dto.type === 'WEEKLY' && dto.weeks && dto.weeks > 1;
    const count = isWeekly ? dto.weeks! : 1;
    let groupId: string | null = null;
    
    if (isWeekly) {
      const crypto = require('crypto');
      groupId = crypto.randomUUID();
    }

    const appointments: Appointment[] = [];
    const baseDate = new Date(dto.appointmentDate);

    for (let i = 0; i < count; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(currentDate.getDate() + i * 7);
      
      const appointment = this.appointmentRepository.create({
        ...dto,
        appointmentDate: currentDate.toISOString().split('T')[0],
        type: isWeekly ? 'WEEKLY' : 'SINGLE',
        groupId,
      });
      appointments.push(appointment);
    }

    return this.appointmentRepository.save(appointments);
  }

  async update(id: number, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    const oldStatus = appointment.status;
    
    Object.assign(appointment, dto);
    const saved = await this.appointmentRepository.save(appointment);

    if (dto.status && dto.status !== oldStatus) {
      await this.notifyStatusChange(saved);
    }

    return saved;
  }

  async cancelMy(id: number, patientId: number): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên lịch hẹn này');
    }
    appointment.status = 'CANCELLED';
    const saved = await this.appointmentRepository.save(appointment);
    
    await this.notifyStatusChange(saved);
    
    return saved;
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }

  private async notifyStatusChange(appointment: Appointment) {
    try {
      const patient = await this.patientsService.findOne(appointment.patientId);
      if (patient && patient.fcmToken) {
        let title = 'Cập nhật lịch hẹn';
        let body = `Lịch hẹn ngày ${appointment.appointmentDate} lúc ${appointment.appointmentTime} của bạn đã thay đổi trạng thái thành: ${this.getStatusText(appointment.status)}`;
        
        await this.firebaseService.sendNotification(patient.fcmToken, title, body, {
          appointmentId: appointment.id.toString(),
          type: 'APPOINTMENT_UPDATE',
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Đang chờ';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'CANCELLED': return 'Đã hủy';
      case 'COMPLETED': return 'Đã hoàn thành';
      default: return status;
    }
  }
}
