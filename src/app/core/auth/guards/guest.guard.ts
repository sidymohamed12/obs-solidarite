import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Bloque les utilisateurs déjà connectés (pages login/register). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return true;
  auth.redirectByRole(auth.userRole()!);
  return false;
};
