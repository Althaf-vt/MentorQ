import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';
import { NotificationDtoMapper } from '../mappers/notification.dto-mapper.js';
import {
  NotificationResponseDto,
  NotificationActionResponseDto,
} from '../dto/notification-response.dto.js';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Request() req: AuthenticatedRequest): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsService.getUserNotifications(req.user.id, req.user.role || '');
    return NotificationDtoMapper.toResponseDtoList(notifications);
  }

  // ⚠️ read-all MUST be defined before :id/read so NestJS doesn't
  //    interpret the literal "read-all" as a value for the :id param.
  @Patch('read-all')
  async markAllAsRead(@Request() req: AuthenticatedRequest): Promise<NotificationActionResponseDto> {
    await this.notificationsService.markAllAsRead(req.user.id, req.user.role || '');
    return NotificationDtoMapper.toActionResponse(true);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto | null> {
    const notification = await this.notificationsService.markAsRead(id, req.user.id);
    return notification ? NotificationDtoMapper.toResponseDto(notification) : null;
  }
}
