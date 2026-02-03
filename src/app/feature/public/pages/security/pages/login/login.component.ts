import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  loginMethod: 'email' | 'phone' = 'email';

  // Définition des formulaires
  emailForm!: FormGroup;
  phoneForm!: FormGroup;

  ngOnInit() {
    this.initForms();
  }

  private initForms() {
    // Formulaire Email
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Formulaire Téléphone
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern('^[0-9+ ]*$')]],
      pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
    });
  }

  setLoginMethod(method: 'email' | 'phone') {
    this.loginMethod = method;
  }

  onLogin() {
    if (this.loginMethod === 'email') {
      if (this.emailForm.valid) {
        console.log('Données Email:', this.emailForm.value);
        this.router.navigate(['/public']);
      } else {
        this.emailForm.markAllAsTouched();
      }
    } else {
      if (this.phoneForm.valid) {
        console.log('Données Téléphone:', this.phoneForm.value);
        this.router.navigate(['/public']);
      } else {
        this.phoneForm.markAllAsTouched();
      }
    }
  }
}
