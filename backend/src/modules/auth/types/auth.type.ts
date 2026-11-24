export interface AuthUserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthTokenResponseDto {
  access_token: string;
  user: AuthUserDto;
}

export interface AuthMessageResponseDto {
  message: string;
  email?: string;
}

export interface AuthOtpVerifyResponseDto {
  message: string;
  access_token?: string;
  user?: AuthUserDto;
}

export interface JwtUserPayload {
  id: string;
  email: string;
  role: string;
}
