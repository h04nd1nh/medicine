import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../models/patient.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientAuthService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly jwtService: JwtService,
  ) {}

  async register(phone: string, password: string, fullName?: string): Promise<any> {
    const existingPatient = await this.patientRepository.findOne({ where: { phone } });
    if (existingPatient) {
      if (existingPatient.passwordHash) {
        throw new BadRequestException('Số điện thoại này đã được đăng ký!');
      } else {
        // Patient exists but without password (maybe created by admin previously), update it
        existingPatient.passwordHash = await bcrypt.hash(password, 10);
        if (fullName) existingPatient.fullName = fullName;
        await this.patientRepository.save(existingPatient);
        return this.login(existingPatient);
      }
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const newPatient = this.patientRepository.create({
      phone,
      passwordHash,
      fullName: fullName || 'Bệnh nhân mới',
    });
    
    await this.patientRepository.save(newPatient);
    return this.login(newPatient);
  }

  async validatePatient(phone: string, pass: string): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({ where: { phone } });
    if (patient && patient.passwordHash && (await bcrypt.compare(pass, patient.passwordHash))) {
      return patient;
    }
    return null;
  }

  async login(patient: Patient) {
    const payload = { phone: patient.phone, sub: patient.id, role: 'patient' };
    return {
      access_token: this.jwtService.sign(payload),
      patient: {
        id: patient.id,
        phone: patient.phone,
        fullName: patient.fullName,
      }
    };
  }
}
