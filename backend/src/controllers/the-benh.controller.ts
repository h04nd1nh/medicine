import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TheBenh } from '../models/the-benh.model';
import { TheBenhPhuongHuyet } from '../models/the-benh-phuong-huyet.model';
import {
  CreateTheBenhDto,
  UpdateTheBenhDto,
  CreateTheBenhPhuongHuyetDto,
  UpdateTheBenhPhuongHuyetDto,
} from '../models/the-benh.dto';

// ════════════════════════════════════════════════════════════
// SERVICE: TheBenh (Thể bệnh & điều kiện phụ)
// ════════════════════════════════════════════════════════════
@Injectable()
export class TheBenhService {
  constructor(
    @InjectRepository(TheBenh)
    private readonly repo: Repository<TheBenh>,
    @InjectRepository(TheBenhPhuongHuyet)
    private readonly phRepo: Repository<TheBenhPhuongHuyet>,
    private readonly dataSource: DataSource,
  ) {}

  // Lấy toàn bộ thể bệnh theo bệnh (flat list, FE tự build tree)
  findByBenh(idBenh: number): Promise<TheBenh[]> {
    return this.repo.find({
      where: { idBenh },
      order: { thu_tu: 'ASC', id: 'ASC' },
    });
  }

  // Lấy 1 thể bệnh kèm phương huyệt
  async findOne(id: number): Promise<TheBenh> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['dieuKienPhu'],
    });
    if (!item) throw new NotFoundException(`Thể bệnh #${id} không tồn tại`);
    return item;
  }

  async create(dto: CreateTheBenhDto): Promise<TheBenh> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const entity = this.repo.create({
        idBenh: dto.id_benh,
        parentId: dto.parent_id ?? null,
        ten_the_benh: dto.ten_the_benh,
        mo_ta: dto.mo_ta,
        thu_tu: dto.thu_tu ?? 0,
      });
      const saved = await queryRunner.manager.save(entity);

      if (dto.phuong_huyet && dto.phuong_huyet.length > 0) {
        const details = dto.phuong_huyet.map((ph, idx) =>
          this.phRepo.create({
            idTheBenh: saved.id,
            idHuyet: ph.id_huyet ?? null,
            phuong_phap: ph.phuong_phap,
            vai_tro: ph.vai_tro,
            ghi_chu: ph.ghi_chu,
            thu_tu: ph.thu_tu ?? idx,
          }),
        );
        await queryRunner.manager.save(details);
      }

      await queryRunner.commitTransaction();
      return this.findOne(saved.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateTheBenhDto): Promise<TheBenh> {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException(`Thể bệnh #${id} không tồn tại`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (dto.ten_the_benh !== undefined) item.ten_the_benh = dto.ten_the_benh;
      if (dto.mo_ta !== undefined) item.mo_ta = dto.mo_ta;
      if (dto.thu_tu !== undefined) item.thu_tu = dto.thu_tu;
      if ('parent_id' in dto) item.parentId = dto.parent_id ?? null;

      await queryRunner.manager.save(item);

      if (dto.phuong_huyet !== undefined) {
        await queryRunner.manager.delete(TheBenhPhuongHuyet, { idTheBenh: id });
        if (dto.phuong_huyet.length > 0) {
          const details = dto.phuong_huyet.map((ph, idx) =>
            this.phRepo.create({
              idTheBenh: id,
              idHuyet: ph.id_huyet ?? null,
              phuong_phap: ph.phuong_phap,
              vai_tro: ph.vai_tro,
              ghi_chu: ph.ghi_chu,
              thu_tu: ph.thu_tu ?? idx,
            }),
          );
          await queryRunner.manager.save(details);
        }
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

// ════════════════════════════════════════════════════════════
// SERVICE: TheBenhPhuongHuyet (Chi tiết huyệt của thể bệnh)
// ════════════════════════════════════════════════════════════
@Injectable()
export class TheBenhPhuongHuyetService {
  constructor(
    @InjectRepository(TheBenhPhuongHuyet)
    private readonly repo: Repository<TheBenhPhuongHuyet>,
  ) {}

  findByTheBenh(idTheBenh: number): Promise<TheBenhPhuongHuyet[]> {
    return this.repo.find({
      where: { idTheBenh },
      relations: ['huyetVi', 'huyetVi.kinhMach'],
      order: { thu_tu: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TheBenhPhuongHuyet> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['huyetVi', 'huyetVi.kinhMach'],
    });
    if (!item) throw new NotFoundException(`Phương huyệt #${id} không tồn tại`);
    return item;
  }

  async create(dto: CreateTheBenhPhuongHuyetDto): Promise<TheBenhPhuongHuyet> {
    const entity = this.repo.create({
      idTheBenh: dto.id_the_benh,
      idHuyet: dto.id_huyet ?? null,
      phuong_phap: dto.phuong_phap,
      vai_tro: dto.vai_tro,
      ghi_chu: dto.ghi_chu,
      thu_tu: dto.thu_tu ?? 0,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateTheBenhPhuongHuyetDto): Promise<TheBenhPhuongHuyet> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async removeAllByTheBenh(idTheBenh: number): Promise<void> {
    await this.repo.delete({ idTheBenh });
  }
}
