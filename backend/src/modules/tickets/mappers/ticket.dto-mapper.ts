import { TicketModel } from '../types/ticket.type.js';
import {
  TicketResponseDto,
  TicketQueuePositionResponseDto,
} from '../dto/ticket-response.dto.js';

export class TicketDtoMapper {
  static toResponseDto(model: TicketModel): TicketResponseDto {
    return {
      id: model.id,
      studentId: model.studentId,
      mentorId: model.mentorId ?? null,
      topic: model.topic,
      description: model.description,
      requestedMinutes: model.requestedMinutes,
      status: model.status,
      scheduledTime: model.scheduledTime ?? null,
      actualTimeSpentMinutes: model.actualTimeSpentMinutes,
      tags: model.tags || [],
      guidanceMessage: model.guidanceMessage ?? null,
      statusHistory: model.statusHistory || [],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toResponseDtoList(models: TicketModel[]): TicketResponseDto[] {
    return models.map((m) => this.toResponseDto(m));
  }

  static toQueuePositionDto(position: number): TicketQueuePositionResponseDto {
    return { position };
  }
}
