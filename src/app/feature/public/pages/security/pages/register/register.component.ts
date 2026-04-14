import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/services/auth.service';
import { RegisterRequest } from '../../../../../../core/auth/models/auth.models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  contactMethod: 'email' | 'phone' = 'email';
  registerForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
        prenom: ['', [Validators.required, Validators.minLength(2)]],
        nom: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(4)]],
        confirmPassword: ['', Validators.required],
        phoneNumber: ['', []],
      },
      { validators: this.passwordMatchValidator }
    );

    this.applyContactValidators();
  }

  private passwordMatchValidator(form: FormGroup): { passwordMismatch: true } | null {
    const pw = form.get('password')?.value;
    const cpw = form.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }

  setContactMethod(method: 'email' | 'phone'): void {
    if (this.contactMethod === method) {
      return;
    }

    this.contactMethod = method;
    this.auth.clearError();
    this.applyContactValidators();
  }

  fieldError(field: string): boolean {
    const ctrl = this.registerForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { confirmPassword, email, phoneNumber, ...rest } = this.registerForm.value;
    const payload: RegisterRequest = {
      ...rest,
      ...(this.contactMethod === 'email'
        ? { email: (email ?? '').trim() }
        : { phoneNumber: (phoneNumber ?? '').trim() }),
    };

    this.auth.register(payload);
  }

  private applyContactValidators(): void {
    const emailCtrl = this.registerForm.get('email');
    const phoneCtrl = this.registerForm.get('phoneNumber');

    if (!emailCtrl || !phoneCtrl) {
      return;
    }

    if (this.contactMethod === 'email') {
      emailCtrl.setValidators([Validators.required, Validators.email]);
      phoneCtrl.setValidators([]);
      phoneCtrl.setValue('');
    } else {
      emailCtrl.setValidators([]);
      emailCtrl.setValue('');
      phoneCtrl.setValidators([Validators.required, Validators.pattern('^\\+?[0-9 ]{8,15}$')]);
    }

    emailCtrl.updateValueAndValidity();
    phoneCtrl.updateValueAndValidity();
  }
}
