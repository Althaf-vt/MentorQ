import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AdminRole, AdminStatus } from '../types/admin.type.js';
import { ADMIN_REPOSITORY, type IAdminRepository } from '../repositories/admin.repository.interface.js';

@Injectable()
export class AdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepository: IAdminRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      this.logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not found in environment variables. Skipping admin seeding.');
      return;
    }

    const existingAdmin = await this.adminRepository.findByEmail(adminEmail);

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      await this.adminRepository.createAdmin({
        email: adminEmail,
        passwordHash,
        role: AdminRole.ADMIN,
        status: AdminStatus.ACTIVE,
      });

      this.logger.log(`Admin created successfully for email: ${adminEmail}`);
    } else {
      this.logger.log('Admin already exists. Seeding skipped.');
    }
  }
}
