import { Injectable, Optional } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService, @Optional() private readonly router?: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAccessToken();
    if (!token) {
      return next.handle(req).pipe(catchError((error: unknown) => this.handleUnauthorized(req, error)));
    }

    const withAuth = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(withAuth).pipe(catchError((error: unknown) => this.handleUnauthorized(req, error)));
  }

  private handleUnauthorized(req: HttpRequest<unknown>, error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/auth/google')) {
      this.authService.logout();
      void this.router?.navigateByUrl('/login');
    }
    return throwError(() => error);
  }
}
