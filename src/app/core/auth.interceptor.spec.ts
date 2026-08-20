import { HttpRequest, HttpResponse } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { of } from 'rxjs';

describe('AuthInterceptor compatibility', () => {
  it('adds a bearer header when the central AuthService has a token', () => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['getAccessToken']);
    authService.getAccessToken.and.returnValue('jwt-token');
    const interceptor = new AuthInterceptor(authService);
    const next = { handle: jasmine.createSpy('handle').and.returnValue(of(new HttpResponse({ status: 200 }))) };
    const request = new HttpRequest('GET', '/v1/episodes');

    interceptor.intercept(request, next).subscribe();

    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(next.handle.calls.mostRecent().args[0].headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(request.headers.has('Authorization')).toBeFalse();
  });

  it('passes requests through unchanged when no token exists, including bypass-compatible requests', () => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['getAccessToken']);
    authService.getAccessToken.and.returnValue(null);
    const interceptor = new AuthInterceptor(authService);
    const next = { handle: jasmine.createSpy('handle').and.returnValue(of(new HttpResponse({ status: 200 }))) };
    const request = new HttpRequest('GET', '/v1/episodes');

    interceptor.intercept(request, next).subscribe();

    expect(next.handle).toHaveBeenCalledOnceWith(request);
    expect(next.handle.calls.mostRecent().args[0].headers.has('Authorization')).toBeFalse();
  });
});
