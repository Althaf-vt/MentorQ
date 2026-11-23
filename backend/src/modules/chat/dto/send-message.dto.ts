import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CHAT_CONSTANTS, CHAT_ERROR_MESSAGES } from '../constants/chat.constants.js';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: CHAT_ERROR_MESSAGES.MESSAGE_EMPTY })
  @MaxLength(CHAT_CONSTANTS.MESSAGE_MAX_LENGTH, { message: CHAT_ERROR_MESSAGES.MESSAGE_TOO_LONG })
  message_text: string;
}
