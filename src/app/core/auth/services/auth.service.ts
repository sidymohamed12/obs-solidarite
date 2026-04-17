import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { ActionMessageResponse, ChangePasswordRequest, ConfirmResetPasswordOtpRequest, ContactMethod, LoginRequest, PendingRegistration, RegisterRequest, ResetPasswordRequest, UserDto, UserRole } from '../models/auth.models';

export const TOKEN_KEY = 'taxawu_token';
export const USER_KEY = 'taxawu_user';
const PENDING_REGISTRATION_KEY = 'taxawu_pending_registration';
const CITOYENS_ACCOUNTS_KEY = 'taxawu_citoyens_accounts';
const AGENTS_ACCOUNTS_KEY = 'taxawu_agents_accounts';

type PersistedAccountRole = 'CITOYEN' | 'AGENT';

interface PersistedAuthAccount {
  identifier: string;
  password: string;
  contactMethod: ContactMethod;
  user: UserDto;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly authApi = inject(AuthApiService);

  private readonly _token = signal<string | null>(this.loadToken());
  private readonly _user = signal<UserDto | null>(this.loadUser());
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly userRole = computed(() => this._user()?.role ?? null);

  register(payload: RegisterRequest, role: UserRole = 'CITOYEN'): void {
    this._loading.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    if (role !== 'CITOYEN') {
      this._error.set('Inscription non autorisée pour ce rôle.');
      this._loading.set(false);
      return;
    }

    const normalizedPayload: RegisterRequest = {
      username: payload.username.trim(),
      prenom: payload.prenom.trim(),
      nom: payload.nom.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      ...(payload.phoneNumber?.trim() ? { phoneNumber: payload.phoneNumber.trim() } : {}),
    };

    if (!normalizedPayload.email) {
      this._error.set('L’email est obligatoire.');
      this._loading.set(false);
      return;
    }

    this.authApi.register(normalizedPayload, role).subscribe({
      next: (response) => {
        const registration: PendingRegistration = {
          username: normalizedPayload.username,
          prenom: normalizedPayload.prenom,
          nom: normalizedPayload.nom,
          email: normalizedPayload.email,
          phoneNumber: normalizedPayload.phoneNumber,
          contactMethod: normalizedPayload.phoneNumber ? 'phone' : 'email',
          password: normalizedPayload.password,
          message: response.message,
          createdAt: new Date().toISOString(),
        };

        this.setPendingRegistration(registration);
        this._successMessage.set(response.message);
        this._loading.set(false);

        this.router.navigate(['/auth/public/verify'], {
          queryParams: {
            identifier: normalizedPayload.email,
            message: response.message,
          },
        });
      },
      error: (error: unknown) => {
        this._error.set(this.resolveErrorMessage(error));
        this._loading.set(false);
      },
    });
  }

  verifyRegistration(code: string): void {
    this._loading.set(true);
    this._error.set(null);

    const pending = this.getPendingRegistration();
    if (!pending) {
      this._error.set('Aucune inscription en attente de vérification.');
      this._loading.set(false);
      return;
    }

    if (!code.trim()) {
      this._error.set('Saisissez le code de validation.');
      this._loading.set(false);
      return;
    }

    this.authApi.verifyRegistration({ identifier: pending.email, code: code.trim() }).subscribe({
      next: (response) => {
        this.clearPendingRegistration();
        this._successMessage.set(response.message);
        this._loading.set(false);
        this.router.navigate(['/auth/public/login'], {
          queryParams: {
            verified: 'true',
            message: response.message || 'Compte vérifié avec succès. Vous pouvez maintenant vous connecter.',
          },
        });
      },
      error: (error: unknown) => {
        this._error.set(this.resolveErrorMessage(error));
        this._loading.set(false);
      },
    });
  }

  login(payload: LoginRequest): void {
    this._loading.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    const email = payload.email?.trim().toLowerCase() ?? '';
    const phoneNumber = payload.phoneNumber?.trim() ?? '';
    const password = payload.password.trim();

    if ((!email && !phoneNumber) || !password) {
      this._error.set('Identifiants incorrects');
      this._loading.set(false);
      return;
    }

    this.authApi.login(email ? { email, password } : { phoneNumber, password }).subscribe({
      next: (response) => {
        if (!response.token) {
          this._error.set('Le backend n’a renvoyé aucun token de connexion.');
          this._loading.set(false);
          return;
        }

        this.persistSession(response.token, response.user);
        this._loading.set(false);
        this.redirectByRole(response.user.role);
      },
      error: (error: unknown) => {
        this._error.set(this.resolveErrorMessage(error));
        this._loading.set(false);
      },
    });
  }

  createAgent(payload: RegisterRequest): Observable<{ success: boolean; message: string; user: UserDto }> {
    const email = payload.email.trim().toLowerCase();
    const phoneNumber = payload.phoneNumber?.trim();

    if (!email) {
      throw new Error('L’email est obligatoire.');
    }

    const normalizedPayload: RegisterRequest = {
      username: payload.username.trim(),
      prenom: payload.prenom.trim(),
      nom: payload.nom.trim(),
      email,
      password: payload.password,
      ...(phoneNumber ? { phoneNumber } : {}),
    };

    return this.authApi.register(normalizedPayload, 'AGENT').pipe(
      map((response) => ({
        success: true,
        message: response.message || 'Agent créé avec succès.',
        user: {
          id: Date.now(),
          username: normalizedPayload.username,
          prenom: normalizedPayload.prenom,
          nom: normalizedPayload.nom,
          email: normalizedPayload.email,
          phoneNumber: normalizedPayload.phoneNumber ?? '',
          role: 'AGENT',
        },
      })),
    );
  }

  listAdminAgents(): Observable<UserDto[]> {
    return this.authApi.listAdminAgents();
  }

  activateAgent(id: number): Observable<{ message: string }> {
    return this.authApi.activateAgent(id);
  }

  deactivateAgent(id: number): Observable<{ message: string }> {
    return this.authApi.deactivateAgent(id);
  }

  requestPasswordReset(payload: ResetPasswordRequest): Observable<ActionMessageResponse> {
    const identifier = payload.identifier.trim();

    return this.authApi.requestPasswordReset({ identifier: identifier.includes('@') ? identifier.toLowerCase() : identifier });
  }

  confirmResetPasswordOtp(payload: ConfirmResetPasswordOtpRequest): Observable<ActionMessageResponse> {
    return this.authApi.confirmResetPasswordOtp({
      phoneNumber: payload.phoneNumber.trim(),
      otpCode: payload.otpCode.trim(),
      newPassword: payload.newPassword,
    });
  }

  changePassword(payload: ChangePasswordRequest): Observable<ActionMessageResponse> {
    return this.authApi.changePassword({
      resetToken: payload.resetToken.trim(),
      newPassword: payload.newPassword,
    });
  }

  getCitoyens(): UserDto[] {
    return this.loadAccounts('CITOYEN').map((account) => ({ ...account.user }));
  }

  getAgents(): UserDto[] {
    return this.loadAccounts('AGENT').map((account) => ({ ...account.user }));
  }

  getPendingRegistration(): PendingRegistration | null {
    return this.readSessionStorage<PendingRegistration>(PENDING_REGISTRATION_KEY);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/public/login']);
  }

  clearError(): void {
    this._error.set(null);
  }

  resetSession(): void {
    this.clearSession();
    this.clearPendingRegistration();
    this._error.set(null);
    this._successMessage.set(null);
  }

  redirectByRole(role: UserRole): void {
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'AGENT':
        this.router.navigate(['/admin/agent/demandes']);
        break;
      case 'CITOYEN':
      default:
        this.router.navigate(['/public']);
        break;
    }
  }

  private buildAccountFromRegistration(registration: PendingRegistration, role: PersistedAccountRole): PersistedAuthAccount {
    const user: UserDto = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      username: registration.username,
      prenom: registration.prenom,
      nom: registration.nom,
      email: registration.email,
      phoneNumber: registration.phoneNumber ?? '',
      role,
    };

    return {
      identifier: registration.email,
      password: registration.password,
      contactMethod: registration.contactMethod,
      user,
      createdAt: new Date().toISOString(),
    };
  }

  private identifierExists(identifier: string): boolean {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    const allAccounts = [...this.loadAccounts('CITOYEN'), ...this.loadAccounts('AGENT')];
    return allAccounts.some((account) => account.identifier.trim().toLowerCase() === normalized);
  }

  private loadAccounts(role: PersistedAccountRole): PersistedAuthAccount[] {
    const key = role === 'CITOYEN' ? CITOYENS_ACCOUNTS_KEY : AGENTS_ACCOUNTS_KEY;
    if (!this.isBrowser) {
      return [];
    }

    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as PersistedAuthAccount[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveAccount(role: PersistedAccountRole, account: PersistedAuthAccount): void {
    if (!this.isBrowser) {
      return;
    }

    const key = role === 'CITOYEN' ? CITOYENS_ACCOUNTS_KEY : AGENTS_ACCOUNTS_KEY;
    const list = this.loadAccounts(role);
    list.push(account);
    localStorage.setItem(key, JSON.stringify(list));
  }

  private setPendingRegistration(registration: PendingRegistration): void {
    this.writeSessionStorage(PENDING_REGISTRATION_KEY, registration);
  }

  private clearPendingRegistration(): void {
    if (!this.isBrowser) {
      return;
    }

    sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
  }

  private persistSession(token: string, user: UserDto): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._token.set(token);
    this._user.set(user);
  }

  private clearSession(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private loadToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): UserDto | null {
    if (!this.isBrowser) {
      return null;
    }

    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as UserDto;
    } catch {
      return null;
    }
  }

  private readSessionStorage<T>(key: string): T | null {
    if (!this.isBrowser) {
      return null;
    }

    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private writeSessionStorage<T>(key: string, value: T): void {
    if (!this.isBrowser) {
      return;
    }

    sessionStorage.setItem(key, JSON.stringify(value));
  }

  private resolveErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const objectError = error as { message?: string; error?: { message?: string } };
      return objectError.error?.message ?? objectError.message ?? 'La connexion a échoué.';
    }

    return 'La connexion a échoué.';
  }
}
