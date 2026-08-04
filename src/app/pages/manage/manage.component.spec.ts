import { CommonModule } from '@angular/common';
import { HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { ApiService, Episode, EpisodeArtifactJobSnapshot, EpisodeGeneratedSummaryStatus, EpisodeTrailerVideoUploadResponse, EpisodeTranscriptionStatus } from '../../core/api.service';
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
      'downloadEpisodeArtifact',
      'listEpisodes',
      'reserveEpisodeDraft',
      'uploadEpisodeTrailerVideo',
      'createEpisode',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    apiService.downloadEpisodeArtifact.and.returnValue(of(new HttpResponse<Blob>({
      body: new Blob(['zip'], { type: 'application/zip' }),
      headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="episode-42-artifacts.zip"' }),
    })));
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
      'downloadEpisodeArtifact',
      'listEpisodes',
      'reserveEpisodeDraft',
      'uploadEpisodeTrailerVideo',
      'createEpisode',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    apiService.getEpisodeArtifactJobStatus.and.returnValue(of(completedSnapshot()));
    apiService.downloadEpisodeArtifact.and.returnValue(of(new HttpResponse<Blob>({
      body: new Blob(['zip'], { type: 'application/zip' }),
      headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="episode-42-artifacts.zip"' }),
    })));
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
    // ngOnInit loads the list synchronously in this test, so restore the row used
    // by the DOM/focus contract after exercising that lifecycle path.
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

  it('UI-07 delivers a completed archive once with the server filename and revokes its object URL', () => {
    const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:artifact-42');
    const revokeObjectUrl = spyOn(URL, 'revokeObjectURL');
    const click = spyOn(HTMLAnchorElement.prototype, 'click');
    const appendChild = spyOn(document.body, 'appendChild').and.callThrough();
    const snapshot = completedSnapshot();

    component.openArtifactModal(episode);
    (component as unknown as { storeArtifactJob: (value: EpisodeArtifactJobSnapshot) => void }).storeArtifactJob(snapshot);
    (component as unknown as { storeArtifactJob: (value: EpisodeArtifactJobSnapshot) => void }).storeArtifactJob(snapshot);
    component.closeArtifactModal();
    component.openArtifactModal(episode);

    expect(apiService.downloadEpisodeArtifact).toHaveBeenCalledOnceWith(snapshot.downloadUrl as string);
    expect(createObjectUrl).toHaveBeenCalledOnceWith(jasmine.any(Blob));
    expect(click).toHaveBeenCalledOnceWith();
    expect((appendChild.calls.mostRecent().args[0] as HTMLAnchorElement).download).toBe('episode-42-artifacts.zip');
    expect(revokeObjectUrl).toHaveBeenCalledOnceWith('blob:artifact-42');
    expect(component.getArtifactDeliveryStatus()).toBe('Download started.');
  });

  it('UI-07 revokes the object URL when native activation throws', () => {
    const revokeObjectUrl = spyOn(URL, 'revokeObjectURL');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:artifact-42');
    spyOn(HTMLAnchorElement.prototype, 'click').and.throwError('activation failed');
    const snapshot = completedSnapshot();

    component.openArtifactModal(episode);
    (component as unknown as { storeArtifactJob: (value: EpisodeArtifactJobSnapshot) => void }).storeArtifactJob(snapshot);

    expect(revokeObjectUrl).toHaveBeenCalledOnceWith('blob:artifact-42');
    expect(component.artifactModalMessage).toContain('activation failed');
    expect(component.isArtifactDeliveryRetryAvailable()).toBeTrue();
  });

  it('UI-08 rejects missing or unsafe server filenames and retries the same completed URL without starting a job', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:artifact-42');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    const snapshot = completedSnapshot();
    apiService.downloadEpisodeArtifact.and.returnValues(
      of(new HttpResponse<Blob>({ body: new Blob(['zip']), headers: new HttpHeaders() })),
      of(new HttpResponse<Blob>({
        body: new Blob(['zip']),
        headers: new HttpHeaders({ 'Content-Disposition': "attachment; filename*=UTF-8''episode%2042.zip" }),
      })),
    );

    component.openArtifactModal(episode);
    (component as unknown as { storeArtifactJob: (value: EpisodeArtifactJobSnapshot) => void }).storeArtifactJob(snapshot);
    expect(component.artifactModalMessage).toContain('safe archive filename');
    expect(component.isArtifactDeliveryRetryAvailable()).toBeTrue();
    expect(() => (component as unknown as { getArtifactFilename: (value: string) => string })
      .getArtifactFilename('attachment; filename="../unsafe.zip"')).toThrowError(/invalid archive filename/);

    component.retryArtifactDelivery();

    expect(apiService.downloadEpisodeArtifact).toHaveBeenCalledTimes(2);
    expect(apiService.downloadEpisodeArtifact.calls.allArgs()).toEqual([[snapshot.downloadUrl as string], [snapshot.downloadUrl as string]]);
    expect(apiService.startEpisodeArtifactJob).not.toHaveBeenCalled();
    expect(component.getArtifactDeliveryStatus()).toBe('Download started.');
  });

  it('UI-08 preserves completed state for network, authentication, and expired-download failures', () => {
    const snapshot = completedSnapshot();
    const cases = [
      [{ status: 0 }, 'could not be downloaded'],
      [{ status: 401 }, 'authenticated session'],
      [{ status: 404 }, 'expired or is no longer available'],
      [{ status: 409 }, 'expired or is no longer available'],
    ] as const;

    cases.forEach(([error, expected]) => {
      apiService.downloadEpisodeArtifact.and.returnValue(throwError(() => error));
      component.openArtifactModal(episode);
      (component as unknown as { storeArtifactJob: (value: EpisodeArtifactJobSnapshot) => void }).storeArtifactJob(snapshot);
      expect(component.artifactJob?.state).toBe('completed');
      expect(component.artifactModalMessage).toContain(expected);
      expect(component.isArtifactDeliveryRetryAvailable()).toBeTrue();
      component.resetArtifactFlow();
      expect(component.artifactJob).toBeNull();
    });
  });
});

describe('ManageComponent trailer video lifecycle', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let component: ManageComponent;

  beforeEach(() => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'listEpisodes', 'reserveEpisodeDraft', 'uploadEpisodeTrailerVideo', 'createEpisode',
      'getEpisodeTranscriptionStatus', 'getEpisodeGeneratedSummaryStatus', 'startEpisodeArtifactJob',
      'getEpisodeArtifactJobStatus', 'downloadEpisodeArtifact',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    component = new ManageComponent(apiService);
  });

  const staged = (fileName: string, draftId = 'draft-42'): HttpResponse<EpisodeTrailerVideoUploadResponse> => new HttpResponse({
    body: {
      episodeId: 42,
      draftId,
      state: 'staged',
      trailerVideoFileName: fileName,
      trailerVideoSyncStatus: 'unpublished',
      message: 'Trailer video staged.',
    },
  });

  it('reserves before immediately starting upload and retains the File for retry', () => {
    const reservation = of({ draftId: 'draft-42', episodeId: 42, state: 'reserved' as const, expiresAt: '2026-08-05T00:00:00Z' });
    const upload = new Subject<any>();
    const file = new File(['video'], 'first.mp4', { type: 'video/mp4' });
    apiService.reserveEpisodeDraft.and.returnValue(reservation);
    apiService.uploadEpisodeTrailerVideo.and.returnValue(upload.asObservable());
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;

    component.uploadMedia(editor, 'trailerVideo', file);
    expect(apiService.reserveEpisodeDraft).toHaveBeenCalledOnceWith(42);
    expect(apiService.uploadEpisodeTrailerVideo).toHaveBeenCalledOnceWith(42, 'draft-42', file);
    upload.next({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
    expect(component.getTrailerVideoProgress(editor)).toBe(50);
    expect(component.getTrailerVideoStatus(editor)).toBe('uploading');
    upload.next({ type: HttpEventType.UploadProgress, loaded: 10, total: 10 });
    expect(component.getTrailerVideoStatus(editor)).toBe('uploading');
    upload.next(staged('episodes/42/trailer.mp4'));
    expect(component.getTrailerVideoStatus(editor)).toBe('staged');

    component.cancelTrailerVideo(editor);
    expect(component.getTrailerVideoStatus(editor)).toBe('canceled');
    component.retryTrailerVideo(editor);
    expect(apiService.uploadEpisodeTrailerVideo).toHaveBeenCalledTimes(2);
    expect(apiService.uploadEpisodeTrailerVideo.calls.mostRecent().args[2]).toBe(file);
  });

  it('ignores stale replacement events and only keeps the matching terminal response', () => {
    const first = new Subject<any>();
    const second = new Subject<any>();
    apiService.reserveEpisodeDraft.and.returnValue(of({ draftId: 'draft-42', episodeId: 42, state: 'reserved' as const, expiresAt: '2026-08-05T00:00:00Z' }));
    apiService.uploadEpisodeTrailerVideo.and.returnValues(first.asObservable(), second.asObservable());
    const editor = component.episodesEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/old.mp4';

    component.uploadMedia(editor, 'trailerVideo', new File(['a'], 'a.mp4', { type: 'video/mp4' }));
    component.uploadMedia(editor, 'trailerVideo', new File(['b'], 'b.mp4', { type: 'video/mp4' }));
    first.next({ type: HttpEventType.UploadProgress, loaded: 100, total: 100 });
    first.next(staged('episodes/42/a.mp4'));
    expect(component.getUploadFilename(editor, 'trailerVideo')).toBe('b.mp4');
    expect(editor.formModel.trailerVideoFileName).toBe('episodes/42/old.mp4');
    second.next(staged('episodes/42/b.mp4'));
    expect(component.getTrailerVideoStatus(editor)).toBe('staged');
    expect(editor.formModel.trailerVideoFileName).toBe('episodes/42/old.mp4');
  });

  it('tears down active work on reset and does not allow a late response into the new editor', () => {
    const upload = new Subject<any>();
    apiService.reserveEpisodeDraft.and.returnValue(of({ draftId: 'draft-42', episodeId: 42, state: 'reserved' as const, expiresAt: '2026-08-05T00:00:00Z' }));
    apiService.uploadEpisodeTrailerVideo.and.returnValue(upload.asObservable());
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    component.uploadMedia(editor, 'trailerVideo', new File(['a'], 'a.mp4', { type: 'video/mp4' }));
    component.resetEditor(editor);
    upload.next(staged('episodes/42/stale.mp4'));
    expect(editor.formModel.trailerVideoFileName).toBeUndefined();
    expect(component.getTrailerVideoStatus(editor)).toBe('selected');
    component.ngOnDestroy();
  });
});

describe('EpisodeFormComponent trailer video card', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let manage: ManageComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<EpisodeFormComponent>>;

  beforeEach(async () => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'listEpisodes', 'reserveEpisodeDraft', 'uploadEpisodeTrailerVideo', 'createEpisode',
      'getEpisodeTranscriptionStatus', 'getEpisodeGeneratedSummaryStatus', 'startEpisodeArtifactJob',
      'getEpisodeArtifactJobStatus', 'downloadEpisodeArtifact',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    manage = new ManageComponent(apiService);
    await TestBed.configureTestingModule({
      declarations: [EpisodeFormComponent],
      imports: [CommonModule, FormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(EpisodeFormComponent);
    fixture.componentInstance.controller = manage;
    fixture.componentInstance.editor = manage.addEditorState;
    fixture.detectChanges();
  });

  it('renders a dedicated MP4 card with lifecycle status and no provider controls', () => {
    const cards = Array.from(fixture.nativeElement.querySelectorAll('.upload-card')) as HTMLElement[];
    const card = cards.find((candidate) => Boolean(candidate.textContent?.includes('Trailer video')));
    expect(card).not.toBeNull();
    if (!card) {
      fail('Trailer video card was not rendered.');
    }
    const renderedCard = card as HTMLElement;
    expect(renderedCard.textContent).toContain('.mp4');
    expect(renderedCard.querySelector('input')?.getAttribute('accept')).toBe('.mp4,video/mp4');
    expect(fixture.nativeElement.textContent).not.toContain('YouTube');
    expect(fixture.nativeElement.textContent).not.toContain('Publish');
  });

  it('keeps the last-known-good filename visible while a replacement uploads', () => {
    const editor = manage.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/old.mp4';
    const upload = new Subject<any>();
    apiService.reserveEpisodeDraft.and.returnValue(of({ draftId: 'draft-42', episodeId: 42, state: 'reserved' as const, expiresAt: '2026-08-05T00:00:00Z' }));
    apiService.uploadEpisodeTrailerVideo.and.returnValue(upload.asObservable());
    manage.uploadMedia(editor, 'trailerVideo', new File(['new'], 'new.mp4', { type: 'video/mp4' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('old.mp4');
    upload.next({ type: HttpEventType.UploadProgress, loaded: 1, total: 2 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Uploading trailer video');
    expect(fixture.nativeElement.textContent).toContain('old.mp4');
  });
});
