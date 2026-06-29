import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Episode {
  episodeId: number;
  title: string;
  summary: string;
  pubDate: string;
  duration?: string;
  explicit: 'yes' | 'no';
  bytes?: number;
  episodeNumber?: number;
  episodeType?: string;
  authors?: string[];
  guests?: string[];
  tags?: string[];
  citations?: string[];
  fileName?: string;
  coverFileName?: string;
  coverLowFileName?: string;
  trailerFileName?: string;
  youtube?: string;
  spotifyId?: string;
  musicCredits?: string[];
  coverCredits?: string[];
}

export interface EpisodeWriteInput {
  episodeId: number;
  title: string;
  summary: string;
  pubDate: string;
  duration?: string;
  explicit: 'yes' | 'no';
  authors?: string[];
  guests?: string[];
  tags?: string[];
  citations?: string[];
  bytes?: number;
  episodeNumber?: number;
  episodeType?: string;
  fileName?: string;
  coverFileName?: string;
  coverLowFileName?: string;
  trailerFileName?: string;
  youtube?: string;
  spotifyId?: string;
  musicCredits?: string[];
  coverCredits?: string[];
}

export interface StructuredEntrySuggestionItem {
  name: string;
  links: Array<{ label: string; url: string }>;
}

export interface StructuredEntryCatalogResponse {
  guests: StructuredEntrySuggestionItem[];
  musicCredits: StructuredEntrySuggestionItem[];
}

export interface FeedStatus {
  generatedAt: string;
  publishedCount: number;
  scheduledCount: number;
  nextScheduled: { episodeId: number; pubDate: string; title: string } | null;
}

export interface SpotifyMetricsErrorResponse {
  source: 'spotify-connector';
  fetchedAt: string;
  ok: false;
  message: string;
  details?: string;
}

export interface SpotifyMetricsSnapshot {
  source: 'spotify-connector';
  fetchedAt: string;
  range: {
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
  };
  metadata: Record<string, unknown>;
  current: {
    aggregate: Record<string, unknown>;
    listeners: Record<string, unknown>;
  };
  previous: {
    aggregate: Record<string, unknown>;
    listeners: Record<string, unknown>;
  };
  summary: {
    plays: { current: number | null; previous: number | null; deltaPercent: number | null };
    publicValue: { current: number | null; previous: number | null; deltaPercent: number | null; source?: string };
    consumingTime: { current: number | null; previous: number | null; deltaPercent: number | null };
    followers: { current: number | null; previous: number | null; deltaPercent: number | null; source?: string };
    followersCurrent?: number | null;
  };
  episodes: Array<Record<string, unknown>>;
  samplePerformance: Record<string, unknown> | null;
  debug?: Record<string, unknown>;
}

export interface YouTubeMetricsErrorResponse {
  source: 'youtube-analytics';
  fetchedAt: string;
  ok: false;
  code: 'disabled' | 'missing_credentials' | 'fetch_failed';
  message: string;
  details?: string;
}

export interface YouTubeMetricsSnapshot {
  source: 'youtube-analytics';
  fetchedAt: string;
  range: {
    requestedDays: number;
    lookbackDays: number;
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
    timeZone: string;
  };
  channel: {
    id: string;
    url: string;
    subscriberCount: number | null;
  };
  series: Array<{
    date: string;
    views: number;
    estimatedMinutesWatched: number;
    subscribersGained: number;
    subscribersLost: number;
    subscribersCurrent: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  totals: {
    views: number;
    estimatedMinutesWatched: number;
    subscribersGained: number;
    subscribersLost: number;
    netSubscribers: number;
    likes: number;
    comments: number;
    shares: number;
    averageViewDurationSeconds: number;
  };
  debug?: Record<string, unknown>;
}

export interface DeleteEpisodeResponse {
  episodeId: number;
  message: string;
}

export interface HealthStatus {
  status: string;
  uptime: number;
  bot?: {
    enabled: boolean;
    running: boolean;
    reason: string | null;
    pendingLaunchNotifications: number;
    lastQueuedAt: string | null;
    nextPendingEpisode: {
      episodeId: number;
      title: string;
      pubDate: string;
    } | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private readonly http: HttpClient) { }

  private uploadEpisodeFile(episodeId: number, file: File, pathSuffix: string): Observable<HttpEvent<Episode>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<Episode>(`${environment.apiBaseUrl}/episodes/${episodeId}/${pathSuffix}`, formData, {
      observe: 'events',
      reportProgress: true,
    });
  }

  listEpisodes(): Observable<Episode[]> {
    return this.http.get<Episode[]>(`${environment.apiBaseUrl}/episodes`);
  }

  listStructuredEntryCatalog(): Observable<StructuredEntryCatalogResponse> {
    return this.http.get<StructuredEntryCatalogResponse>(`${environment.apiBaseUrl}/episodes/references`);
  }

  createEpisode(payload: EpisodeWriteInput): Observable<Episode> {
    return this.http.post<Episode>(`${environment.apiBaseUrl}/episodes`, payload);
  }

  updateEpisode(episodeId: number, payload: EpisodeWriteInput): Observable<Episode> {
    return this.http.put<Episode>(`${environment.apiBaseUrl}/episodes/${episodeId}`, payload);
  }

  deleteEpisode(episodeId: number): Observable<DeleteEpisodeResponse> {
    return this.http.delete<DeleteEpisodeResponse>(`${environment.apiBaseUrl}/episodes/${episodeId}`);
  }

  uploadEpisodeAudio(episodeId: number, file: File): Observable<HttpEvent<Episode>> {
    return this.uploadEpisodeFile(episodeId, file, 'audio');
  }

  uploadEpisodeTrailer(episodeId: number, file: File): Observable<HttpEvent<Episode>> {
    return this.uploadEpisodeFile(episodeId, file, 'trailer');
  }

  uploadEpisodeCover(episodeId: number, file: File): Observable<HttpEvent<Episode>> {
    return this.uploadEpisodeFile(episodeId, file, 'cover');
  }

  uploadEpisodeCoverWebp(episodeId: number, file: File): Observable<HttpEvent<Episode>> {
    return this.uploadEpisodeFile(episodeId, file, 'cover-webp');
  }

  private deleteEpisodeFile(episodeId: number, pathSuffix: string): Observable<Episode> {
    return this.http.delete<Episode>(`${environment.apiBaseUrl}/episodes/${episodeId}/${pathSuffix}`);
  }

  deleteEpisodeAudio(episodeId: number): Observable<Episode> {
    return this.deleteEpisodeFile(episodeId, 'audio');
  }

  deleteEpisodeTrailer(episodeId: number): Observable<Episode> {
    return this.deleteEpisodeFile(episodeId, 'trailer');
  }

  deleteEpisodeCover(episodeId: number): Observable<Episode> {
    return this.deleteEpisodeFile(episodeId, 'cover');
  }

  deleteEpisodeCoverWebp(episodeId: number): Observable<Episode> {
    return this.deleteEpisodeFile(episodeId, 'cover-webp');
  }

  getFeedStatus(): Observable<FeedStatus> {
    return this.http.get<FeedStatus>(`${environment.apiBaseUrl}/feed/status`);
  }

  getFeedXml(): Observable<string> {
    return this.http.get(`${environment.apiBaseUrl}/feed`, { responseType: 'text' });
  }

  getFeedPreviewXml(): Observable<string> {
    return this.http.get(`${environment.apiBaseUrl}/feed/preview`, { responseType: 'text' });
  }

  getSpotifyMetrics(days = 30): Observable<SpotifyMetricsSnapshot | SpotifyMetricsErrorResponse> {
    const params = new HttpParams().set('days', String(days));
    return this.http.get<SpotifyMetricsSnapshot | SpotifyMetricsErrorResponse>(`${environment.apiBaseUrl}/metrics/spotify`, {
      params,
    });
  }

  getYouTubeMetrics(days = 90): Observable<YouTubeMetricsSnapshot | YouTubeMetricsErrorResponse> {
    const params = new HttpParams().set('days', String(days));
    return this.http.get<YouTubeMetricsSnapshot | YouTubeMetricsErrorResponse>(`${environment.apiBaseUrl}/metrics/youtube`, {
      params,
    });
  }

  getHealth(): Observable<HealthStatus> {
    const healthUrl = environment.apiBaseUrl.replace(/\/v1$/, '/health');
    return this.http.get<HealthStatus>(healthUrl);
  }
}
