import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Admin } from './models/admin.model';
import { MeridianSyndrome } from './models/meridian-syndrome.model';
import { Patient } from './models/patient.model';
import { Examination } from './models/examination.model';
import { ChungBenh } from './models/chung-benh.model';
import { BenhTayY } from './models/benh-tay-y.model';
import { TrieuChung } from './models/trieu-chung.model';
import { KinhMach } from './models/kinh-mach.model';
import { HuyetVi } from './models/huyet-vi.model';
import { PhacDoDieuTri } from './models/phac-do-dieu-tri.model';
import { ViThuoc } from './models/vi-thuoc.model';
import { BaiThuoc } from './models/bai-thuoc.model';
import { BaiThuocChiTiet } from './models/bai-thuoc-chi-tiet.model';
import { TheBenh } from './models/the-benh.model';
import { TheBenhPhuongHuyet } from './models/the-benh-phuong-huyet.model';
import { Appointment } from './models/appointment.model';
import { BienChung } from './models/bien-chung.model';
import { PhapTri } from './models/phap-tri.model';
import { ThietChan } from './models/thiet-chan.model';
import { MachChan } from './models/mach-chan.model';
import { NhomDuocLy } from './models/nhom-duoc-ly.model';
import { CongDung } from './models/cong-dung.model';

// Routers (NestJS Controllers)
import { AdminsRouter } from './routers/admin.router';
import { AuthRouter } from './routers/auth.router';
import { MeridiansRouter } from './routers/meridian.router';
import { PatientsRouter } from './routers/patient.router';
import { ExaminationsRouter } from './routers/examination.router';
import { ModelsRouter } from './routers/model.router';
import { RecordsRouter } from './routers/record.router';
import { ChungBenhRouter } from './routers/chung-benh.router';
import { BenhTayYRouter } from './routers/benh-tay-y.router';
import { TrieuChungRouter } from './routers/trieu-chung.router';
import { KinhMachRouter } from './routers/kinh-mach.router';
import { HuyetViRouter } from './routers/huyet-vi.router';
import { PhacDoDieuTriRouter } from './routers/phac-do-dieu-tri.router';
import { ViThuocRouter } from './routers/vi-thuoc.router';
import { BaiThuocRouter } from './routers/bai-thuoc.router';
import { TheBenhRouter, TheBenhPhuongHuyetRouter } from './routers/the-benh.router';
import { PatientAuthRouter } from './routers/patient-auth.router';
import { AppointmentsRouter } from './routers/appointment.router';
import { BienChungRouter } from './routers/bien-chung.router';
import { PhapTriRouter } from './routers/phap-tri.router';
import { ThietChanRouter } from './routers/thiet-chan.router';
import { MachChanRouter } from './routers/mach-chan.router';
import { NhomDuocLyRouter } from './routers/nhom-duoc-ly.router';
import { CongDungRouter } from './routers/cong-dung.router';

// Controllers (NestJS Services)
import { AdminsService } from './controllers/admin.controller';
import { AuthService } from './controllers/auth.controller';
import { MeridiansService } from './controllers/meridian.controller';
import { PatientsService } from './controllers/patient.controller';
import { ExaminationsService } from './controllers/examination.controller';
import { ModelsService } from './controllers/model.controller';
import { ChungBenhService } from './controllers/chung-benh.controller';
import { BenhTayYService } from './controllers/benh-tay-y.controller';
import { TrieuChungService } from './controllers/trieu-chung.controller';
import { KinhMachService } from './controllers/kinh-mach.controller';
import { HuyetViService } from './controllers/huyet-vi.controller';
import { PhacDoDieuTriService } from './controllers/phac-do-dieu-tri.controller';
import { ViThuocService } from './controllers/vi-thuoc.controller';
import { BaiThuocService } from './controllers/bai-thuoc.controller';
import { TheBenhService, TheBenhPhuongHuyetService } from './controllers/the-benh.controller';
import { PatientAuthService } from './controllers/patient-auth.controller';
import { AppointmentsService } from './controllers/appointment.controller';
import { FirebaseService } from './controllers/firebase.controller';
import { BienChungService } from './controllers/bien-chung.controller';
import { PhapTriService } from './controllers/phap-tri.controller';
import { ThietChanService } from './controllers/thiet-chan.controller';
import { MachChanService } from './controllers/mach-chan.controller';
import { NhomDuocLyService } from './controllers/nhom-duoc-ly.controller';
import { CongDungService } from './controllers/cong-dung.controller';

// Middlewares (Strategies/Guards)
import { JwtStrategy } from './middlewares/auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        ssl: {
          rejectUnauthorized: true,
          ca: configService.get<string>('CA_CERTIFICATE'),
        },
        autoLoadEntities: true,
        synchronize: true, // Should be false in production
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Admin, MeridianSyndrome, Patient, Examination, ChungBenh, BenhTayY, TrieuChung, KinhMach, HuyetVi, PhacDoDieuTri, ViThuoc, BaiThuoc, BaiThuocChiTiet, TheBenh, TheBenhPhuongHuyet, Appointment, BienChung, PhapTri, ThietChan, MachChan, NhomDuocLy, CongDung]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback_secret_key',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, AdminsRouter, AuthRouter, MeridiansRouter, PatientsRouter, ExaminationsRouter, ModelsRouter, RecordsRouter, ChungBenhRouter, BenhTayYRouter, TrieuChungRouter, KinhMachRouter, HuyetViRouter, PhacDoDieuTriRouter, ViThuocRouter, BaiThuocRouter, TheBenhRouter, TheBenhPhuongHuyetRouter, PatientAuthRouter, AppointmentsRouter, BienChungRouter, PhapTriRouter, ThietChanRouter, MachChanRouter, NhomDuocLyRouter, CongDungRouter],
  providers: [AppService, AdminsService, AuthService, JwtStrategy, MeridiansService, PatientsService, ExaminationsService, ModelsService, ChungBenhService, BenhTayYService, TrieuChungService, KinhMachService, HuyetViService, PhacDoDieuTriService, ViThuocService, BaiThuocService, TheBenhService, TheBenhPhuongHuyetService, PatientAuthService, AppointmentsService, FirebaseService, BienChungService, PhapTriService, ThietChanService, MachChanService, NhomDuocLyService, CongDungService],
})
export class AppModule {}
