import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { PhapTri } from '../models/phap-tri.model';
import { CreatePhapTriDto, UpdatePhapTriDto } from '../models/phap-tri.dto';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { BaiThuocPhapTri } from '../models/bai-thuoc-phap-tri.model';
import { NhomDuocLyNho } from '../models/nhom-duoc-ly-nho.model';
import { KinhMach } from '../models/kinh-mach.model';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';
import { TrieuChung } from '../models/trieu-chung.model';

@Injectable()
export class PhapTriService {
  private static readonly RELATIONS = [
    'bai_thuoc',
    'bai_thuoc_links',
    'bai_thuoc_links.baiThuoc',
    'nhom_duoc_ly_nho',
    'nhom_duoc_ly_nho.nhomLon',
    'nhom_duoc_ly_nho_list',
    'benh_dong_y_list',
    'kinh_mach_list',
    'trieu_chung_list',
  ] as const;

  constructor(
    @InjectRepository(PhapTri)
    private readonly repo: Repository<PhapTri>,
    @InjectRepository(BaiThuoc)
    private readonly baiThuocRepo: Repository<BaiThuoc>,
    @InjectRepository(NhomDuocLyNho)
    private readonly nhomNhoRepo: Repository<NhomDuocLyNho>,
    @InjectRepository(KinhMach)
    private readonly kinhRepo: Repository<KinhMach>,
    @InjectRepository(MeridianSyndrome)
    private readonly benhDongYRepo: Repository<MeridianSyndrome>,
    @InjectRepository(BaiThuocPhapTri)
    private readonly baiPhapTriLinkRepo: Repository<BaiThuocPhapTri>,
    @InjectRepository(TrieuChung)
    private readonly trieuChungRepo: Repository<TrieuChung>,
  ) {}

  findAll(): Promise<PhapTri[]> {
    return this.repo.find({
      relations: [...PhapTriService.RELATIONS],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PhapTri> {
    const item = await this.repo.findOne({
      where: { id },
      relations: [...PhapTriService.RELATIONS],
    });
    if (!item) {
      throw new NotFoundException(`Pháp trị #${id} không tồn tại`);
    }
    return item;
  }

  private static has<K extends string>(dto: object, key: K): dto is Record<K, unknown> {
    return Object.prototype.hasOwnProperty.call(dto, key);
  }

  /** Ưu tiên key mới the_benh; fallback chung_trang để tương thích client cũ. */
  private static readTheBenh(dto: CreatePhapTriDto | UpdatePhapTriDto): string | null | undefined {
    if (PhapTriService.has(dto, 'the_benh')) return dto.the_benh;
    if (PhapTriService.has(dto, 'chung_trang')) return dto.chung_trang;
    return undefined;
  }

  private async resolveKinhMach(ids?: number[] | null): Promise<KinhMach[]> {
    if (!ids?.length) return [];
    return this.kinhRepo.findBy({ idKinhMach: In(ids) });
  }

  private async resolveNhomNho(ids?: number[] | null): Promise<NhomDuocLyNho[]> {
    if (!ids?.length) return [];
    return this.nhomNhoRepo.findBy({ id: In(ids) });
  }

  /** PG 23505 = unique_violation (vd. id_benh_dong_y UNIQUE) */
  private static isPostgresUniqueViolation(err: unknown): boolean {
    return err instanceof QueryFailedError && (err as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505';
  }

  private async resolveBenhDongY(ids?: number[] | null): Promise<MeridianSyndrome[]> {
    if (!ids?.length) return [];
    return this.benhDongYRepo.findBy({ id: In(ids) });
  }

  /** create: thiếu key → null; update: chỉ đổi khi key có trong body */
  private async applyRefs(
    entity: PhapTri,
    dto: CreatePhapTriDto | UpdatePhapTriDto,
    mode: 'create' | 'update',
  ): Promise<void> {
    const touch = (key: keyof CreatePhapTriDto) =>
      mode === 'create' || PhapTriService.has(dto, key as string);

    if (touch('id_nhom_duoc_ly_nho_list')) {
      const ids = [...new Set((dto.id_nhom_duoc_ly_nho_list ?? []).filter((x): x is number => Number.isFinite(x)))];
      const list = await this.resolveNhomNho(ids);
      entity.nhom_duoc_ly_nho_list = list;
      entity.nhom_duoc_ly_nho = list.length > 0 ? list[0] : null;
    } else if (touch('id_nhom_duoc_ly_nho')) {
      const v = dto.id_nhom_duoc_ly_nho;
      if (v == null) {
        entity.nhom_duoc_ly_nho = null;
        entity.nhom_duoc_ly_nho_list = [];
      } else {
        const n = await this.nhomNhoRepo.findOneBy({ id: v });
        entity.nhom_duoc_ly_nho = n ?? null;
        entity.nhom_duoc_ly_nho_list = n ? [n] : [];
      }
    } else if (mode === 'create') {
      entity.nhom_duoc_ly_nho = null;
      entity.nhom_duoc_ly_nho_list = [];
    }

    const hasMany = PhapTriService.has(dto, 'id_benh_dong_y_list');
    const hasSingle = PhapTriService.has(dto, 'id_benh_dong_y');
    if (mode === 'create' || hasMany || hasSingle) {
      const ids = hasMany
        ? dto.id_benh_dong_y_list ?? []
        : hasSingle && dto.id_benh_dong_y != null
          ? [dto.id_benh_dong_y]
          : [];
      const uniq = [...new Set(ids.filter((x): x is number => Number.isFinite(Number(x))).map((x) => Number(x)))];
      entity.benh_dong_y_list = await this.resolveBenhDongY(uniq);
    }

    if (touch('id_kinh_mach_list')) {
      entity.kinh_mach_list = await this.resolveKinhMach(dto.id_kinh_mach_list);
    } else if (mode === 'create') {
      entity.kinh_mach_list = [];
    }

    await this.applyTrieuChungAndMoTa(entity, dto, mode);
  }

  private formatMoTaFromTrieuChungList(list: TrieuChung[]): string | null {
    if (!list.length) return null;
    return list
      .map((t) => t.ten_trieu_chung.trim())
      .filter(Boolean)
      .join(', ');
  }

  private splitTrieuChungMoTaParts(raw: string | null | undefined): string[] {
    if (raw == null || !String(raw).trim()) return [];
    const parts = String(raw)
      .split(/[\n\r,;，、]+/)
      .map((t) => t.replace(/^\s*[-•*·]\s+/, '').trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of parts) {
      const k = p.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
    }
    return out;
  }

  private async resolveTrieuChungAndMoTaFromText(
    moTa: string | null,
  ): Promise<{ list: TrieuChung[]; moTa: string | null }> {
    const parts = this.splitTrieuChungMoTaParts(moTa);
    if (!parts.length) return { list: [], moTa: null };
    const all = await this.trieuChungRepo.find();
    const byLower = new Map<string, TrieuChung>();
    for (const t of all) {
      byLower.set(t.ten_trieu_chung.trim().toLowerCase(), t);
    }
    const list: TrieuChung[] = [];
    const unmatched: string[] = [];
    const seenId = new Set<number>();
    for (const p of parts) {
      const hit = byLower.get(p.toLowerCase());
      if (hit && !seenId.has(hit.id)) {
        seenId.add(hit.id);
        list.push(hit);
      } else if (!hit) {
        unmatched.push(p);
      }
    }
    const matchedCsv = this.formatMoTaFromTrieuChungList(list);
    const moTaOut =
      unmatched.length > 0
        ? (matchedCsv ? matchedCsv + ', ' : '') + unmatched.join(', ')
        : matchedCsv;
    return { list, moTa: moTaOut || null };
  }

  private async applyTrieuChungAndMoTa(
    entity: PhapTri,
    dto: CreatePhapTriDto | UpdatePhapTriDto,
    mode: 'create' | 'update',
  ): Promise<void> {
    const hasList = PhapTriService.has(dto, 'id_trieu_chung_list');
    const hasText = PhapTriService.has(dto, 'trieu_chung_mo_ta');

    if (mode === 'update' && !hasList && !hasText) {
      return;
    }

    if (hasList) {
      const ids = [...new Set((dto.id_trieu_chung_list ?? []).filter((x): x is number => Number.isFinite(x)))];
      const found = ids.length ? await this.trieuChungRepo.findBy({ id: In(ids) }) : [];
      const byId = new Map(found.map((t) => [t.id, t]));
      entity.trieu_chung_list = ids.map((id) => byId.get(id)).filter((t): t is TrieuChung => t != null);
      entity.trieu_chung_mo_ta = this.formatMoTaFromTrieuChungList(entity.trieu_chung_list);
      return;
    }

    const rawMoTa =
      hasText ? (dto.trieu_chung_mo_ta ?? null) : mode === 'create' ? (entity.trieu_chung_mo_ta ?? null) : null;
    if (mode === 'update' && !hasText) {
      return;
    }

    const resolved = await this.resolveTrieuChungAndMoTaFromText(rawMoTa);
    entity.trieu_chung_list = resolved.list;
    entity.trieu_chung_mo_ta = resolved.moTa;
  }

  /** Chuỗi id bài thuốc; 'unchanged' = không đổi junction (chỉ PUT). */
  private planBaiThuocIds(
    dto: CreatePhapTriDto | UpdatePhapTriDto,
    mode: 'create' | 'update',
  ): number[] | 'unchanged' {
    const hasList = PhapTriService.has(dto, 'id_bai_thuoc_list');
    const hasSingle = PhapTriService.has(dto, 'id_bai_thuoc');
    if (mode === 'create') {
      if (hasList) {
        return [...new Set((dto.id_bai_thuoc_list ?? []).filter((x): x is number => Number.isFinite(x)))];
      }
      if (hasSingle) {
        const v = dto.id_bai_thuoc;
        return v != null && Number.isFinite(Number(v)) ? [Number(v)] : [];
      }
      return [];
    }
    if (hasList) {
      return [...new Set((dto.id_bai_thuoc_list ?? []).filter((x): x is number => Number.isFinite(x)))];
    }
    if (hasSingle) {
      const v = dto.id_bai_thuoc;
      return v != null && Number.isFinite(Number(v)) ? [Number(v)] : [];
    }
    return 'unchanged';
  }

  private async syncPhapTriBaiThuocLinks(
    phapTriId: number,
    dto: CreatePhapTriDto | UpdatePhapTriDto,
    mode: 'create' | 'update',
  ): Promise<void> {
    const plan = this.planBaiThuocIds(dto, mode);
    if (plan === 'unchanged') {
      return;
    }
    const ids = plan;
    await this.baiPhapTriLinkRepo.delete({ idPhapTri: phapTriId });
    let ord = 0;
    for (const idBt of ids) {
      const bt = await this.baiThuocRepo.findOneBy({ id: idBt });
      if (!bt) {
        continue;
      }
      await this.baiPhapTriLinkRepo.save(
        this.baiPhapTriLinkRepo.create({
          idBaiThuoc: idBt,
          idPhapTri: phapTriId,
          thuTu: ord,
          doanChungTrang: null,
        }),
      );
      ord += 1;
    }
    const item = await this.repo.findOne({ where: { id: phapTriId } });
    if (!item) {
      return;
    }
    const firstId = ids.length > 0 ? ids[0]! : null;
    item.bai_thuoc =
      firstId != null ? ((await this.baiThuocRepo.findOneBy({ id: firstId })) ?? null) : null;
    await this.repo.save(item);
  }

  async create(dto: CreatePhapTriDto): Promise<PhapTri> {
    const theBenh = PhapTriService.readTheBenh(dto);
    const entity = this.repo.create({
      chung_trang: theBenh ?? null,
      nguyen_tac: dto.nguyen_tac ?? null,
      y_nghia_co_che: dto.y_nghia_co_che ?? null,
      bat_phap: dto.bat_phap ?? null,
      bat_cuong: dto.bat_cuong ?? null,
      luc_dam: dto.luc_dam ?? null,
      am_duong: dto.am_duong ?? null,
      ton_thuong: dto.ton_thuong ?? null,
      tac_nhan: dto.tac_nhan ?? null,
      ban_chat: dto.ban_chat ?? null,
      vi_tri_tien_trinh: dto.vi_tri_tien_trinh ?? null,
      mach_chan: dto.mach_chan ?? null,
      chat_luoi: dto.chat_luoi ?? null,
      nguyen_nhan: dto.nguyen_nhan ?? null,
      trieu_chung_mo_ta: dto.trieu_chung_mo_ta ?? null,
      kinh_mach_list: [],
      trieu_chung_list: [],
      nhom_duoc_ly_nho_list: [],
    });
    await this.applyRefs(entity, dto, 'create');
    try {
      await this.repo.save(entity);
    } catch (e) {
      if (PhapTriService.isPostgresUniqueViolation(e)) throw new ConflictException('Dữ liệu pháp trị bị trùng ràng buộc UNIQUE.');
      throw e;
    }
    await this.syncPhapTriBaiThuocLinks(entity.id, dto, 'create');
    return this.findOne(entity.id);
  }

  async update(id: number, dto: UpdatePhapTriDto): Promise<PhapTri> {
    const item = await this.findOne(id);
    const theBenh = PhapTriService.readTheBenh(dto);
    if (theBenh !== undefined) item.chung_trang = theBenh;
    if (dto.nguyen_tac !== undefined) item.nguyen_tac = dto.nguyen_tac;
    if (dto.y_nghia_co_che !== undefined) item.y_nghia_co_che = dto.y_nghia_co_che;
    if (dto.bat_phap !== undefined) item.bat_phap = dto.bat_phap;
    if (dto.bat_cuong !== undefined) item.bat_cuong = dto.bat_cuong;
    if (dto.luc_dam !== undefined) item.luc_dam = dto.luc_dam;
    if (dto.am_duong !== undefined) item.am_duong = dto.am_duong;
    if (dto.ton_thuong !== undefined) item.ton_thuong = dto.ton_thuong;
    if (dto.tac_nhan !== undefined) item.tac_nhan = dto.tac_nhan;
    if (dto.ban_chat !== undefined) item.ban_chat = dto.ban_chat;
    if (dto.vi_tri_tien_trinh !== undefined) item.vi_tri_tien_trinh = dto.vi_tri_tien_trinh;
    if (dto.mach_chan !== undefined) item.mach_chan = dto.mach_chan;
    if (dto.chat_luoi !== undefined) item.chat_luoi = dto.chat_luoi;
    if (dto.nguyen_nhan !== undefined) item.nguyen_nhan = dto.nguyen_nhan;

    await this.applyRefs(item, dto, 'update');
    try {
      await this.repo.save(item);
    } catch (e) {
      if (PhapTriService.isPostgresUniqueViolation(e)) throw new ConflictException('Dữ liệu pháp trị bị trùng ràng buộc UNIQUE.');
      throw e;
    }
    await this.syncPhapTriBaiThuocLinks(id, dto, 'update');
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
