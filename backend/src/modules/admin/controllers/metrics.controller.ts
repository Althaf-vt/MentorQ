import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from '../services/metrics.service.js';

@Controller('api/v1/admin/metrics')
@UseGuards(AuthGuard('jwt'))
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics() {
    return this.metricsService.getGlobalMetrics();
  }
}
