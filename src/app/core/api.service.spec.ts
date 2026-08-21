import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import {
  ApiService,
  Episode,
  EpisodeArtifactJobSnapshot,
  EpisodeArtifactSelector,
  EpisodeTrailerVideoUploadResponse,
  EpisodeGeneratedSummaryStatus,
  HashtagLookupResponse,
  SuggestedTagsSnapshot,
  YoutubeTrailerJobSnapshot,
} from './api.service';

describe('ApiService title and hashtag authoring contract', () => {
  let apiService: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    apiService = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('maps suggestedTags metadata and safe terminal/error state from the summary snapshot', () => {
    const suggestedTags: SuggestedTagsSnapshot = {
      status: 'unavailable',
      version: 4,
      updatedAt: '2026-08-14T00:00:00.000Z',
      startedAt: '2026-08-13T23:59:00.000Z',
      finishedAt: '2026-08-14T00:00:00.000Z',
      retryAt: '2026-08-14T01:00:00.000Z',
      errorCategory: 'rate_limited',
      promptVersion: 'hashtags-v1',
      provider: 'groq',
      suggestions: [],
    };
    let response: EpisodeGeneratedSummaryStatus | undefined;
    apiService.getEpisodeGeneratedSummaryStatus(42).subscribe(value => response = value);

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/episodes-generated-summary`);
    request.flush({
      status: 'done', summaryFileName: null, summaryUpdatedAt: null, summaryStartedAt: null,
      progress: 100, error: null, version: 2, promptVersion: 'summary-v2', summaryText: 'Summary', suggestedTags,
    });

    expect(response?.suggestedTags).toEqual(suggestedTags);
    expect(response?.suggestedTags?.errorCategory).toBe('rate_limited');
  });

  it('posts one hashtag to the authenticated lookup route and exposes safe unavailable responses', () => {
    const lookup: HashtagLookupResponse = {
      displayTag: '#rpg', normalizedTag: '#rpg', approximateCount: null, retrievedAt: null,
      cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', source: 'provider',
      state: 'unavailable', errorCategory: 'quota_exhausted', retryAt: '2026-08-14T01:00:00.000Z',
    };
    let response: HashtagLookupResponse | undefined;
    apiService.lookupHashtag(42, '#rpg').subscribe({ error: error => response = error.error });

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/hashtag-lookup`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ tag: '#rpg' });
    request.flush(lookup, { status: 429, statusText: 'Too Many Requests' });

    expect(response?.state).toBe('unavailable');
    expect(response?.errorCategory).toBe('quota_exhausted');
  });

  it('commits the computed title and authored hashtags in the required publication body', () => {
    apiService.commitYoutubeTrailerJob(42, 'job-42', 'Trailer - Episode', ['#rpg']).subscribe();

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs/commit`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ jobId: 'job-42', title: 'Trailer - Episode', hashtags: ['#rpg'] });
    request.flush(youtubeSnapshot());
  });
});

describe('ApiService artifact jobs', () => {
  let apiService: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    apiService = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('starts an artifact job with the exact trailer-video selector in the canonical request body', () => {
    const artifacts: EpisodeArtifactSelector[] = ['episode', 'trailer', 'trailer-video', 'image', 'image-low', 'transcript'];
    const snapshot = createSnapshot({ requested: artifacts });
    let response: EpisodeArtifactJobSnapshot | undefined;

    apiService.startEpisodeArtifactJob(42, artifacts).subscribe((value) => {
      response = value;
    });

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/artifacts/jobs`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ artifacts });
    request.flush(snapshot);

    expect(response).toEqual(snapshot);
  });

  it('posts trailer-video unchanged when it is the only requested artifact', () => {
    apiService.startEpisodeArtifactJob(42, ['trailer-video']).subscribe();

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/artifacts/jobs`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ artifacts: ['trailer-video'] });
    request.flush(createSnapshot({ requested: ['trailer-video'], available: ['trailer-video'] }));
  });

  it('polls the job status route and exposes a completed download URL as data', () => {
    const snapshot = createSnapshot({
      state: 'completed',
      progress: 100,
      stateText: 'Archive ready',
      downloadUrl: '/v1/episodes/42/artifacts/jobs/job-42/download',
    });
    let response: EpisodeArtifactJobSnapshot | undefined;

    apiService.getEpisodeArtifactJobStatus(42, 'job-42').subscribe((value) => {
      response = value;
    });

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/artifacts/jobs/job-42`);
    expect(request.request.method).toBe('GET');
    request.flush(snapshot);

    expect(response?.state).toBe('completed');
    expect(response?.downloadUrl).toBe('/v1/episodes/42/artifacts/jobs/job-42/download');
  });

  it('downloads a relative completed URL from the API origin as an authenticated Blob response with headers', () => {
    const archive = new Blob(['zip bytes'], { type: 'application/zip' });
    const headers = {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="episode-42-artifacts.zip"',
    };
    let response: HttpResponse<Blob> | undefined;

    apiService.downloadEpisodeArtifact('/v1/episodes/42/artifacts/jobs/job-42/download').subscribe((value) => {
      response = value;
    });

    const request = httpTestingController.expectOne('http://localhost:3000/v1/episodes/42/artifacts/jobs/job-42/download');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(archive, { headers });

    expect(response?.body).toBe(archive);
    expect(response?.headers.get('Content-Disposition')).toBe(headers['Content-Disposition']);
    expect(response?.headers.get('Content-Type')).toBe('application/zip');
  });

  it('preserves an already-absolute API download URL', () => {
    apiService.downloadEpisodeArtifact('https://api.example.test/v1/episodes/42/download').subscribe();

    const request = httpTestingController.expectOne('https://api.example.test/v1/episodes/42/download');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['zip bytes'], { type: 'application/zip' }));
  });
});

describe('ApiService trailer video lifecycle', () => {
  let apiService: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    apiService = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('reserves a draft with the form episode id and returns the typed reservation', () => {
    let reservation: unknown;
    apiService.reserveEpisodeDraft(42).subscribe(value => reservation = value);

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/drafts`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ episodeId: 42 });
    request.flush({ draftId: 'draft-42', episodeId: 42, state: 'reserved', expiresAt: '2026-08-05T00:00:00.000Z' });
    expect(reservation).toEqual(jasmine.objectContaining({ draftId: 'draft-42', episodeId: 42 }));
  });

  it('posts the MP4 multipart field with draft header and exposes progress before staged response', () => {
    const file = new File(['video'], 'trailer.mp4', { type: 'video/mp4' });
    const events: unknown[] = [];
    apiService.uploadEpisodeTrailerVideo(42, 'draft-42', file).subscribe(event => events.push(event));

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/trailer-video`);
    expect(request.request.method).toBe('POST');
    expect(request.request.reportProgress).toBeTrue();
    expect(request.request.headers.get('X-Episode-Draft-Id')).toBe('draft-42');
    expect(request.request.body instanceof FormData).toBeTrue();
    expect((request.request.body as FormData).get('file')).toEqual(file);
    request.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    const response: EpisodeTrailerVideoUploadResponse = {
      episodeId: 42,
      draftId: 'draft-42',
      state: 'staged',
      trailerVideoFileName: 'episodes/42/trailer.mp4',
      trailerVideoSyncStatus: 'unpublished',
      message: 'Trailer video staged.',
    };
    request.flush(response);
    expect((events[0] as { type: HttpEventType }).type).toBe(HttpEventType.Sent);
    expect((events[1] as { type: HttpEventType }).type).toBe(HttpEventType.UploadProgress);
    expect((events[2] as HttpResponse<EpisodeTrailerVideoUploadResponse>).body).toEqual(response);
  });

  it('posts persisted replacement MP4 without requesting a draft reservation', () => {
    const file = new File(['video'], 'replacement.mp4', { type: 'video/mp4' });
    apiService.uploadEpisodeTrailerVideo(42, null, file).subscribe();

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/trailer-video`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('X-Episode-Draft-Id')).toBeFalse();
    expect(request.request.body instanceof FormData).toBeTrue();
    expect((request.request.body as FormData).get('file')).toEqual(file);
    request.flush({
      episodeId: 42,
      draftId: null,
      state: 'finalized',
      trailerVideoFileName: 'episodes/42/trailer.mp4',
      trailerVideoSyncStatus: 'manual-sync-required',
      message: 'Trailer video finalized.',
    });
  });

  it('sends the same draft id and episode id when creating an episode', () => {
    apiService.createEpisode({ episodeId: 42, title: 'Draft', summary: 'Summary', pubDate: '2026-08-04', explicit: 'no' }, 'draft-42').subscribe();
    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(jasmine.objectContaining({ episodeId: 42, draftId: 'draft-42' }));
    request.flush({ episodeId: 42, title: 'Draft', summary: 'Summary', pubDate: '2026-08-04', explicit: 'no' });
  });
});

describe('ApiService YouTube trailer lifecycle', () => {
  let apiService: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    apiService = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('starts with the selected title and summary and retains a sanitized private URL', () => {
    const snapshot = youtubeSnapshot({
      status: 'ready',
      privateWatchUrl: 'https://www.youtube.com/watch?v=private-42',
    });
    let response: YoutubeTrailerJobSnapshot | undefined;

    apiService.startYoutubeTrailerJob(42, 'Selected title', 'Selected summary')
      .subscribe(value => response = value);

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'Selected title', summary: 'Selected summary', hashtags: [] });
    request.flush(snapshot);
    expect(response?.privateWatchUrl).toBe('https://www.youtube.com/watch?v=private-42');
  });

  it('accepts both queued 202 responses and reused 200 responses', () => {
    const snapshot = youtubeSnapshot();
    const responses: YoutubeTrailerJobSnapshot[] = [];

    apiService.startYoutubeTrailerJob(42, 'Title', 'Summary').subscribe(value => responses.push(value));
    const queued = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs`);
    queued.flush(snapshot, { status: 202, statusText: 'Accepted' });

    apiService.startYoutubeTrailerJob(42, 'Title', 'Summary').subscribe(value => responses.push(value));
    const reused = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs`);
    reused.flush({ ...snapshot, status: 'ready' }, { status: 200, statusText: 'OK' });

    expect(responses.map(value => value.status)).toEqual(['queued', 'ready']);
  });

  it('keeps the API no-store response compatible with the typed boundary', () => {
    let response: YoutubeTrailerJobSnapshot | undefined;
    apiService.startYoutubeTrailerJob(42, 'Title', 'Summary').subscribe(value => response = value);

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'Title', summary: 'Summary', hashtags: [] });
    request.flush(youtubeSnapshot(), {
      status: 202,
      statusText: 'Accepted',
      headers: new HttpHeaders({ 'Cache-Control': 'no-store' }),
    });

    expect(response?.jobId).toBe('job-42');
  });

  it('supports current lookup, status, same-job retry, and cancellation with empty control bodies', () => {
    const snapshot = youtubeSnapshot();
    apiService.getCurrentYoutubeTrailerJob(42).subscribe();
    const current = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs/current`);
    expect(current.request.method).toBe('GET');
    current.flush(snapshot);
    apiService.getYoutubeTrailerJobStatus(42, 'job-42').subscribe();
    const status = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs/job-42`);
    expect(status.request.method).toBe('GET');
    status.flush(snapshot);
    apiService.retryYoutubeTrailerJob(42, 'job-42').subscribe();
    const retry = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs/job-42/retry`);
    expect(retry.request.body).toEqual({});
    retry.flush(snapshot);
    apiService.cancelYoutubeTrailerJob(42, 'job-42').subscribe();
    const cancel = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs/job-42/cancel`);
    expect(cancel.request.body).toEqual({});
    cancel.flush(snapshot);
  });

  it('exposes safe lifecycle fixtures without provider/session/source/raw-error fields or Angular publish controls', () => {
    const snapshot = youtubeSnapshot({ status: 'cancelled', privateWatchUrl: 'https://www.youtube.com/watch?v=private-42' });
    expect(snapshot.status).toBe('cancelled');
    expect(snapshot.privateWatchUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    expect(snapshot as unknown as Record<string, unknown>).not.toEqual(jasmine.objectContaining({
      providerVideoId: jasmine.anything(),
      sessionUri: jasmine.anything(),
      sourceFileName: jasmine.anything(),
      sourceSha256: jasmine.anything(),
      errorMessage: jasmine.anything(),
      oauthToken: jasmine.anything(),
    }));
    expect((apiService as unknown as Record<string, unknown>)['publishYoutubeTrailer']).toBeUndefined();
  });

  it('accepts every raw backend lifecycle status without widening the safe DTO', () => {
    const statuses: YoutubeTrailerJobSnapshot['status'][] = [
      'queued', 'claimed', 'transferring', 'processing', 'ready', 'failed',
      'cancel_requested', 'cancelled', 'obsolete',
    ];

    statuses.forEach(status => {
      let response: YoutubeTrailerJobSnapshot | undefined;
      apiService.getYoutubeTrailerJobStatus(42, `job-${status}`).subscribe(value => response = value);
      const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/youtube-trailer-jobs/job-${status}`);
      request.flush(youtubeSnapshot({ status }));
      expect(response?.status).toBe(status);
    });
  });
});

describe('ApiService Phase 8.1 RED audio contract seams', () => {
  let apiService: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    apiService = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('FORM-02/D-04/D-05/D-06 sends episode audio as multipart and preserves backend-confirmed metadata', () => {
    const file = new File(['browser bytes'], 'episode.mp3', { type: 'audio/mpeg' });
    let response: Episode | undefined;
    apiService.uploadEpisodeAudio(42, file).subscribe(event => {
      if (event.type === HttpEventType.Response) {
        response = event.body ?? undefined;
      }
    });

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/audio`);
    expect(request.request.method).toBe('POST');
    expect(request.request.reportProgress).toBeTrue();
    expect(request.request.body instanceof FormData).toBeTrue();
    expect((request.request.body as FormData).get('file')).toEqual(file);
    request.flush({
      episodeId: 42,
      title: 'Episode',
      summary: '',
      pubDate: '2026-05-06T09:10:00.000Z',
      explicit: 'no',
      duration: '01:02:03',
      bytes: 1234567,
    });

    expect(response?.duration).toBe('01:02:03');
    expect(response?.bytes).toBe(1234567);
  });

  it('FORM-02/D-05/D-08 does not invent missing confirmed metadata in the API response seam', () => {
    let response: Episode | undefined;
    apiService.uploadEpisodeAudio(42, new File(['audio'], 'episode.mp3', { type: 'audio/mpeg' }))
      .subscribe(event => {
        if (event.type === HttpEventType.Response) {
          response = event.body ?? undefined;
        }
      });
    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/audio`);
    request.flush({
      episodeId: 42,
      title: 'Episode',
      summary: '',
      pubDate: '2026-05-06T09:10:00.000Z',
      explicit: 'no',
    });

    expect(response?.duration).toBeUndefined();
    expect(response?.bytes).toBeUndefined();
  });

  it('FORM-02/D-04 keeps trailer audio on the filename/message response contract', () => {
    let response: Episode & { message?: string } | undefined;
    apiService.uploadEpisodeTrailer(42, new File(['trailer'], 'trailer.mp3', { type: 'audio/mpeg' }))
      .subscribe(event => {
        if (event.type === HttpEventType.Response) {
          response = event.body ?? undefined;
        }
      });
    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes/42/trailer`);
    request.flush({
      episodeId: 42,
      title: 'Episode',
      summary: '',
      pubDate: '2026-05-06T09:10:00.000Z',
      explicit: 'no',
      trailerFileName: 'episodes/42/trailer.mp3',
      message: 'Trailer staged.',
    });

    expect(response?.trailerFileName).toBe('episodes/42/trailer.mp3');
    expect(response?.message).toBe('Trailer staged.');
  });

  it('FORM-03/D-09/D-10 carries raw confirmed bytes through the create payload', () => {
    const payload = {
      episodeId: 42,
      title: 'Episode',
      summary: '',
      pubDate: '2026-05-06T09:10:00.000Z',
      explicit: 'no' as const,
      duration: '01:02:03',
      bytes: 1234567,
      authors: ['Jhonatt Lima'],
      musicCredits: [],
    };
    apiService.createEpisode(payload).subscribe();
    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ ...payload });
  });
});

const youtubeSnapshot = (overrides: Partial<YoutubeTrailerJobSnapshot> = {}): YoutubeTrailerJobSnapshot => ({
  jobId: 'job-42',
  episodeId: 42,
  status: 'queued' as const,
  privateWatchUrl: null,
  progress: { confirmedBytes: 0, totalBytes: 100, processingPartsProcessed: null, processingPartsTotal: null, processingTimeLeftMs: null },
  cancellation: { requestedAt: null, cancelledAt: null, boundary: null },
  error: { category: null, occurredAt: null },
  retry: { count: 0, nextAttemptAt: null },
  createdAt: '2026-08-11T00:00:00.000Z',
  updatedAt: '2026-08-11T00:00:00.000Z',
  completedAt: null,
  ...overrides,
});

const createSnapshot = (overrides: Partial<EpisodeArtifactJobSnapshot> = {}): EpisodeArtifactJobSnapshot => ({
  jobId: 'job-42',
  episodeId: 42,
  requested: ['episode'],
  available: ['episode'],
  missing: [],
  state: 'pending',
  progress: 0,
  stateText: 'Queued for preparation',
  queuePosition: 1,
  downloadUrl: null,
  expiresAt: null,
  error: null,
  createdAt: '2026-07-30T00:00:00.000Z',
  updatedAt: '2026-07-30T00:00:00.000Z',
  ...overrides,
});
