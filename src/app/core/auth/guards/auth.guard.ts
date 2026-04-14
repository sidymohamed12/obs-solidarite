import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protège les routes qui nécessitent une authentification. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  inject(Router).navigate(['/auth/public/login']);
  return false;
};
