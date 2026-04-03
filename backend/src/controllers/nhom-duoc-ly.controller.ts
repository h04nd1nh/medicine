import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { NhomDuocLyLon } from '../models/nhom-duoc-ly-lon.model';
import { NhomDuocLyNho } from '../models/nhom-duoc-ly-nho.model';
import { ViThuocNhomNho } from '../models/vi-thuoc-nhom-nho.model';
import {
  CreateNhomDuocLyLonDto,
  UpdateNhomDuocLyLonDto,
  CreateNhomDuocLyNhoDto,
  UpdateNhomDuocLyNhoDto,
  SetNhomNhoMembersDto,
} from '../models/nhom-duoc-ly-catalog.dto';

@Injectable()
export class NhomDuocLyService {
  constructor(
    @InjectRepository(NhomDuocLyLon)
    private readonly lonRepo: Repository<NhomDuocLyLon>,
    @InjectRepository(NhomDuocLyNho)
    private readonly nhoRepo: Repository<NhomDuocLyNho>,
    private readonly dataSource: DataSource,
  ) {}

  /** Cây: nhóm lớn → nhóm nhỏ → danh sách id vị thuốc */
  async getCatalog() {
    const lons = await this.lonRepo.find({
      relations: { nhomNhoList: { viLinks: true } },
      order: { ten_nhom_lon: 'ASC' },
    });
    for (const lon of lons) {
      (lon.nhomNhoList || []).sort((a, b) =>
        (a.ten_nhom_nho || '').localeCompare(b.ten_nhom_nho || '', 'vi'),
      );
    }
    const mapNho = (n: NhomDuocLyNho) => ({
      id: n.id,
      id_nhom_lon: n.id_nhom_lon,
      ten_nhom_nho: n.ten_nhom_nho,
      mo_ta: n.mo_ta,
      id_vi_thuoc: [...new Set((n.viLinks || []).map((l) => l.idViThuoc))].sort((a, b) => a - b),
    });

    const out = lons.map((lon) => ({
      id: lon.id,
      ten_nhom_lon: lon.ten_nhom_lon,
      isOrphanBucket: false as const,
      nhomNho: (lon.nhomNhoList || []).map(mapNho),
    }));

    const orphans = await this.nhoRepo.find({
      where: { id_nhom_lon: IsNull() },
      relations: { viLinks: true },
      order: { ten_nhom_nho: 'ASC' },
    });
    out.push({
      id: null,
      ten_nhom_lon: '— Nhóm nhỏ độc lập —',
      isOrphanBucket: true as const,
      nhomNho: orphans.map(mapNho),
    });
    return out;
  }

  async createLon(dto: CreateNhomDuocLyLonDto): Promise<NhomDuocLyLon> {
    const ten = (dto.ten_nhom_lon || '').trim();
    if (!ten) throw new BadRequestException('Thiếu tên nhóm lớn');
    const e = this.lonRepo.create({ ten_nhom_lon: ten });
    return this.lonRepo.save(e);
  }

  async updateLon(id: number, dto: UpdateNhomDuocLyLonDto): Promise<NhomDuocLyLon> {
    const lon = await this.lonRepo.findOneBy({ id });
    if (!lon) throw new NotFoundException(`Nhóm lớn #${id} không tồn tại`);
    if (dto.ten_nhom_lon != null) lon.ten_nhom_lon = dto.ten_nhom_lon.trim();
    return this.lonRepo.save(lon);
  }

  async removeLon(id: number): Promise<void> {
    const lon = await this.lonRepo.findOneBy({ id });
    if (!lon) throw new NotFoundException(`Nhóm lớn #${id} không tồn tại`);
    await this.lonRepo.remove(lon);
  }

  async createNho(dto: CreateNhomDuocLyNhoDto): Promise<NhomDuocLyNho> {
    const ten = (dto.ten_nhom_nho || '').trim();
    if (!ten) throw new BadRequestException('Thiếu tên nhóm nhỏ');

    let idLon: number | null = null;
    if (dto.id_nhom_lon != null && dto.id_nhom_lon !== undefined) {
      const lon = await this.lonRepo.findOneBy({ id: dto.id_nhom_lon });
      if (!lon) throw new NotFoundException(`Nhóm lớn #${dto.id_nhom_lon} không tồn tại`);
      idLon = dto.id_nhom_lon;
    }

    const e = this.nhoRepo.create({
      id_nhom_lon: idLon,
      ten_nhom_nho: ten,
      mo_ta: (dto.mo_ta ?? '').trim() || null,
    });
    return this.nhoRepo.save(e);
  }

  async updateNho(id: number, dto: UpdateNhomDuocLyNhoDto): Promise<NhomDuocLyNho> {
    const n = await this.nhoRepo.findOneBy({ id });
    if (!n) throw new NotFoundException(`Nhóm nhỏ #${id} không tồn tại`);
    if (dto.id_nhom_lon !== undefined) {
      if (dto.id_nhom_lon === null) {
        n.id_nhom_lon = null;
      } else {
        const lon = await this.lonRepo.findOneBy({ id: dto.id_nhom_lon });
        if (!lon) throw new NotFoundException(`Nhóm lớn #${dto.id_nhom_lon} không tồn tại`);
        n.id_nhom_lon = dto.id_nhom_lon;
      }
    }
    if (dto.ten_nhom_nho != null) n.ten_nhom_nho = dto.ten_nhom_nho.trim();
    if (dto.mo_ta !== undefined) n.mo_ta = dto.mo_ta.trim() || null;
    return this.nhoRepo.save(n);
  }

  async removeNho(id: number): Promise<void> {
    const n = await this.nhoRepo.findOneBy({ id });
    if (!n) throw new NotFoundException(`Nhóm nhỏ #${id} không tồn tại`);
    await this.nhoRepo.remove(n);
  }

  async setNhoMembers(idNho: number, dto: SetNhomNhoMembersDto): Promise<{ success: true }> {
    const n = await this.nhoRepo.findOneBy({ id: idNho });
    if (!n) throw new NotFoundException(`Nhóm nhỏ #${idNho} không tồn tại`);
    const ids = [...new Set((dto.id_vi_thuoc || []).map(Number).filter(Number.isFinite))];

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.manager.delete(ViThuocNhomNho, { idNhomNho: idNho });
      for (const vid of ids) {
        await qr.manager.insert(ViThuocNhomNho, { idViThuoc: vid, idNhomNho: idNho });
      }
      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
    return { success: true };
  }
}
