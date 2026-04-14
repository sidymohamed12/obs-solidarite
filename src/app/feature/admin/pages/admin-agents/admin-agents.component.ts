import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterRequest, UserDto } from '../../../../core/auth/models/auth.models';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-admin-agents',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-agents.component.html',
  styleUrl: './admin-agents.component.css',
})
export class AdminAgentsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected contactMethod: 'email' | 'phone' = 'email';
  protected createAgentForm!: FormGroup;
  protected agents: UserDto[] = [];
  protected formMessage: { type: 'success' | 'error'; text: string } | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadAgents();
  }

  protected setContactMethod(method: 'email' | 'phone'): void {
    if (this.contactMethod === method) {
      return;
    }

    this.contactMethod = method;
    this.formMessage = null;
    this.applyContactValidators();
  }

  protected fieldError(field: string): boolean {
    const ctrl = this.createAgentForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected createAgent(): void {
    this.formMessage = null;

    if (this.createAgentForm.invalid) {
      this.createAgentForm.markAllAsTouched();
      return;
    }

    const { confirmPassword, email, phoneNumber, ...rest } = this.createAgentForm.value;
    const payload: RegisterRequest = {
      ...rest,
      ...(this.contactMethod === 'email'
        ? { email: (email ?? '').trim() }
        : { phoneNumber: (phoneNumber ?? '').trim() }),
    };

    const result = this.auth.createAgent(payload);
    this.formMessage = {
      type: result.success ? 'success' : 'error',
      text: result.message,
    };

    if (!result.success) {
      return;
    }

    this.createAgentForm.reset();
    this.createAgentForm.patchValue({ email: '', phoneNumber: '' });
    this.contactMethod = 'email';
    this.applyContactValidators();
    this.loadAgents();
  }

  private initForm(): void {
    this.createAgentForm = this.fb.group(
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

  private loadAgents(): void {
    this.agents = this.auth.getAgents();
  }

  private passwordMatchValidator(form: FormGroup): { passwordMismatch: true } | null {
    const pw = form.get('password')?.value;
    const cpw = form.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }

  private applyContactValidators(): void {
    const emailCtrl = this.createAgentForm.get('email');
    const phoneCtrl = this.createAgentForm.get('phoneNumber');

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
