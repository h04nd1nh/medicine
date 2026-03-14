import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExaminationsService } from '../controllers/examination.controller';
import { CreateExaminationDto } from '../models/examination.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('examinations')
export class ExaminationsRouter {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Post()
  create(@Body() dto: CreateExaminationDto) {
    return this.examinationsService.create(dto);
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
