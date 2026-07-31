import { of } from 'rxjs';
import { ApiService, Episode, EpisodeArtifactJobSnapshot } from '../../core/api.service';
import { ManageComponent } from './manage.component';

describe('Phase 6 API/UI progress-stage contract', () => {
  let component: ManageComponent;
  const episode: Episode = {
    episodeId: 334,
    title: 'DC 334',
    summary: 'Summary',
    pubDate: '2026-07-31T00:00:00.000Z',
    explicit: 'no',
    fileName: 'episode-334.mp3',
  };
  const snapshot = (progress: number): EpisodeArtifactJobSnapshot => ({
    jobId: 'job-334',
    episodeId: 334,
    requested: ['episode'],
    available: ['episode'],
    missing: [],
    state: 'processing',
    progress,
    stateText: progress < 25 ? 'Preparing artifact snapshot' : progress < 90 ? 'Assembling archive' : 'Finalizing archive',
    queuePosition: null,
    downloadUrl: null,
    expiresAt: null,
    error: null,
    createdAt: '2026-07-31T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:01.000Z',
  });

  beforeEach(() => {
    const api = jasmine.createSpyObj<ApiService>('ApiService', [
      'startEpisodeArtifactJob',
      'getEpisodeArtifactJobStatus',
      'downloadEpisodeArtifact',
      'listEpisodes',
    ]);
    api.listEpisodes.and.returnValue(of([]));
    component = new ManageComponent(api);
    component.openArtifactModal(episode);
  });

  it('uses API assembly-stage boundaries: 25% and 85% remain Creating ZIP', () => {
    const store = (progress: number): void => {
      (component as unknown as { storeArtifactJob: (value: EpisodeArtifactJobSnapshot) => void }).storeArtifactJob(snapshot(progress));
    };

    store(25);
    expect(component.getArtifactStatusLabel()).toBe('Creating ZIP — 25%');
    store(85);
    expect(component.getArtifactStatusLabel()).toBe('Creating ZIP — 85%');
  });
});
