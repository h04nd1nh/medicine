import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BenhTayY } from '../models/benh-tay-y.model';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { TrieuChung } from '../models/trieu-chung.model';
import { ThietChan } from '../models/thiet-chan.model';
import { MachChan } from '../models/mach-chan.model';
import { PhapTri } from '../models/phap-tri.model';
import { CreateBenhTayYDto, UpdateBenhTayYDto } from '../models/benh-tay-y.dto';

@Injectable()
export class BenhTayYService {
  constructor(
    @InjectRepository(BenhTayY)
    private readonly repo: Repository<BenhTayY>,
    @InjectRepository(BaiThuoc)
    private readonly baiThuocRepo: Repository<BaiThuoc>,
    @InjectRepository(TrieuChung)
    private readonly trieuChungRepo: Repository<TrieuChung>,
    @InjectRepository(ThietChan)
    private readonly thietChanRepo: Repository<ThietChan>,
    @InjectRepository(MachChan)
    private readonly machChanRepo: Repository<MachChan>,
    @InjectRepository(PhapTri)
    private readonly phapTriRepo: Repository<PhapTri>,
  ) {}

  findAll(): Promise<BenhTayY[]> {
    return this.repo.find({
      relations: ['chungBenh', 'baiThuocList', 'trieuChungList', 'thietChanList', 'machChanList', 'phapTriList'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<BenhTayY> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['chungBenh', 'baiThuocList', 'trieuChungList', 'thietChanList', 'machChanList', 'phapTriList'],
    });
    if (!item) {
      throw new NotFoundException(`Bệnh tây y #${id} không tồn tại`);
    }
    return item;
  }

  async create(dto: CreateBenhTayYDto): Promise<BenhTayY> {
    const entity = this.repo.create({
      ten_benh: dto.ten_benh,
      idChungBenh: dto.id_chung_benh,
    });

    if (dto.bai_thuoc_ids && dto.bai_thuoc_ids.length > 0) {
      entity.baiThuocList = await this.baiThuocRepo.findBy({
        id: In(dto.bai_thuoc_ids),
      });
    }

    if (dto.trieu_chung_ids && dto.trieu_chung_ids.length > 0) {
      entity.trieuChungList = await this.trieuChungRepo.findBy({
        id: In(dto.trieu_chung_ids),
      });
    }

    if (dto.thiet_chan_ids && dto.thiet_chan_ids.length > 0) {
      entity.thietChanList = await this.thietChanRepo.findBy({
        id: In(dto.thiet_chan_ids),
      });
    }

    if (dto.mach_chan_ids && dto.mach_chan_ids.length > 0) {
      entity.machChanList = await this.machChanRepo.findBy({
        id: In(dto.mach_chan_ids),
      });
    }

    if (dto.phap_tri_ids && dto.phap_tri_ids.length > 0) {
      entity.phapTriList = await this.phapTriRepo.findBy({
        id: In(dto.phap_tri_ids),
      });
    }

    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateBenhTayYDto): Promise<BenhTayY> {
    const item = await this.findOne(id);

    if (dto.ten_benh !== undefined) item.ten_benh = dto.ten_benh;
    if (dto.id_chung_benh !== undefined) {
      item.idChungBenh = dto.id_chung_benh;
      // Trích xuất entity liên quan để TypeORM cập nhật đúng quan hệ bằng ID mới
      (item as any).chungBenh = undefined;
    }

    if (dto.bai_thuoc_ids !== undefined) {
      item.baiThuocList = dto.bai_thuoc_ids.length > 0
        ? await this.baiThuocRepo.findBy({ id: In(dto.bai_thuoc_ids) })
        : [];
    }

    if (dto.trieu_chung_ids !== undefined) {
      item.trieuChungList = dto.trieu_chung_ids.length > 0
        ? await this.trieuChungRepo.findBy({ id: In(dto.trieu_chung_ids) })
        : [];
    }

    if (dto.thiet_chan_ids !== undefined) {
      item.thietChanList = dto.thiet_chan_ids.length > 0
        ? await this.thietChanRepo.findBy({ id: In(dto.thiet_chan_ids) })
        : [];
    }

    if (dto.mach_chan_ids !== undefined) {
      item.machChanList = dto.mach_chan_ids.length > 0
        ? await this.machChanRepo.findBy({ id: In(dto.mach_chan_ids) })
        : [];
    }

    if (dto.phap_tri_ids !== undefined) {
      item.phapTriList =
        dto.phap_tri_ids.length > 0 ? await this.phapTriRepo.findBy({ id: In(dto.phap_tri_ids) }) : [];
    }

    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
