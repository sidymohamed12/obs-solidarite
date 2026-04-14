import { Routes } from '@angular/router';
import { AuthPublicLayoutComponent } from './auth-public-layout/auth-public-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { authGuard } from '../../../../core/auth/guards/auth.guard';

export const AUTH_PUBLIC_ROUTES: Routes = [
  {
    path: '',
    component: AuthPublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent, title: 'Connexion' },
      { path: 'register', component: RegisterComponent, title: 'Inscription' },
      { path: 'logout',   component: LogoutComponent,   title: 'Déconnexion', canActivate: [authGuard] },
    ],
  },
];
