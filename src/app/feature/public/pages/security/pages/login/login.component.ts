import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly router = inject(Router);
  loginMethod: 'email' | 'phone' = 'email';

  setLoginMethod(method: 'email' | 'phone') {
    this.loginMethod = method;
  }

  onLogin() {
    if (this.loginMethod === 'email') {
      console.log('Connexion via Email');
      this.router.navigate(['public']);
    } else {
      console.log('Connexion via Téléphone');
      this.router.navigate(['public']);
    }
  }
}
