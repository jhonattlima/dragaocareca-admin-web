import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService, AuthUser } from './auth.service';
import { environment } from '../../environments/environment';
import { environment as stagingEnvironment } from '../../environments/environment.staging';
import { environment as productionEnvironment } from '../../environments/environment.prod';

describe('AuthService compatibility', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let originalBypass: boolean;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    originalBypass = environment.authBypass;
    localStorage.clear();
  });

  afterEach(() => {
    environment.authBypass = originalBypass;
    localStorage.clear();
    httpMock.verify();
  });

  it('keeps local authBypass explicit and returns the mock profile without an API call', () => {
    environment.authBypass = true;

    expect(service.isAuthBypassEnabled()).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();

    let profile: { user: AuthUser } | undefined;
    service.getProfile().subscribe((value) => profile = value);

    expect(profile).toEqual({ user: { email: 'dev-bypass@local', name: 'Development Bypass' } });
    httpMock.expectNone(`${environment.apiBaseUrl}/auth/me`);
  });

  it('keeps staging and production configured for normal authentication', () => {
    expect(stagingEnvironment.authBypass).toBeFalse();
    expect(productionEnvironment.authBypass).toBeFalse();
  });

  it('exchanges the Google token, stores the returned access token, and loads the normal profile', () => {
    environment.authBypass = false;
    const user: AuthUser = { email: 'operator@example.test', name: 'Operator' };

    service.loginWithGoogleIdToken('google-id-token').subscribe((response) => {
      expect(response).toEqual({ accessToken: 'jwt-token', user });
    });

    const exchange = httpMock.expectOne(`${environment.apiBaseUrl}/auth/google`);
    expect(exchange.request.method).toBe('POST');
    expect(exchange.request.body).toEqual({ idToken: 'google-id-token' });
    exchange.flush({ accessToken: 'jwt-token', user });
    expect(service.getAccessToken()).toBe('jwt-token');
    expect(service.isAuthenticated()).toBeTrue();

    service.getProfile().subscribe((response) => expect(response).toEqual({ user }));
    const profile = httpMock.expectOne(`${environment.apiBaseUrl}/auth/me`);
    expect(profile.request.method).toBe('GET');
    profile.flush({ user });
  });

  it('does not treat an empty normal-mode token as authenticated', () => {
    environment.authBypass = false;
    expect(service.isAuthenticated()).toBeFalse();
  });
});
