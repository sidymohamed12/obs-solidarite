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
} from '../models/auth.models';

export const TOKEN_KEY = 'taxawu_token';
export const USER_KEY = 'taxawu_user';
const PENDING_REGISTRATION_KEY = 'taxawu_pending_registration';
const CITOYENS_ACCOUNTS_KEY = 'taxawu_citoyens_accounts';
const AGENTS_ACCOUNTS_KEY = 'taxawu_agents_accounts';

const ADMIN_EMAIL = 'admin@accel-tech.net';
const ADMIN_PASSWORD = 'admin123';

type PersistedAccountRole = 'CITOYEN' | 'AGENT';

interface ContactSelection {
  method: ContactMethod;
  value: string;
}

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

    try {
      if (role !== 'CITOYEN') {
        this._error.set('Inscription non autorisée pour ce rôle.');
        return;
      }

      const contact = this.resolveContact(payload);
      if (!contact) {
        this._error.set('Renseignez soit un email, soit un numéro de téléphone.');
        return;
      }

      if (this.identifierExists(contact.value)) {
        this._error.set('Un compte existe déjà avec cet identifiant.');
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
        queryParams: { channel: contact.method },
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

      if (this.identifierExists(pending.contactValue)) {
        this._error.set('Ce compte existe déjà.');
        return;
      }

      const account = this.buildAccountFromRegistration(pending, 'CITOYEN');
      this.saveAccount('CITOYEN', account);
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
      const identifier = payload.identifier.trim().toLowerCase();
      const password = payload.password.trim();

      if (!identifier || !password) {
        this._error.set('Identifiants incorrects');
        return;
      }

      if (identifier === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
        const adminUser: UserDto = {
          id: 1,
          username: 'admin.accel-tech',
          prenom: 'Admin',
          nom: 'Accel Tech',
          email: ADMIN_EMAIL,
          phoneNumber: '',
          role: 'ADMIN',
        };
        this.persistSession(`taxawu-admin-${Date.now()}`, adminUser);
        this.redirectByRole('ADMIN');
        return;
      }

      const allAccounts = [...this.loadAccounts('CITOYEN'), ...this.loadAccounts('AGENT')];
      const account = allAccounts.find(
        (item) => item.identifier.trim().toLowerCase() === identifier && item.password === password,
      );

      if (!account) {
        this._error.set('Identifiants incorrects');
        return;
      }

      this.persistSession(`taxawu-${account.user.role.toLowerCase()}-${Date.now()}`, account.user);
      this.redirectByRole(account.user.role);
    } finally {
      this._loading.set(false);
    }
  }

  createAgent(payload: RegisterRequest): { success: boolean; message: string } {
    const contact = this.resolveContact(payload);
    if (!contact) {
      return {
        success: false,
        message: 'Renseignez soit un email, soit un numéro de téléphone.',
      };
    }

    if (this.identifierExists(contact.value)) {
      return {
        success: false,
        message: 'Un compte existe déjà avec cet identifiant.',
      };
    }

    const account = this.buildAccountFromRegistration(
      {
        username: payload.username.trim(),
        prenom: payload.prenom.trim(),
        nom: payload.nom.trim(),
        contactMethod: contact.method,
        contactValue: contact.value,
        password: payload.password,
        createdAt: new Date().toISOString(),
      },
      'AGENT',
    );

    this.saveAccount('AGENT', account);

    return {
      success: true,
      message: 'Agent créé avec succès.',
    };
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

  private buildAccountFromRegistration(
    registration: PendingRegistration,
    role: PersistedAccountRole,
  ): PersistedAuthAccount {
    const user: UserDto = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      username: registration.username,
      prenom: registration.prenom,
      nom: registration.nom,
      email: registration.contactMethod === 'email' ? registration.contactValue : '',
      phoneNumber: registration.contactMethod === 'phone' ? registration.contactValue : '',
      role,
    };

    return {
      identifier: registration.contactValue,
      password: registration.password,
      contactMethod: registration.contactMethod,
      user,
      createdAt: new Date().toISOString(),
    };
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

  private identifierExists(identifier: string): boolean {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    if (normalized === ADMIN_EMAIL.toLowerCase()) {
      return true;
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

    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private clearSession(): void {
    if (!this.isBrowser) {
      return;
    }

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private loadToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return sessionStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): UserDto | null {
    if (!this.isBrowser) {
      return null;
    }

    const raw = sessionStorage.getItem(USER_KEY);
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
}
