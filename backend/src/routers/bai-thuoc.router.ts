import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BaiThuocService } from '../controllers/bai-thuoc.controller';
import { CreateBaiThuocDto, UpdateBaiThuocDto } from '../models/dongy-thuoc.dto';

@Controller('bai-thuoc')
export class BaiThuocRouter {
  constructor(private readonly service: BaiThuocService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateBaiThuocDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBaiThuocDto) {
    const item = await this.service.update(+id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { success: true };
  }

  @Post(':id/analyze')
  async analyze(@Param('id') id: string) {
    return this.service.analyzeBaiThuoc(+id);
  }
}
