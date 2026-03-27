import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  LoginEmailRequest,
  LoginPhoneRequest,
  RegisterRequest,
  UserRole,
} from '../models/auth.models';
import { API_ENDPOINTS } from '../../config/api.config';

const REGISTER_ENDPOINT: Record<UserRole, string> = {
  CITOYEN: API_ENDPOINTS.auth.register.citoyen,
  AGENT: API_ENDPOINTS.auth.register.agent,
  ADMIN: API_ENDPOINTS.auth.register.admin,
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(payload: LoginEmailRequest | LoginPhoneRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ENDPOINTS.auth.login, payload);
  }

  register(payload: RegisterRequest, role: UserRole): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(REGISTER_ENDPOINT[role], payload);
  }

  logout(token: string): Observable<void> {
    return this.http.post<void>(
      API_ENDPOINTS.auth.logout,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }
}
