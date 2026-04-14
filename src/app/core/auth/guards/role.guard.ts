import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

/**
 * Fabrique un guard de rôle.
 * @example canActivate: [roleGuard(['ADMIN', 'AGENT'])]
 */
export const roleGuard =
  (allowedRoles: UserRole[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const role = auth.userRole();
    if (role && allowedRoles.includes(role)) return true;
    inject(Router).navigate(['/public']);
    return false;
  };
