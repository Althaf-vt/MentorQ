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
