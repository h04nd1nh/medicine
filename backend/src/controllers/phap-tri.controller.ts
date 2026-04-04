import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PhapTri } from '../models/phap-tri.model';
import { CreatePhapTriDto, UpdatePhapTriDto } from '../models/phap-tri.dto';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { NhomDuocLyNho } from '../models/nhom-duoc-ly-nho.model';
import { KinhMach } from '../models/kinh-mach.model';

@Injectable()
export class PhapTriService {
  private static readonly RELATIONS = [
    'benh_dong_y',
    'bai_thuoc',
    'nhom_duoc_ly_nho',
    'nhom_duoc_ly_nho.nhomLon',
    'kinh_mach_list',
  ] as const;

  constructor(
    @InjectRepository(PhapTri)
    private readonly repo: Repository<PhapTri>,
    @InjectRepository(MeridianSyndrome)
    private readonly benhRepo: Repository<MeridianSyndrome>,
    @InjectRepository(BaiThuoc)
    private readonly baiThuocRepo: Repository<BaiThuoc>,
    @InjectRepository(NhomDuocLyNho)
    private readonly nhomNhoRepo: Repository<NhomDuocLyNho>,
    @InjectRepository(KinhMach)
    private readonly kinhRepo: Repository<KinhMach>,
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

  /** create: thiếu key → null; update: chỉ đổi khi key có trong body */
  private async applyRefs(
    entity: PhapTri,
    dto: CreatePhapTriDto | UpdatePhapTriDto,
    mode: 'create' | 'update',
  ): Promise<void> {
    const touch = (key: keyof CreatePhapTriDto) =>
      mode === 'create' || PhapTriService.has(dto, key as string);

    if (touch('id_benh_dong_y')) {
      const v = dto.id_benh_dong_y;
      if (v == null) entity.benh_dong_y = null;
      else {
        const b = await this.benhRepo.findOneBy({ id: v });
        entity.benh_dong_y = b ?? null;
      }
    } else if (mode === 'create') {
      entity.benh_dong_y = null;
    }

    if (touch('id_bai_thuoc')) {
      const v = dto.id_bai_thuoc;
      if (v == null) entity.bai_thuoc = null;
      else {
        const bt = await this.baiThuocRepo.findOneBy({ id: v });
        entity.bai_thuoc = bt ?? null;
      }
    } else if (mode === 'create') {
      entity.bai_thuoc = null;
    }

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

    if (touch('id_kinh_mach_list')) {
      entity.kinh_mach_list = await this.resolveKinhMach(dto.id_kinh_mach_list);
    } else if (mode === 'create') {
      entity.kinh_mach_list = [];
    }
  }

  async create(dto: CreatePhapTriDto): Promise<PhapTri> {
    const entity = this.repo.create({
      nguyen_tac: dto.nguyen_tac ?? null,
      y_nghia_co_che: dto.y_nghia_co_che ?? null,
      bat_phap: dto.bat_phap ?? null,
      bat_cuong: dto.bat_cuong ?? null,
      luc_dam: dto.luc_dam ?? null,
      trieu_chung_mo_ta: dto.trieu_chung_mo_ta ?? null,
      kinh_mach_list: [],
    });
    await this.applyRefs(entity, dto, 'create');
    await this.repo.save(entity);
    return this.findOne(entity.id);
  }

  async update(id: number, dto: UpdatePhapTriDto): Promise<PhapTri> {
    const item = await this.findOne(id);
    if (dto.nguyen_tac !== undefined) item.nguyen_tac = dto.nguyen_tac;
    if (dto.y_nghia_co_che !== undefined) item.y_nghia_co_che = dto.y_nghia_co_che;
    if (dto.bat_phap !== undefined) item.bat_phap = dto.bat_phap;
    if (dto.bat_cuong !== undefined) item.bat_cuong = dto.bat_cuong;
    if (dto.luc_dam !== undefined) item.luc_dam = dto.luc_dam;
    if (dto.trieu_chung_mo_ta !== undefined) item.trieu_chung_mo_ta = dto.trieu_chung_mo_ta;

    await this.applyRefs(item, dto, 'update');
    await this.repo.save(item);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
