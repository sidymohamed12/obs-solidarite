import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import {
  UserDto,
  UserRole,
  LoginEmailRequest,
  LoginPhoneRequest,
  RegisterRequest,
} from '../models/auth.models';

export const TOKEN_KEY = 'taxawu_token';
export const USER_KEY = 'taxawu_user';
const ADMIN_AREA_ENABLED = true;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // ── State ────────────────────────────────────────────────────────────────
  private readonly _token = signal<string | null>(this.loadToken());
  private readonly _user = signal<UserDto | null>(this.loadUser());
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);

  // ── Selectors (read-only) ─────────────────────────────────────────────────
  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly userRole = computed(() => this._user()?.role ?? null);

  // ── Persistence helpers ───────────────────────────────────────────────────
  private loadToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): UserDto | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as UserDto) : null;
    } catch {
      return null;
    }
  }

  private persist(token: string, user: UserDto): void {
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    this._token.set(token);
    this._user.set(user);
  }

  private clearState(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this._token.set(null);
    this._user.set(null);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  login(payload: LoginEmailRequest | LoginPhoneRequest): void {
    this._loading.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    this.api
      .login(payload)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => {
          this.persist(res.token!, res.user);
          this.redirectByRole(res.user.role);
        },
        error: (err) => this._error.set(this.extractError(err)),
      });
  }

  register(payload: RegisterRequest, role: UserRole): void {
    this._loading.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    this.api
      .register(payload, role)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => {
          this.router.navigate(['/auth/public/login'], {
            queryParams: { registered: 'true', message: res.message },
          });
        },
        error: (err) => this._error.set(this.extractError(err)),
      });
  }

  logout(): void {
    const token = this._token();
    this.api
      .logout(token ?? '')
      .pipe(catchError(() => EMPTY))
      .subscribe({
        complete: () => {
          this.clearState();
          this.router.navigate(['/auth/public/login']);
        },
      });
  }

  clearError(): void {
    this._error.set(null);
  }

  resetSession(): void {
    this.clearState();
    this._error.set(null);
    this._successMessage.set(null);
  }

  redirectByRole(role: UserRole): void {
    switch (role) {
      case 'ADMIN':
      case 'AGENT':
        this.router.navigate([ADMIN_AREA_ENABLED ? '/admin' : '/public']);
        break;
      case 'CITOYEN':
      default:
        this.router.navigate(['/public']);
    }
  }

  private extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const httpErr = err as { error?: { message?: string }; message?: string };
      return httpErr.error?.message ?? httpErr.message ?? 'Une erreur est survenue.';
    }
    return 'Une erreur est survenue.';
  }
}
