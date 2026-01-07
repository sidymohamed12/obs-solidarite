import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginMethod: 'email' | 'phone' = 'email';

  setLoginMethod(method: 'email' | 'phone') {
    this.loginMethod = method;
  }

  onLogin() {
    if (this.loginMethod === 'email') {
      console.log('Connexion via Email');
    } else {
      console.log('Connexion via Téléphone');
    }
  }
}
