import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from '../services/metrics.service.js';
import { GlobalMetricsResponseDto } from '../dto/metrics-response.dto.js';

@Controller('api/v1/admin/metrics')
@UseGuards(AuthGuard('jwt'))
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(): Promise<GlobalMetricsResponseDto> {
    return this.metricsService.getGlobalMetrics();
  }
}
