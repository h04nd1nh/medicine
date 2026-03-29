import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MachChan } from '../models/mach-chan.model';
import { CreateMachChanDto, UpdateMachChanDto } from '../models/mach-chan.dto';

@Injectable()
export class MachChanService {
  constructor(
    @InjectRepository(MachChan)
    private readonly repo: Repository<MachChan>,
  ) {}

  findAll(): Promise<MachChan[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async create(dto: CreateMachChanDto): Promise<MachChan> {
    const item = this.repo.create(dto);
    return this.repo.save(item);
  }

  async update(id: number, dto: UpdateMachChanDto): Promise<MachChan> {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Mạch chẩn không tồn tại');
    if (dto.ten_mach_chan) item.ten_mach_chan = dto.ten_mach_chan;
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.findOneBy({ id });
    if (item) await this.repo.remove(item);
  }
}
