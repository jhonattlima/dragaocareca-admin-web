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
  transcriptProvider?: string | null;
  summaryStatus?: 'idle' | 'pending' | 'processing' | 'done' | 'error';
  summaryUpdatedAt?: string | null;
  summaryStartedAt?: string | null;
  summaryError?: string | null;
  summaryProgress?: number | null;
  summaryProvider?: string | null;
  instagramCaptionMentions?: string[];
  instagramHashtags?: string[];
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
  instagramCaptionMentions?: string[];
  instagramHashtags?: string[];
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

export interface SiteUsageMetricsErrorResponse {
  source: 'umami';
  fetchedAt: string;
  ok: false;
  code: 'disabled' | 'missing_credentials' | 'fetch_failed';
  message: string;
  details?: string;
}

export interface SiteUsageMetricsSnapshot {
  source: 'umami';
  fetchedAt: string;
  ok: true;
  range: { requestedDays: number; currentStart: string; currentEnd: string; previousStart: string; previousEnd: string; timeZone: string };
  totals: { pageviews: number; visitors: number; sessions: number; bounces: number; totalTimeSeconds: number };
  comparison: { pageviews: number; visitors: number; sessions: number; bounces: number; totalTimeSeconds: number };
  series: Array<{ date: string; pageviews: number; sessions: number }>;
  topPages: Array<{ label: string; value: number }>;
  referrers: Array<{ label: string; value: number }>;
  campaigns: Array<{ label: string; value: number }>;
  browsers: Array<{ label: string; value: number }>;
  operatingSystems: Array<{ label: string; value: number }>;
  devices: Array<{ label: string; value: number }>;
}

export interface EpisodeTranscriptionStatus {
  status: 'idle' | 'pending' | 'processing' | 'done' | 'error';
  transcriptFileName: string | null;
  transcriptUpdatedAt: string | null;
  transcriptStartedAt: string | null;
  progress: number | null;
  transcriptError: string | null;
  provider: string | null;
}

export interface EpisodeTranscriptionQueueResponse {
  episodeId: number;
  queued: boolean;
  version: number;
  status: EpisodeTranscriptionStatus['status'];
  progress: number | null;
  transcriptError: string | null;
  message: string;
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
  provider: string | null;
  summaryText?: string | null;
  suggestedTags?: SuggestedTagsSnapshot;
}

export type SuggestedTagsStatus = 'idle' | 'pending' | 'processing' | 'done' | 'unavailable';
export type SuggestedTagsErrorCategory =
  | 'disabled'
  | 'missing_credentials'
  | 'unauthorized'
  | 'quota_exhausted'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'invalid_provider_response';

export interface SuggestedTagRetrieval {
  displayTag: string;
  normalizedTag: string;
  approximateCount: number | null;
  retrievedAt: string | null;
  cacheStatus: 'hit' | 'miss';
  regionCode: string;
  relevanceLanguage: string;
  relevanceScore?: number;
}

export interface SuggestedTagsSnapshot {
  status: SuggestedTagsStatus;
  version: number;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  retryAt: string | null;
  errorCategory: SuggestedTagsErrorCategory | null;
  promptVersion: string | null;
  provider: string | null;
  candidates: Array<{
    displayTag: string;
    normalizedTag: string;
    relevant: boolean;
    relevanceScore: number;
  }>;
  suggestions: SuggestedTagRetrieval[];
}

export interface HashtagLookupResponse extends SuggestedTagRetrieval {
  source: 'youtube-search-list' | 'cache' | 'admission' | 'provider';
  state: 'available' | 'unavailable';
  errorCategory: SuggestedTagsErrorCategory | null;
  retryAt: string | null;
}

export type EpisodeArtifactSelector = 'episode' | 'trailer' | 'image' | 'image-low' | 'transcript' | 'trailer-video';

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

export type YoutubeTrailerJobStatus =
  | 'queued'
  | 'claimed'
  | 'transferring'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'cancel_requested'
  | 'cancelled'
  | 'obsolete';

export type YoutubeTrailerJobErrorCategory =
  | 'authentication'
  | 'session-expired'
  | 'quota'
  | 'timeout'
  | 'network'
  | 'provider'
  | 'invalid-trailer'
  | 'reconciliation-required';

export type YoutubeTrailerCancellationBoundary = 'local-cancelled' | 'provider-video-retained';

export interface YoutubeTrailerJobSnapshot {
  jobId: string;
  episodeId: number;
  status: YoutubeTrailerJobStatus;
  progress: {
    confirmedBytes: number;
    totalBytes: number;
    processingPartsProcessed: number | null;
    processingPartsTotal: number | null;
    processingTimeLeftMs: number | null;
  };
  cancellation: {
    requestedAt: string | null;
    cancelledAt: string | null;
    boundary: YoutubeTrailerCancellationBoundary | null;
  };
  error: {
    category: YoutubeTrailerJobErrorCategory | null;
    occurredAt: string | null;
  };
  retry: {
    count: number;
    nextAttemptAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  privateWatchUrl: string | null;
  metadata?: {
    hashtags?: string[];
  } | null;
  publicationStatus?: 'not_started' | 'pending' | 'metadata_accepted' | 'playlist_confirmed' | 'public_confirmed' | 'failed';
  publicationErrorCategory?: string | null;
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
  youtubeJob?: YoutubeTrailerJobSnapshot | null;
}

export type TrailerCandidateLifecycle = 'pending' | 'processing' | 'waiting_capacity' | 'retryable' | 'ready' | 'stale' | 'superseded';
export type TrailerCaptionMode = 'automatic' | 'disabled';
export type TrailerCaptionStatus = 'checking' | 'eligible' | 'aligning' | 'rendering' | 'included' | 'waveform_only' | 'unavailable';
export type TrailerCaptionReasonCode = 'quality_calibration_unavailable' | 'capacity_unavailable' | 'captions_disabled'
  | 'transcript_unavailable' | 'model_unavailable' | 'aligner_unavailable' | 'alignment_failed'
  | 'alignment_provenance_stale' | 'alignment_coverage_insufficient' | 'alignment_timing_invalid'
  | 'quality_below_calibration' | 'caption_render_failed' | null;

export interface TrailerCandidateReviewStatus {
  candidateId: string;
  episodeId: number;
  version: number;
  status: TrailerCandidateLifecycle;
  progress: number;
  errorCategory: string | null;
  errorMessage: string | null;
  durationSeconds: number | null;
  resolution: string | null;
  profileId: string;
  profileRevision: number;
  sourceFingerprint: string;
  isCurrent: boolean;
  outputValid: boolean;
  createdAt: string;
  updatedAt: string;
  readyAt: string | null;
  transcriptStatus: 'not_started' | 'pending' | 'processing' | 'done' | 'error';
  transcriptProgress: number;
  transcriptText: string | null;
  transcriptProvider: string | null;
  transcriptErrorCategory: string | null;
  transcriptErrorMessage: string | null;
  captionMode: TrailerCaptionMode;
  captionStatus: TrailerCaptionStatus;
  captionReasonCode: TrailerCaptionReasonCode;
}

export interface TrailerCandidatePreviewGrant {
  episodeId: number;
  candidateId: string;
  previewUrl: string;
  expiresAt: string;
}

export interface TrailerCandidateDecisionResponse {
  status: 'approved' | 'rejected' | 'replayed' | 'conflict';
  candidateId?: string;
  episodeId?: number;
  version?: number;
  sourceFingerprint?: string;
  sourceRevision?: string;
  code?: string;
}

export interface TrailerReplacementDestinationStatus {
  destination: 'instagram_reel' | 'facebook_native_video';
  lifecycle: string;
  retirementStatus: 'waiting_for_successor' | 'manual_retirement_required' | 'confirmed_manually' | 'retired_automatically' | 'not_applicable';
  replacementComplete: boolean;
  predecessor: { remoteId: string; permalink: string | null } | null;
  successor: { remoteId: string; permalink: string | null } | null;
  manualInstructions: string | null;
  confirmationEndpoint: string | null;
  retirementActorEmail: string | null;
  retirementConfirmedAt: string | null;
}

export interface TrailerReplacementStatus {
  episodeId: number;
  sourceRevision: string;
  status: 'complete' | 'waiting_for_successor' | 'waiting_for_operator_retirement' | 'waiting_for_youtube_action' | 'waiting_for_youtube_public_success' | 'waiting_for_youtube_retirement' | 'waiting_for_telegram';
  replacementComplete: boolean;
  destinations: Partial<Record<'instagram_reel' | 'facebook_native_video', TrailerReplacementDestinationStatus>>;
  youtube: null | {
    status: string;
    predecessor: { remoteId: string; permalink: string | null } | null;
    successor: { remoteId: string | null; permalink: string | null; jobId: string } | null;
    retirementError: string | null;
  };
  telegram: {
    configured: boolean;
    status: 'not_applicable' | 'pending' | 'in_progress' | 'complete' | 'replayed' | 'temporary_failure' | 'permanent_failure' | 'unknown';
    destinations: Partial<Record<'guild_trailer' | 'advance_access', {
      status: 'pending' | 'in_progress' | 'complete' | 'replayed' | 'temporary_failure' | 'permanent_failure' | 'unknown';
      messageId: string | null;
      fileId: string | null;
      topicId: string | null;
      messageThreadId: string | null;
    }>>;
  };
}

export interface TrailerRetirementConfirmationResponse {
  status: string;
  sourceRevision: string;
  destination: 'instagram_reel' | 'facebook_native_video';
  predecessor: { remoteId: string; permalink: string | null } | null;
  successor: { remoteId: string; permalink: string | null } | null;
  retirementStatus: TrailerReplacementDestinationStatus['retirementStatus'];
  retirementActorEmail: string | null;
  retirementConfirmedAt: string | null;
  replacementComplete: boolean;
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

export interface MetaGateStatus {
  enabled: boolean;
  canPublish: boolean;
  status: 'disabled' | 'blocked' | 'ready';
  reasons: string[];
}

export interface MetaConnectionStatus {
  contractVersion: 'meta-connection.v1';
  graphApiVersion: 'v25.0';
  configured: boolean;
  page: { id: string | null; linkedInstagramAccountId: string | null };
  token: { status: 'valid' | 'expiring' | 'invalid' | 'unknown'; expiresAt: string | null };
  checks: { identity: boolean; linkage: boolean; permissions: boolean; version: boolean };
  permissions: string[];
  tasks: string[];
  gates: { instagram: MetaGateStatus; facebookReel: MetaGateStatus };
  accountTagging: 'not_checked' | 'proven' | 'not_proven' | 'unsupported';
  checkedAt: string | null;
  requestId: string | null;
  diagnostic: 'not_configured' | 'disabled' | 'validated' | 'validation_failed' | 'provider_unavailable';
}

export interface PublicationEffectStatus {
  destination: 'telegram' | 'instagram_reel' | 'facebook_native_video';
  lifecycle: 'pending' | 'eligible' | 'delivering' | 'processing' | 'published' | 'failed' | 'blocked' | 'uncertain';
  checkpoint?: { stage: string; providerId: string | null; permalink: string | null; updatedAt: string };
  attempt?: { count: number; lastAttemptAt: string | null };
  diagnostic?: string | null;
}

export interface EpisodePublicationStatus {
  contractVersion: 'episode-publication.v1';
  episodeId: number;
  effects: PublicationEffectStatus[];
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

  getCurrentTrailerCandidate(episodeId: number): Observable<TrailerCandidateReviewStatus> {
    return this.http.get<TrailerCandidateReviewStatus>(`${environment.apiBaseUrl}/episodes/${episodeId}/trailer-candidates/current`);
  }

  getTrailerCandidate(episodeId: number, candidateId: string): Observable<TrailerCandidateReviewStatus> {
    return this.http.get<TrailerCandidateReviewStatus>(`${environment.apiBaseUrl}/episodes/${episodeId}/trailer-candidates/${encodeURIComponent(candidateId)}`);
  }

  generateTrailerCandidate(episodeId: number, transcriptText: string, expectedSourceFingerprint: string, includeTimedCaptions?: boolean): Observable<TrailerCandidateReviewStatus> {
    return this.http.post<TrailerCandidateReviewStatus>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/trailer-candidates`,
      { transcriptText, expectedSourceFingerprint, ...(includeTimedCaptions === undefined ? {} : { includeTimedCaptions }) },
    );
  }

  retryTrailerCandidate(episodeId: number, candidateId: string, expectedSourceFingerprint: string): Observable<TrailerCandidateReviewStatus> {
    return this.http.post<TrailerCandidateReviewStatus>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/trailer-candidates/${encodeURIComponent(candidateId)}/retry`,
      { expectedSourceFingerprint },
    );
  }

  createTrailerCandidatePreviewGrant(episodeId: number, candidateId: string): Observable<TrailerCandidatePreviewGrant> {
    return this.http.post<TrailerCandidatePreviewGrant>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/trailer-candidates/${encodeURIComponent(candidateId)}/preview-grant`,
      {},
    );
  }

  decideTrailerCandidate(episodeId: number, candidateId: string, decision: 'approve' | 'reject', expectedVersion: number, expectedSourceFingerprint: string): Observable<TrailerCandidateDecisionResponse> {
    return this.http.post<TrailerCandidateDecisionResponse>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/trailer-candidates/${encodeURIComponent(candidateId)}/decision`,
      { decision, expectedVersion, expectedSourceFingerprint },
    );
  }

  getTrailerReplacementStatus(episodeId: number, sourceRevision: string): Observable<TrailerReplacementStatus> {
    return this.http.get<TrailerReplacementStatus>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/trailer-replacements/${encodeURIComponent(sourceRevision)}`,
    );
  }

  confirmTrailerPredecessorRetirement(episodeId: number, sourceRevision: string, destination: 'instagram_reel' | 'facebook_native_video', predecessorRemoteId: string): Observable<TrailerRetirementConfirmationResponse> {
    return this.http.post<TrailerRetirementConfirmationResponse>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/trailer-replacements/${encodeURIComponent(sourceRevision)}/destinations/${destination}/retirement/confirm`,
      { predecessorRemoteId, confirmation: 'removed_manually' },
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

  transcribeEpisodeWithWhisper(episodeId: number): Observable<EpisodeTranscriptionQueueResponse> {
    return this.http.post<EpisodeTranscriptionQueueResponse>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/transcription/whisper`,
      {},
    );
  }

  getEpisodeGeneratedSummaryStatus(episodeId: number): Observable<EpisodeGeneratedSummaryStatus> {
    return this.http.get<EpisodeGeneratedSummaryStatus>(`${environment.apiBaseUrl}/episodes/${episodeId}/episodes-generated-summary`);
  }

  lookupHashtag(episodeId: number, tag: string): Observable<HashtagLookupResponse> {
    return this.http.post<HashtagLookupResponse>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/hashtag-lookup`,
      { tag },
    );
  }

  startEpisodeArtifactJob(episodeId: number, artifacts: EpisodeArtifactSelector[]): Observable<EpisodeArtifactJobSnapshot> {
    return this.http.post<EpisodeArtifactJobSnapshot>(`${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/jobs`, { artifacts });
  }

  getEpisodeArtifactJobStatus(episodeId: number, jobId: string): Observable<EpisodeArtifactJobSnapshot> {
    return this.http.get<EpisodeArtifactJobSnapshot>(`${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/jobs/${jobId}`);
  }

  startYoutubeTrailerJob(episodeId: number, title: string, summary: string, draftId?: string | null, hashtags: string[] = []): Observable<YoutubeTrailerJobSnapshot> {
    return this.http.post<YoutubeTrailerJobSnapshot>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs`,
        { title, summary, hashtags, ...(draftId ? { draftId } : {}) },
    );
  }

  commitYoutubeTrailerJob(episodeId: number, jobId: string | undefined, title: string, hashtags: string[]): Observable<YoutubeTrailerJobSnapshot> {
    return this.http.post<YoutubeTrailerJobSnapshot>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/commit`,
      { ...(jobId ? { jobId } : {}), title, hashtags },
    );
  }

  deleteYoutubeTrailerVideo(episodeId: number): Observable<{ episodeId: number; message: string }> {
    return this.http.delete<{ episodeId: number; message: string }>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/trailer-video`,
    );
  }

  getCurrentYoutubeTrailerJob(episodeId: number): Observable<YoutubeTrailerJobSnapshot | null> {
    return this.http.get<YoutubeTrailerJobSnapshot | null>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/current`,
    );
  }

  getYoutubeTrailerJobStatus(episodeId: number, jobId: string): Observable<YoutubeTrailerJobSnapshot> {
    return this.http.get<YoutubeTrailerJobSnapshot>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/${jobId}`,
    );
  }

  retryYoutubeTrailerJob(episodeId: number, jobId: string): Observable<YoutubeTrailerJobSnapshot> {
    return this.http.post<YoutubeTrailerJobSnapshot>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/${jobId}/retry`,
      {},
    );
  }

  cancelYoutubeTrailerJob(episodeId: number, jobId: string): Observable<YoutubeTrailerJobSnapshot> {
    return this.http.post<YoutubeTrailerJobSnapshot>(
      `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/${jobId}/cancel`,
      {},
    );
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

  getSiteUsageMetrics(days = 30): Observable<SiteUsageMetricsSnapshot | SiteUsageMetricsErrorResponse> {
    const params = new HttpParams().set('days', String(days));
    return this.http.get<SiteUsageMetricsSnapshot | SiteUsageMetricsErrorResponse>(`${environment.apiBaseUrl}/metrics/site-usage`, { params });
  }

  getHealth(): Observable<HealthStatus> {
    const healthUrl = environment.apiBaseUrl.replace(/\/v1$/, '/health');
    return this.http.get<HealthStatus>(healthUrl);
  }

  getMetaConnectionStatus(): Observable<MetaConnectionStatus> {
    return this.http.get<MetaConnectionStatus>(`${environment.apiBaseUrl}/meta-connection/status`);
  }

  getEpisodePublicationStatus(episodeId: number): Observable<EpisodePublicationStatus> {
    return this.http.get<EpisodePublicationStatus>(`${environment.apiBaseUrl}/internal/publication/episodes/${episodeId}`);
  }
}
