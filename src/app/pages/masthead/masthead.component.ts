import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-masthead',
  templateUrl: './masthead.component.html',
  styleUrls: ['./masthead.component.scss']
})
export class MastheadComponent {
  @Input() user?: AuthUser;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
