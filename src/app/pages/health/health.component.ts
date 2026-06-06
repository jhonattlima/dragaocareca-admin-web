import { Component, OnInit } from '@angular/core';
import { ApiService, HealthStatus } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.scss']
})
export class HealthComponent implements OnInit {
  healthStatus?: HealthStatus;
  authBypassEnabled = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authBypassEnabled = this.authService.isAuthBypassEnabled();
    this.apiService.getHealth().subscribe({
      next: (status) => {
        this.healthStatus = status;
      },
      error: () => {
        this.healthStatus = undefined;
      },
    });
  }
}
