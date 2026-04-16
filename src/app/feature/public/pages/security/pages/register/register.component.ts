import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/services/auth.service';
import { RegisterRequest } from '../../../../../../core/auth/models/auth.models';

const LETTERS_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,30}$/;
const PHONE_PATTERN = /^\+?[0-9 ]{8,15}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  registerForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN)]],
        prenom: ['', [Validators.required, Validators.pattern(LETTERS_PATTERN)]],
        nom: ['', [Validators.required, Validators.pattern(LETTERS_PATTERN)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
        confirmPassword: ['', Validators.required],
        phoneNumber: ['', [Validators.pattern(PHONE_PATTERN)]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(form: FormGroup): { passwordMismatch: true } | null {
    const pw = form.get('password')?.value;
    const cpw = form.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }

  fieldError(field: string): boolean {
    const ctrl = this.registerForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected sanitizeLettersField(field: 'prenom' | 'nom', event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.registerForm.get(field)?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected sanitizeUsername(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^A-Za-z0-9._-]/g, '');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.registerForm.get('username')?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected sanitizePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let sanitized = input.value.replace(/[^0-9+ ]/g, '');
    sanitized = sanitized.replace(/(?!^)\+/g, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.registerForm.get('phoneNumber')?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected trimControl(field: 'prenom' | 'nom' | 'username' | 'email' | 'phoneNumber'): void {
    const control = this.registerForm.get(field);
    const value = control?.value;
    if (control && typeof value === 'string') {
      control.setValue(value.trim(), { emitEvent: false });
    }
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { confirmPassword, email, phoneNumber, ...rest } = this.registerForm.value;
    const payload: RegisterRequest = {
      ...rest,
      email: (email ?? '').trim().toLowerCase(),
      ...((phoneNumber ?? '').trim()
        ? { phoneNumber: (phoneNumber ?? '').trim() }
        : {}),
    };

    this.auth.register(payload);
  }
}
