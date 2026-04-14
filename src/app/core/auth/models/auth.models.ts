export type UserRole = 'CITOYEN' | 'AGENT' | 'ADMIN';

export type ContactMethod = 'email' | 'phone';

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
  email?: string;
  password: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface PendingRegistration {
  username: string;
  prenom: string;
  nom: string;
  contactMethod: ContactMethod;
  contactValue: string;
  password: string;
  createdAt: string;
}

export interface VerifiedRegistration {
  identifier: string;
  password: string;
  username: string;
  prenom: string;
  nom: string;
  contactMethod: ContactMethod;
  verifiedAt: string;
  token: string;
  user: UserDto;
}
