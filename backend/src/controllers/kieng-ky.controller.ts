import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KiengKy } from '../models/kieng-ky.model';

@Controller('kieng-ky')
export class KiengKyController {
  constructor(
    @InjectRepository(KiengKy)
    private repo: Repository<KiengKy>,
  ) {}

  @Get()
  async findAll() {
    return this.repo.find();
  }

  @Post()
  async create(@Body() body: Partial<KiengKy>) {
    const item = this.repo.create(body);
    return this.repo.save(item);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<KiengKy>) {
    await this.repo.update(parseInt(id, 10), body);
    return this.repo.findOneBy({ id: parseInt(id, 10) });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.repo.delete(parseInt(id, 10));
    return { success: true };
  }
}
