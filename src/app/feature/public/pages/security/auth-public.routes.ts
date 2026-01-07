import { Routes } from '@angular/router';
import { AuthPublicLayoutComponent } from './auth-public-layout/auth-public-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const AUTH_PUBLIC_ROUTES: Routes = [
  {
    path: '',
    component: AuthPublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent, title: 'Connexion' },
      { path: 'register', component: RegisterComponent, title: 'Inscription' },
    ],
  },
];
