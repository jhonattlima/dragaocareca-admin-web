import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { HttpResponse } from '@angular/common/http';
import { ApiService, EpisodeArtifactJobSnapshot, EpisodeArtifactSelector } from './api.service';

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
