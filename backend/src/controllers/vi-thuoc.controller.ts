import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViThuoc } from '../models/vi-thuoc.model';
import { CreateViThuocDto, UpdateViThuocDto } from '../models/dongy-thuoc.dto';

const VI_THUOC_RELATIONS = {
  nhomLinks: { nhomNho: { nhomLon: true } },
} as const;

@Injectable()
export class ViThuocService {
  constructor(
    @InjectRepository(ViThuoc)
    private repo: Repository<ViThuoc>,
  ) {}

  findAll(): Promise<ViThuoc[]> {
    return this.repo.find({
      relations: VI_THUOC_RELATIONS,
      order: { ten_vi_thuoc: 'ASC' },
    });
  }

  findOne(id: number): Promise<ViThuoc | null> {
    return this.repo.findOne({
      where: { id },
      relations: VI_THUOC_RELATIONS,
    });
  }

  private pickForSave(dto: Partial<CreateViThuocDto>): Partial<ViThuoc> {
    const o: Partial<ViThuoc> = {};
    if (dto.ten_vi_thuoc !== undefined) o.ten_vi_thuoc = dto.ten_vi_thuoc;
    if (dto.ten_goi_khac !== undefined) o.ten_goi_khac = dto.ten_goi_khac;
    if (dto.tinh !== undefined) o.tinh = dto.tinh;
    if (dto.vi !== undefined) o.vi = dto.vi;
    if (dto.quy_kinh !== undefined) o.quy_kinh = dto.quy_kinh;
    if (dto.lieu_dung !== undefined) o.lieu_dung = dto.lieu_dung;
    if (dto.cong_dung !== undefined) o.cong_dung = dto.cong_dung;
    if (dto.chu_tri !== undefined) o.chu_tri = dto.chu_tri;
    if (dto.kieng_ky !== undefined) o.kieng_ky = dto.kieng_ky;
    return o;
  }

  create(dto: CreateViThuocDto): Promise<ViThuoc> {
    const item = this.repo.create(this.pickForSave(dto) as ViThuoc);
    return this.repo.save(item);
  }

  async update(id: number, dto: UpdateViThuocDto): Promise<ViThuoc | null> {
    const patch = this.pickForSave(dto);
    await this.repo.update(id, patch);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
