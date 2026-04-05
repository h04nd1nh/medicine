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

  /** Tách triệu chứng văn bản thành chuỗi chip (phẩy) giống các cột CSV ở phap_tri */
  private trieuchungToChipCsv(raw: string | null | undefined): string | null {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (!s) return null;
    const parts = s
      .split(/[\n\r,;，、]+/)
      .map((t) => t.replace(/^\s*[-•*·]\s+/, '').trim())
      .filter(Boolean);
    if (!parts.length) return null;
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const p of parts) {
      if (seen.has(p)) continue;
      seen.add(p);
      ordered.push(p);
    }
    return ordered.join(', ');
  }

  /** Đồng bộ tiểu kết / triệu chứng / bệnh lý sang mọi pháp trị gắn id_benh_dong_y (kèm quan hệ trieu_chung_list). */
  private async syncLinkedPhapTriFromBenh(b: MeridianSyndrome): Promise<void> {
    const chipCsv = this.trieuchungToChipCsv(b.trieuchung);
    const pts = await this.phapTriRepo.find({
      where: { benh_dong_y: { id: b.id } },
      relations: ['trieu_chung_list'],
    });
    if (!pts.length) return;
    const allTc = await this.trieuChungRepo.find();
    const byLower = new Map(allTc.map((t) => [t.ten_trieu_chung.trim().toLowerCase(), t]));
    const parts = chipCsv
      ? chipCsv
          .split(/[\n\r,;，、]+/)
          .map((t) => t.replace(/^\s*[-•*·]\s+/, '').trim())
          .filter(Boolean)
      : [];
    const seenPart = new Set<string>();
    const orderedParts: string[] = [];
    for (const p of parts) {
      const k = p.toLowerCase();
      if (seenPart.has(k)) continue;
      seenPart.add(k);
      orderedParts.push(p);
    }
    const seenId = new Set<number>();
    const triList: TrieuChung[] = [];
    for (const p of orderedParts) {
      const hit = byLower.get(p.toLowerCase());
      if (hit && !seenId.has(hit.id)) {
        seenId.add(hit.id);
        triList.push(hit);
      }
    }
    for (const pt of pts) {
      pt.chung_trang = b.tieuket ?? null;
      pt.nguyen_tac = b.benhly ?? null;
      pt.trieu_chung_mo_ta = chipCsv;
      pt.trieu_chung_list = triList;
      await this.phapTriRepo.save(pt);
    }
  }

  findAll(): Promise<MeridianSyndrome[]> {
    return this.repo.find({
      relations: ['baiThuocList', 'trieuChungList'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<MeridianSyndrome> {
    const row = await this.repo.findOne({
      where: { id },
      relations: ['baiThuocList', 'trieuChungList'],
    });
    if (!row) throw new NotFoundException(`Mô hình #${id} không tồn tại`);
    return row;
  }

  async create(data: any): Promise<MeridianSyndrome> {
    const { bai_thuoc_ids, trieu_chung_ids, ...rest } = data;
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
    await this.syncLinkedPhapTriFromBenh(saved);
    return saved;
  }

  async update(id: number, data: any): Promise<MeridianSyndrome> {
    const { bai_thuoc_ids, trieu_chung_ids, ...rest } = data;
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
    await this.syncLinkedPhapTriFromBenh(saved);
    return saved;
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
    return { success: true };
  }
}
