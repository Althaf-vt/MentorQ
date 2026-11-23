import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminSchema } from './schemas/admin.schema.js';
import { AdminSeederService } from './services/admin-seeder.service.js';
import { AdminAuthService } from './services/admin-auth.service.js';
import { AdminAuthController } from './controllers/admin-auth.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { PlatformSettings, PlatformSettingsSchema } from './schemas/settings.schema.js';
import { SettingsSeederService } from './services/settings-seeder.service.js';
import { SettingsService } from './services/settings.service.js';
import { SettingsController } from './controllers/settings.controller.js';
import { UsersModule } from '../users/users.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { AdminUsersService } from './services/admin-users.service.js';
import { AdminUsersController } from './controllers/admin-users.controller.js';
import { MetricsService } from './services/metrics.service.js';
import { MetricsController } from './controllers/metrics.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: PlatformSettings.name, schema: PlatformSettingsSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    AuthModule,
    UsersModule,
    TicketsModule,
    SessionsModule,
  ],
  controllers: [AdminAuthController, SettingsController, AdminUsersController, MetricsController],
  providers: [
    AdminSeederService, 
    AdminAuthService, 
    SettingsSeederService, 
    SettingsService, 
    AdminUsersService, 
    MetricsService
  ],
  exports: [AdminAuthService],
})
export class AdminModule {}
