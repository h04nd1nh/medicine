import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { PatientAuthService } from '../controllers/patient-auth.controller';

@Controller('patient-auth')
export class PatientAuthRouter {
  constructor(private readonly patientAuthService: PatientAuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    if (!signInDto.phone || !signInDto.password) {
      throw new BadRequestException('Vui lòng cung cấp số điện thoại và mật khẩu.');
    }
    const patient = await this.patientAuthService.validatePatient(signInDto.phone, signInDto.password);
    if (!patient) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng!');
    }
    return this.patientAuthService.login(patient);
  }

  @Post('register')
  async register(@Body() registerDto: Record<string, any>) {
    if (!registerDto.phone || !registerDto.password) {
      throw new BadRequestException('Vui lòng cung cấp số điện thoại và mật khẩu.');
    }
    return this.patientAuthService.register(registerDto.phone, registerDto.password, registerDto.fullName);
  }
}
