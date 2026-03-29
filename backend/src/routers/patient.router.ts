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
import { PatientsService } from '../controllers/patient.controller';
import { CreatePatientDto, UpdatePatientDto } from '../models/patient.dto';

@Controller('patients')
export class PatientsRouter {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findPatients(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 0;
    if (pageNum > 0 && limitNum > 0) {
      return this.patientsService.findPaginated(pageNum, limitNum, search);
    }
    return this.patientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePatientDto) {
    const item = await this.patientsService.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePatientDto
  ) {
    const item = await this.patientsService.update(id, dto);
    return { success: true, id, data: item };
  }

  @Put(':id/fcm-token')
  async updateFcmToken(
    @Param('id', ParseIntPipe) id: number,
    @Body('fcmToken') fcmToken: string
  ) {
    await this.patientsService.updateFcmToken(id, fcmToken);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.patientsService.remove(id);
    return { success: true };
  }
}
