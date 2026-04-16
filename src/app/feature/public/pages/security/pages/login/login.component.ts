import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/services/auth.service';
import { LoginRequest } from '../../../../../../core/auth/models/auth.models';

const PHONE_PATTERN = /^\+?[0-9 ]{8,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  registeredMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    identifier: ['', [Validators.required, this.identifierValidator]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  ngOnInit(): void {
    const registered = this.route.snapshot.queryParamMap.get('verified');
    const msg = this.route.snapshot.queryParamMap.get('message');

    if (registered === 'true' || msg) {
      this.registeredMessage.set(msg ?? 'Compte vérifié avec succès. Connectez-vous.');
    }
  }

  protected fieldError(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload: LoginRequest = {
      ...(this.isEmailIdentifier(this.loginForm.value.identifier ?? '')
        ? { email: (this.loginForm.value.identifier ?? '').trim() }
        : { phoneNumber: (this.loginForm.value.identifier ?? '').trim() }),
      password: this.loginForm.value.password ?? '',
    };

    this.auth.login(payload);
  }

  protected sanitizeIdentifier(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\s{2,}/g, '');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.loginForm.get('identifier')?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected trimControl(field: 'identifier' | 'password'): void {
    const control = this.loginForm.get(field);
    const value = control?.value;
    if (control && typeof value === 'string') {
      control.setValue(value.trim(), { emitEvent: false });
    }
  }

  private identifierValidator(control: { value: string | null }): { invalidIdentifier: true } | null {
    const value = control.value?.trim() ?? '';
    if (!value) {
      return null;
    }

    const isEmail = EMAIL_PATTERN.test(value);
    const isPhone = PHONE_PATTERN.test(value);

    return isEmail || isPhone ? null : { invalidIdentifier: true };
  }

  private isEmailIdentifier(value: string): boolean {
    return value.includes('@');
  }
}
