import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Episode, EpisodeWriteInput, FeedStatus } from '../../core/api.service';
import { AuthService, AuthUser } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user?: AuthUser;
  feedStatus?: FeedStatus;
  episodes: Episode[] = [];
  errorMessage = '';
  successMessage = '';
  editingEpisodeId: number | null = null;

  formModel: EpisodeWriteInput = {
    episodeId: 0,
    title: '',
    summary: '',
    pubDate: new Date().toISOString(),
    explicit: 'no',
    duration: '',
    authors: [],
    guests: [],
    tags: ['podcast', 'rpg', 'dragaocareca', 'humor'],
    citations: [],
    musicCredits: [],
    coverCredits: [],
  };

  constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (response) => {
        this.user = response.user;
      },
      error: () => {
        this.logout();
      },
    });

    this.reloadData();
  }

  startEdit(episode: Episode): void {
    this.editingEpisodeId = episode.episodeId;
    this.formModel = {
      episodeId: episode.episodeId,
      title: episode.title,
      summary: episode.summary,
      pubDate: episode.pubDate,
      duration: episode.duration,
      explicit: episode.explicit,
      authors: [],
      guests: [],
      tags: ['podcast', 'rpg', 'dragaocareca', 'humor'],
      citations: [],
      musicCredits: [],
      coverCredits: [],
    };
  }

  resetForm(): void {
    this.editingEpisodeId = null;
    this.formModel = {
      episodeId: 0,
      title: '',
      summary: '',
      pubDate: new Date().toISOString(),
      explicit: 'no',
      duration: '',
      authors: [],
      guests: [],
      tags: ['podcast', 'rpg', 'dragaocareca', 'humor'],
      citations: [],
      musicCredits: [],
      coverCredits: [],
    };
  }

  saveEpisode(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formModel.episodeId || !this.formModel.title || !this.formModel.pubDate) {
      this.errorMessage = 'Episode ID, title and pubDate are required.';
      return;
    }

    const request = this.editingEpisodeId
      ? this.apiService.updateEpisode(this.editingEpisodeId, this.formModel)
      : this.apiService.createEpisode(this.formModel);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingEpisodeId ? 'Episode updated.' : 'Episode created.';
        this.resetForm();
        this.reloadData();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not save episode.';
      },
    });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  private reloadData(): void {
    this.apiService.getFeedStatus().subscribe({
      next: (status) => {
        this.feedStatus = status;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not load feed status.';
      },
    });

    this.apiService.listEpisodes().subscribe({
      next: (episodes) => {
        this.episodes = episodes;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not load episodes.';
      },
    });
  }
}
