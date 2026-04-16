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
  active?: boolean;
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
  phoneNumber?: string;
}

export interface RegisterInitResponse {
  message: string;
}

export interface LoginRequest {
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface PendingRegistration {
  username: string;
  prenom: string;
  nom: string;
  email: string;
  phoneNumber?: string;
  contactMethod: ContactMethod;
  password: string;
  message?: string;
  createdAt: string;
}

export interface VerifyRegistrationRequest {
  identifier: string;
  code: string;
}

export interface ResetPasswordRequest {
  identifier: string;
}

export interface ConfirmResetPasswordOtpRequest {
  phoneNumber: string;
  otpCode: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface ActionMessageResponse {
  message: string;
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
