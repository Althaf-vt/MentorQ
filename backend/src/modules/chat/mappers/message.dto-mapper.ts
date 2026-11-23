import { MessageModel } from '../types/message.type.js';
import {
  MessageResponseDto,
  MessageActionResponseDto,
} from '../dto/message-response.dto.js';

export class MessageDtoMapper {
  static toResponseDto(model: MessageModel): MessageResponseDto {
    return {
      id: model.id,
      sessionId: model.sessionId,
      senderId: model.senderId,
      messageText: model.messageText,
      sentAt: model.sentAt ? model.sentAt.toISOString() : new Date().toISOString(),
      readStatus: model.readStatus,
      createdAt: model.createdAt ? model.createdAt.toISOString() : undefined,
      updatedAt: model.updatedAt ? model.updatedAt.toISOString() : undefined,
    };
  }

  static toResponseDtoList(models: MessageModel[]): MessageResponseDto[] {
    return models.map((m) => this.toResponseDto(m));
  }

  static toActionResponse(success: boolean = true): MessageActionResponseDto {
    return { success };
  }
}
