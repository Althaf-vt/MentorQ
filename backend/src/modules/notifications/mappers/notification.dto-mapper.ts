import { NotificationModel } from '../types/notification.type.js';
import {
  NotificationResponseDto,
  NotificationActionResponseDto,
} from '../dto/notification-response.dto.js';

export class NotificationDtoMapper {
  static toResponseDto(model: NotificationModel): NotificationResponseDto {
    return {
      id: model.id,
      recipientId: model.recipientId ?? null,
      role: model.role,
      title: model.title,
      message: model.message,
      type: model.type,
      isRead: model.isRead,
      createdAt: model.createdAt ? model.createdAt.toISOString() : undefined,
      updatedAt: model.updatedAt ? model.updatedAt.toISOString() : undefined,
    };
  }

  static toResponseDtoList(models: NotificationModel[]): NotificationResponseDto[] {
    return models.map((m) => this.toResponseDto(m));
  }

  static toActionResponse(success: boolean = true): NotificationActionResponseDto {
    return { success };
  }
}
