export interface AuthenticatedUserPayload {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUserPayload;
}
