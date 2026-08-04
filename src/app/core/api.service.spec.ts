import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ApiService, EpisodeArtifactJobSnapshot, EpisodeArtifactSelector, EpisodeTrailerVideoUploadResponse } from './api.service';

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

  it('starts an artifact job with canonical selectors in the requested order', () => {
    const artifacts: EpisodeArtifactSelector[] = ['episode', 'trailer', 'image', 'image-low', 'transcript'];
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
    expect((events[0] as { type: HttpEventType }).type).toBe(HttpEventType.UploadProgress);
    expect((events[1] as HttpResponse<EpisodeTrailerVideoUploadResponse>).body).toEqual(response);
  });

  it('sends the same draft id and episode id when creating an episode', () => {
    apiService.createEpisode({ episodeId: 42, title: 'Draft', summary: 'Summary', pubDate: '2026-08-04', explicit: 'no' }, 'draft-42').subscribe();
    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/episodes`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(jasmine.objectContaining({ episodeId: 42, draftId: 'draft-42' }));
    request.flush({ episodeId: 42, title: 'Draft', summary: 'Summary', pubDate: '2026-08-04', explicit: 'no' });
  });
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
