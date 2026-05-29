import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const ACCESS_TOKEN_KEY = 'dc_admin_access_token';

export interface AuthUser {
  email: string;
  name?: string;
  picture?: string;
}

interface GoogleLoginResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private readonly http: HttpClient) { }

  loginWithGoogleIdToken(idToken: string): Observable<GoogleLoginResponse> {
    return this.http
      .post<GoogleLoginResponse>(`${environment.apiBaseUrl}/auth/google`, { idToken })
      .pipe(tap((response) => this.setAccessToken(response.accessToken)));
  }

  getProfile(): Observable<{ user: AuthUser }> {
    if (environment.authBypass) {
      return of({ user: { email: 'dev-bypass@local', name: 'Development Bypass' } });
    }
    return this.http.get<{ user: AuthUser }>(`${environment.apiBaseUrl}/auth/me`);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    if (environment.authBypass) {
      return true;
    }
    return !!this.getAccessToken();
  }

  isAuthBypassEnabled(): boolean {
    return environment.authBypass;
  }
}
