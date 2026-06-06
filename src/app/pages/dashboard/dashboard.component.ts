import { Component, OnInit } from '@angular/core';
import { AuthService, AuthUser } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user?: AuthUser;
  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (response) => {
        this.user = response.user;
      },
      error: () => {
        this.authService.logout();
      },
    });
  }
}
