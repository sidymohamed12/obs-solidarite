import { Routes } from '@angular/router';
import { AuthPublicLayoutComponent } from './auth-public-layout/auth-public-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { VerifyComponent } from './pages/verify/verify.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { authGuard } from '../../../../core/auth/guards/auth.guard';
import { guestGuard } from '../../../../core/auth/guards/guest.guard';

export const AUTH_PUBLIC_ROUTES: Routes = [
  {
    path: '',
    component: AuthPublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent, title: 'Connexion', canActivate: [guestGuard] },
      { path: 'register', component: RegisterComponent, title: 'Inscription', canActivate: [guestGuard] },
      { path: 'verify', component: VerifyComponent, title: 'Vérification', canActivate: [guestGuard] },
      { path: 'reset-password', component: ResetPasswordComponent, title: 'Réinitialisation', canActivate: [guestGuard] },
      { path: 'logout',   component: LogoutComponent,   title: 'Déconnexion', canActivate: [authGuard] },
    ],
  },
];
