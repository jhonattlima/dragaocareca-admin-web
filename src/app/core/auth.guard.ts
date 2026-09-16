import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthBypassEnabled()) {
    return true;
  }

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // A token can remain in localStorage after it expires or is revoked. Validate
  // it before activating the protected shell so unauthenticated users never see
  // dashboard pages while the profile request is failing in the background.
  return authService.getProfile().pipe(
    map(() => true),
    catchError(() => {
      authService.logout();
      return of(router.createUrlTree(['/login']));
    }),
  );
};
