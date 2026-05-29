import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleButtonHost', { static: true })
  googleButtonHost!: ElementRef<HTMLDivElement>;

  idToken = '';
  loading = false;
  errorMessage = '';
  authBypassEnabled = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly zone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.authBypassEnabled = this.authService.isAuthBypassEnabled();
    if (this.authBypassEnabled) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.setupGoogleButton();
  }

  login(): void {
    this.errorMessage = '';
    if (!this.idToken.trim()) {
      this.errorMessage = 'Provide a Google ID token to continue.';
      return;
    }

    this.exchangeGoogleToken(this.idToken.trim());
  }

  private setupGoogleButton(): void {
    if (!environment.googleClientId) {
      this.errorMessage = 'Set googleClientId in environment.ts to use Google Sign-In button.';
      return;
    }

    const google = window.google;
    if (!google?.accounts?.id) {
      this.errorMessage = 'Google Identity script not available. Reload and try again.';
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential?: string }) => {
        if (!response.credential) {
          this.errorMessage = 'Google did not return a credential token.';
          return;
        }
        this.zone.run(() => this.exchangeGoogleToken(response.credential as string));
      },
    });

    google.accounts.id.renderButton(this.googleButtonHost.nativeElement, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 320,
    });
  }

  private exchangeGoogleToken(token: string): void {
    this.loading = true;
    this.authService.loginWithGoogleIdToken(token).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigateByUrl('/');
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'Login failed.';
      },
    });
  }
}
