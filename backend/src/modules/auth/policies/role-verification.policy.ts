import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import { USER_ROLES } from '../../users/constants/users.constants.js';
import { AUTH_ERROR_MESSAGES } from '../constants/auth.constants.js';

export class RoleVerificationPolicy {
  static assertRoleMatches(actualRole: string, expectedRole?: string): void {
    if (!expectedRole || actualRole === expectedRole) {
      return;
    }

    if (expectedRole === USER_ROLES.MENTOR) {
      throw new AppException(ErrorCode.FORBIDDEN, AUTH_ERROR_MESSAGES.MENTOR_NOT_ACCESSED);
    }

    if (expectedRole === USER_ROLES.STUDENT) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    throw new AppException(ErrorCode.UNAUTHORIZED, AUTH_ERROR_MESSAGES.INVALID_ROLE);
  }
}
