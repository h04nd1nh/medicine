import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { BaiThuocChiTiet } from '../models/bai-thuoc-chi-tiet.model';
import { CreateBaiThuocDto, UpdateBaiThuocDto } from '../models/dongy-thuoc.dto';

@Injectable()
export class BaiThuocService {
  constructor(
    @InjectRepository(BaiThuoc)
    private repo: Repository<BaiThuoc>,
    @InjectRepository(BaiThuocChiTiet)
    private detailRepo: Repository<BaiThuocChiTiet>,
    private dataSource: DataSource,
  ) {}

  findAll(): Promise<BaiThuoc[]> {
    return this.repo.find({ relations: ['chiTietViThuoc', 'chiTietViThuoc.viThuoc'], order: { ten_bai_thuoc: 'ASC' } });
  }

  findOne(id: number): Promise<BaiThuoc | null> {
    return this.repo.findOne({ where: { id }, relations: ['chiTietViThuoc', 'chiTietViThuoc.viThuoc'] });
  }

  async create(dto: CreateBaiThuocDto): Promise<BaiThuoc> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { chi_tiet, ...rest } = dto;
      const bt = this.repo.create(rest);
      const savedBt = await queryRunner.manager.save(bt);

      if (chi_tiet && chi_tiet.length > 0) {
        const details = chi_tiet.map(d => this.detailRepo.create({ ...d, idBaiThuoc: savedBt.id }));
        await queryRunner.manager.save(details);
      }
      await queryRunner.commitTransaction();
      return this.findOne(savedBt.id) as Promise<BaiThuoc>;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateBaiThuocDto): Promise<BaiThuoc | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { chi_tiet, ...rest } = dto;
      await queryRunner.manager.update(BaiThuoc, id, rest);

      if (chi_tiet) {
        // Xóa cũ thêm mới cho đơn giản
        await queryRunner.manager.delete(BaiThuocChiTiet, { idBaiThuoc: id });
        const details = chi_tiet.map(d => this.detailRepo.create({ ...d, idBaiThuoc: id }));
        await queryRunner.manager.save(details);
      }
      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
