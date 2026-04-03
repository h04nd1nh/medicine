import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CongDung } from '../models/cong-dung.model';
import { CreateCongDungDto, UpdateCongDungDto } from '../models/cong-dung.dto';

@Injectable()
export class CongDungService {
  constructor(
    @InjectRepository(CongDung)
    private readonly repo: Repository<CongDung>,
  ) {}

  findAll(): Promise<CongDung[]> {
    return this.repo.find({ order: { ten_cong_dung: 'ASC' } });
  }

  async findOne(id: number): Promise<CongDung> {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException(`Công dụng #${id} không tồn tại`);
    return item;
  }

  create(dto: CreateCongDungDto): Promise<CongDung> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateCongDungDto): Promise<CongDung> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
