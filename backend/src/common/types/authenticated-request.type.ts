import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  _id?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
