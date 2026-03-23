import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViThuoc } from '../models/vi-thuoc.model';
import { CreateViThuocDto, UpdateViThuocDto } from '../models/dongy-thuoc.dto';

@Injectable()
export class ViThuocService {
  constructor(
    @InjectRepository(ViThuoc)
    private repo: Repository<ViThuoc>,
  ) {}

  findAll(): Promise<ViThuoc[]> {
    return this.repo.find({ order: { ten_vi_thuoc: 'ASC' } });
  }

  findOne(id: number): Promise<ViThuoc | null> {
    return this.repo.findOneBy({ id });
  }

  create(dto: CreateViThuocDto): Promise<ViThuoc> {
    const item = this.repo.create(dto);
    return this.repo.save(item);
  }

  async update(id: number, dto: UpdateViThuocDto): Promise<ViThuoc | null> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
