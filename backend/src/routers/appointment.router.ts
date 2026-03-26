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
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from '../controllers/appointment.controller';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../models/appointment.dto';
import { JwtAuthGuard } from '../middlewares/auth/jwt-auth.guard';

@Controller('appointments')
export class AppointmentsRouter {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAppointments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 0;
    if (pageNum > 0 && limitNum > 0) {
      return this.appointmentsService.findPaginated(pageNum, limitNum);
    }
    return this.appointmentsService.findAll();
  }

  // Patient API
  @UseGuards(JwtAuthGuard)
  @Get('my-appointments')
  async findMy(@Request() req: any) {
    // sub is patientId, role is patient
    return this.appointmentsService.findMy(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('my-appointments')
  async createMy(@Request() req: any, @Body() dto: CreateAppointmentDto) {
    // Add patient id mapping from token
    dto.patientId = req.user.id;
    const item = await this.appointmentsService.create(dto);
    return { success: true, id: item.id, data: item };
  }

  @UseGuards(JwtAuthGuard)
  @Put('my-appointments/:id/cancel')
  async cancelMy(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ) {
    const item = await this.appointmentsService.cancelMy(id, req.user.id);
    return { success: true, id, data: item };
  }

  // Admin API
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto
  ) {
    const item = await this.appointmentsService.update(id, dto);
    return { success: true, id, data: item };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.appointmentsService.remove(id);
    return { success: true };
  }
}
