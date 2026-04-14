import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ContactMethod,
  LoginRequest,
  PendingRegistration,
  RegisterRequest,
  UserDto,
  UserRole,
  VerifiedRegistration,
} from '../models/auth.models';

export const TOKEN_KEY = 'taxawu_token';
export const USER_KEY = 'taxawu_user';
const PENDING_REGISTRATION_KEY = 'taxawu_pending_registration';
const VERIFIED_REGISTRATION_KEY = 'taxawu_verified_registration';

interface ContactSelection {
  method: ContactMethod;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
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

  // ── Actions ───────────────────────────────────────────────────────────────
  register(payload: RegisterRequest, role: UserRole = 'CITOYEN'): void {
    this._loading.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    try {
      const contact = this.resolveContact(payload);
      if (!contact) {
        this._error.set('Renseignez soit un email, soit un numéro de téléphone.');
        return;
      }

      const registration: PendingRegistration = {
        username: payload.username.trim(),
        prenom: payload.prenom.trim(),
        nom: payload.nom.trim(),
        contactMethod: contact.method,
        contactValue: contact.value,
        password: payload.password,
        createdAt: new Date().toISOString(),
      };

      this.setPendingRegistration(registration);
      this._successMessage.set(
        contact.method === 'phone'
          ? 'Un code de validation a été envoyé par SMS à ce numéro.'
          : 'Un code de validation a été envoyé par email.'
      );
      this.router.navigate(['/auth/public/verify'], {
        queryParams: { channel: contact.method, role },
      });
    } finally {
      this._loading.set(false);
    }
  }

  verifyRegistration(code: string): void {
    this._loading.set(true);
    this._error.set(null);

    try {
      const pending = this.getPendingRegistration();
      if (!pending) {
        this._error.set('Aucune inscription en attente de vérification.');
        return;
      }

      if (!code.trim()) {
        this._error.set('Saisissez le code de validation.');
        return;
      }

      const verified = this.buildVerifiedRegistration(pending);
      this.setVerifiedRegistration(verified);
      this.clearPendingRegistration();
      this._successMessage.set('Compte vérifié avec succès. Vous pouvez maintenant vous connecter.');
      this.router.navigate(['/auth/public/login'], {
        queryParams: {
          verified: 'true',
          message: 'Compte vérifié avec succès. Vous pouvez maintenant vous connecter.',
        },
      });
    } finally {
      this._loading.set(false);
    }
  }

  login(payload: LoginRequest): void {
    this._loading.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    try {
      const verified = this.getVerifiedRegistration();
      if (!verified) {
        this._error.set('Aucun compte vérifié. Veuillez d’abord terminer l’inscription.');
        return;
      }

      const identifier = payload.identifier.trim().toLowerCase();
      const storedIdentifier = verified.identifier.trim().toLowerCase();

      if (identifier !== storedIdentifier || payload.password.trim() !== verified.password) {
        this._error.set('Identifiants incorrects');
        return;
      }

      this.persistSession(verified.token, verified.user);
      this.redirectByRole(verified.user.role);
    } finally {
      this._loading.set(false);
    }
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
    this.clearVerifiedRegistration();
    this._error.set(null);
    this._successMessage.set(null);
  }

  getPendingRegistration(): PendingRegistration | null {
    return this.readStorage<PendingRegistration>(PENDING_REGISTRATION_KEY);
  }

  getVerifiedRegistration(): VerifiedRegistration | null {
    return this.readStorage<VerifiedRegistration>(VERIFIED_REGISTRATION_KEY);
  }

  redirectByRole(role: UserRole): void {
    switch (role) {
      case 'ADMIN':
      case 'AGENT':
        this.router.navigate(['/admin']);
        break;
      case 'CITOYEN':
      default:
        this.router.navigate(['/public']);
    }
  }

  private resolveContact(payload: RegisterRequest): ContactSelection | null {
    const email = payload.email?.trim() ?? '';
    const phoneNumber = payload.phoneNumber?.trim() ?? '';

    if ((!email && !phoneNumber) || (email && phoneNumber)) {
      return null;
    }

    if (email) {
      return { method: 'email', value: email };
    }

    return { method: 'phone', value: phoneNumber };
  }

  private buildVerifiedRegistration(pending: PendingRegistration): VerifiedRegistration {
    const user: UserDto = {
      id: Date.now(),
      username: pending.username,
      prenom: pending.prenom,
      nom: pending.nom,
      email: pending.contactMethod === 'email' ? pending.contactValue : '',
      phoneNumber: pending.contactMethod === 'phone' ? pending.contactValue : '',
      role: 'CITOYEN',
    };

    return {
      identifier: pending.contactValue,
      password: pending.password,
      username: pending.username,
      prenom: pending.prenom,
      nom: pending.nom,
      contactMethod: pending.contactMethod,
      verifiedAt: new Date().toISOString(),
      token: `taxawu-${Date.now()}`,
      user,
    };
  }

  private persistSession(token: string, user: UserDto): void {
    this.writeStorage(TOKEN_KEY, token);
    this.writeStorage(USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private clearSession(): void {
    this.removeStorage(TOKEN_KEY);
    this.removeStorage(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private setPendingRegistration(registration: PendingRegistration): void {
    this.writeStorage(PENDING_REGISTRATION_KEY, JSON.stringify(registration));
  }

  private clearPendingRegistration(): void {
    this.removeStorage(PENDING_REGISTRATION_KEY);
  }

  private setVerifiedRegistration(registration: VerifiedRegistration): void {
    this.writeStorage(VERIFIED_REGISTRATION_KEY, JSON.stringify(registration));
  }

  private clearVerifiedRegistration(): void {
    this.removeStorage(VERIFIED_REGISTRATION_KEY);
  }

  private loadToken(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): UserDto | null {
    if (!this.isBrowser) return null;

    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserDto;
    } catch {
      return null;
    }
  }

  private readStorage<T>(key: string): T | null {
    if (!this.isBrowser) return null;

    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem(key, value);
  }

  private removeStorage(key: string): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem(key);
  }
}
