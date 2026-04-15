import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { TrieuChung } from '../models/trieu-chung.model';
import { PhapTri } from '../models/phap-tri.model';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(MeridianSyndrome)
    private readonly repo: Repository<MeridianSyndrome>,
    @InjectRepository(BaiThuoc)
    private readonly baiThuocRepo: Repository<BaiThuoc>,
    @InjectRepository(TrieuChung)
    private readonly trieuChungRepo: Repository<TrieuChung>,
    @InjectRepository(PhapTri)
    private readonly phapTriRepo: Repository<PhapTri>,
  ) {}

  findAll(): Promise<MeridianSyndrome[]> {
    return this.repo.find({
      relations: ['baiThuocList', 'trieuChungList', 'phap_tri_list'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<MeridianSyndrome> {
    const row = await this.repo.findOne({
      where: { id },
      relations: ['baiThuocList', 'trieuChungList', 'phap_tri_list'],
    });
    if (!row) throw new NotFoundException(`Mô hình #${id} không tồn tại`);
    return row;
  }

  async create(data: any): Promise<MeridianSyndrome> {
    const { bai_thuoc_ids, trieu_chung_ids, phap_tri_ids, ...rest } = data;
    const entity = this.repo.create(rest as Partial<MeridianSyndrome>);

    if (bai_thuoc_ids && bai_thuoc_ids.length > 0) {
      entity.baiThuocList = await this.baiThuocRepo.findBy({
        id: In(bai_thuoc_ids),
      });
    }
    if (trieu_chung_ids && trieu_chung_ids.length > 0) {
      entity.trieuChungList = await this.trieuChungRepo.findBy({
        id: In(trieu_chung_ids),
      });
    }

    const saved = await this.repo.save(entity);

    if (phap_tri_ids !== undefined) {
      const ids = Array.isArray(phap_tri_ids) ? phap_tri_ids : [];
      if (ids.length > 0) {
        const links = await this.phapTriRepo.findBy({ id: In(ids) });
        for (const row of links) row.benh_dong_y = saved;
        await this.phapTriRepo.save(links);
      }
    }

    return this.findOne(saved.id);
  }

  async update(id: number, data: any): Promise<MeridianSyndrome> {
    const { bai_thuoc_ids, trieu_chung_ids, phap_tri_ids, ...rest } = data;
    const existing = await this.findOne(id);
    Object.assign(existing, rest);

    if (bai_thuoc_ids !== undefined) {
      existing.baiThuocList = bai_thuoc_ids.length > 0
        ? await this.baiThuocRepo.findBy({ id: In(bai_thuoc_ids) })
        : [];
    }
    if (trieu_chung_ids !== undefined) {
      existing.trieuChungList = trieu_chung_ids.length > 0
        ? await this.trieuChungRepo.findBy({ id: In(trieu_chung_ids) })
        : [];
    }

    const saved = await this.repo.save(existing);

    if (phap_tri_ids !== undefined) {
      const ids = Array.isArray(phap_tri_ids) ? phap_tri_ids : [];
      const want = new Set(ids.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0));

      const linkedNow = await this.phapTriRepo.find({
        where: { benh_dong_y: { id } },
        relations: ['benh_dong_y'],
      });
      const toSave: PhapTri[] = [];

      for (const row of linkedNow) {
        if (!want.has(Number(row.id))) {
          row.benh_dong_y = null;
          toSave.push(row);
        }
      }

      if (want.size > 0) {
        const target = await this.phapTriRepo.findBy({ id: In([...want]) });
        for (const row of target) {
          row.benh_dong_y = saved;
          toSave.push(row);
        }
      }

      if (toSave.length > 0) await this.phapTriRepo.save(toSave);
    }

    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
    return { success: true };
  }
}
