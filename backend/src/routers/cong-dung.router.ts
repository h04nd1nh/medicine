import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CongDungService } from '../controllers/cong-dung.controller';
import { CreateCongDungDto, UpdateCongDungDto } from '../models/cong-dung.dto';

@Controller('cong-dung')
export class CongDungRouter {
  constructor(private readonly service: CongDungService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateCongDungDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCongDungDto) {
    const item = await this.service.update(+id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { success: true };
  }
}
