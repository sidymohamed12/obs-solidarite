export type UserRole = 'CITOYEN' | 'AGENT' | 'ADMIN';

export interface UserDto {
  id: number;
  username: string;
  prenom: string;
  nom: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string | null;
  tokenType: string | null;
  message: string;
  user: UserDto;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}

export interface LoginEmailRequest {
  email: string;
  password: string;
}

export interface LoginPhoneRequest {
  phoneNumber: string;
  codePin: string;
}

export interface RegisterRequest {
  username: string;
  prenom: string;
  nom: string;
  email: string;
  password: string;
  phoneNumber: string;
  codePin: string;
}
