import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ApiService, Episode, EpisodeArtifactJobSnapshot } from '../../core/api.service';
import { ManageComponent } from './manage.component';

describe('Phase 6 artifact recovery behavior', () => {
  let api: jasmine.SpyObj<ApiService>;
  let component: ManageComponent;

  const episode: Episode = {
    episodeId: 334,
    title: 'DC 334',
    summary: 'Summary',
    pubDate: '2026-07-31T00:00:00.000Z',
    explicit: 'no',
    fileName: 'episode-334.mp3',
    coverFileName: 'cover.jpeg',
    coverLowFileName: 'cover.webp',
    transcriptFileName: 'transcript.txt',
  };

  const snapshot = (overrides: Partial<EpisodeArtifactJobSnapshot> = {}): EpisodeArtifactJobSnapshot => ({
    jobId: 'job-334',
    episodeId: 334,
    requested: ['episode', 'image', 'image-low', 'transcript'],
    available: ['episode', 'image', 'image-low', 'transcript'],
    missing: [],
    state: 'completed',
    progress: 100,
    stateText: 'Archive ready',
    queuePosition: null,
    downloadUrl: '/v1/episodes/334/artifacts/jobs/job-334/download',
    expiresAt: null,
    error: null,
    createdAt: '2026-07-31T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:01.000Z',
    ...overrides,
  });

  const successfulDownload = (): HttpResponse<Blob> => new HttpResponse<Blob>({
    body: new Blob(['zip'], { type: 'application/zip' }),
    headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="episode-334-artifacts.zip"' }),
  });

  const store = (value: EpisodeArtifactJobSnapshot): void => {
    (component as unknown as { storeArtifactJob: (snapshot: EpisodeArtifactJobSnapshot) => void }).storeArtifactJob(value);
  };

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'startEpisodeArtifactJob',
      'getEpisodeArtifactJobStatus',
      'downloadEpisodeArtifact',
      'listEpisodes',
    ]);
    api.listEpisodes.and.returnValue(of([]));
    api.downloadEpisodeArtifact.and.returnValue(of(successfulDownload()));
    component = new ManageComponent(api);
    component.openArtifactModal(episode);
  });

  it('keeps empty selection local and reports that a file must be selected', () => {
    component.artifactOptions.forEach((option) => option.checked = false);

    component.confirmArtifactJob();

    expect(api.startEpisodeArtifactJob).not.toHaveBeenCalled();
    expect(component.artifactModalMessage).toBe('Select at least one available artifact.');
  });

  it('keeps partial availability visible after completion and delivery', () => {
    const partial = snapshot({
      requested: ['episode', 'image', 'transcript'],
      available: ['episode', 'transcript'],
      missing: ['image'],
    });

    store(partial);

    expect(component.artifactJob?.state).toBe('completed');
    expect(component.getArtifactMissingLabels()).toEqual(['Cover art']);
    expect(component.getArtifactDeliveryStatus()).toBe('Download started.');
  });

  it('retains failed preparation context and retries preparation as a new job', () => {
    const failed = snapshot({ state: 'failed', progress: 42, downloadUrl: null, error: 'archive worker failed' });
    const pending = snapshot({ state: 'pending', progress: 0, downloadUrl: null });
    api.startEpisodeArtifactJob.and.returnValue(of(pending));
    api.getEpisodeArtifactJobStatus.and.returnValue(of(pending));
    store(failed);

    expect(component.getArtifactStage()).toBe('Archive preparation failed');
    expect(component.isArtifactRetryAvailable()).toBeTrue();

    component.retryArtifactJob();

    expect(api.startEpisodeArtifactJob).toHaveBeenCalledOnceWith(334, ['episode', 'image', 'image-low', 'transcript']);
  });

  it('preserves completed state for network, authentication, and expiry failures', () => {
    const failures: Array<{ error: unknown; text: string }> = [
      { error: { status: 0 }, text: 'could not be downloaded' },
      { error: { status: 401 }, text: 'authenticated session' },
      { error: { status: 403 }, text: 'authenticated session' },
      { error: { status: 404 }, text: 'expired or is no longer available' },
      { error: { status: 409 }, text: 'expired or is no longer available' },
    ];

    failures.forEach(({ error, text }) => {
      api.downloadEpisodeArtifact.and.returnValue(throwError(() => error));
      store(snapshot());
      expect(component.artifactJob?.state).toBe('completed');
      expect(component.artifactModalMessage).toContain(text);
      component.resetArtifactFlow();
    });
  });

  it('retries the same completed URL without starting another preparation job, then reset clears it', () => {
    const completed = snapshot();
    api.downloadEpisodeArtifact.and.returnValues(
      throwError(() => ({ status: 404 })),
      of(successfulDownload()),
    );

    store(completed);
    component.retryArtifactDelivery();

    expect(api.downloadEpisodeArtifact.calls.allArgs()).toEqual([
      [completed.downloadUrl as string],
      [completed.downloadUrl as string],
    ]);
    expect(api.startEpisodeArtifactJob).not.toHaveBeenCalled();

    component.resetArtifactFlow();
    expect(component.artifactJob).toBeNull();
    expect(component.getArtifactDeliveryStatus()).toBe('');
  });

  it('delivers repeated completed emissions only once', () => {
    const completed = snapshot();

    store(completed);
    store(completed);

    expect(api.downloadEpisodeArtifact).toHaveBeenCalledOnceWith(completed.downloadUrl as string);
  });

});
