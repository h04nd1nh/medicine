import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { NhomDuocLyService } from '../controllers/nhom-duoc-ly.controller';
import { CreateNhomDuocLyDto, UpdateNhomDuocLyDto } from '../models/nhom-duoc-ly.dto';

@Controller('nhom-duoc-ly')
export class NhomDuocLyRouter {
  constructor(private readonly service: NhomDuocLyService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateNhomDuocLyDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateNhomDuocLyDto) {
    const item = await this.service.update(+id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { success: true };
  }
}
