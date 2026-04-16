import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../../../core/auth/services/auth.service';

const PHONE_PATTERN = /^\+?[0-9 ]{8,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly step = signal<'request' | 'otp' | 'email'>('request');
  protected readonly loading = signal(false);
  protected readonly serverMessage = signal<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  private resetToken: string | null = null;

  protected readonly requestForm = this.fb.group({
    identifier: ['', [Validators.required, this.identifierValidator]],
  });

  protected readonly otpForm = this.fb.group(
    {
      phoneNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      otpCode: ['', [Validators.required, Validators.pattern(OTP_PATTERN)]],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  protected readonly emailForm = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit(): void {
    this.auth.clearError();

    const token = this.route.snapshot.queryParamMap.get('token');
    const hasTokenParam = this.route.snapshot.queryParamMap.has('token');

    if (hasTokenParam) {
      this.step.set('email');
      this.resetToken = token?.trim() || null;

      if (!this.resetToken) {
        this.serverMessage.set({
          type: 'error',
          text: 'Lien de réinitialisation invalide.',
        });
      }
      return;
    }

    this.serverMessage.set({
      type: 'info',
      text: 'Saisissez votre email ou votre numéro de téléphone pour recevoir un lien ou un code de réinitialisation.',
    });
  }

  protected fieldError(formName: 'request' | 'otp' | 'email', field: string): boolean {
    const ctrl = this.getForm(formName).get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected hasPasswordMismatch(formName: 'otp' | 'email'): boolean {
    const form = this.getForm(formName);
    const confirmControl = form.get('confirmPassword');
    return !!(form.hasError('passwordMismatch') && confirmControl?.touched);
  }

  protected submitRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    const rawIdentifier = (this.requestForm.value.identifier ?? '').trim();
    const identifier = this.isEmailIdentifier(rawIdentifier) ? rawIdentifier.toLowerCase() : rawIdentifier;

    this.loading.set(true);
    this.serverMessage.set(null);

    this.auth.requestPasswordReset({ identifier })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (this.isEmailIdentifier(identifier)) {
            this.serverMessage.set({
              type: 'success',
              text: response.message,
            });
            return;
          }

          this.showOtpStep(identifier, 'Saisissez le code reçu par SMS ainsi que votre nouveau mot de passe.');
        },
        error: (error: unknown) => {
          if (!this.isEmailIdentifier(identifier) && this.shouldAdvanceToOtpOnRequestError(error)) {
            this.showOtpStep(
              identifier,
              'Le serveur a signalé une erreur après l’envoi. Si vous avez bien reçu le code OTP par SMS, vous pouvez continuer ci-dessous.',
            );
            return;
          }

          this.serverMessage.set({
            type: 'error',
            text: this.resolveErrorMessage(error, 'Impossible de lancer la réinitialisation.'),
          });
        },
      });
  }

  protected submitOtpReset(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const { phoneNumber, otpCode, newPassword } = this.otpForm.getRawValue();

    this.loading.set(true);
    this.serverMessage.set(null);

    this.auth.confirmResetPasswordOtp({
      phoneNumber: phoneNumber ?? '',
      otpCode: otpCode ?? '',
      newPassword: newPassword ?? '',
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.router.navigate(['/auth/public/login'], {
            queryParams: {
              message: response.message,
            },
          });
        },
        error: (error: unknown) => {
          this.serverMessage.set({
            type: 'error',
            text: this.resolveErrorMessage(error, 'Impossible de réinitialiser le mot de passe.'),
          });
        },
      });
  }

  protected submitEmailReset(): void {
    if (!this.resetToken) {
      this.serverMessage.set({
        type: 'error',
        text: 'Lien de réinitialisation invalide.',
      });
      this.emailForm.markAllAsTouched();
      return;
    }

    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const { newPassword } = this.emailForm.getRawValue();

    this.loading.set(true);
    this.serverMessage.set(null);

    this.auth.changePassword({
      resetToken: this.resetToken,
      newPassword: newPassword ?? '',
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.router.navigate(['/auth/public/login'], {
            queryParams: {
              message: response.message,
            },
          });
        },
        error: (error: unknown) => {
          this.serverMessage.set({
            type: 'error',
            text: this.resolveErrorMessage(error, 'Impossible de modifier le mot de passe.'),
          });
        },
      });
  }

  protected goBackToRequest(): void {
    this.step.set('request');
    this.serverMessage.set({
      type: 'info',
      text: 'Saisissez votre email ou votre numéro de téléphone pour recevoir un lien ou un code de réinitialisation.',
    });
  }

  protected sanitizeIdentifier(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\s{2,}/g, '').trimStart();
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.requestForm.get('identifier')?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected sanitizePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let sanitized = input.value.replace(/[^0-9+ ]/g, '');
    sanitized = sanitized.replace(/(?!^)\+/g, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.otpForm.get('phoneNumber')?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected sanitizeOtp(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\D/g, '').slice(0, 6);
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.otpForm.get('otpCode')?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected trimControl(formName: 'request' | 'otp', field: string): void {
    const control = this.getForm(formName).get(field);
    const value = control?.value;
    if (control && typeof value === 'string') {
      control.setValue(value.trim(), { emitEvent: false });
    }
  }

  private getForm(formName: 'request' | 'otp' | 'email'): FormGroup {
    if (formName === 'request') {
      return this.requestForm;
    }

    if (formName === 'otp') {
      return this.otpForm;
    }

    return this.emailForm;
  }

  private identifierValidator(control: { value: string | null }): { invalidIdentifier: true } | null {
    const value = control.value?.trim() ?? '';
    if (!value) {
      return null;
    }

    return EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value) ? null : { invalidIdentifier: true };
  }

  private isEmailIdentifier(value: string): boolean {
    return value.includes('@');
  }

  private passwordMatchValidator(form: FormGroup): { passwordMismatch: true } | null {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  }

  private showOtpStep(phoneNumber: string, message: string): void {
    this.otpForm.patchValue({ phoneNumber });
    this.step.set('otp');
    this.serverMessage.set({
      type: 'info',
      text: message,
    });
  }

  private shouldAdvanceToOtpOnRequestError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const httpError = error as { status?: number; message?: string; error?: { message?: string } | string };
    const message = this.resolveErrorMessage(error, '').toLowerCase();

    return httpError.status === 500 || message.includes('erreur interne');
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
      const objectError = error as { message?: string; error?: { message?: string } | string };

      if (typeof objectError.error === 'string') {
        const parsed = this.parseJsonMessage(objectError.error);
        return parsed ?? objectError.error ?? objectError.message ?? fallback;
      }

      return objectError.error?.message ?? objectError.message ?? fallback;
    }

    return fallback;
  }

  private parseJsonMessage(value: string): string | null {
    const raw = value.trim();
    if (!raw.startsWith('{')) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as { message?: string; detail?: string; error?: string };
      return parsed.message ?? parsed.detail ?? parsed.error ?? null;
    } catch {
      return null;
    }
  }
}
