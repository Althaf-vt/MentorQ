import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from '../services/settings.service.js';
import { UpdateSettingsDto } from '../dto/settings.dto.js';

@Controller('api/v1/admin/settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  async updateSettings(@Body() updateDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateDto);
  }
}
