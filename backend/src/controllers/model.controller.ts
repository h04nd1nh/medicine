import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';
import { BaiThuoc } from '../models/bai-thuoc.model';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(MeridianSyndrome)
    private readonly repo: Repository<MeridianSyndrome>,
    @InjectRepository(BaiThuoc)
    private readonly baiThuocRepo: Repository<BaiThuoc>,
  ) {}

  findAll(): Promise<MeridianSyndrome[]> {
    return this.repo.find({
      relations: ['baiThuocList'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<MeridianSyndrome> {
    const row = await this.repo.findOne({
      where: { id },
      relations: ['baiThuocList'],
    });
    if (!row) throw new NotFoundException(`Mô hình #${id} không tồn tại`);
    return row;
  }

  async create(data: any): Promise<MeridianSyndrome> {
    const { bai_thuoc_ids, ...rest } = data;
    const entity = this.repo.create(rest as Partial<MeridianSyndrome>);

    if (bai_thuoc_ids && bai_thuoc_ids.length > 0) {
      entity.baiThuocList = await this.baiThuocRepo.findBy({
        id: In(bai_thuoc_ids),
      });
    }

    return this.repo.save(entity);
  }

  async update(id: number, data: any): Promise<MeridianSyndrome> {
    const { bai_thuoc_ids, ...rest } = data;
    const existing = await this.findOne(id);
    Object.assign(existing, rest);

    if (bai_thuoc_ids !== undefined) {
      existing.baiThuocList = bai_thuoc_ids.length > 0
        ? await this.baiThuocRepo.findBy({ id: In(bai_thuoc_ids) })
        : [];
    }

    return this.repo.save(existing);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
    return { success: true };
  }
}
