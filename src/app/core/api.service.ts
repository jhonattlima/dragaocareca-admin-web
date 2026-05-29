import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Episode {
  episodeId: number;
  title: string;
  summary: string;
  pubDate: string;
  duration?: string;
  explicit: 'yes' | 'no';
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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private readonly http: HttpClient) { }

  listEpisodes(): Observable<Episode[]> {
    return this.http.get<Episode[]>(`${environment.apiBaseUrl}/episodes`);
  }

  createEpisode(payload: EpisodeWriteInput): Observable<Episode> {
    return this.http.post<Episode>(`${environment.apiBaseUrl}/episodes`, payload);
  }

  updateEpisode(episodeId: number, payload: EpisodeWriteInput): Observable<Episode> {
    return this.http.put<Episode>(`${environment.apiBaseUrl}/episodes/${episodeId}`, payload);
  }

  getFeedStatus(): Observable<FeedStatus> {
    return this.http.get<FeedStatus>(`${environment.apiBaseUrl}/feed/status`);
  }
}
