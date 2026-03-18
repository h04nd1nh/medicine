import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(MeridianSyndrome)
    private readonly repo: Repository<MeridianSyndrome>,
  ) {}

  findAll(): Promise<MeridianSyndrome[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<MeridianSyndrome> {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException(`Mô hình #${id} không tồn tại`);
    return row;
  }

  async create(data: Partial<MeridianSyndrome>): Promise<MeridianSyndrome> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<MeridianSyndrome>): Promise<MeridianSyndrome> {
    const existing = await this.findOne(id);
    Object.assign(existing, data);
    return this.repo.save(existing);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
    return { success: true };
  }
}
