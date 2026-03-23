import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrieuChung } from '../models/trieu-chung.model';
import { CreateTrieuChungDto, UpdateTrieuChungDto } from '../models/trieu-chung.dto';

@Injectable()
export class TrieuChungService {
  constructor(
    @InjectRepository(TrieuChung)
    private readonly repo: Repository<TrieuChung>,
  ) {}

  findAll(): Promise<TrieuChung[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<TrieuChung> {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Triệu chứng #${id} không tồn tại`);
    }
    return item;
  }

  create(dto: CreateTrieuChungDto): Promise<TrieuChung> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateTrieuChungDto): Promise<TrieuChung> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
