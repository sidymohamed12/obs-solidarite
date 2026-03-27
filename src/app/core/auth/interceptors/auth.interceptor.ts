import { HttpInterceptorFn } from '@angular/common/http';
import { TOKEN_KEY } from '../services/auth.service';

/**
 * Attache le token Bearer sur chaque requête sortante.
 * Lit directement depuis localStorage pour éviter la dépendance
 * circulaire HttpClient → AuthService → AuthApiService → HttpClient.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  );
};
