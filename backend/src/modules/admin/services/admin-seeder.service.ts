import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument, AdminRole, AdminStatus } from '../schemas/admin.schema.js';

@Injectable()
export class AdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
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

    const existingAdmin = await this.adminModel.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const password_hash = await bcrypt.hash(adminPassword, 10);

      const admin = new this.adminModel({
        email: adminEmail,
        password_hash,
        role: AdminRole.ADMIN,
        status: AdminStatus.ACTIVE,
      });

      await admin.save();
      this.logger.log(`Admin created successfully for email: ${adminEmail}`);
    } else {
      this.logger.log('Admin already exists. Seeding skipped.');
    }
  }
}
