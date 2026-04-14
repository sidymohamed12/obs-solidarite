import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  AuthResponse,
  LoginEmailRequest,
  LoginPhoneRequest,
  RegisterRequest,
  UserDto,
  UserRole,
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
  login(payload: LoginEmailRequest | LoginPhoneRequest): Observable<AuthResponse> {
    const users = this.loadUsers();

    const user = this.isEmailLogin(payload)
      ? users.find(
          (item) =>
            item.email.toLowerCase() === payload.email.trim().toLowerCase() &&
            item.password === payload.password,
        )
      : users.find(
          (item) =>
            item.phoneNumber.trim() === payload.phoneNumber.trim() && item.codePin === payload.codePin,
        );

    if (!user) {
      return throwError(() => ({
        error: { message: 'Identifiants invalides.' },
        message: 'Identifiants invalides.',
      }));
    }

    return of({
      token: this.createToken(user),
      tokenType: 'Bearer',
      message: 'Connexion réussie (mode statique).',
      user: this.toUserDto(user),
    }).pipe(delay(250));
  }

  register(payload: RegisterRequest, role: UserRole): Observable<AuthResponse> {
    const users = this.loadUsers();
    const username = payload.username.trim().toLowerCase();
    const email = payload.email?.trim().toLowerCase() ?? '';
    const phone = payload.phoneNumber?.trim() ?? '';

    if ((!email && !phone) || (email && phone)) {
      return throwError(() => ({
        error: { message: 'Renseignez soit un email, soit un numéro de téléphone.' },
        message: 'Renseignez soit un email, soit un numéro de téléphone.',
      }));
    }

    const exists = users.some(
      (user) =>
        user.username.toLowerCase() === username ||
        (email.length > 0 && user.email.toLowerCase() === email) ||
        (phone.length > 0 && user.phoneNumber.trim() === phone),
    );

    if (exists) {
      return throwError(() => ({
        error: { message: 'Un compte existe déjà avec ces informations.' },
        message: 'Un compte existe déjà avec ces informations.',
      }));
    }

    const newUser: MockStoredUser = {
      id: this.nextId(users),
      username: payload.username.trim(),
      prenom: payload.prenom.trim(),
      nom: payload.nom.trim(),
      email: payload.email?.trim() ?? '',
      phoneNumber: payload.phoneNumber?.trim() ?? '',
      role,
      password: payload.password,
      codePin: '1234',
    };

    users.push(newUser);
    this.saveUsers(users);

    return of({
      token: null,
      tokenType: null,
      message: 'Compte créé avec succès (mode statique).',
      user: this.toUserDto(newUser),
    }).pipe(delay(250));
  }

  logout(_token: string): Observable<void> {
    return of(void 0).pipe(delay(100));
  }

  private isEmailLogin(payload: LoginEmailRequest | LoginPhoneRequest): payload is LoginEmailRequest {
    return 'email' in payload;
  }

  private toUserDto(user: MockStoredUser): UserDto {
    const { password: _password, codePin: _codePin, ...dto } = user;
    return dto;
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
