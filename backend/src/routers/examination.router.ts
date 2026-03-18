import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ExaminationsService } from '../controllers/examination.controller';
import { CreateExaminationDto, UpdateExaminationDto } from '../models/examination.dto';

@Controller('examinations')
export class ExaminationsRouter {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Get()
  findAll() {
    return this.examinationsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateExaminationDto) {
    return this.examinationsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExaminationDto
  ) {
    return this.examinationsService.update(id, dto);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.examinationsService.findByPatient(patientId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examinationsService.findOne(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examinationsService.remove(id);
  }
}
