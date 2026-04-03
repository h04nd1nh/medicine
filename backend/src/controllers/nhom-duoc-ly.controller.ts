import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NhomDuocLy } from '../models/nhom-duoc-ly.model';
import { CreateNhomDuocLyDto, UpdateNhomDuocLyDto } from '../models/nhom-duoc-ly.dto';

@Injectable()
export class NhomDuocLyService {
  constructor(
    @InjectRepository(NhomDuocLy)
    private readonly repo: Repository<NhomDuocLy>,
  ) {}

  findAll(): Promise<NhomDuocLy[]> {
    return this.repo.find({ order: { ten_nhom: 'ASC' } });
  }

  async findOne(id: number): Promise<NhomDuocLy> {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Nhóm dược lý #${id} không tồn tại`);
    }
    return item;
  }

  create(dto: CreateNhomDuocLyDto): Promise<NhomDuocLy> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateNhomDuocLyDto): Promise<NhomDuocLy> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
