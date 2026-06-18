import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  feedXmlUrl: SafeResourceUrl | null = null;
  errorMessage = '';
  loading = true;
  rawOpen = true;

  constructor(
    private readonly apiService: ApiService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
    this.apiService.getFeedXml().subscribe({
      next: (feedXml) => {
        const dataUrl = `data:application/xml;charset=utf-8,${encodeURIComponent(feedXml)}`;
        this.feedXmlUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not load feed.';
        this.loading = false;
      },
    });
  }
}
