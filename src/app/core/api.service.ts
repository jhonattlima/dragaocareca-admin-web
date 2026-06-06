import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpEvent } from '@angular/common/http';
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

export interface FeedStatus {
  generatedAt: string;
  publishedCount: number;
  scheduledCount: number;
  nextScheduled: { episodeId: number; pubDate: string; title: string } | null;
}

export interface DeleteEpisodeResponse {
  episodeId: number;
  message: string;
}

export interface HealthStatus {
  status: string;
  uptime: number;
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

  getHealth(): Observable<HealthStatus> {
    const healthUrl = environment.apiBaseUrl.replace(/\/v1$/, '/health');
    return this.http.get<HealthStatus>(healthUrl);
  }
}
