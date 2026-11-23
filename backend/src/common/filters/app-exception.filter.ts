import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AppException, ErrorCode } from '../exceptions/app.exception.js';

const ERROR_CODE_HTTP_STATUS_MAP: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ErrorCode.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.CONFLICT]: HttpStatus.CONFLICT,
  [ErrorCode.BAD_REQUEST]: HttpStatus.BAD_REQUEST,

  [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.ACCOUNT_SUSPENDED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.INVALID_OR_EXPIRED_OTP]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.EMAIL_NOT_VERIFIED]: HttpStatus.UNAUTHORIZED,

  [ErrorCode.TICKET_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.TICKET_NOT_PENDING]: HttpStatus.BAD_REQUEST,
  [ErrorCode.TICKET_ALREADY_CLAIMED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.SESSION_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.SESSION_NOT_COMPLETED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.SESSION_ALREADY_ACTIVE]: HttpStatus.CONFLICT,
  [ErrorCode.UNAUTHORIZED_SESSION_PARTICIPANT]: HttpStatus.FORBIDDEN,

  [ErrorCode.REVIEW_ALREADY_SUBMITTED]: HttpStatus.CONFLICT,
  [ErrorCode.ONLY_STUDENT_CAN_REVIEW]: HttpStatus.BAD_REQUEST,

  [ErrorCode.SETTINGS_NOT_FOUND]: HttpStatus.NOT_FOUND,
};

@Catch(AppException)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: AppException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      ERROR_CODE_HTTP_STATUS_MAP[exception.code] ||
      HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${exception.code}] ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(`[${exception.code}] ${exception.message}`);
    }

    response.status(status).json({
      statusCode: status,
      errorCode: exception.code,
      message: exception.message,
      details: exception.details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
