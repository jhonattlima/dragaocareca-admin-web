import { Component, OnInit } from '@angular/core';
import { ApiService, FeedStatus } from '../../core/api.service';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit {
  feedStatus?: FeedStatus;
  errorMessage = '';

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getFeedStatus().subscribe({
      next: (status) => {
        this.feedStatus = status;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not load feed status.';
      },
    });
  }
}
