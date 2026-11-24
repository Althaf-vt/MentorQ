import { SessionModel } from '../types/session.type.js';
import { SessionResponseDto } from '../dto/session-response.dto.js';

export class SessionDtoMapper {
  static toResponseDto(model: SessionModel): SessionResponseDto {
    return {
      id: model.id,
      ticketId: model.ticketId,
      mentorId: model.mentorId,
      studentId: model.studentId,
      startedAt: model.startedAt,
      allocatedMinutes: model.allocatedMinutes,
      extendedMinutes: model.extendedMinutes,
      endedAt: model.endedAt ?? null,
      actualDurationMinutes: model.actualDurationMinutes,
      sessionStatus: model.sessionStatus,
      resolutionNotes: model.resolutionNotes ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toResponseDtoList(models: SessionModel[]): SessionResponseDto[] {
    return models.map((m) => this.toResponseDto(m));
  }
}
