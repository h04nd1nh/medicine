import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Examination } from '../models/examination.model';
import { CreateExaminationDto } from '../models/examination.dto';
import { MeridiansService, AnalyzeInputDto } from './meridian.controller';
import { PatientsService } from './patient.controller';

@Injectable()
export class ExaminationsService {
  constructor(
    @InjectRepository(Examination)
    private readonly examinationRepository: Repository<Examination>,
    private readonly meridiansService: MeridiansService,
    private readonly patientsService: PatientsService,
  ) {}

  async create(dto: CreateExaminationDto): Promise<Examination> {
    await this.patientsService.findOne(dto.patientId);

    const analyzeInput: AnalyzeInputDto = {
      tieutruongtrai: dto.tieutruongtrai,
      tieutruongphai: dto.tieutruongphai,
      tamtrai: dto.tamtrai,
      tamphai: dto.tamphai,
      tamtieutrai: dto.tamtieutrai,
      tamtieuphai: dto.tamtieuphai,
      tambaotrai: dto.tambaotrai,
      tambaophai: dto.tambaophai,
      daitrangtrai: dto.daitrangtrai,
      daitrangphai: dto.daitrangphai,
      phetrai: dto.phetrai,
      phephai: dto.phephai,
      bangquangtrai: dto.bangquangtrai,
      bangquangphai: dto.bangquangphai,
      thantrai: dto.thantrai,
      thanphai: dto.thanphai,
      damtrai: dto.damtrai,
      damphai: dto.damphai,
      vitrai: dto.vitrai,
      viphai: dto.viphai,
      cantrai: dto.cantrai,
      canphai: dto.canphai,
      tytrai: dto.tytrai,
      typhai: dto.typhai,
    };

    const result = await this.meridiansService.analyze(analyzeInput);

    const inputData: Record<string, number> = { ...analyzeInput };

    const examination = this.examinationRepository.create({
      patientId: dto.patientId,
      inputData,
      amDuong: result.am_duong,
      khi: result.khi,
      huyet: result.huyet,
      flags: result.flags,
      syndromes: result.syndromes as any[],
      notes: dto.notes ?? null,
    });

    return this.examinationRepository.save(examination);
  }

  findByPatient(patientId: number): Promise<Examination[]> {
    return this.examinationRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Examination> {
    const examination = await this.examinationRepository.findOneBy({ id });
    if (!examination) {
      throw new NotFoundException(`Ca khám #${id} không tồn tại`);
    }
    return examination;
  }

  async remove(id: number): Promise<void> {
    const examination = await this.findOne(id);
    await this.examinationRepository.remove(examination);
  }
}
