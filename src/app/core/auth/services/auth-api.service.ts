import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../config/api.config';
import {
  ActionMessageResponse,
  AuthResponse,
  ChangePasswordRequest,
  ConfirmResetPasswordOtpRequest,
  LoginRequest,
  ResetPasswordRequest,
  RegisterInitResponse,
  RegisterRequest,
  UserDto,
  UserRole,
  VerifyRegistrationRequest,
} from '../models/auth.models';

const MOCK_AUTH_USERS_KEY = 'taxawu_mock_auth_users';

interface MockStoredUser extends UserDto {
  password: string;
  codePin: string;
}

const INITIAL_USERS: MockStoredUser[] = [
  {
    id: 1,
    username: 'citoyen.demo',
    prenom: 'Awa',
    nom: 'Ndiaye',
    email: 'test2@example.com',
    phoneNumber: '700000002',
    role: 'CITOYEN',
    password: '12345678',
    codePin: '1234',
  },
  {
    id: 2,
    username: 'agent.demo',
    prenom: 'Mamadou',
    nom: 'Fall',
    email: 'agent@example.com',
    phoneNumber: '700000003',
    role: 'AGENT',
    password: '12345678',
    codePin: '1234',
  },
  {
    id: 3,
    username: 'admin.demo',
    prenom: 'Fatou',
    nom: 'Sow',
    email: 'admin@example.com',
    phoneNumber: '700000004',
    role: 'ADMIN',
    password: '12345678',
    codePin: '1234',
  },
];

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<unknown>(API_ENDPOINTS.auth.login, payload).pipe(
      map((response) => this.normalizeAuthResponse(response, payload.email ?? payload.phoneNumber ?? '')),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  register(payload: RegisterRequest, role: UserRole): Observable<RegisterInitResponse> {
    const endpoint = this.resolveRegisterEndpoint(role);

    return this.http.post<unknown>(endpoint, payload).pipe(
      map((response) => ({
        message: this.normalizeRegisterMessage(response),
      })),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  listAdminAgents(): Observable<UserDto[]> {
    return this.http.get<unknown>(API_ENDPOINTS.utilisateurs.adminAgents).pipe(
      map((response) => this.normalizeUsersResponse(response)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  activateAgent(id: number): Observable<{ message: string }> {
    return this.http.patch<unknown>(API_ENDPOINTS.utilisateurs.activate(id), null).pipe(
      map((response) => ({ message: this.normalizeActionMessage(response, 'Agent activé avec succès.') })),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  deactivateAgent(id: number): Observable<{ message: string }> {
    return this.http.patch<unknown>(API_ENDPOINTS.utilisateurs.deactivate(id), null).pipe(
      map((response) => ({ message: this.normalizeActionMessage(response, 'Agent désactivé avec succès.') })),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  verifyRegistration(payload: VerifyRegistrationRequest): Observable<AuthResponse> {
    return this.http.post<unknown>(API_ENDPOINTS.auth.verify.citoyen, payload).pipe(
      map((response) => this.normalizeAuthResponse(response, payload.identifier)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  requestPasswordReset(payload: ResetPasswordRequest): Observable<ActionMessageResponse> {
    return this.http.post(API_ENDPOINTS.auth.resetPassword, payload, { responseType: 'text' }).pipe(
      map((response) => ({ message: this.normalizeActionMessage(response, 'Un code ou lien de réinitialisation a été envoyé.') })),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  confirmResetPasswordOtp(payload: ConfirmResetPasswordOtpRequest): Observable<ActionMessageResponse> {
    return this.http.post(API_ENDPOINTS.auth.confirmResetOtp, payload, { responseType: 'text' }).pipe(
      map((response) => ({ message: this.normalizeActionMessage(response, 'Mot de passe réinitialisé avec succès.') })),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  changePassword(payload: ChangePasswordRequest): Observable<ActionMessageResponse> {
    return this.http.post(API_ENDPOINTS.auth.changePassword, payload, { responseType: 'text' }).pipe(
      map((response) => ({ message: this.normalizeActionMessage(response, 'Mot de passe réinitialisé avec succès.') })),
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          ...error,
          message: this.extractErrorMessage(error),
        })),
      ),
    );
  }

  logout(_token: string): Observable<void> {
    return of(void 0);
  }

  private toUserDto(user: MockStoredUser): UserDto {
    const { password: _password, codePin: _codePin, ...dto } = user;
    return dto;
  }

  private resolveRegisterEndpoint(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return API_ENDPOINTS.auth.register.admin;
      case 'AGENT':
        return API_ENDPOINTS.auth.register.agent;
      case 'CITOYEN':
      default:
        return API_ENDPOINTS.auth.register.citoyen;
    }
  }

  private normalizeRegisterMessage(response: unknown): string {
    const body = this.pickRecord(this.asRecord(response), ['data', 'result', 'payload', 'body']) ?? this.asRecord(response);
    return this.pickString(body, ['message', 'detail']) ?? 'Un code de vérification a été envoyé.';
  }

  private normalizeActionMessage(response: unknown, fallback: string): string {
    if (typeof response === 'string' && response.trim()) {
      return response.trim();
    }

    const body = this.pickRecord(this.asRecord(response), ['data', 'result', 'payload', 'body']) ?? this.asRecord(response);
    return this.pickString(body, ['message', 'detail']) ?? fallback;
  }

  private normalizeUsersResponse(response: unknown): UserDto[] {
    const root = this.asRecord(response);
    const collection = this.pickArray(root, ['data', 'result', 'payload', 'body']) ?? (Array.isArray(response) ? response : []);
    return collection
      .map((entry) => this.normalizeUserDto(entry))
      .filter((user): user is UserDto => user !== null);
  }

  private normalizeUserDto(value: unknown): UserDto | null {
    const source = this.asRecord(value);
    const role = this.normalizeRole(this.pickString(source, ['role', 'profil', 'typeUtilisateur']));
    const id = this.pickNumber(source, ['id', 'userId', 'utilisateurId']);

    if (id === null) {
      return null;
    }

    return {
      id,
      username: this.pickString(source, ['username', 'login', 'identifiant']) ?? '',
      prenom: this.pickString(source, ['prenom', 'firstName', 'first_name']) ?? '',
      nom: this.pickString(source, ['nom', 'lastName', 'last_name']) ?? '',
      email: this.pickString(source, ['email', 'mail']) ?? '',
      phoneNumber: this.pickString(source, ['phoneNumber', 'phone', 'telephone', 'numeroTelephone']) ?? '',
      role,
      active: this.pickBoolean(source, ['active', 'actif', 'enabled', 'isActive']) ?? true,
    };
  }

  private normalizeAuthResponse(response: unknown, fallbackIdentifier: string): AuthResponse {
    const root = this.asRecord(response);
    const body = this.pickRecord(root, ['data', 'result', 'payload', 'body']) ?? root;
    const userSource =
      this.pickRecord(body, ['user', 'utilisateur', 'account', 'compte']) ?? body;
    const role = this.normalizeRole(
      this.pickString(userSource, ['role', 'profil', 'typeUtilisateur']) ??
        this.pickString(body, ['role', 'profil', 'typeUtilisateur']),
    );

    return {
      token:
        this.pickString(body, ['token', 'accessToken', 'access_token', 'jwt', 'bearerToken']) ??
        null,
      tokenType:
        this.pickString(body, ['tokenType', 'token_type', 'type']) ??
        (this.pickString(body, ['token', 'accessToken', 'access_token', 'jwt', 'bearerToken'])
          ? 'Bearer'
          : null),
      message: this.pickString(body, ['message', 'detail']) ?? 'Connexion réussie.',
      user: {
        id: this.pickNumber(userSource, ['id', 'userId', 'utilisateurId']) ?? Date.now(),
        username:
          this.pickString(userSource, ['username', 'login', 'identifiant']) ??
          (fallbackIdentifier.includes('@') ? fallbackIdentifier.split('@')[0] : fallbackIdentifier) ??
          fallbackIdentifier,
        prenom: this.pickString(userSource, ['prenom', 'firstName', 'first_name']) ?? '',
        nom: this.pickString(userSource, ['nom', 'lastName', 'last_name']) ?? '',
        email:
          this.pickString(userSource, ['email', 'mail']) ??
          (fallbackIdentifier.includes('@') ? fallbackIdentifier : ''),
        phoneNumber:
          this.pickString(userSource, ['phoneNumber', 'phone', 'telephone', 'numeroTelephone']) ??
          (!fallbackIdentifier.includes('@') ? fallbackIdentifier : ''),
        role,
      },
    };
  }

  private extractErrorMessage(error: unknown): string {
    const httpError = error as HttpErrorResponse;
    if (typeof httpError?.error === 'string' && httpError.error.trim()) {
      const raw = httpError.error.trim();
      const parsed = this.parseJsonErrorMessage(raw);
      return parsed ?? raw;
    }

    const errorBody = this.asRecord(httpError?.error);

    return (
      this.pickString(errorBody, ['message', 'detail', 'error_description']) ??
      httpError?.message ??
      'La connexion a échoué.'
    );
  }

  private parseJsonErrorMessage(value: string): string | null {
    if (!value.startsWith('{')) {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as { message?: string; detail?: string; error?: string };
      return parsed.message ?? parsed.detail ?? parsed.error ?? null;
    } catch {
      return null;
    }
  }

  private normalizeRole(value: string | null): UserRole {
    const normalized = value?.trim().toUpperCase();
    if (normalized === 'ADMIN' || normalized === 'AGENT' || normalized === 'CITOYEN') {
      return normalized;
    }

    return 'CITOYEN';
  }

  private pickRecord(source: Record<string, unknown>, keys: string[]): Record<string, unknown> | null {
    for (const key of keys) {
      const candidate = source[key];
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return candidate as Record<string, unknown>;
      }
    }

    return null;
  }

  private pickString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const candidate = source[key];
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return null;
  }

  private pickNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const candidate = source[key];
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }

      if (typeof candidate === 'string' && candidate.trim()) {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private pickBoolean(source: Record<string, unknown>, keys: string[]): boolean | null {
    for (const key of keys) {
      const candidate = source[key];
      if (typeof candidate === 'boolean') {
        return candidate;
      }

      if (typeof candidate === 'string') {
        const normalized = candidate.trim().toLowerCase();
        if (normalized === 'true') {
          return true;
        }
        if (normalized === 'false') {
          return false;
        }
      }
    }

    return null;
  }

  private pickArray(source: Record<string, unknown>, keys: string[]): unknown[] | null {
    for (const key of keys) {
      const candidate = source[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private createToken(user: MockStoredUser): string {
    return `mock-token-${user.id}-${Date.now()}`;
  }

  private nextId(users: MockStoredUser[]): number {
    return users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
  }

  private loadUsers(): MockStoredUser[] {
    const storage = this.getStorage();
    if (!storage) {
      return [...INITIAL_USERS];
    }

    const raw = storage.getItem(MOCK_AUTH_USERS_KEY);
    if (!raw) {
      storage.setItem(MOCK_AUTH_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return [...INITIAL_USERS];
    }

    try {
      const users = JSON.parse(raw) as MockStoredUser[];
      return Array.isArray(users) && users.length > 0 ? users : [...INITIAL_USERS];
    } catch {
      storage.setItem(MOCK_AUTH_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return [...INITIAL_USERS];
    }
  }

  private saveUsers(users: MockStoredUser[]): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(MOCK_AUTH_USERS_KEY, JSON.stringify(users));
  }

  private getStorage(): Storage | null {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
      return null;
    }

    return globalThis.localStorage;
  }
}
