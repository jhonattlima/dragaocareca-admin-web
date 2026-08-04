import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
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
  trailerVideoFileName?: string | null;
  trailerVideoSyncStatus?: 'unpublished' | 'manual-sync-required' | 'synced';
  youtube?: string;
  spotifyId?: string;
  musicCredits?: string[];
  coverCredits?: string[];
  transcriptFileName?: string;
  transcriptStatus?: 'idle' | 'pending' | 'processing' | 'done' | 'error';
  transcriptUpdatedAt?: string;
  transcriptStartedAt?: string | null;
  transcriptError?: string;
  transcriptProgress?: number | null;
  summaryStatus?: 'idle' | 'pending' | 'processing' | 'done' | 'error';
  summaryUpdatedAt?: string | null;
  summaryStartedAt?: string | null;
  summaryError?: string | null;
  summaryProgress?: number | null;
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
  trailerVideoFileName?: string | null;
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

export interface EpisodeTranscriptionStatus {
  status: 'idle' | 'pending' | 'processing' | 'done' | 'error';
  transcriptFileName: string | null;
  transcriptUpdatedAt: string | null;
  transcriptStartedAt: string | null;
  progress: number | null;
  transcriptError: string | null;
}

export interface EpisodeGeneratedSummaryStatus {
  status: 'idle' | 'pending' | 'processing' | 'done' | 'error';
  summaryFileName: string | null;
  summaryUpdatedAt: string | null;
  summaryStartedAt: string | null;
  progress: number | null;
  error: string | null;
  version: number | null;
  promptVersion: string | null;
  summaryText?: string | null;
}

export type EpisodeArtifactSelector = 'episode' | 'trailer' | 'image' | 'image-low' | 'transcript';

export interface EpisodeArtifactJobSnapshot {
  jobId: string;
  episodeId: number;
  requested: EpisodeArtifactSelector[];
  available: EpisodeArtifactSelector[];
  missing: EpisodeArtifactSelector[];
  state: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stateText: string;
  queuePosition: number | null;
  downloadUrl: string | null;
  expiresAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteEpisodeResponse {
  episodeId: number;
  message: string;
}

export interface EpisodeTrailerVideoDraftReservation {
  draftId: string;
  episodeId: number;
  state: 'reserved';
  expiresAt: string;
}

export interface EpisodeTrailerVideoUploadResponse {
  episodeId: number;
  draftId: string | null;
  state: 'staged' | 'finalized';
  trailerVideoFileName: string | null;
  trailerVideoSyncStatus?: 'unpublished' | 'manual-sync-required' | 'synced';
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

  createEpisode(payload: EpisodeWriteInput, draftId?: string): Observable<Episode> {
    const body = draftId ? { ...payload, draftId } : payload;
    return this.http.post<Episode>(`${environment.apiBaseUrl}/episodes`, body);
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

  reserveEpisodeDraft(episodeId: number): Observable<EpisodeTrailerVideoDraftReservation> {
    return this.http.post<EpisodeTrailerVideoDraftReservation>(`${environment.apiBaseUrl}/episodes/drafts`, { episodeId });
  }

  uploadEpisodeTrailerVideo(
    episodeId: number,
    draftId: string | null,
    file: File,
  ): Observable<HttpEvent<EpisodeTrailerVideoUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<EpisodeTrailerVideoUploadResponse>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/trailer-video`,
      formData,
      {
        headers: draftId ? new HttpHeaders({ 'X-Episode-Draft-Id': draftId }) : new HttpHeaders(),
        observe: 'events',
        reportProgress: true,
      },
    );
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

  getEpisodeTranscriptionStatus(episodeId: number): Observable<EpisodeTranscriptionStatus> {
    return this.http.get<EpisodeTranscriptionStatus>(`${environment.apiBaseUrl}/episodes/${episodeId}/transcription`);
  }

  getEpisodeGeneratedSummaryStatus(episodeId: number): Observable<EpisodeGeneratedSummaryStatus> {
    return this.http.get<EpisodeGeneratedSummaryStatus>(`${environment.apiBaseUrl}/episodes/${episodeId}/episodes-generated-summary`);
  }

  startEpisodeArtifactJob(episodeId: number, artifacts: EpisodeArtifactSelector[]): Observable<EpisodeArtifactJobSnapshot> {
    return this.http.post<EpisodeArtifactJobSnapshot>(`${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/jobs`, { artifacts });
  }

  getEpisodeArtifactJobStatus(episodeId: number, jobId: string): Observable<EpisodeArtifactJobSnapshot> {
    return this.http.get<EpisodeArtifactJobSnapshot>(`${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/jobs/${jobId}`);
  }

  downloadEpisodeArtifact(downloadUrl: string): Observable<HttpResponse<Blob>> {
    const apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const resolvedUrl = /^https?:\/\//i.test(downloadUrl)
      ? downloadUrl
      : downloadUrl.startsWith('/')
        ? `${new URL(apiBaseUrl).origin}${downloadUrl}`
        : `${apiBaseUrl}/${downloadUrl.replace(/^\/+/, '')}`;

    return this.http.get(resolvedUrl, {
      observe: 'response',
      responseType: 'blob',
    });
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
