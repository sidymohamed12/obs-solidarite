import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'public',
    loadChildren: () => import('./feature/public/public.routes').then((m) => m.PUBLIC_ROUTES),
  },
  {
    path: 'auth/public',
    loadChildren: () =>
      import('./feature/public/pages/security/auth-public.routes').then(
        (m) => m.AUTH_PUBLIC_ROUTES
      ),
  },
  { path: '', redirectTo: 'public', pathMatch: 'full' },
];
