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

// Routers (NestJS Controllers)
import { AdminsRouter } from './routers/admin.router';
import { AuthRouter } from './routers/auth.router';
import { MeridiansRouter } from './routers/meridian.router';
import { PatientsRouter } from './routers/patient.router';
import { ExaminationsRouter } from './routers/examination.router';

// Controllers (NestJS Services)
import { AdminsService } from './controllers/admin.controller';
import { AuthService } from './controllers/auth.controller';
import { MeridiansService } from './controllers/meridian.controller';
import { PatientsService } from './controllers/patient.controller';
import { ExaminationsService } from './controllers/examination.controller';

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
        host: configService.get<string>('HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('USER'),
        password: configService.get<string>('PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        ssl: {
          rejectUnauthorized: true,
          ca: configService.get<string>('CA_CERTIFICATE'),
        },
        autoLoadEntities: true,
        synchronize: true, // Should be false in production
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Admin, MeridianSyndrome, Patient, Examination]),
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
  controllers: [AppController, AdminsRouter, AuthRouter, MeridiansRouter, PatientsRouter, ExaminationsRouter],
  providers: [AppService, AdminsService, AuthService, JwtStrategy, MeridiansService, PatientsService, ExaminationsService],
})
export class AppModule {}
