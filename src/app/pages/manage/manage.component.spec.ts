import { CommonModule } from '@angular/common';
import { HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { ApiService, Episode, EpisodeArtifactJobSnapshot, EpisodeGeneratedSummaryStatus, EpisodeTrailerVideoUploadResponse, EpisodeTranscriptionStatus, HashtagLookupResponse, SuggestedTagsSnapshot, TrailerCandidatePreviewGrant, TrailerCandidateReviewStatus, TrailerReplacementStatus, YoutubeTrailerJobSnapshot } from '../../core/api.service';
import { EpisodeFormComponent } from './episode-form.component';
import { ManageComponent } from './manage.component';
import { environment as developmentEnvironment } from '../../../environments/environment';
import { environment as stagingEnvironment } from '../../../environments/environment.staging';
import { environment as productionEnvironment } from '../../../environments/environment.prod';

const trailerCandidateStatus = (episodeId = 42, overrides: Partial<TrailerCandidateReviewStatus> = {}): TrailerCandidateReviewStatus => ({
  candidateId: `candidate-${episodeId}`,
  episodeId,
  version: 3,
  status: 'ready',
  progress: 100,
  errorCategory: null,
  errorMessage: null,
  durationSeconds: 98,
  resolution: '1280×1280',
  profileId: 'dc-square-waveform',
  profileRevision: 2,
  sourceFingerprint: 'a'.repeat(64),
  isCurrent: true,
  outputValid: true,
  createdAt: '2026-09-12T10:00:00.000Z',
  updatedAt: '2026-09-12T10:01:00.000Z',
  readyAt: '2026-09-12T10:01:00.000Z',
  transcriptStatus: 'done',
  transcriptProgress: 100,
  transcriptText: 'Automatic trailer transcript',
  transcriptProvider: 'fake-transcription',
  transcriptErrorCategory: null,
  transcriptErrorMessage: null,
  captionMode: 'automatic',
  captionStatus: 'waveform_only',
  captionReasonCode: 'quality_calibration_unavailable',
  ...overrides,
});

const trailerCandidatePreviewGrant = (episodeId = 42, candidateId = `candidate-${episodeId}`, token = 'A'.repeat(43), expiresAt = new Date(Date.now() + 60_000).toISOString()): TrailerCandidatePreviewGrant => ({
  episodeId,
  candidateId,
  previewUrl: `/v1/episodes/${episodeId}/trailer-candidates/${encodeURIComponent(candidateId)}/preview?grant=${token}`,
  expiresAt,
});

const trailerReplacementStatus = (episodeId = 42, overrides: Partial<TrailerReplacementStatus> = {}): TrailerReplacementStatus => ({
  episodeId,
  sourceRevision: `episode:${episodeId}:${'b'.repeat(64)}`,
  status: 'waiting_for_youtube_action',
  replacementComplete: false,
  destinations: {
    instagram_reel: {
      destination: 'instagram_reel', lifecycle: 'published', retirementStatus: 'manual_retirement_required', replacementComplete: false,
      predecessor: { remoteId: 'instagram-old', permalink: 'https://example.test/instagram-old' },
      successor: { remoteId: 'instagram-new', permalink: 'https://example.test/instagram-new' },
      manualInstructions: 'Remove the exact predecessor in Meta before confirming.', confirmationEndpoint: '/confirm',
      retirementActorEmail: null, retirementConfirmedAt: null,
    },
    facebook_native_video: {
      destination: 'facebook_native_video', lifecycle: 'published', retirementStatus: 'confirmed_manually', replacementComplete: true,
      predecessor: { remoteId: 'facebook-old', permalink: 'https://example.test/facebook-old' },
      successor: { remoteId: 'facebook-new', permalink: 'https://example.test/facebook-new' },
      manualInstructions: null, confirmationEndpoint: null, retirementActorEmail: 'operator@example.test', retirementConfirmedAt: '2026-09-13T10:00:00.000Z',
    },
  },
  youtube: { status: 'waiting_for_operator_upload', predecessor: { remoteId: 'youtube-old', permalink: 'https://youtube.com/watch?v=old' }, successor: null, retirementError: null },
  telegram: {
    configured: true,
    status: 'pending',
    destinations: {
      guild_trailer: { status: 'pending', messageId: null, fileId: null, topicId: null, messageThreadId: null },
      advance_access: { status: 'pending', messageId: null, fileId: null, topicId: 'topic-stable', messageThreadId: 'thread-stable' },
    },
  },
  ...overrides,
});

describe('ManageComponent summary flow', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let component: ManageComponent;

  beforeEach(() => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'getEpisodeTranscriptionStatus',
      'transcribeEpisodeWithWhisper',
      'getEpisodeGeneratedSummaryStatus',
      'startEpisodeArtifactJob',
      'getEpisodeArtifactJobStatus',
      'downloadEpisodeArtifact',
      'listEpisodes',
      'listStructuredEntryCatalog',
      'reserveEpisodeDraft',
      'uploadEpisodeTrailerVideo',
      'uploadEpisodeAudio',
      'uploadEpisodeTrailer',
      'createEpisode',
      'updateEpisode',
      'commitYoutubeTrailerJob',
      'lookupHashtag',
      'getCurrentTrailerCandidate',
      'getTrailerCandidate',
      'createTrailerCandidatePreviewGrant',
      'generateTrailerCandidate',
      'retryTrailerCandidate',
      'decideTrailerCandidate',
      'getTrailerReplacementStatus',
      'confirmTrailerPredecessorRetirement',
      'startYoutubeTrailerJob',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    apiService.listStructuredEntryCatalog.and.returnValue(of({ guests: [], musicCredits: [] }));
    apiService.getCurrentTrailerCandidate.and.returnValue(throwError(() => ({ status: 404 })));
    apiService.getTrailerCandidate.and.returnValue(of(trailerCandidateStatus()));
    apiService.createTrailerCandidatePreviewGrant.and.callFake((episodeId, candidateId) => of(trailerCandidatePreviewGrant(episodeId, candidateId)));
    apiService.generateTrailerCandidate.and.callFake((episodeId, transcriptText, expectedSourceFingerprint) => of(trailerCandidateStatus(episodeId, {
      candidateId: 'generated-candidate', status: 'pending', progress: 0, durationSeconds: null, resolution: null,
      transcriptText, sourceFingerprint: expectedSourceFingerprint,
    })));
    apiService.retryTrailerCandidate.and.callFake((episodeId, candidateId) => of(trailerCandidateStatus(episodeId, {
      candidateId, status: 'pending', progress: 0, durationSeconds: null, resolution: null,
    })));
    apiService.decideTrailerCandidate.and.callFake((episodeId, candidateId, decision, expectedVersion, expectedSourceFingerprint) => of({
      status: decision === 'approve' ? 'approved' : 'rejected', candidateId, episodeId, version: expectedVersion, sourceFingerprint: expectedSourceFingerprint,
      ...(decision === 'approve' ? { sourceRevision: trailerReplacementStatus(episodeId).sourceRevision } : {}),
    }));
    apiService.getTrailerReplacementStatus.and.callFake((episodeId) => of(trailerReplacementStatus(episodeId)));
    apiService.confirmTrailerPredecessorRetirement.and.callFake((episodeId, sourceRevision, destination, predecessorRemoteId) => of({
      status: 'confirmed', sourceRevision, destination,
      predecessor: { remoteId: predecessorRemoteId, permalink: 'https://example.test/old' },
      successor: { remoteId: 'successor', permalink: 'https://example.test/new' },
      retirementStatus: 'confirmed_manually', retirementActorEmail: 'operator@example.test', retirementConfirmedAt: new Date().toISOString(), replacementComplete: false,
    }));
    apiService.startYoutubeTrailerJob.and.returnValue(of({} as YoutubeTrailerJobSnapshot));
    apiService.transcribeEpisodeWithWhisper = jasmine.createSpy('transcribeEpisodeWithWhisper');
    apiService.downloadEpisodeArtifact.and.returnValue(of(new HttpResponse<Blob>({
      body: new Blob(['zip'], { type: 'application/zip' }),
      headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="episode-42-artifacts.zip"' }),
    })));
    component = new ManageComponent(apiService);
    component.addEditorState.formModel.episodeNumber = 42;
    component.episodesEditorState.formModel.episodeNumber = 42;
  });

  it('merges generated suggestions additively without touching generic episode tags', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeNumber = 42;
    editor.formModel.episodeId = 42;
    editor.formModel.tags = ['podcast', 'rpg'];
    editor.formModel.hashtags = '#manual #rpg';
    const suggestedTags: SuggestedTagsSnapshot = {
      status: 'done', version: 2, updatedAt: '2026-08-14T00:00:00.000Z', startedAt: null,
      finishedAt: '2026-08-14T00:00:00.000Z', retryAt: null, errorCategory: null,
      promptVersion: 'hashtags-v1', provider: null, suggestions: [
        { displayTag: '#rpg', normalizedTag: '#rpg', approximateCount: 10, retrievedAt: null, cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', relevanceScore: 90 },
        { displayTag: '#fantasy', normalizedTag: '#fantasy', approximateCount: 9, retrievedAt: null, cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', relevanceScore: 80 },
        { displayTag: '#podcast', normalizedTag: '#podcast', approximateCount: 8, retrievedAt: null, cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', relevanceScore: 70 },
      ],
      candidates: [
        { displayTag: '#rpg', normalizedTag: '#rpg', relevant: true, relevanceScore: 90 },
        { displayTag: '#fantasy', normalizedTag: '#fantasy', relevant: true, relevanceScore: 80 },
        { displayTag: '#podcast', normalizedTag: '#podcast', relevant: true, relevanceScore: 70 },
      ],
    };
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(of({
      status: 'done', summaryFileName: null, summaryUpdatedAt: null, summaryStartedAt: null,
      progress: 100, error: null, version: 1, promptVersion: 'summary-v1', provider: null, summaryText: 'Generated', suggestedTags,
    }));

    (component as unknown as { syncSummaryStatusPolling: (episodeId: number, targetEditor: typeof editor) => void })
      .syncSummaryStatusPolling(42, editor);

    expect(editor.formModel.hashtags).toBe('#manual #rpg #fantasy');
    expect(editor.formModel.tags).toEqual(['podcast', 'rpg']);
    expect(editor.formModel.summary).toBe('Generated');
    expect(editor.formModel.instagramHashtags).toEqual(['#rpg', '#fantasy', '#podcast']);
  });

  it('keeps manual Instagram hashtag edits when suggestion polling returns', () => {
    const editor = component.addEditorState;
    editor.formModel.instagramHashtags = ['#manual'];
    component.onInstagramHashtagsChange(editor);
    const snapshot: SuggestedTagsSnapshot = {
      status: 'done', version: 1, updatedAt: '', startedAt: null, finishedAt: null, retryAt: null,
      errorCategory: null, promptVersion: null, provider: null,
      candidates: [{ displayTag: '#suggested', normalizedTag: '#suggested', relevant: true, relevanceScore: 90 }],
      suggestions: [],
    };
    (component as unknown as { mergeSuggestedTags: (targetEditor: typeof editor, value: SuggestedTagsSnapshot) => void })
      .mergeSuggestedTags(editor, snapshot);
    expect(editor.formModel.instagramHashtags).toEqual(['#manual']);
  });

  it('derives a Unicode-aware read-only title and rejects an assembled title over 100 code points', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeNumber = 42;
    editor.formModel.title = 'Episode 😀';
    editor.formModel.hashtags = '#rpg #fantasy';

    expect(component.getTrailerTitle(editor)).toBe('Trailer - DC 42 - Episode 😀 #rpg #fantasy');
    expect(component.getTrailerTitleCodePointLength(editor)).toBe([...component.getTrailerTitle(editor)].length);
    expect(component.getTrailerTitleValidationError(editor)).toBe('');

    editor.formModel.title = 'x'.repeat(90);
    editor.formModel.hashtags = '#rpg';
    expect(component.getTrailerTitleValidationError(editor)).toContain('100 Unicode characters');
    expect(component.isEpisodeSaveDisabled(editor)).toBeTrue();
  });

  it('shows the scheduled publication popup and clears all upload state after Save', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeNumber = 42;
    editor.editingEpisodeId = 42;
    editor.formModel.episodeId = 42;
    editor.formModel.title = 'Scheduled episode';
    editor.formModel.pubDate = '2026-08-20T10:00';
    editor.formModel.musicCredits[0] = {
      name: 'Artist', links: [{ label: 'Bandcamp', url: 'https://example.test/music' }],
      draftLabel: '', draftUrl: '', suggestions: [], suggestionsOpen: false,
    };
    (component as any).uploadStates.audio.progress = 100;
    (component as any).uploadStates.trailerVideo.progress = 100;
    (component as any).setTrailerVideoState(editor, {
      file: new File(['video'], 'trailer.mp4', { type: 'video/mp4' }),
      status: 'finalized',
      progress: 100,
    });
    apiService.updateEpisode.and.returnValue(of({
      episodeId: 42,
      pubDate: '2099-01-01T10:00:00.000Z',
    } as Episode));

    component.saveEpisode(editor);

    expect(component.successPopupOpen).toBeTrue();
    expect(component.successPopupMessage).toContain('scheduled to launch');
    expect((component as any).uploadStates.audio.progress).toBe(0);
    expect((component as any).uploadStates.trailerVideo.progress).toBe(0);
    expect(component.getTrailerVideoStatus(editor)).toBe('selected');
    expect(component.getTrailerVideoProgress(editor)).toBe(0);
  });

  it('reports an immediate launch outcome and does not open a success popup on Save failure', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeNumber = 42;
    editor.editingEpisodeId = 42;
    editor.formModel.episodeId = 42;
    editor.formModel.title = 'Published episode';
    editor.formModel.pubDate = '2020-01-01T10:00';
    editor.formModel.musicCredits[0] = {
      name: 'Artist', links: [{ label: 'Bandcamp', url: 'https://example.test/music' }],
      draftLabel: '', draftUrl: '', suggestions: [], suggestionsOpen: false,
    };
    apiService.updateEpisode.and.returnValue(of({ episodeId: 42, pubDate: '2020-01-01T10:00:00.000Z' } as Episode));

    component.saveEpisode(editor);

    expect(component.successPopupMessage).toContain('launched successfully');
    component.dismissSuccessPopup();
    apiService.updateEpisode.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));
    editor.editingEpisodeId = 42;
    editor.formModel.episodeId = 42;
    editor.formModel.title = 'Failed episode';
    editor.formModel.pubDate = '2020-01-01T10:00';
    editor.formModel.musicCredits[0] = {
      name: 'Artist', links: [{ label: 'Bandcamp', url: 'https://example.test/music' }],
      draftLabel: '', draftUrl: '', suggestions: [], suggestionsOpen: false,
    };

    component.saveEpisode(editor);

    expect(component.successPopupOpen).toBeFalse();
    expect(component.errorMessage).toBe('Save failed');
  });

  it('debounces hashtag lookup and ignores a late response after a newer token', fakeAsync(() => {
    const editor = component.addEditorState;
    editor.formModel.episodeNumber = 42;
    editor.formModel.episodeId = 42;
    const first = new Subject<HashtagLookupResponse>();
    const second = new Subject<HashtagLookupResponse>();
    apiService.lookupHashtag.and.returnValues(first.asObservable(), second.asObservable());

    editor.formModel.hashtags = '#old';
    component.onHashtagInput(editor);
    tick(1000);
    expect(apiService.lookupHashtag).toHaveBeenCalledWith(42, jasmine.any(String));
    editor.formModel.hashtags = '#new';
    component.onHashtagInput(editor);
    tick(1000);
    first.next({ displayTag: '#old', normalizedTag: '#old', approximateCount: 1, retrievedAt: null, cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', source: 'provider', state: 'available', errorCategory: null, retryAt: null });
    second.next({ displayTag: '#new', normalizedTag: '#new', approximateCount: 2, retrievedAt: null, cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', source: 'provider', state: 'available', errorCategory: null, retryAt: null });

    expect(component.getHashtagLookup(editor)?.normalizedTag).toBe('#new');
    expect(component.hasHashtagLookup(editor, '#NEW')).toBeTrue();
  }));

  it('marks the summary as manually edited when the field changes', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeNumber = 42;

    expect(editor.formModel.summaryManuallyEdited).toBeFalse();

    component.onSummaryChange(editor);

    expect(editor.formModel.summaryManuallyEdited).toBeTrue();
  });

  it('keeps authored hashtag lookup and editor context through a deferred YouTube commit failure', fakeAsync(() => {
    const editor = component.addEditorState;
    editor.formModel.episodeNumber = 42;
    editor.formModel.episodeId = 42;
    editor.formModel.title = 'Saved title';
    editor.formModel.pubDate = '2026-08-20T10:00';
    editor.formModel.hashtags = '#rpg';
    editor.formModel.musicCredits[0] = {
      name: 'Artist', links: [{ label: 'Bandcamp', url: 'https://example.test/music' }],
      draftLabel: '', draftUrl: '', suggestions: [], suggestionsOpen: false,
    };
    editor.trailerVideoDraftId = 'draft-42';
    const lookupResponse: HashtagLookupResponse = {
      displayTag: '#rpg', normalizedTag: '#rpg', approximateCount: 12, retrievedAt: null,
      cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', source: 'provider',
      state: 'available', errorCategory: null, retryAt: null,
    };
    apiService.lookupHashtag.and.returnValue(of(lookupResponse));
    const createResponse = new Subject<Episode>();
    const commitResponse = new Subject<YoutubeTrailerJobSnapshot>();
    apiService.createEpisode.and.returnValue(createResponse);
    apiService.commitYoutubeTrailerJob.and.returnValue(commitResponse);
    (component as any).youtubeTrailerJobStates.set(editor, {
      snapshot: { jobId: 'job-42', episodeId: 42, status: 'ready', progress: { confirmedBytes: 1, totalBytes: 1, processingPartsProcessed: null, processingPartsTotal: null, processingTimeLeftMs: null }, cancellation: { requestedAt: null, cancelledAt: null, boundary: null }, error: { category: null, occurredAt: null }, retry: { count: 0, nextAttemptAt: null }, createdAt: '', updatedAt: '', completedAt: '', privateWatchUrl: 'https://youtu.be/private', publicationStatus: 'not_started' },
      episodeId: 42, jobId: 'job-42', sourceGeneration: 0, sourceFileName: 'draft:draft-42', pollingTimer: null, pollingSubscription: null, startInFlight: null, error: '',
    });

    component.onHashtagInput(editor);
    tick(1000);
    expect(component.getHashtagLookup(editor)?.normalizedTag).toBe('#rpg');
    component.saveEpisode(editor);
    createResponse.next({ episodeId: 42 } as Episode);
    expect(apiService.commitYoutubeTrailerJob).toHaveBeenCalledWith(42, 'job-42', 'Trailer - DC 42 - Saved title', ['#rpg']);
    expect(component.getSaveTransaction(editor)?.phase).toBe('committing');
    expect(component.getHashtagLookup(editor)?.normalizedTag).toBe('#rpg');

    commitResponse.error({ error: { category: 'quota' } });

    expect(editor.formModel.title).toBe('Saved title');
    expect(editor.formModel.hashtags).toBe('#rpg');
    expect(editor.formModel.youtube).toBe('https://youtu.be/private');
    expect(component.getHashtagLookup(editor)?.normalizedTag).toBe('#rpg');
    expect(component.getSaveTransaction(editor)?.phase).toBe('error');
    expect(component.errorMessage).toContain('YouTube commit failed (quota)');
  }));

  it('restores persisted YouTube hashtags when an existing episode is reopened', () => {
    const episode = {
      episodeId: 42,
      title: 'Episode 42',
      summary: 'Existing summary',
      pubDate: '2026-08-20T10:00:00.000Z',
      explicit: 'no' as const,
      trailerVideoFileName: 'episodes/42/trailer.mp4',
      youtubeJob: { metadata: { hashtags: ['#Manual', '#RPG'] } },
    } as Episode & { youtubeJob: { metadata: { hashtags: string[] } } };

    component.startEdit(episode);

    expect(component.episodesEditorState.formModel.hashtags).toBe('#manual #rpg');
    expect(component.serializeHashtags(component.episodesEditorState.formModel.hashtags)).toEqual(['#manual', '#rpg']);
  });

  it('keeps a successful hashtag lookup actionable through the save and commit boundaries', fakeAsync(() => {
    const editor = component.addEditorState;
    editor.formModel.episodeNumber = 42;
    editor.formModel.episodeId = 42;
    editor.formModel.title = 'Saved title';
    editor.formModel.pubDate = '2026-08-20T10:00';
    editor.formModel.hashtags = '#rpg';
    editor.formModel.musicCredits[0] = {
      name: 'Artist', links: [{ label: 'Bandcamp', url: 'https://example.test/music' }],
      draftLabel: '', draftUrl: '', suggestions: [], suggestionsOpen: false,
    };
    const createResponse = new Subject<Episode>();
    const commitResponse = new Subject<YoutubeTrailerJobSnapshot>();
    apiService.lookupHashtag.and.returnValue(of({
      displayTag: '#rpg', normalizedTag: '#rpg', approximateCount: 12, retrievedAt: null,
      cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', source: 'provider',
      state: 'available', errorCategory: null, retryAt: null,
    }));
    apiService.createEpisode.and.returnValue(createResponse);
    apiService.commitYoutubeTrailerJob.and.returnValue(commitResponse);
    (component as any).youtubeTrailerJobStates.set(editor, {
      snapshot: { jobId: 'job-42', episodeId: 42, status: 'ready', progress: { confirmedBytes: 1, totalBytes: 1, processingPartsProcessed: null, processingPartsTotal: null, processingTimeLeftMs: null }, cancellation: { requestedAt: null, cancelledAt: null, boundary: null }, error: { category: null, occurredAt: null }, retry: { count: 0, nextAttemptAt: null }, createdAt: '', updatedAt: '', completedAt: '', privateWatchUrl: null, publicationStatus: 'not_started' },
      episodeId: 42, jobId: 'job-42', sourceGeneration: 0, sourceFileName: 'draft:draft-42', pollingTimer: null, pollingSubscription: null, startInFlight: null, error: '',
    });

    component.onHashtagInput(editor);
    tick(1000);
    expect(component.getHashtagLookup(editor)?.state).toBe('available');
    component.saveEpisode(editor);
    createResponse.next({ episodeId: 42 } as Episode);

    expect(component.getHashtagLookup(editor)?.normalizedTag).toBe('#rpg');
    expect(component.getSaveTransaction(editor)?.phase).toBe('committing');
    expect(apiService.commitYoutubeTrailerJob).toHaveBeenCalledWith(42, 'job-42', 'Trailer - DC 42 - Saved title', ['#rpg']);
  }));

  it('keeps a hashtag lookup error visible while an ordinary save remains unchanged', fakeAsync(() => {
    const editor = component.addEditorState;
    editor.editingEpisodeId = 42;
    editor.formModel.episodeNumber = 42;
    editor.formModel.episodeId = 42;
    editor.formModel.title = 'Ordinary save';
    editor.formModel.pubDate = '2026-08-20T10:00';
    editor.formModel.musicCredits[0] = {
      name: 'Artist', links: [{ label: 'Bandcamp', url: 'https://example.test/music' }],
      draftLabel: '', draftUrl: '', suggestions: [], suggestionsOpen: false,
    };
    apiService.lookupHashtag.and.returnValue(throwError(() => ({ error: {
      displayTag: '#broken', normalizedTag: '#broken', approximateCount: null, retrievedAt: null,
      cacheStatus: 'miss', regionCode: 'BR', relevanceLanguage: 'pt', source: 'provider',
      state: 'unavailable', errorCategory: 'provider_unavailable', retryAt: null,
    } })));
    apiService.updateEpisode.and.returnValue(of({ episodeId: 42 } as Episode));

    editor.formModel.hashtags = '#broken';
    component.onHashtagInput(editor);
    tick(1000);
    expect(component.getHashtagLookup(editor)?.state).toBe('unavailable');
    expect(component.getHashtagLookup(editor)?.errorCategory).toBe('provider_unavailable');

    component.saveEpisode(editor);

    expect(apiService.updateEpisode).toHaveBeenCalled();
    expect(apiService.commitYoutubeTrailerJob).not.toHaveBeenCalled();
    expect(component.getHashtagLookup(editor)).toBeNull();
    expect(component.getHashtagLookup(editor)).toBeNull();
    tick(0);
    discardPeriodicTasks();
  }));

  it('ignores a save response after the editor is explicitly reset', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.title = 'Stale save';
    editor.formModel.pubDate = '2026-08-20T10:00';
    editor.formModel.musicCredits[0] = {
      name: 'Artist', links: [{ label: 'Bandcamp', url: 'https://example.test/music' }],
      draftLabel: '', draftUrl: '', suggestions: [], suggestionsOpen: false,
    };
    const createResponse = new Subject<Episode>();
    apiService.createEpisode.and.returnValue(createResponse);

    component.saveEpisode(editor);
    component.resetEditor(editor);
    createResponse.next({ episodeId: 42 } as Episode);

    expect(apiService.commitYoutubeTrailerJob).not.toHaveBeenCalled();
    expect(editor.formModel.title).toBe('');
    expect(component.getSaveTransaction(editor)).toBeNull();
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
      provider: null,
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
      provider: null,
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
      provider: null,
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
      provider: null,
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

  it('surfaces transcription failure even when the summary cycle was initialized', () => {
    const editor = component.addEditorState;
    editor.formModel.transcriptStatus = 'error';
    editor.formModel.transcriptError = 'Gemini request failed (403): The caller does not have permission';
    editor.formModel.summaryStatus = 'pending';

    expect(component.isGenerationError(editor)).toBeTrue();
    expect(component.getGenerationStatus(editor)).toBe(
      'Transcription failed: Gemini request failed (403): The caller does not have permission'
    );
  });

  it('stops transcription polling after a terminal provider failure', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    apiService.getEpisodeTranscriptionStatus.and.returnValue(throwError(() => ({
      error: { message: 'Gemini request failed (503): temporary overload' },
    })));

    (component as unknown as { syncTranscriptionStatusPolling: (episodeId: number, targetEditor: typeof editor) => void })
      .syncTranscriptionStatusPolling(42, editor);
    (component as unknown as { syncTranscriptionStatusPolling: (episodeId: number, targetEditor: typeof editor) => void })
      .syncTranscriptionStatusPolling(42, editor);

    expect(apiService.getEpisodeTranscriptionStatus).toHaveBeenCalledTimes(1);
    expect(editor.formModel.transcriptStatus).toBe('error');
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
      provider: null,
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
      provider: null,
      summaryText: 'Generated summary for the edited episode',
    }));

    (component as unknown as { syncTranscriptionStatusPolling: (episodeId: number, targetEditor: typeof editor) => void })
      .syncTranscriptionStatusPolling(345, editor);

    expect(editor.formModel.summary).toBe('Generated summary for the edited episode');
    expect(editor.formModel.summaryStatus).toBe('done');
    expect((component as unknown as { summaryStatusPollTimer: number | null }).summaryStatusPollTimer).toBeNull();
  });

  it('restores transcript polling before summary polling for pending edited episodes', () => {
    const episode = (episodeId: number, overrides: Partial<Episode> = {}): Episode => ({
      episodeId,
      title: `Episode ${episodeId}`,
      summary: 'Existing summary',
      pubDate: '2026-07-24T00:00:00.000Z',
      explicit: 'no',
      transcriptStatus: 'pending',
      summaryStatus: 'pending',
      ...overrides,
    });
    apiService.getEpisodeTranscriptionStatus.and.returnValue(of({
      status: 'pending', transcriptFileName: null, transcriptUpdatedAt: null,
      transcriptStartedAt: null, progress: 20, transcriptError: null, provider: null,
    }));
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(of({
      status: 'pending', summaryFileName: null, summaryUpdatedAt: null,
      summaryStartedAt: null, progress: 10, error: null, version: 1,
      promptVersion: 'summary-v1', provider: null, summaryText: null,
    }));

    component.startEdit(episode(42));

    expect(apiService.getEpisodeTranscriptionStatus).toHaveBeenCalledOnceWith(42);
    expect(apiService.getEpisodeGeneratedSummaryStatus).not.toHaveBeenCalled();
    expect((component as unknown as { summaryStatusPollTimer: number | null }).summaryStatusPollTimer).toBeNull();
    expect((component as unknown as { transcriptionStatusPollTimer: number | null }).transcriptionStatusPollTimer).not.toBeNull();

    component.startEdit(episode(43, { transcriptStatus: 'done', summaryStatus: 'processing' }));

    expect(apiService.getEpisodeTranscriptionStatus).toHaveBeenCalledOnceWith(42);
    expect(apiService.getEpisodeGeneratedSummaryStatus).toHaveBeenCalledOnceWith(43);
    expect((component as unknown as { transcriptionStatusPollTimer: number | null }).transcriptionStatusPollTimer).toBeNull();
    expect((component as unknown as { summaryStatusPollTimer: number | null }).summaryStatusPollTimer).not.toBeNull();
    (component as unknown as { clearEpisodeGenerationPolling: () => void }).clearEpisodeGenerationPolling();
  });

  it('restores suggested-tag polling without polling terminal generation states', () => {
    const episode: Episode = {
      episodeId: 42,
      title: 'Episode 42',
      summary: 'Existing summary',
      pubDate: '2026-07-24T00:00:00.000Z',
      explicit: 'no',
      transcriptStatus: 'done',
      summaryStatus: 'done',
    };
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(of({
      status: 'processing', summaryFileName: null, summaryUpdatedAt: null,
      summaryStartedAt: null, progress: 50, error: null, version: 1,
      promptVersion: 'summary-v1', provider: null, summaryText: null,
    }));

    component.startEdit({ ...episode, summaryStatus: 'idle' });
    expect(apiService.getEpisodeGeneratedSummaryStatus).not.toHaveBeenCalled();

    component.startEdit({
      ...episode,
      summaryStatus: 'done',
      suggestedTags: {
        status: 'processing', version: 1, updatedAt: '', startedAt: null,
        finishedAt: null, retryAt: null, errorCategory: null,
        promptVersion: null, provider: null, candidates: [], suggestions: [],
      },
    } as Episode & { suggestedTags?: SuggestedTagsSnapshot });
    expect(apiService.getEpisodeGeneratedSummaryStatus).toHaveBeenCalledOnceWith(42);
    (component as unknown as { clearEpisodeGenerationPolling: () => void }).clearEpisodeGenerationPolling();

    component.startEdit({ ...episode, summaryStatus: 'error' });
    expect(apiService.getEpisodeGeneratedSummaryStatus).toHaveBeenCalledOnceWith(42);
  });

  it('ignores a late response from an older restored summary poll after re-editing', () => {
    const oldResponse = new Subject<EpisodeGeneratedSummaryStatus>();
    const currentResponse = new Subject<EpisodeGeneratedSummaryStatus>();
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValues(oldResponse.asObservable(), currentResponse.asObservable());
    const episode: Episode = {
      episodeId: 42,
      title: 'Episode 42',
      summary: 'Existing summary',
      pubDate: '2026-07-24T00:00:00.000Z',
      explicit: 'no',
      transcriptStatus: 'done',
      summaryStatus: 'pending',
    };

    component.startEdit(episode);
    component.startEdit(episode);
    oldResponse.next({
      status: 'done', summaryFileName: null, summaryUpdatedAt: null,
      summaryStartedAt: null, progress: 100, error: null, version: 1,
      promptVersion: null, provider: null, summaryText: 'Stale summary',
    });
    expect(component.episodesEditorState.formModel.summary).toBe('Existing summary');
    currentResponse.next({
      status: 'done', summaryFileName: null, summaryUpdatedAt: null,
      summaryStartedAt: null, progress: 100, error: null, version: 2,
      promptVersion: null, provider: null, summaryText: 'Current summary',
    });
    expect(component.episodesEditorState.formModel.summary).toBe('Current summary');
    (component as unknown as { clearEpisodeGenerationPolling: () => void }).clearEpisodeGenerationPolling();
  });

  it('recovers the API-owned current trailer candidate on editor reload with safe metadata', () => {
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42, { errorCategory: 'render_failed', errorMessage: 'Trailer generation failed. Check the source files and try again.' })));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });

    const candidate = component.getTrailerCandidate(component.episodesEditorState);
    expect(apiService.getCurrentTrailerCandidate).toHaveBeenCalledOnceWith(42);
    expect(candidate?.candidateId).toBe('candidate-42');
    expect(candidate?.version).toBe(3);
    expect(candidate?.sourceFingerprint).toBe('a'.repeat(64));
    expect(candidate?.profileId).toBe('dc-square-waveform');
    expect(candidate?.durationSeconds).toBe(98);
    expect(candidate?.resolution).toBe('1280×1280');
    expect(candidate?.errorMessage).toContain('Check the source files');
    expect(component.getTrailerCandidateStatusLabel(candidate!)).toBe('Trailer ready for review');
    expect(component.formatTrailerCandidateDuration(candidate?.durationSeconds ?? null)).toBe('1:38');
  });

  it('keeps edited transcript text when a delayed candidate poll returns generated text', fakeAsync(() => {
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42, {
      status: 'processing', progress: 20, transcriptText: null, transcriptStatus: 'processing', transcriptProgress: 35,
    })));
    apiService.getTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42, {
      status: 'processing', progress: 70, transcriptText: 'Late provider transcript', transcriptStatus: 'done', transcriptProgress: 100,
    })));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });

    component.onTrailerTranscriptChange(component.episodesEditorState, 'Operator edits remain');
    tick(2500);

    expect(component.getTrailerTranscript(component.episodesEditorState)).toBe('Operator edits remain');
    component.ngOnDestroy();
    discardPeriodicTasks();
  }));

  it('generates from the latest transcript and current source fingerprint', () => {
    const editor = component.episodesEditorState;
    const candidate = trailerCandidateStatus(42, { status: 'processing', progress: 20, transcriptText: 'Old generated text' });
    apiService.getCurrentTrailerCandidate.and.returnValue(of(candidate));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    component.onTrailerTranscriptChange(editor, 'Exact operator transcript\nwith edits');

    component.generateTrailer(editor);

    expect(apiService.generateTrailerCandidate).toHaveBeenCalledOnceWith(42, 'Exact operator transcript\nwith edits', 'a'.repeat(64), undefined);
    expect(component.getTrailerTranscript(editor)).toBe('Exact operator transcript\nwith edits');
    expect(component.getTrailerCandidate(editor)?.candidateId).toBe('generated-candidate');
  });

  it('defaults captions on only for API eligibility and sends explicit opt-out with the latest transcript', () => {
    const editor = component.episodesEditorState;
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42, {
      status: 'processing', progress: 20, captionStatus: 'eligible', captionReasonCode: null,
    })));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });

    expect(component.isTimedCaptionsEligible(editor)).toBeTrue();
    expect(component.includeTimedCaptions(editor)).toBeTrue();
    component.setIncludeTimedCaptions(editor, false);
    component.onTrailerTranscriptChange(editor, 'Latest edited transcript');
    component.generateTrailer(editor);

    expect(apiService.generateTrailerCandidate).toHaveBeenCalledOnceWith(42, 'Latest edited transcript', 'a'.repeat(64), false);
  });

  it('does not let a delayed render overwrite a newer transcript edit or approve its older revision', () => {
    const editor = component.episodesEditorState;
    const delayedRender = new Subject<TrailerCandidateReviewStatus>();
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42, { status: 'processing', progress: 20 })));
    apiService.generateTrailerCandidate.and.returnValue(delayedRender.asObservable());
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    component.onTrailerTranscriptChange(editor, 'Transcript submitted');
    component.generateTrailer(editor);
    component.onTrailerTranscriptChange(editor, 'Newer transcript edit');

    delayedRender.next(trailerCandidateStatus(42, {
      candidateId: 'older-render', status: 'ready', transcriptText: 'Transcript submitted',
    }));

    expect(component.getTrailerTranscript(editor)).toBe('Newer transcript edit');
    expect(component.canDecideTrailerCandidate(editor)).toBeFalse();
    expect(component.canGenerateTrailer(editor)).toBeTrue();
  });

  it('retries only the exact API-marked retryable candidate', () => {
    const editor = component.episodesEditorState;
    const retryable = trailerCandidateStatus(42, { status: 'retryable', progress: 42, errorCategory: 'render_failed' });
    apiService.getCurrentTrailerCandidate.and.returnValue(of(retryable));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    expect(component.canRetryTrailerGeneration(editor)).toBeTrue();

    component.retryTrailerGeneration(editor);

    expect(apiService.retryTrailerCandidate).toHaveBeenCalledOnceWith(42, retryable.candidateId, retryable.sourceFingerprint);
    expect(component.getTrailerCandidate(editor)?.candidateId).toBe(retryable.candidateId);
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42, { status: 'processing' })));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    expect(component.canRetryTrailerGeneration(editor)).toBeFalse();
    expect(apiService.retryTrailerCandidate).toHaveBeenCalledTimes(1);
    component.ngOnDestroy();
  });

  it('uses only the exact API-issued grant for the current ready candidate and clears it when currentness changes', () => {
    apiService.getCurrentTrailerCandidate.and.returnValues(
      of(trailerCandidateStatus(42)),
      of(trailerCandidateStatus(42, { isCurrent: false, status: 'stale' })),
    );
    const exactGrant = trailerCandidatePreviewGrant(42, 'candidate-42', 'B'.repeat(43));
    apiService.createTrailerCandidatePreviewGrant.and.returnValue(of(exactGrant));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });

    expect(apiService.createTrailerCandidatePreviewGrant).toHaveBeenCalledOnceWith(42, 'candidate-42');
    expect(component.getTrailerCandidatePreviewUrl(component.episodesEditorState)).toBe(`http://localhost:3000${exactGrant.previewUrl}`);

    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    expect(component.getTrailerCandidatePreviewUrl(component.episodesEditorState)).toBeNull();
    expect(apiService.createTrailerCandidatePreviewGrant).toHaveBeenCalledTimes(1);
    component.ngOnDestroy();
  });

  it('does not let a late preview grant from the previous editor bind to the active editor', () => {
    const oldGrant = new Subject<TrailerCandidatePreviewGrant>();
    const activeGrant = new Subject<TrailerCandidatePreviewGrant>();
    apiService.getCurrentTrailerCandidate.and.returnValues(of(trailerCandidateStatus(42)), of(trailerCandidateStatus(43)));
    apiService.createTrailerCandidatePreviewGrant.and.returnValues(oldGrant.asObservable(), activeGrant.asObservable());
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    component.startEdit({
      episodeId: 43, title: 'Episode 43', summary: 'Summary', pubDate: '2026-07-25T00:00:00.000Z', explicit: 'no',
    });

    oldGrant.next(trailerCandidatePreviewGrant(42));
    expect(component.getTrailerCandidatePreviewUrl(component.episodesEditorState)).toBeNull();
    activeGrant.next(trailerCandidatePreviewGrant(43));
    expect(component.getTrailerCandidatePreviewUrl(component.episodesEditorState)).toContain('/episodes/43/trailer-candidates/candidate-43/preview');
    component.ngOnDestroy();
  });

  it('clears the old preview as soon as trailer source replacement starts and reloads currentness after staging', () => {
    apiService.getCurrentTrailerCandidate.and.returnValues(
      of(trailerCandidateStatus(42)),
      of(trailerCandidateStatus(42, { isCurrent: false, status: 'stale' })),
    );
    apiService.uploadEpisodeTrailer.and.returnValue(of(new HttpResponse<Episode>({
      body: { episodeId: 42, trailerFileName: 'episodes/42/new-trailer.mp3' } as Episode,
    })));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    const editor = component.episodesEditorState;
    expect(component.getTrailerCandidatePreviewUrl(editor)).not.toBeNull();

    component.uploadMedia(editor, 'trailer', new File(['audio'], 'new-trailer.mp3', { type: 'audio/mpeg' }));
    expect(component.getTrailerCandidatePreviewUrl(editor)).toBeNull();
    expect(component.getTrailerCandidate(editor)?.isCurrent).toBeFalse();
    expect(apiService.createTrailerCandidatePreviewGrant).toHaveBeenCalledOnceWith(42, 'candidate-42');
    component.ngOnDestroy();
  });

  it('refreshes an expiring native preview grant without changing its candidate binding', fakeAsync(() => {
    let grantNumber = 0;
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42)));
    apiService.createTrailerCandidatePreviewGrant.and.callFake((episodeId, candidateId) => {
      grantNumber += 1;
      return of(trailerCandidatePreviewGrant(episodeId, candidateId, String.fromCharCode(64 + grantNumber).repeat(43), new Date(Date.now() + 15_000).toISOString()));
    });
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    const firstUrl = component.getTrailerCandidatePreviewUrl(component.episodesEditorState);
    tick(1000);
    const secondUrl = component.getTrailerCandidatePreviewUrl(component.episodesEditorState);

    expect(firstUrl).not.toBeNull();
    expect(secondUrl).not.toBe(firstUrl);
    expect(apiService.createTrailerCandidatePreviewGrant).toHaveBeenCalledTimes(2);
    expect(component.getTrailerCandidate(component.episodesEditorState)?.candidateId).toBe('candidate-42');
    component.ngOnDestroy();
    discardPeriodicTasks();
  }));

  it('ignores a delayed candidate response after switching to another episode editor', () => {
    const oldResponse = new Subject<TrailerCandidateReviewStatus>();
    const currentResponse = new Subject<TrailerCandidateReviewStatus>();
    apiService.getCurrentTrailerCandidate.and.returnValues(oldResponse.asObservable(), currentResponse.asObservable());
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary 42', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    component.startEdit({
      episodeId: 43, title: 'Episode 43', summary: 'Summary 43', pubDate: '2026-07-25T00:00:00.000Z', explicit: 'no',
    });

    oldResponse.next(trailerCandidateStatus(42));
    expect(component.getTrailerCandidate(component.episodesEditorState)).toBeNull();
    currentResponse.next(trailerCandidateStatus(43));
    expect(component.getTrailerCandidate(component.episodesEditorState)?.candidateId).toBe('candidate-43');
    component.ngOnDestroy();
  });

  it('exposes empty, loading, safe error, and populated candidate states', () => {
    apiService.getCurrentTrailerCandidate.and.returnValue(throwError(() => ({ status: 404 })));
    component.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    expect(component.getTrailerCandidate(component.episodesEditorState)).toBeNull();
    expect(component.getTrailerCandidateError(component.episodesEditorState)).toBe('');

    const pending = new Subject<TrailerCandidateReviewStatus>();
    apiService.getCurrentTrailerCandidate.and.returnValue(pending.asObservable());
    component.startEdit({
      episodeId: 43, title: 'Episode 43', summary: 'Summary', pubDate: '2026-07-25T00:00:00.000Z', explicit: 'no',
    });
    expect(component.isTrailerCandidateLoading(component.episodesEditorState)).toBeTrue();
    pending.error({ status: 500 });
    expect(component.isTrailerCandidateLoading(component.episodesEditorState)).toBeFalse();
    expect(component.getTrailerCandidateError(component.episodesEditorState)).toContain('could not be loaded');

    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(43)));
    component.startEdit({
      episodeId: 43, title: 'Episode 43', summary: 'Summary', pubDate: '2026-07-25T00:00:00.000Z', explicit: 'no',
    });
    expect(component.getTrailerCandidate(component.episodesEditorState)?.candidateId).toBe('candidate-43');
    component.ngOnDestroy();
  });

  it('preserves an operator summary edit when restored polling completes', () => {
    const response = new Subject<EpisodeGeneratedSummaryStatus>();
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(response.asObservable());
    const episode: Episode = {
      episodeId: 42,
      title: 'Episode 42',
      summary: 'Persisted summary',
      pubDate: '2026-07-24T00:00:00.000Z',
      explicit: 'no',
      transcriptStatus: 'done',
      summaryStatus: 'pending',
    };

    component.startEdit(episode);
    component.episodesEditorState.formModel.summary = 'Operator summary';
    component.onSummaryChange(component.episodesEditorState);
    response.next({
      status: 'done', summaryFileName: null, summaryUpdatedAt: null,
      summaryStartedAt: null, progress: 100, error: null, version: 1,
      promptVersion: null, provider: null, summaryText: 'Generated replacement',
    });

    expect(component.episodesEditorState.formModel.summary).toBe('Operator summary');
    expect(component.episodesEditorState.formModel.summaryManuallyEdited).toBeTrue();
    (component as unknown as { clearEpisodeGenerationPolling: () => void }).clearEpisodeGenerationPolling();
  });

  it('decides only the exact displayed candidate and loads API replacement truth by returned revision', () => {
    const revision = `episode:42:${'c'.repeat(64)}`;
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42)));
    apiService.decideTrailerCandidate.and.returnValue(of({
      status: 'approved', candidateId: 'candidate-42', episodeId: 42, version: 3,
      sourceFingerprint: 'a'.repeat(64), sourceRevision: revision,
    }));
    apiService.getTrailerReplacementStatus.and.returnValue(of(trailerReplacementStatus(42, { sourceRevision: revision })));
    spyOn(window, 'confirm').and.returnValue(true);
    component.startEdit({ episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no' });

    component.decideTrailerCandidate(component.episodesEditorState, 'approve');

    expect(apiService.decideTrailerCandidate).toHaveBeenCalledOnceWith(42, 'candidate-42', 'approve', 3, 'a'.repeat(64));
    expect(apiService.getTrailerReplacementStatus).toHaveBeenCalledOnceWith(42, revision);
    expect(component.getTrailerReplacementStatus(component.episodesEditorState)?.replacementComplete).toBeFalse();
    expect(component.getTrailerReplacementSummary(component.episodesEditorState)).toContain('separate Upload to YouTube action');
    expect(component.getTelegramReplacementLabel(component.episodesEditorState)).toContain('pending');
    expect(component.canDecideTrailerCandidate(component.episodesEditorState)).toBeFalse();
    component.ngOnDestroy();
  });

  it('keeps stale conflicts visibly disabled and never reports a failed decision as success', () => {
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42)));
    apiService.decideTrailerCandidate.and.returnValue(of({
      status: 'conflict', candidateId: 'candidate-42', episodeId: 42, version: 3,
      sourceFingerprint: 'a'.repeat(64), code: 'stale',
    }));
    spyOn(window, 'confirm').and.returnValue(true);
    component.startEdit({ episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no' });

    component.decideTrailerCandidate(component.episodesEditorState, 'approve');

    expect(component.getTrailerCandidate(component.episodesEditorState)?.isCurrent).toBeFalse();
    expect(component.canDecideTrailerCandidate(component.episodesEditorState)).toBeFalse();
    expect(component.getTrailerDecisionError(component.episodesEditorState)).toContain('no longer eligible');
    expect(component.getTrailerDecisionMessage(component.episodesEditorState)).toBe('');
    expect(apiService.getTrailerReplacementStatus).not.toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('confirms the exact Meta predecessor and leaves it incomplete when confirmation fails', () => {
    const revision = trailerReplacementStatus().sourceRevision;
    const status = trailerReplacementStatus();
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42)));
    apiService.decideTrailerCandidate.and.returnValue(of({
      status: 'approved', candidateId: 'candidate-42', episodeId: 42, version: 3,
      sourceFingerprint: 'a'.repeat(64), sourceRevision: revision,
    }));
    apiService.getTrailerReplacementStatus.and.returnValue(of(status));
    apiService.confirmTrailerPredecessorRetirement.and.returnValue(throwError(() => new Error('conflict')));
    spyOn(window, 'confirm').and.returnValue(true);
    component.startEdit({ episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no' });
    component.decideTrailerCandidate(component.episodesEditorState, 'approve');

    component.confirmTrailerPredecessorRetirement(component.episodesEditorState, 'instagram_reel');

    expect(apiService.confirmTrailerPredecessorRetirement).toHaveBeenCalledOnceWith(42, revision, 'instagram_reel', 'instagram-old');
    expect(component.getTrailerReplacementStatus(component.episodesEditorState)?.destinations.instagram_reel?.replacementComplete).toBeFalse();
    expect(component.getTrailerReplacementError(component.episodesEditorState)).toContain('exact predecessor remains incomplete');
    component.ngOnDestroy();
  });

  it('polls incomplete replacement status with a bounded timer and stops at API terminal completion', fakeAsync(() => {
    const revision = trailerReplacementStatus().sourceRevision;
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42)));
    apiService.decideTrailerCandidate.and.returnValue(of({
      status: 'approved', candidateId: 'candidate-42', episodeId: 42, version: 3,
      sourceFingerprint: 'a'.repeat(64), sourceRevision: revision,
    }));
    apiService.getTrailerReplacementStatus.and.returnValues(
      of(trailerReplacementStatus(42, { sourceRevision: revision })),
      of(trailerReplacementStatus(42, { sourceRevision: revision, status: 'complete', replacementComplete: true, telegram: { configured: true, status: 'complete', destinations: {} }, youtube: null })),
    );
    spyOn(window, 'confirm').and.returnValue(true);
    component.startEdit({ episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no' });
    component.decideTrailerCandidate(component.episodesEditorState, 'approve');
    expect(apiService.getTrailerReplacementStatus).toHaveBeenCalledTimes(1);

    tick(5000);

    expect(apiService.getTrailerReplacementStatus).toHaveBeenCalledTimes(2);
    expect(component.getTrailerReplacementStatus(component.episodesEditorState)?.replacementComplete).toBeTrue();
    tick(60_000);
    expect(apiService.getTrailerReplacementStatus).toHaveBeenCalledTimes(2);
    component.ngOnDestroy();
  }));
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
    trailerVideoFileName: 'episodes/42/trailer.mp4',
    coverFileName: 'cover-42.jpg',
    coverLowFileName: 'cover-42.webp',
    transcriptFileName: 'transcript-42.txt',
    guests: [],
  };

  const completedSnapshot = (overrides: Partial<EpisodeArtifactJobSnapshot> = {}): EpisodeArtifactJobSnapshot => ({
    jobId: 'job-42',
    episodeId: 42,
    requested: ['episode', 'trailer-video', 'image', 'image-low', 'transcript'],
    available: ['episode', 'trailer-video', 'image', 'image-low', 'transcript'],
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

  it('UI-03 and UI-04 render the six canonical options in order with finalized trailer-video availability', () => {
    component.openArtifactModal(episode);
    fixture.detectChanges();

    const options = Array.from(fixture.nativeElement.querySelectorAll('.artifact-option')) as HTMLElement[];
    expect(options.map((option) => option.querySelector('.artifact-option-label')?.textContent?.trim())).toEqual([
      'Episode audio .mp3',
      'Trailer .mp3',
      'Trailer video .mp4',
      'Cover art .jpg/.jpeg',
      'Low cover art .webp',
      'Transcript .txt',
    ]);
    const checkboxes = Array.from(fixture.nativeElement.querySelectorAll('.artifact-option input')) as HTMLInputElement[];
    expect(checkboxes.map((checkbox) => checkbox.checked)).toEqual([true, false, true, true, true, true]);
    expect(checkboxes[1].disabled).toBeTrue();
    expect(checkboxes[1].parentElement?.textContent).toContain('Unavailable — file not uploaded.');
    expect(checkboxes[0].parentElement?.querySelector('.artifact-option-filename')?.getAttribute('title')).toBe('episode-42.mp3');
    expect(checkboxes[2].disabled).toBeFalse();
    expect(checkboxes[2].parentElement?.querySelector('.artifact-option-filename')?.getAttribute('title')).toBe('episodes/42/trailer.mp4');
  });

  it('leaves trailer-video unavailable and excludes it for absent, null, and staged-like DTO state', () => {
    for (const candidate of [
      { trailerVideoFileName: undefined },
      { trailerVideoFileName: null },
      { trailerVideoFileName: undefined, trailerVideoSyncStatus: 'unpublished' as const },
    ]) {
      component.openArtifactModal({ ...episode, ...candidate });
      const trailerVideo = component.artifactOptions.find((option) => option.selector === 'trailer-video');
      expect(trailerVideo?.available).toBeFalse();
      expect(trailerVideo?.checked).toBeFalse();
      expect(trailerVideo?.tooltip).toBe('Unavailable — file not uploaded.');
      expect(component.artifactOptions.filter((option) => option.checked).map((option) => option.selector))
        .not.toContain('trailer-video');
    }
  });

  it('UI-05 validates an empty selection and submits only checked canonical selectors', () => {
    component.openArtifactModal(episode);
    fixture.detectChanges();
    component.artifactOptions.forEach((option) => option.checked = false);
    component.confirmArtifactJob();
    expect(apiService.startEpisodeArtifactJob).not.toHaveBeenCalled();
    expect(component.artifactModalMessage).toContain('Select at least one');

    component.artifactOptions[0].checked = true;
    component.artifactOptions[3].checked = true;
    apiService.startEpisodeArtifactJob.and.returnValue(of(completedSnapshot({ state: 'pending', progress: 0 })));
    component.confirmArtifactJob();
    expect(apiService.startEpisodeArtifactJob).toHaveBeenCalledOnceWith(42, ['episode', 'image']);
  });

  it('submits the exact trailer-video selector and delivers a completed mixed artifact through the generic path', () => {
    const snapshot = completedSnapshot({
      requested: ['episode', 'trailer-video'],
      available: ['episode', 'trailer-video'],
    });
    apiService.startEpisodeArtifactJob.and.returnValue(of(snapshot));

    component.openArtifactModal(episode);
    component.artifactOptions.forEach((option) => option.checked = option.selector === 'trailer-video');
    component.confirmArtifactJob();

    expect(apiService.startEpisodeArtifactJob).toHaveBeenCalledOnceWith(42, ['trailer-video']);
    expect(apiService.downloadEpisodeArtifact).toHaveBeenCalledOnceWith(snapshot.downloadUrl as string);
  });

  it('marks finalized trailer-video unavailable after a backend no-final-file preflight rejection without inventing a URL', () => {
    apiService.startEpisodeArtifactJob.and.returnValue(throwError(() => ({ status: 404 })));
    component.openArtifactModal(episode);
    component.artifactOptions.forEach((option) => option.checked = option.selector === 'trailer-video');

    component.confirmArtifactJob();

    const trailerVideo = component.artifactOptions.find((option) => option.selector === 'trailer-video');
    expect(trailerVideo?.available).toBeFalse();
    expect(trailerVideo?.checked).toBeFalse();
    expect(component.artifactModalMessage).toContain('No selected files are currently available');
    expect(component.artifactJob?.downloadUrl).not.toBeDefined();
    expect(apiService.downloadEpisodeArtifact).not.toHaveBeenCalled();
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

describe('ManageComponent YouTube lifecycle RED scaffold', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let component: ManageComponent;

  beforeEach(() => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'listEpisodes', 'startYoutubeTrailerJob', 'getCurrentYoutubeTrailerJob',
      'getYoutubeTrailerJobStatus', 'retryYoutubeTrailerJob', 'cancelYoutubeTrailerJob',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    component = new ManageComponent(apiService);
    component.addEditorState.formModel.episodeNumber = 42;
  });

  const snapshot = (overrides: Partial<YoutubeTrailerJobSnapshot> = {}): YoutubeTrailerJobSnapshot => ({
    jobId: 'job-42',
    episodeId: 42,
    status: 'queued',
    progress: { confirmedBytes: 0, totalBytes: 100, processingPartsProcessed: null, processingPartsTotal: null, processingTimeLeftMs: null },
    cancellation: { requestedAt: null, cancelledAt: null, boundary: null },
    error: { category: null, occurredAt: null },
    retry: { count: 0, nextAttemptAt: null },
    createdAt: '2026-08-11T00:00:00Z',
    updatedAt: '2026-08-11T00:00:00Z',
    completedAt: null,
    privateWatchUrl: null,
    ...overrides,
  });

  it('starts only the finalized trailer with the current title and summary', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/trailer.mp4';
    editor.formModel.title = 'Selected title';
    editor.formModel.summary = 'Selected summary';

    expect((component as unknown as { startYoutubeTrailerJob: (target: typeof editor) => void }).startYoutubeTrailerJob)
      .toEqual(jasmine.any(Function));
  });

  it('maps transfer, processing, private-ready, failed, and retained-private states truthfully', () => {
    const mapStatus = (component as unknown as {
      getYoutubeTrailerJobStatusLabel: (snapshot: { status: string; cancellation: { boundary: string | null } }) => string;
    }).getYoutubeTrailerJobStatusLabel;

    expect(mapStatus({ status: 'transferring', cancellation: { boundary: null } })).toContain('Uploading');
    expect(mapStatus({ status: 'processing', cancellation: { boundary: null } })).toContain('Processing');
    expect(mapStatus({ status: 'ready', cancellation: { boundary: null } })).toContain('Private');
    expect(mapStatus({ status: 'cancelled', cancellation: { boundary: 'provider-video-retained' } })).toContain('Reconciliation');
  });

  it('defines reload recovery, retry/cancel boundaries, polling teardown, and stale-source protection', () => {
    const lifecycle = component as unknown as Record<string, unknown>;
    expect(lifecycle['restoreCurrentYoutubeTrailerJob']).toEqual(jasmine.any(Function));
    expect(lifecycle['retryYoutubeTrailerJob']).toEqual(jasmine.any(Function));
    expect(lifecycle['cancelYoutubeTrailerJob']).toEqual(jasmine.any(Function));
    expect(lifecycle['clearYoutubeTrailerJobPolling']).toEqual(jasmine.any(Function));
    expect(lifecycle['youtubeTrailerJobSourceGeneration']).toBeDefined();
    expect(lifecycle['publishYoutubeTrailer']).toBeUndefined();
  });

  it('sends current metadata once and polls the returned job', fakeAsync(() => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/trailer.mp4';
    editor.formModel.title = 'Title';
    editor.formModel.summary = 'Summary';
    editor.formModel.hashtags = '#rpg';
    (component as any).setTrailerVideoState(editor, { status: 'finalized', episodeId: 42 });
    apiService.startYoutubeTrailerJob.and.returnValue(of(snapshot()));
    apiService.getYoutubeTrailerJobStatus.and.returnValue(of(snapshot({ status: 'transferring', progress: { confirmedBytes: 25, totalBytes: 100, processingPartsProcessed: null, processingPartsTotal: null, processingTimeLeftMs: null } })));

    component.startYoutubeTrailerJob(editor);
    tick();

    expect(apiService.startYoutubeTrailerJob).toHaveBeenCalledOnceWith(42, 'Trailer - DC 42 - Title', 'Summary', null, ['#rpg']);
    expect(component.getYoutubeTrailerJobProgress(editor)).toBe(25);
    component.clearYoutubeTrailerJobPolling(editor);
    discardPeriodicTasks();
  }));

  it('ignores duplicate starts while the first request is in flight', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/trailer.mp4';
    editor.formModel.title = 'Title';
    editor.formModel.summary = 'Summary';
    (component as any).setTrailerVideoState(editor, { status: 'finalized', episodeId: 42 });
    const pending = new Subject<YoutubeTrailerJobSnapshot>();
    apiService.startYoutubeTrailerJob.and.returnValue(pending.asObservable());
    apiService.getYoutubeTrailerJobStatus.and.returnValue(of(snapshot()));

    component.startYoutubeTrailerJob(editor);
    component.startYoutubeTrailerJob(editor);

    expect(apiService.startYoutubeTrailerJob).toHaveBeenCalledTimes(1);
    pending.next(snapshot());
  });

  it('recovers current jobs and preserves retained-private cancellation guidance', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/trailer.mp4';
    const retained = snapshot({
      status: 'cancelled',
      cancellation: { requestedAt: '2026-08-11T00:00:00Z', cancelledAt: '2026-08-11T00:01:00Z', boundary: 'provider-video-retained' },
      privateWatchUrl: 'https://youtu.be/private-42',
    });
    apiService.getCurrentYoutubeTrailerJob.and.returnValue(of(retained));

    component.restoreCurrentYoutubeTrailerJob(editor);

    expect(component.getYoutubeTrailerJobStatusLabel(retained)).toContain('Reconciliation');
    expect(component.getYoutubeTrailerJobPrivateWatchUrl(editor)).toBe('https://youtu.be/private-42');
  });

  it('cancels the durable job without polling and keeps the returned boundary visible', fakeAsync(() => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/trailer.mp4';
    (component as any).setTrailerVideoState(editor, { status: 'finalized', episodeId: 42 });
    const queued = snapshot();
    const cancelled = snapshot({ status: 'cancelled', cancellation: { requestedAt: '2026-08-11T00:00:00Z', cancelledAt: '2026-08-11T00:01:00Z', boundary: 'local-cancelled' } });
    apiService.startYoutubeTrailerJob.and.returnValue(of(queued));
    apiService.getYoutubeTrailerJobStatus.and.returnValue(of(queued));
    apiService.cancelYoutubeTrailerJob.and.returnValue(of(cancelled));
    editor.formModel.title = 'Title';
    editor.formModel.summary = 'Summary';
    component.startYoutubeTrailerJob(editor);
    tick();
    component.cancelYoutubeTrailerJob(editor);

    expect(apiService.cancelYoutubeTrailerJob).toHaveBeenCalledOnceWith(42, 'job-42');
    expect(component.getYoutubeTrailerJobStatusLabel(cancelled)).toContain('Canceled');
  }));
});

describe('ManageComponent trailer video lifecycle', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let component: ManageComponent;

  beforeEach(() => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'listEpisodes', 'reserveEpisodeDraft', 'uploadEpisodeTrailerVideo', 'createEpisode',
      'getEpisodeTranscriptionStatus', 'getEpisodeGeneratedSummaryStatus', 'startEpisodeArtifactJob',
      'getEpisodeArtifactJobStatus', 'downloadEpisodeArtifact', 'startYoutubeTrailerJob',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    apiService.startYoutubeTrailerJob.and.returnValue(of());
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
    apiService.uploadEpisodeTrailerVideo.and.returnValues(first.asObservable(), second.asObservable());
    const editor = component.episodesEditorState;
    editor.formModel.episodeId = 42;
    editor.editingEpisodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/old.mp4';

    component.uploadMedia(editor, 'trailerVideo', new File(['a'], 'a.mp4', { type: 'video/mp4' }));
    component.uploadMedia(editor, 'trailerVideo', new File(['b'], 'b.mp4', { type: 'video/mp4' }));
    expect(apiService.reserveEpisodeDraft).not.toHaveBeenCalled();
    expect(apiService.uploadEpisodeTrailerVideo.calls.allArgs()).toEqual([
      [42, null, jasmine.any(File)],
      [42, null, jasmine.any(File)],
    ]);
    first.next({ type: HttpEventType.UploadProgress, loaded: 100, total: 100 });
    first.next(staged('episodes/42/a.mp4'));
    expect(component.getUploadFilename(editor, 'trailerVideo')).toBe('episodes/42/old.mp4');
    expect(editor.formModel.trailerVideoFileName).toBe('episodes/42/old.mp4');
    second.next(staged('episodes/42/b.mp4'));
    expect(component.getTrailerVideoStatus(editor)).toBe('staged');
    expect(editor.formModel.trailerVideoFileName).toBe('episodes/42/old.mp4');
  });

  it('uses the authenticated persisted replacement path without reserving a draft', () => {
    const upload = new Subject<any>();
    const editor = component.episodesEditorState;
    editor.formModel.episodeId = 42;
    editor.editingEpisodeId = 42;
    editor.formModel.trailerVideoFileName = 'episodes/42/old.mp4';
    apiService.uploadEpisodeTrailerVideo.and.returnValue(upload.asObservable());

    component.uploadMedia(editor, 'trailerVideo', new File(['new'], 'new.mp4', { type: 'video/mp4' }));

    expect(apiService.reserveEpisodeDraft).not.toHaveBeenCalled();
    expect(apiService.uploadEpisodeTrailerVideo).toHaveBeenCalledOnceWith(42, null, jasmine.any(File));
    upload.next(new HttpResponse({
      body: {
        episodeId: 42,
        draftId: null,
        state: 'finalized',
        trailerVideoFileName: 'episodes/42/trailer.mp4',
        trailerVideoSyncStatus: 'manual-sync-required',
        message: 'Trailer video finalized.',
      },
    }));

    expect(component.getTrailerVideoStatus(editor)).toBe('finalized');
    expect(editor.formModel.trailerVideoFileName).toBe('episodes/42/trailer.mp4');
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
    expect(component.getTrailerVideoStatus(editor)).toBe('canceled');
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
      'getEpisodeArtifactJobStatus', 'downloadEpisodeArtifact', 'getCurrentTrailerCandidate',
      'createTrailerCandidatePreviewGrant', 'generateTrailerCandidate', 'retryTrailerCandidate', 'startYoutubeTrailerJob',
      'decideTrailerCandidate', 'getTrailerReplacementStatus', 'confirmTrailerPredecessorRetirement',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    apiService.getCurrentTrailerCandidate.and.returnValue(throwError(() => ({ status: 404 })));
    apiService.createTrailerCandidatePreviewGrant.and.callFake((episodeId, candidateId) => of(trailerCandidatePreviewGrant(episodeId, candidateId)));
    apiService.decideTrailerCandidate.and.callFake((episodeId, candidateId, decision, version, sourceFingerprint) => of({
      status: decision === 'approve' ? 'approved' : 'rejected', candidateId, episodeId, version, sourceFingerprint,
      ...(decision === 'approve' ? { sourceRevision: trailerReplacementStatus(episodeId).sourceRevision } : {}),
    }));
    apiService.getTrailerReplacementStatus.and.callFake((episodeId) => of(trailerReplacementStatus(episodeId)));
    apiService.confirmTrailerPredecessorRetirement.and.callFake((episodeId, sourceRevision, destination, predecessorRemoteId) => of({
      status: 'confirmed', sourceRevision, destination,
      predecessor: { remoteId: predecessorRemoteId, permalink: 'https://example.test/old' },
      successor: { remoteId: 'successor', permalink: 'https://example.test/new' },
      retirementStatus: 'confirmed_manually', retirementActorEmail: 'operator@example.test', retirementConfirmedAt: new Date().toISOString(), replacementComplete: false,
    }));
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

  it('renders the exact three trailer actions in order and keeps YouTube disabled until an MP4 is staged', () => {
    const cards = Array.from(fixture.nativeElement.querySelectorAll('.upload-card')) as HTMLElement[];
    const card = cards.find((candidate) => Boolean(candidate.textContent?.includes('Trailer video')));
    expect(card).not.toBeNull();
    if (!card) {
      fail('Trailer video card was not rendered.');
    }
    const renderedCard = card as HTMLElement;
    expect(renderedCard.textContent).toContain('.mp4');
    expect(renderedCard.querySelector('input')?.getAttribute('accept')).toBe('.mp4,video/mp4');
    const actionButtons = Array.from(renderedCard.querySelectorAll('.trailer-actions button')) as HTMLButtonElement[];
    expect(actionButtons.map((button) => button.textContent?.trim())).toEqual([
      'Choose or replace MP4', 'Generate trailer', 'Upload to YouTube',
    ]);
    expect(actionButtons[2].disabled).toBeTrue();
    expect(renderedCard.querySelector('label[for^="trailer-transcript-"]')?.textContent?.trim()).toBe('Trailer transcript');
    expect(renderedCard.textContent).toContain('Upload to YouTube becomes available after an MP4 is staged.');
    expect(renderedCard.textContent).not.toContain('Publish');
  });

  it('renders an explicit empty state without implying preview or destination success', () => {
    const empty = fixture.nativeElement.querySelector('[data-trailer-empty-state]') as HTMLElement;
    expect(empty).not.toBeNull();
    expect(empty.querySelector('h3')?.textContent?.trim()).toBe('No trailer candidate to review');
    expect(empty.textContent).toContain('Upload the cover and trailer audio to start automatic generation');
    expect(empty.textContent).toContain('choose an MP4 to stage a finished trailer');
    expect(fixture.nativeElement.querySelector('[data-trailer-candidate-preview]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-trailer-replacement]')).toBeNull();
  });

  it('renders populated provenance, a long editable transcript, independent destinations, and narrow-width wrapping', async () => {
    const longTranscript = `${'Dragon Careca trailer words '.repeat(1500)}ending`;
    const longId = `remote-${'identifier-'.repeat(30)}`;
    const defaults = trailerReplacementStatus(42);
    const status = trailerReplacementStatus(42, {
      destinations: {
        instagram_reel: {
          ...defaults.destinations.instagram_reel!,
          predecessor: { remoteId: longId, permalink: `https://example.test/${'old-link-'.repeat(30)}` },
        },
        facebook_native_video: defaults.destinations.facebook_native_video!,
      },
    });
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42, { transcriptText: longTranscript })));
    apiService.getTrailerReplacementStatus.and.returnValue(of(status));
    spyOn(window, 'confirm').and.returnValue(true);
    manage.startEdit({ episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no' });
    fixture.componentInstance.editor = manage.episodesEditorState;
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const card = (Array.from(fixture.nativeElement.querySelectorAll('.upload-card')) as HTMLElement[])
      .find((candidate) => candidate.textContent?.includes('Trailer video')) as HTMLElement;
    expect(card).toBeTruthy();
    expect(manage.getTrailerCandidate(manage.episodesEditorState)?.transcriptText).toBe(longTranscript);
    expect(manage.getTrailerTranscript(manage.episodesEditorState)).toBe(longTranscript);
    const transcript = card.querySelector('.trailer-transcript') as HTMLTextAreaElement;
    expect(transcript.value).toBe(longTranscript);
    expect(transcript.rows).toBe(5);
    expect(transcript.getAttribute('aria-describedby')).toContain('trailer-transcript-status-42');
    expect(card.textContent).toContain('Version 3');
    expect(card.textContent).toContain('1:38');
    expect(card.textContent).toContain('1280×1280');
    expect(card.textContent).toContain('Profile dc-square-waveform r2');
    expect(card.querySelector('[data-approve-trailer]')).not.toBeNull();
    expect(card.querySelector('[data-reject-trailer]')).not.toBeNull();
    expect(getComputedStyle(card.querySelector('[data-approve-trailer]') as HTMLElement).minHeight).toBe('44px');

    manage.decideTrailerCandidate(manage.episodesEditorState, 'approve');
    fixture.detectChanges();
    expect(card.querySelector('[data-destination="instagram_reel"]')?.textContent).toContain(longId);
    expect(card.querySelector('[data-destination="telegram"]')?.textContent).toContain('pending');
    expect(card.querySelector('[data-destination="telegram"]')?.textContent).toContain('existing early-access link and topic stay unchanged');
    expect(card.querySelector('[data-destination="youtube"]')?.textContent).toContain('separate manual action');
    expect(card.textContent).toContain('Waiting for the separate Upload to YouTube action.');
    expect(card.querySelectorAll('.trailer-status-action').length).toBe(1);
    expect(card.querySelector('video')?.getAttribute('aria-label')).toContain('candidate version 3');
    expect(getComputedStyle(card.querySelector('.trailer-destination a') as HTMLAnchorElement).overflowWrap).toBe('anywhere');

    fixture.nativeElement.style.width = '320px';
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(getComputedStyle(card.querySelector('.trailer-actions') as HTMLElement).flexWrap).toBe('wrap');
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    manage.ngOnDestroy();
  });

  it('announces candidate loading politely and exposes safe retryable errors as alerts', () => {
    const pending = new Subject<TrailerCandidateReviewStatus>();
    apiService.getCurrentTrailerCandidate.and.returnValue(pending.asObservable());
    manage.startEdit({ episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no' });
    fixture.componentInstance.editor = manage.episodesEditorState;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading generated trailer status');
    expect(fixture.nativeElement.querySelector('.trailer-candidate-review')?.getAttribute('aria-live')).toBe('polite');

    pending.next(trailerCandidateStatus(42, {
      status: 'retryable', progress: -1, errorCategory: 'render_failed',
      errorMessage: 'Rendering failed safely. Retry trailer generation or choose an MP4.',
    }));
    pending.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Retry trailer generation');
    expect(fixture.nativeElement.querySelector('[data-retry-trailer-generation]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-trailer-candidate-preview]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Choose or replace MP4');
    manage.ngOnDestroy();
  });

  it('stages a manual MP4 without starting YouTube and starts transfer only on button action', () => {
    const editor = manage.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.title = 'Episode title';
    editor.formModel.episodeNumber = 42;
    apiService.reserveEpisodeDraft.and.returnValue(of({ draftId: 'draft-manual-42', episodeId: 42, state: 'reserved', expiresAt: '2026-09-14T00:00:00Z' }));
    apiService.uploadEpisodeTrailerVideo.and.returnValue(of(new HttpResponse<EpisodeTrailerVideoUploadResponse>({
      body: { episodeId: 42, draftId: 'draft-manual-42', state: 'staged', trailerVideoFileName: null, message: 'Trailer video staged.' },
    })));
    apiService.startYoutubeTrailerJob.and.returnValue(new Subject<YoutubeTrailerJobSnapshot>().asObservable());
    fixture.componentInstance.editor = editor;

    manage.uploadMedia(editor, 'trailerVideo', new File(['mp4'], 'manual.mp4', { type: 'video/mp4' }));
    fixture.detectChanges();

    expect(manage.getTrailerVideoStatus(editor)).toBe('staged');
    expect(apiService.startYoutubeTrailerJob).not.toHaveBeenCalled();
    const youtubeButton = fixture.nativeElement.querySelector('[data-upload-to-youtube]') as HTMLButtonElement;
    expect(youtubeButton.disabled).toBeFalse();
    youtubeButton.click();
    expect(apiService.startYoutubeTrailerJob).toHaveBeenCalledOnceWith(42, 'Trailer - DC 42 - Episode title', '', 'draft-manual-42', []);
    manage.ngOnDestroy();
  });

  it('renders the exact private API URL in native controls and direct link with accessible candidate context', () => {
    const editor = manage.episodesEditorState;
    apiService.getCurrentTrailerCandidate.and.returnValue(of(trailerCandidateStatus(42)));
    manage.startEdit({
      episodeId: 42, title: 'Episode 42', summary: 'Summary', pubDate: '2026-07-24T00:00:00.000Z', explicit: 'no',
    });
    fixture.componentInstance.editor = editor;
    fixture.detectChanges();

    const video = fixture.nativeElement.querySelector('[data-trailer-candidate-preview] video') as HTMLVideoElement;
    const link = fixture.nativeElement.querySelector('[data-trailer-candidate-preview] a') as HTMLAnchorElement;
    const expectedUrl = `http://localhost:3000${trailerCandidatePreviewGrant().previewUrl}`;
    expect(video).not.toBeNull();
    expect(video.controls).toBeTrue();
    expect(video.src).toBe(expectedUrl);
    expect(video.getAttribute('aria-label')).toContain('episode 42, candidate version 3');
    expect(video.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(link.href).toBe(expectedUrl);
    expect(link.rel).toContain('noreferrer');
    expect(apiService.createTrailerCandidatePreviewGrant).toHaveBeenCalledOnceWith(42, 'candidate-42');
    expect(fixture.nativeElement.textContent).toContain('Choose or replace MP4');
    fixture.componentInstance.controller.ngOnDestroy();
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

  it('renders Duration and Bytes as scoped native readonly metadata fields', () => {
    const fields = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    const duration = fields.find((field) => field.previousElementSibling?.textContent?.trim() === 'Duration');
    const bytes = fields.find((field) => field.previousElementSibling?.textContent?.trim() === 'Bytes');
    const spotifyId = fields.find((field) => field.previousElementSibling?.textContent?.trim() === 'Spotify ID');

    expect(duration).not.toBeUndefined();
    expect(bytes).not.toBeUndefined();
    expect(duration?.readOnly).toBeTrue();
    expect(bytes?.readOnly).toBeTrue();
    expect(duration?.classList.contains('readonly-metadata-field')).toBeTrue();
    expect(bytes?.classList.contains('readonly-metadata-field')).toBeTrue();
    expect(fixture.nativeElement.querySelector('.form-group:has(input[readonly])')?.textContent).not.toContain('hint');
    expect(spotifyId?.classList.contains('readonly-metadata-field')).toBeFalse();

    const styles = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .join('\n')
      .replace(/\s+/g, '');
    expect(styles).toContain('.readonly-metadata-field');
    expect(styles).toContain('background-color:#dee2e6');
    expect(styles).toContain('border-color:#adb5bd');
    expect(styles).toContain('color:#495057');
    expect(styles).toContain('cursor:default');
    expect(styles).toContain(':focus');
    expect(styles).toContain('box-shadow:none');
  });
});

describe('Phase 8.1 RED form contracts FORM-01 through FORM-05', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let component: ManageComponent;

  beforeEach(() => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'listEpisodes',
      'listStructuredEntryCatalog',
      'uploadEpisodeAudio',
      'uploadEpisodeTrailer',
      'getEpisodeTranscriptionStatus',
      'getEpisodeGeneratedSummaryStatus',
    ]);
    apiService.listEpisodes.and.returnValue(of([]));
    apiService.listStructuredEntryCatalog.and.returnValue(of({ guests: [], musicCredits: [] }));
    apiService.getEpisodeTranscriptionStatus.and.returnValue(of({
      status: 'processing',
      transcriptFileName: null,
      transcriptUpdatedAt: null,
      transcriptStartedAt: null,
      progress: 0,
      transcriptError: null,
      provider: null,
    }));
    apiService.getEpisodeGeneratedSummaryStatus.and.returnValue(of({
      status: 'idle',
      summaryFileName: null,
      summaryUpdatedAt: null,
      summaryStartedAt: null,
      progress: null,
      error: null,
      version: null,
      promptVersion: null,
      provider: null,
    }));
    component = new ManageComponent(apiService);
  });

  it('FORM-01/D-01 preserves the latest publication local clock while adding seven calendar days', () => {
    const compute = (component as unknown as { computeSuggestedNextPubDate: (episodes: Episode[]) => string })
      .computeSuggestedNextPubDate.bind(component);
    const latest = '2026-01-31T13:45:00';

    expect(compute([{ episodeId: 1, title: 'Latest', summary: '', pubDate: latest, explicit: 'no' }]))
      .toBe('2026-02-07T13:45');
  });

  it('FORM-01/D-02/D-03 falls back safely to the current local datetime for empty and invalid lists', () => {
    jasmine.clock().install();
    const now = new Date(2026, 4, 6, 9, 10, 11);
    jasmine.clock().mockDate(now);
    const compute = (component as unknown as { computeSuggestedNextPubDate: (episodes: Episode[]) => string })
      .computeSuggestedNextPubDate.bind(component);

    expect(compute([])).toBe('2026-05-06T09:10');
    expect(compute([{ episodeId: 2, title: 'Broken date', summary: '', pubDate: 'not-a-date', explicit: 'no' }]))
      .toBe('2026-05-06T09:10');
    jasmine.clock().uninstall();
  });

  it('FORM-02/D-04/D-05/D-06/D-08 maps only backend-confirmed audio metadata and rejects missing metadata', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    const audio = new File(['browser bytes'], 'episode.mp3', { type: 'audio/mpeg' });
    apiService.uploadEpisodeAudio.and.returnValue(of(new HttpResponse<Episode>({
      body: {
        episodeId: 42,
        title: 'Episode',
        summary: '',
        pubDate: '2026-05-06T09:10:00.000Z',
        explicit: 'no',
        fileName: 'episodes/42/episode.mp3',
        duration: '01:02:03',
        bytes: 1234567,
      },
    })));

    component.uploadMedia(editor, 'audio', audio);

    expect(editor.formModel.duration).toBe('01:02:03');
    expect(editor.formModel.bytes).toBe(1234567);
    expect(editor.formModel.bytes).not.toBe(audio.size);

    apiService.uploadEpisodeAudio.and.returnValue(of(new HttpResponse<Episode>({
      body: {
        episodeId: 42,
        title: 'Episode',
        summary: '',
        pubDate: '2026-05-06T09:10:00.000Z',
        explicit: 'no',
        fileName: 'episodes/42/episode.mp3',
      },
    })));
    component.uploadMedia(editor, 'audio', audio);
    expect(component.errorMessage).toContain('metadata');
  });

  it('retains the selected audio file and exposes Try again after transcription failure', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.transcriptStatus = 'error';
    const audio = new File(['browser bytes'], 'episode.mp3', { type: 'audio/mpeg' });
    apiService.uploadEpisodeAudio.and.returnValue(of(new HttpResponse<Episode>({
      body: {
        episodeId: 42,
        title: 'Episode',
        summary: '',
        pubDate: '2026-05-06T09:10:00.000Z',
        explicit: 'no',
        fileName: 'episodes/42/episode.mp3',
        duration: '01:02:03',
        bytes: 1234567,
      },
    })));

    component.uploadMedia(editor, 'audio', audio);
    editor.formModel.transcriptStatus = 'error';

    expect(component.canRetryUpload(editor, 'audio')).toBeTrue();
    component.retryUpload(editor, 'audio');
    expect(apiService.uploadEpisodeAudio).toHaveBeenCalledTimes(2);
    expect(apiService.uploadEpisodeAudio.calls.mostRecent().args[1]).toBe(audio);
  });

  it('offers Whisper fallback after a Gemini transcription failure', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.transcriptStatus = 'error';
    const whisperSpy = jasmine.createSpy('transcribeEpisodeWithWhisper').and.returnValue(of({
      episodeId: 42,
      queued: true,
      version: 4,
      status: 'pending',
      progress: 0,
      transcriptError: null,
      message: 'Whisper transcription started.',
    }));
    apiService.transcribeEpisodeWithWhisper = whisperSpy;
    apiService.getEpisodeTranscriptionStatus.and.returnValue(of({
      status: 'processing',
      transcriptFileName: null,
      transcriptUpdatedAt: null,
      transcriptStartedAt: new Date().toISOString(),
      progress: 0,
      transcriptError: null,
      provider: null,
    }));

    expect(component.canTranscribeWithWhisper(editor)).toBeTrue();
    component.transcribeWithWhisper(editor);

    expect(whisperSpy).toHaveBeenCalledWith(42);
    expect(editor.formModel.transcriptStatus).toBe('processing');
    expect(component.canTranscribeWithWhisper(editor)).toBeFalse();
  });

  it('shows the active Groq provider during automatic transcription fallback', () => {
    const editor = component.addEditorState;
    editor.formModel.transcriptStatus = 'processing';
    editor.formModel.transcriptProvider = 'groq';
    editor.formModel.transcriptProgress = 42;

    expect(component.getTranscriptionStatus(editor)).toContain('Groq');
    expect(component.getTranscriptionStatus(editor)).toContain('42%');
  });

  it('FORM-02/D-04 keeps trailer-audio mapping filename-only', () => {
    const editor = component.addEditorState;
    editor.formModel.episodeId = 42;
    editor.formModel.duration = '00:10:00';
    editor.formModel.bytes = 1000000;
    apiService.uploadEpisodeTrailer.and.returnValue(of(new HttpResponse<Episode>({
      body: {
        episodeId: 42,
        title: 'Episode',
        summary: '',
        pubDate: '2026-05-06T09:10:00.000Z',
        explicit: 'no',
        trailerFileName: 'episodes/42/trailer.mp3',
        duration: '99:99:99',
        bytes: 9999999,
      },
    })));

    component.uploadMedia(editor, 'trailer', new File(['trailer'], 'trailer.mp3', { type: 'audio/mpeg' }));

    expect(editor.formModel.trailerFileName).toBe('episodes/42/trailer.mp3');
    expect(editor.formModel.duration).toBe('00:10:00');
    expect(editor.formModel.bytes).toBe(1000000);
  });

  it('ships the required participant defaults in every frontend environment', () => {
    const expectedDefaults = ['Jhonatt Lima', 'Diego Broniszak', 'Eric Farias', 'Gabriel Moraes'];

    expect(developmentEnvironment.defaultParticipants).toEqual(expectedDefaults);
    expect(stagingEnvironment.defaultParticipants).toEqual(expectedDefaults);
    expect(productionEnvironment.defaultParticipants).toEqual(expectedDefaults);
  });

  it('FORM-03/D-09/D-10 selects known configured participants and never overwrites an active edit', () => {
    const editor = component.addEditorState;
    editor.editingEpisodeId = null;
    editor.selectedMembers = [];
    (component as unknown as { configuredParticipantNames: string[] }).configuredParticipantNames = [
      ...developmentEnvironment.defaultParticipants,
    ];
    (component as unknown as { applyConfiguredParticipantDefaults: (target: typeof editor) => void })
      .applyConfiguredParticipantDefaults(editor);

    expect(editor.selectedMembers).toEqual(developmentEnvironment.defaultParticipants);

    editor.editingEpisodeId = 42;
    editor.selectedMembers = ['Diego Broniszak'];
    (component as unknown as { configuredParticipantNames: string[] }).configuredParticipantNames = [
      ...developmentEnvironment.defaultParticipants,
      'Unknown configured participant',
    ];
    (component as unknown as { applyConfiguredParticipantDefaults: (target: typeof editor) => void })
      .applyConfiguredParticipantDefaults(editor);
    expect(editor.selectedMembers).toEqual(['Diego Broniszak']);
  });

  it('FORM-04/D-11 requires a trimmed music name and at least one trimmed non-empty reference URL', () => {
    const editor = component.addEditorState;
    editor.formModel.transcriptStatus = 'idle';
    editor.formModel.musicCredits[0].name = '  ';
    editor.formModel.musicCredits[0].links = [{ label: 'Spotify', url: ' https://example.test/song ' }];
    expect(component.isEpisodeSaveDisabled(editor)).toBeTrue();

    editor.formModel.musicCredits[0].name = '  Song  ';
    editor.formModel.musicCredits[0].links = [{ label: 'Spotify', url: '   ' }];
    expect(component.isEpisodeSaveDisabled(editor)).toBeTrue();

    editor.formModel.musicCredits[0].name = '  Song  ';
    editor.formModel.musicCredits[0].links = [{ label: 'Spotify', url: ' https://example.test/song ' }];
    expect(component.isEpisodeSaveDisabled(editor)).toBeFalse();
  });

  it('FORM-05/D-07 exposes fixed two-decimal decimal-MB presentation at exact and fractional byte boundaries', () => {
    const format = (component as unknown as { formatBytesAsMegabytes: (bytes: number) => string })
      .formatBytesAsMegabytes.bind(component);

    expect(format(0)).toBe('0.00 MB');
    expect(format(1000000)).toBe('1.00 MB');
    expect(format(1234567)).toBe('1.23 MB');
    expect(format(1235000)).toBe('1.24 MB');
  });

  it('normalizes ordered caption mentions and hashtags and renders truthful preview text', () => {
    const editor = component.addEditorState;
    editor.formModel.title = 'Episode';
    editor.formModel.summary = 'Summary';
    editor.formModel.instagramCaptionMentions = [' @Host ', '@host', 'invalid handle'];
    editor.formModel.instagramHashtags = [' #Tema ', '#tema', '#RPG'];
    expect(component.buildPayload(editor).instagramCaptionMentions).toEqual(['@host']);
    expect(component.buildPayload(editor).instagramHashtags).toEqual(['#tema', '#rpg']);
    expect(component.getInstagramCaptionPreview(editor)).toContain('@host');
    expect(component.getInstagramCaptionPreview(editor)).toContain('#tema');
  });
});
