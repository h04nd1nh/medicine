import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhuongThuoc } from '../models/phuong-thuoc.model';
import { CreatePhuongThuocDto, UpdatePhuongThuocDto } from '../models/phuong-thuoc.dto';

@Injectable()
export class PhuongThuocService {
  constructor(
    @InjectRepository(PhuongThuoc)
    private readonly repo: Repository<PhuongThuoc>,
  ) {}

  findAll(): Promise<PhuongThuoc[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<PhuongThuoc> {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Phương thuốc #${id} không tồn tại`);
    }
    return item;
  }

  create(dto: CreatePhuongThuocDto): Promise<PhuongThuoc> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdatePhuongThuocDto): Promise<PhuongThuoc> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
