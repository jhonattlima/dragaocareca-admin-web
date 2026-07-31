import { CommonModule } from '@angular/common';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { ApiService, Episode, EpisodeArtifactJobSnapshot, EpisodeGeneratedSummaryStatus, EpisodeTranscriptionStatus } from '../../core/api.service';
import { EpisodeFormComponent } from './episode-form.component';
import { ManageComponent } from './manage.component';

describe('ManageComponent summary flow', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let component: ManageComponent;

  beforeEach(() => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'getEpisodeTranscriptionStatus',
      'getEpisodeGeneratedSummaryStatus',
      'startEpisodeArtifactJob',
      'getEpisodeArtifactJobStatus',
      'listEpisodes',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    component = new ManageComponent(apiService);
  });

  it('marks the summary as manually edited when the field changes', () => {
    const editor = component.addEditorState;

    expect(editor.formModel.summaryManuallyEdited).toBeFalse();

    component.onSummaryChange(editor);

    expect(editor.formModel.summaryManuallyEdited).toBeTrue();
  });

  it('polls summary status after transcript completion and autofills the generated text', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;

    const transcriptionResponse: EpisodeTranscriptionStatus = {
      status: 'done',
      transcriptFileName: 'episode_42.txt',
      transcriptUpdatedAt: '2026-07-24T00:00:00.000Z',
      transcriptStartedAt: '2026-07-24T00:00:00.000Z',
      progress: 100,
      transcriptError: null,
    };
    const summaryResponse: EpisodeGeneratedSummaryStatus = {
      status: 'done',
      summaryFileName: 'episodes/42/summary.txt',
      summaryUpdatedAt: '2026-07-24T00:01:00.000Z',
      summaryStartedAt: '2026-07-24T00:00:30.000Z',
      progress: 100,
      error: null,
      version: 2,
      promptVersion: '1',
      summaryText: 'Generated summary text',
    };

    apiService.getEpisodeTranscriptionStatus.and.returnValue(of(transcriptionResponse));
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(of(summaryResponse));

    (component as unknown as { syncTranscriptionStatusPolling: (episodeId: number, targetEditor: typeof editor) => void })
      .syncTranscriptionStatusPolling(42, editor);

    expect(editor.formModel.summary).toBe('Generated summary text');
    expect(editor.formModel.summaryStatus).toBe('done');
    expect(editor.formModel.summaryUpdatedAt).toBe('2026-07-24T00:01:00.000Z');
    expect(editor.formModel.summaryStartedAt).toBe('2026-07-24T00:00:30.000Z');
    expect((component as unknown as { transcriptionStatusPollTimer: number | null }).transcriptionStatusPollTimer).toBeNull();
    expect((component as unknown as { summaryStatusPollTimer: number | null }).summaryStatusPollTimer).toBeNull();
  });

  it('does not overwrite a manually edited summary', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.summary = 'Operator summary';
    editor.formModel.summaryManuallyEdited = true;

    const transcriptionResponse: EpisodeTranscriptionStatus = {
      status: 'done',
      transcriptFileName: 'episode_42.txt',
      transcriptUpdatedAt: '2026-07-24T00:00:00.000Z',
      transcriptStartedAt: '2026-07-24T00:00:00.000Z',
      progress: 100,
      transcriptError: null,
    };
    const summaryResponse: EpisodeGeneratedSummaryStatus = {
      status: 'done',
      summaryFileName: 'episodes/42/summary.txt',
      summaryUpdatedAt: '2026-07-24T00:01:00.000Z',
      summaryStartedAt: '2026-07-24T00:00:30.000Z',
      progress: 100,
      error: null,
      version: 2,
      promptVersion: '1',
      summaryText: 'Backend generated summary',
    };

    apiService.getEpisodeTranscriptionStatus.and.returnValue(of(transcriptionResponse));
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(of(summaryResponse));

    (component as unknown as { syncTranscriptionStatusPolling: (episodeId: number, targetEditor: typeof editor) => void })
      .syncTranscriptionStatusPolling(42, editor);

    expect(editor.formModel.summary).toBe('Operator summary');
    expect(editor.formModel.summaryStatus).toBe('done');
    expect((component as unknown as { transcriptionStatusPollTimer: number | null }).transcriptionStatusPollTimer).toBeNull();
    expect((component as unknown as { summaryStatusPollTimer: number | null }).summaryStatusPollTimer).toBeNull();
  });

  it('shows a summary failure instead of falling back to the transcript status', () => {
    const editor = component.addEditorState;
    editor.formModel.transcriptStatus = 'done';
    editor.formModel.summaryStatus = 'error';
    editor.formModel.summaryError = 'summary draft must be between 80 and 420 characters';

    expect(component.getGenerationStatus(editor)).toBe(
      'Summary generation failed: summary draft must be between 80 and 420 characters'
    );
  });

  it('surfaces summary polling failures without blocking the episode form', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.transcriptStatus = 'done';
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(
      throwError(() => ({ error: { message: 'Summary endpoint unavailable' } }))
    );

    (component as unknown as { syncSummaryStatusPolling: (episodeId: number, targetEditor: typeof editor) => void })
      .syncSummaryStatusPolling(42, editor);

    expect(editor.formModel.summaryStatus).toBe('error');
    expect(editor.formModel.summaryError).toBe('Summary endpoint unavailable');
    expect(component.getGenerationStatus(editor)).toBe('Summary generation failed: Summary endpoint unavailable');
    expect((component as unknown as { summaryStatusPollTimer: number | null }).summaryStatusPollTimer).toBeNull();
  });

  it('polls and autofills summary for an episode editor', () => {
    const editor = component.episodesEditorState;
    editor.formModel.episodeId = 345;
    editor.editingEpisodeId = 345;

    apiService.getEpisodeTranscriptionStatus.and.returnValue(of({
      status: 'done',
      transcriptFileName: 'episodes/345/transcript.txt',
      transcriptUpdatedAt: '2026-07-26T00:00:00.000Z',
      transcriptStartedAt: '2026-07-26T00:00:00.000Z',
      progress: 100,
      transcriptError: null,
    }));
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(of({
      status: 'done',
      summaryFileName: 'episodes/345/summary.txt',
      summaryUpdatedAt: '2026-07-26T00:01:00.000Z',
      summaryStartedAt: '2026-07-26T00:00:30.000Z',
      progress: 100,
      error: null,
      version: 2,
      promptVersion: '1',
      summaryText: 'Generated summary for the edited episode',
    }));

    (component as unknown as { syncTranscriptionStatusPolling: (episodeId: number, targetEditor: typeof editor) => void })
      .syncTranscriptionStatusPolling(345, editor);

    expect(editor.formModel.summary).toBe('Generated summary for the edited episode');
    expect(editor.formModel.summaryStatus).toBe('done');
    expect((component as unknown as { summaryStatusPollTimer: number | null }).summaryStatusPollTimer).toBeNull();
  });
});

describe('ManageComponent artifact download modal', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let fixture: ReturnType<typeof TestBed.createComponent<ManageComponent>>;
  let component: ManageComponent;
  const episode: Episode = {
    episodeId: 42,
    title: 'A test episode',
    summary: 'Summary',
    pubDate: '2026-07-24T00:00:00.000Z',
    duration: '01:00:00',
    explicit: 'no',
    fileName: ' episode-42.mp3 ',
    trailerFileName: '',
    coverFileName: 'cover-42.jpg',
    coverLowFileName: 'cover-42.webp',
    transcriptFileName: 'transcript-42.txt',
    guests: [],
  };

  const completedSnapshot = (overrides: Partial<EpisodeArtifactJobSnapshot> = {}): EpisodeArtifactJobSnapshot => ({
    jobId: 'job-42',
    episodeId: 42,
    requested: ['episode', 'image', 'image-low', 'transcript'],
    available: ['episode', 'image', 'image-low', 'transcript'],
    missing: [],
    state: 'completed',
    progress: 100,
    stateText: 'Archive ready',
    queuePosition: null,
    downloadUrl: '/v1/episodes/42/artifacts/jobs/job-42/download',
    expiresAt: null,
    error: null,
    createdAt: '2026-07-31T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:01.000Z',
    ...overrides,
  });

  beforeEach(async () => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'getEpisodeTranscriptionStatus',
      'getEpisodeGeneratedSummaryStatus',
      'startEpisodeArtifactJob',
      'getEpisodeArtifactJobStatus',
      'listEpisodes',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      declarations: [ManageComponent, EpisodeFormComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: apiService }],
    }).compileComponents();
    fixture = TestBed.createComponent(ManageComponent);
    component = fixture.componentInstance;
    component.activeTab = 'episodes';
    component.episodes = [episode];
    fixture.detectChanges();
  });

  it('UI-01 exposes one labeled icon-only Downloads action per episode row and opens UI-02 modal', fakeAsync(() => {
    const downloadButton = fixture.nativeElement.querySelector('.episode-download-button') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('th').parentElement.textContent).toContain('Downloads');
    expect(downloadButton.getAttribute('title')).toBe('Download episode artifacts');
    expect(downloadButton.getAttribute('aria-label')).toContain('Download episode artifacts');
    expect(downloadButton.textContent?.trim()).toBe('⇩');

    downloadButton.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-labelledby')).toBe('artifactModalTitle');
    expect(document.activeElement?.id).toBe('artifactModalTitle');
  }));

  it('UI-03 and UI-04 render the five canonical options in order with trimmed availability defaults', () => {
    component.openArtifactModal(episode);
    fixture.detectChanges();

    const options = Array.from(fixture.nativeElement.querySelectorAll('.artifact-option')) as HTMLElement[];
    expect(options.map((option) => option.querySelector('.artifact-option-label')?.textContent?.trim())).toEqual([
      'Episode audio .mp3',
      'Trailer .mp3',
      'Cover art .jpg/.jpeg',
      'Low cover art .webp',
      'Transcript .txt',
    ]);
    const checkboxes = Array.from(fixture.nativeElement.querySelectorAll('.artifact-option input')) as HTMLInputElement[];
    expect(checkboxes.map((checkbox) => checkbox.checked)).toEqual([true, false, true, true, true]);
    expect(checkboxes[1].disabled).toBeTrue();
    expect(checkboxes[1].parentElement?.textContent).toContain('Unavailable — file not uploaded.');
    expect(checkboxes[0].parentElement?.querySelector('.artifact-option-filename')?.getAttribute('title')).toBe('episode-42.mp3');
  });

  it('UI-05 validates an empty selection and submits only checked canonical selectors', () => {
    component.openArtifactModal(episode);
    fixture.detectChanges();
    component.artifactOptions.forEach((option) => option.checked = false);
    component.confirmArtifactJob();
    expect(apiService.startEpisodeArtifactJob).not.toHaveBeenCalled();
    expect(component.artifactModalMessage).toContain('Select at least one');

    component.artifactOptions[0].checked = true;
    component.artifactOptions[2].checked = true;
    apiService.startEpisodeArtifactJob.and.returnValue(of(completedSnapshot({ state: 'pending', progress: 0 })));
    component.confirmArtifactJob();
    expect(apiService.startEpisodeArtifactJob).toHaveBeenCalledOnceWith(42, ['episode', 'image']);
  });

  it('UI-06 prevents duplicate starts while the first request is deferred and retains terminal partial results', () => {
    component.openArtifactModal(episode);
    fixture.detectChanges();
    const pending = completedSnapshot({ state: 'processing', progress: 65, requested: ['episode', 'image'], available: ['episode'], missing: ['image'] });
    const deferredStart = new Subject<EpisodeArtifactJobSnapshot>();
    apiService.startEpisodeArtifactJob.and.returnValue(deferredStart.asObservable());
    apiService.getEpisodeArtifactJobStatus.and.returnValue(of(pending));
    component.confirmArtifactJob();
    component.confirmArtifactJob();
    expect(apiService.startEpisodeArtifactJob).toHaveBeenCalledTimes(1);

    deferredStart.next(pending);
    expect(component.getArtifactStatusLabel()).toBe('Creating ZIP — 65%');
    expect(component.getArtifactMissingLabels()).toEqual(['Cover art']);

    const completed = completedSnapshot({ requested: ['episode', 'image'], available: ['episode'], missing: ['image'] });
    (component as unknown as { storeArtifactJob: (snapshot: EpisodeArtifactJobSnapshot) => void }).storeArtifactJob(completed);
    expect(component.getArtifactStage()).toBe('Archive ready');
    expect(component.getArtifactMissingLabels()).toEqual(['Cover art']);
    expect(component.artifactJob?.downloadUrl).toBe('/v1/episodes/42/artifacts/jobs/job-42/download');
    expect(apiService.getEpisodeArtifactJobStatus).toHaveBeenCalled();
  });

  it('UI-06 traps Tab in both directions, closes on Escape, and restores invoker focus', fakeAsync(() => {
    const downloadButton = fixture.nativeElement.querySelector('.episode-download-button') as HTMLButtonElement;
    component.openArtifactModal(episode, downloadButton);
    fixture.detectChanges();
    tick();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'));

    focusable[focusable.length - 1].focus();
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    dialog.dispatchEvent(forward);
    expect(document.activeElement).toBe(focusable[0]);

    focusable[0].focus();
    const backward = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    dialog.dispatchEvent(backward);
    expect(document.activeElement).toBe(focusable[focusable.length - 1]);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    tick();
    expect(component.artifactModalOpen).toBeFalse();
    expect(document.activeElement).toBe(downloadButton);
  }));
});
