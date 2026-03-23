import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { HuyetViService } from '../controllers/huyet-vi.controller';
import { CreateHuyetViDto, UpdateHuyetViDto } from '../models/huyet-vi.dto';

@Controller('huyet-vi')
export class HuyetViRouter {
  constructor(private readonly service: HuyetViService) {}

  @Get()
  findAll(@Query('kinh_mach') kinhMachId?: string) {
    if (kinhMachId) {
      return this.service.findByKinhMach(parseInt(kinhMachId, 10));
    }
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateHuyetViDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.idHuyet, data: item };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHuyetViDto) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
