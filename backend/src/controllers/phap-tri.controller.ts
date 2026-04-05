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

@Injectable()
export class PhapTriService {
  private static readonly RELATIONS = [
    'bai_thuoc',
    'bai_thuoc_links',
    'bai_thuoc_links.baiThuoc',
    'nhom_duoc_ly_nho',
    'nhom_duoc_ly_nho.nhomLon',
    'benh_dong_y',
    'kinh_mach_list',
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

  private async resolveKinhMach(ids?: number[] | null): Promise<KinhMach[]> {
    if (!ids?.length) return [];
    return this.kinhRepo.findBy({ idKinhMach: In(ids) });
  }

  /** PG 23505 = unique_violation (vd. id_benh_dong_y UNIQUE) */
  private static isPostgresUniqueViolation(err: unknown): boolean {
    return err instanceof QueryFailedError && (err as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505';
  }

  /** create: thiếu key → null; update: chỉ đổi khi key có trong body */
  private async applyRefs(
    entity: PhapTri,
    dto: CreatePhapTriDto | UpdatePhapTriDto,
    mode: 'create' | 'update',
  ): Promise<void> {
    const touch = (key: keyof CreatePhapTriDto) =>
      mode === 'create' || PhapTriService.has(dto, key as string);

    if (touch('id_nhom_duoc_ly_nho')) {
      const v = dto.id_nhom_duoc_ly_nho;
      if (v == null) entity.nhom_duoc_ly_nho = null;
      else {
        const n = await this.nhomNhoRepo.findOneBy({ id: v });
        entity.nhom_duoc_ly_nho = n ?? null;
      }
    } else if (mode === 'create') {
      entity.nhom_duoc_ly_nho = null;
    }

    if (touch('id_benh_dong_y')) {
      const v = dto.id_benh_dong_y;
      if (v == null) entity.benh_dong_y = null;
      else {
        const b = await this.benhDongYRepo.findOneBy({ id: v });
        entity.benh_dong_y = b ?? null;
      }
    } else if (mode === 'create') {
      entity.benh_dong_y = null;
    }

    if (touch('id_kinh_mach_list')) {
      entity.kinh_mach_list = await this.resolveKinhMach(dto.id_kinh_mach_list);
    } else if (mode === 'create') {
      entity.kinh_mach_list = [];
    }
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
    const entity = this.repo.create({
      chung_trang: dto.chung_trang ?? null,
      nguyen_tac: dto.nguyen_tac ?? null,
      y_nghia_co_che: dto.y_nghia_co_che ?? null,
      bat_phap: dto.bat_phap ?? null,
      bat_cuong: dto.bat_cuong ?? null,
      luc_dam: dto.luc_dam ?? null,
      trieu_chung_mo_ta: dto.trieu_chung_mo_ta ?? null,
      kinh_mach_list: [],
    });
    await this.applyRefs(entity, dto, 'create');
    try {
      await this.repo.save(entity);
    } catch (e) {
      if (PhapTriService.isPostgresUniqueViolation(e)) {
        throw new ConflictException(
          'Bệnh Đông y đã gắn với một pháp trị khác (trùng id_benh_dong_y). Chỉnh lại hoặc bỏ liên kết bản ghi cũ.',
        );
      }
      throw e;
    }
    await this.syncPhapTriBaiThuocLinks(entity.id, dto, 'create');
    return this.findOne(entity.id);
  }

  async update(id: number, dto: UpdatePhapTriDto): Promise<PhapTri> {
    const item = await this.findOne(id);
    if (dto.chung_trang !== undefined) item.chung_trang = dto.chung_trang;
    if (dto.nguyen_tac !== undefined) item.nguyen_tac = dto.nguyen_tac;
    if (dto.y_nghia_co_che !== undefined) item.y_nghia_co_che = dto.y_nghia_co_che;
    if (dto.bat_phap !== undefined) item.bat_phap = dto.bat_phap;
    if (dto.bat_cuong !== undefined) item.bat_cuong = dto.bat_cuong;
    if (dto.luc_dam !== undefined) item.luc_dam = dto.luc_dam;
    if (dto.trieu_chung_mo_ta !== undefined) item.trieu_chung_mo_ta = dto.trieu_chung_mo_ta;

    await this.applyRefs(item, dto, 'update');
    try {
      await this.repo.save(item);
    } catch (e) {
      if (PhapTriService.isPostgresUniqueViolation(e)) {
        throw new ConflictException(
          'Bệnh Đông y đã gắn với một pháp trị khác (trùng id_benh_dong_y). Chỉnh lại hoặc bỏ liên kết bản ghi cũ.',
        );
      }
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
