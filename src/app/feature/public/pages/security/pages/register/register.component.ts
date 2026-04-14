import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/services/auth.service';
import { RegisterRequest, UserRole } from '../../../../../../core/auth/models/auth.models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  selectedRole: UserRole = 'CITOYEN';
  registerForm!: FormGroup;

  readonly roles: { value: UserRole; label: string; icon: string }[] = [
    { value: 'CITOYEN', label: 'Citoyen', icon: 'fa-solid fa-user' },
    { value: 'AGENT', label: 'Agent', icon: 'fa-solid fa-id-badge' },
    { value: 'ADMIN', label: 'Admin', icon: 'fa-solid fa-shield-halved' },
  ];

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
        phoneNumber: ['', [Validators.required, Validators.pattern('^\\+?[0-9 ]{8,15}$')]],
        codePin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4), Validators.pattern('^[0-9]+$')]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(form: FormGroup): { passwordMismatch: true } | null {
    const pw = form.get('password')?.value;
    const cpw = form.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }

  setRole(role: UserRole): void {
    this.selectedRole = role;
    this.auth.clearError();
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
    const { confirmPassword, ...rest } = this.registerForm.value;
    const payload: RegisterRequest = rest;
    this.auth.register(payload, this.selectedRole);
  }
}
