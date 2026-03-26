import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../models/appointment.model';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../models/appointment.dto';

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

  create(dto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = this.appointmentRepository.create(dto);
    return this.appointmentRepository.save(appointment);
  }

  async update(id: number, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, dto);
    return this.appointmentRepository.save(appointment);
  }

  async cancelMy(id: number, patientId: number): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên lịch hẹn này');
    }
    appointment.status = 'CANCELLED';
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }
}
