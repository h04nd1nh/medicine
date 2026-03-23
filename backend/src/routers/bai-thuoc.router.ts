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
  create(@Body() dto: CreateBaiThuocDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBaiThuocDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
