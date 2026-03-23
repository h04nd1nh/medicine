import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChungBenh } from '../models/chung-benh.model';
import { CreateChungBenhDto, UpdateChungBenhDto } from '../models/chung-benh.dto';

@Injectable()
export class ChungBenhService {
  constructor(
    @InjectRepository(ChungBenh)
    private readonly repo: Repository<ChungBenh>,
  ) {}

  findAll(): Promise<ChungBenh[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<ChungBenh> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['benhTayYList'],
    });
    if (!item) {
      throw new NotFoundException(`Chủng bệnh #${id} không tồn tại`);
    }
    return item;
  }

  create(dto: CreateChungBenhDto): Promise<ChungBenh> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateChungBenhDto): Promise<ChungBenh> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
