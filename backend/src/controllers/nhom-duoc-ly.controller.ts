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
    return this.repo.find({ order: { nhom_lon: 'ASC', nhom_con: 'ASC', nhom_nho: 'ASC', ten_nhom: 'ASC' } });
  }

  async findOne(id: number): Promise<NhomDuocLy> {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Nhóm dược lý #${id} không tồn tại`);
    }
    return item;
  }

  create(dto: CreateNhomDuocLyDto): Promise<NhomDuocLy> {
    const normalized = this.normalizeDto(dto);
    const entity = this.repo.create(normalized);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateNhomDuocLyDto): Promise<NhomDuocLy> {
    const item = await this.findOne(id);
    Object.assign(item, this.normalizeDto(dto));
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }

  private normalizeDto(dto: CreateNhomDuocLyDto | UpdateNhomDuocLyDto): Partial<NhomDuocLy> {
    const nhomLon = (dto.nhom_lon ?? '').trim();
    const nhomCon = (dto.nhom_con ?? '').trim();
    const nhomNho = (dto.nhom_nho ?? '').trim();
    const tenNhomLegacy = (dto.ten_nhom ?? '').trim();

    return {
      nhom_lon: nhomLon || null,
      nhom_con: nhomCon || null,
      nhom_nho: nhomNho || tenNhomLegacy || null,
      mo_ta: (dto.mo_ta ?? '').trim() || null,
      ten_nhom: tenNhomLegacy || nhomNho || null,
    };
  }
}
