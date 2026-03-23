import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BenhTayY } from '../models/benh-tay-y.model';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { TrieuChung } from '../models/trieu-chung.model';
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
  ) {}

  findAll(): Promise<BenhTayY[]> {
    return this.repo.find({
      relations: ['chungBenh', 'baiThuocList', 'trieuChungList'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<BenhTayY> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['chungBenh', 'baiThuocList', 'trieuChungList'],
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

    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateBenhTayYDto): Promise<BenhTayY> {
    const item = await this.findOne(id);

    if (dto.ten_benh !== undefined) item.ten_benh = dto.ten_benh;
    if (dto.id_chung_benh !== undefined) item.idChungBenh = dto.id_chung_benh;

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

    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
