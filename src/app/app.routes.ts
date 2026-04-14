import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: 'public',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/public/public.routes').then((m) => m.PUBLIC_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'auth/public',
    loadChildren: () =>
      import('./feature/public/pages/security/auth-public.routes').then(
        (m) => m.AUTH_PUBLIC_ROUTES
      ),
  },
  { path: '', redirectTo: 'auth/public', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/public' },
];
