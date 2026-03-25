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
import { TheBenhService, TheBenhPhuongHuyetService } from '../controllers/the-benh.controller';
import {
  CreateTheBenhDto,
  UpdateTheBenhDto,
  CreateTheBenhPhuongHuyetDto,
  UpdateTheBenhPhuongHuyetDto,
} from '../models/the-benh.dto';

// ════════════════════════════════════════════════════════════
// ROUTER: /the-benh
// ════════════════════════════════════════════════════════════
@Controller('the-benh')
export class TheBenhRouter {
  constructor(private readonly service: TheBenhService) {}

  @Get()
  findAll(@Query('benh') benhId?: string) {
    if (benhId) return this.service.findByBenh(parseInt(benhId, 10));
    return [];
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTheBenhDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTheBenhDto,
  ) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}

// ════════════════════════════════════════════════════════════
// ROUTER: /the-benh-phuong-huyet
// ════════════════════════════════════════════════════════════
@Controller('the-benh-phuong-huyet')
export class TheBenhPhuongHuyetRouter {
  constructor(private readonly service: TheBenhPhuongHuyetService) {}

  @Get()
  findAll(@Query('the_benh') theBenhId?: string) {
    if (theBenhId) return this.service.findByTheBenh(parseInt(theBenhId, 10));
    return [];
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTheBenhPhuongHuyetDto) {
    const item = await this.service.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTheBenhPhuongHuyetDto,
  ) {
    const item = await this.service.update(id, dto);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}
