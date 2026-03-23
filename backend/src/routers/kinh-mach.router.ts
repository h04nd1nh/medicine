import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { KinhMachService } from '../controllers/kinh-mach.controller';
import { CreateKinhMachDto, UpdateKinhMachDto } from '../models/kinh-mach.dto';

@Controller('kinh-mach')
export class KinhMachRouter {
  constructor(private readonly service: KinhMachService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateKinhMachDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.idKinhMach, data: item };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKinhMachDto) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
