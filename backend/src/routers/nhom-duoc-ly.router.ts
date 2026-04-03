import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { NhomDuocLyService } from '../controllers/nhom-duoc-ly.controller';
import {
  CreateNhomDuocLyLonDto,
  UpdateNhomDuocLyLonDto,
  CreateNhomDuocLyNhoDto,
  UpdateNhomDuocLyNhoDto,
  SetNhomNhoMembersDto,
} from '../models/nhom-duoc-ly-catalog.dto';

@Controller('nhom-duoc-ly')
export class NhomDuocLyRouter {
  constructor(private readonly service: NhomDuocLyService) {}

  @Get()
  catalog() {
    return this.service.getCatalog();
  }

  @Post('lon')
  async createLon(@Body() dto: CreateNhomDuocLyLonDto) {
    const item = await this.service.createLon(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put('lon/:id')
  async updateLon(@Param('id') id: string, @Body() dto: UpdateNhomDuocLyLonDto) {
    const item = await this.service.updateLon(+id, dto);
    return { success: true, data: item };
  }

  @Delete('lon/:id')
  async removeLon(@Param('id') id: string) {
    await this.service.removeLon(+id);
    return { success: true };
  }

  @Post('nho')
  async createNho(@Body() dto: CreateNhomDuocLyNhoDto) {
    const item = await this.service.createNho(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put('nho/:id')
  async updateNho(@Param('id') id: string, @Body() dto: UpdateNhomDuocLyNhoDto) {
    const item = await this.service.updateNho(+id, dto);
    return { success: true, data: item };
  }

  @Delete('nho/:id')
  async removeNho(@Param('id') id: string) {
    await this.service.removeNho(+id);
    return { success: true };
  }

  @Put('nho/:id/members')
  async setMembers(@Param('id') id: string, @Body() dto: SetNhomNhoMembersDto) {
    return this.service.setNhoMembers(+id, dto);
  }
}
