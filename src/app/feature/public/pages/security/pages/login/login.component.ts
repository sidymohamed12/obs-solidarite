import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/services/auth.service';
import { LoginEmailRequest, LoginPhoneRequest } from '../../../../../../core/auth/models/auth.models';

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

  loginMethod: 'email' | 'phone' = 'email';
  registeredMessage = signal<string | null>(null);

  emailForm!: FormGroup;
  phoneForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    // Message de succès après inscription
    const registered = this.route.snapshot.queryParamMap.get('registered');
    const msg = this.route.snapshot.queryParamMap.get('message');
    if (registered === 'true') {
      this.registeredMessage.set(msg ?? 'Compte créé avec succès. Connectez-vous.');
    }
  }

  private initForms(): void {
    this.emailForm = this.fb.group({
      email: ['ndaoelhadji973@gmail.com', [Validators.required, Validators.email]],
      password: ['Citoyen123@', [Validators.required, Validators.minLength(4)]],
    });

    this.phoneForm = this.fb.group({
      phone: ['700000002', [Validators.required, Validators.pattern('^\\+?[0-9 ]{8,15}$')]],
      pin: ['1234', [Validators.required, Validators.minLength(4), Validators.maxLength(4), Validators.pattern('^[0-9]+$')]],
    });
  }

  setLoginMethod(method: 'email' | 'phone'): void {
    this.loginMethod = method;
    this.auth.clearError();
  }

  onLogin(): void {
    if (this.loginMethod === 'email') {
      if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
      const payload: LoginEmailRequest = {
        email: this.emailForm.value.email,
        password: this.emailForm.value.password,
      };
      this.auth.login(payload);
    } else {
      if (this.phoneForm.invalid) { this.phoneForm.markAllAsTouched(); return; }
      const payload: LoginPhoneRequest = {
        phoneNumber: this.phoneForm.value.phone,
        codePin: this.phoneForm.value.pin,
      };
      this.auth.login(payload);
    }
  }
}
