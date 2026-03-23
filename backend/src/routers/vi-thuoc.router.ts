import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ViThuocService } from '../controllers/vi-thuoc.controller';
import { CreateViThuocDto, UpdateViThuocDto } from '../models/dongy-thuoc.dto';

@Controller('vi-thuoc')
export class ViThuocRouter {
  constructor(private readonly service: ViThuocService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateViThuocDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateViThuocDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
