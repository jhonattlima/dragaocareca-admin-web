import { Component, OnInit } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ApiService, Episode, EpisodeWriteInput, StructuredEntryCatalogResponse } from '../../core/api.service';

type EpisodeListField = 'coverCredits' | 'tags';
type UploadKind = 'audio' | 'trailer' | 'cover' | 'coverLow';
type ManageTab = 'add' | 'episodes';

interface MemberOption {
  name: string;
  character: string;
}

interface LinkItem {
  label: string;
  url: string;
}

interface StructuredEntrySuggestion {
  name: string;
  links: LinkItem[];
}

interface StructuredEntry {
  name: string;
  links: LinkItem[];
  draftLabel: string;
  draftUrl: string;
  suggestions: StructuredEntrySuggestion[];
  suggestionsOpen: boolean;
}

interface UploadState {
  busy: boolean;
  deleting: boolean;
  dragOver: boolean;
  progress: number;
}

interface UploadDefinition {
  kind: UploadKind;
  label: string;
  description: string;
  accept: string;
  displayName: (episodeId: number) => string;
  fileField: 'fileName' | 'coverFileName' | 'coverLowFileName' | 'trailerFileName';
}

interface EpisodeFormState extends Omit<EpisodeWriteInput, 'guests' | 'musicCredits' | 'citations'> {
  guests: StructuredEntry[];
  musicCredits: StructuredEntry[];
  citations: StructuredEntry[];
}

export interface EpisodeEditorState {
  formModel: EpisodeFormState;
  selectedMembers: string[];
  listDrafts: Record<EpisodeListField, string>;
  editingEpisodeId: number | null;
}

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss']
})
export class ManageComponent implements OnInit {
  readonly self = this;
  activeTab: ManageTab = 'add';
  readonly episodeTypes = [
    'Leitura de Pergaminhos',
    'Rapidinhas do Careca',
    'Terras Distantes',
    'Especial',
    'Especial de RPG',
    'Montando a Ficha',
    'Quest',
    'Torre do Mago',
    'Contos de Taverna',
    'Nenhum',
  ];

  readonly memberOptions: MemberOption[] = [
    { name: 'Jhonatt Lima', character: 'Tiamat' },
    { name: 'Diego Broniszak', character: 'Troah' },
    { name: 'Eric Farias', character: 'Bron' },
    { name: 'Diogo Truylio', character: 'Aurin' },
    { name: 'Galdrim', character: 'Galdrim' },
  ];

  episodes: Episode[] = [];
  errorMessage = '';
  successMessage = '';
  episodePendingDelete: Episode | null = null;
  deletingEpisode = false;
  episodeSearchText = '';
  episodeGuestSearchText = '';
  pageSize = 10;
  currentPage = 1;
  private readonly structuredEntrySuggestionDelayMs = 500;
  private readonly structuredEntrySuggestionTimers = new WeakMap<StructuredEntry, number>();
  private readonly structuredEntrySuggestionCache: Record<'guests' | 'musicCredits', StructuredEntrySuggestion[]> = {
    guests: [],
    musicCredits: [],
  };
  private suggestedNextPubDate = new Date().toISOString();
  private suggestedNextEpisodeId = 1;
  private suggestedNextEpisodeNumber = 1;
  readonly addEditorState: EpisodeEditorState = this.buildEditorState();
  readonly episodesEditorState: EpisodeEditorState = this.buildEditorState();
  uploadStates: Record<UploadKind, UploadState> = {
    audio: { busy: false, deleting: false, dragOver: false, progress: 0 },
    trailer: { busy: false, deleting: false, dragOver: false, progress: 0 },
    cover: { busy: false, deleting: false, dragOver: false, progress: 0 },
    coverLow: { busy: false, deleting: false, dragOver: false, progress: 0 },
  };
  readonly uploadDefinitions: UploadDefinition[] = [
    {
      kind: 'audio',
      label: 'Episode audio',
      description: 'Drop or choose the .mp3 episode file.',
      accept: '.mp3,audio/mpeg',
      displayName: (episodeId) => `episode_${episodeId}.mp3`,
      fileField: 'fileName',
    },
    {
      kind: 'trailer',
      label: 'Trailer audio',
      description: 'Drop or choose the .mp3 trailer file.',
      accept: '.mp3,audio/mpeg',
      displayName: (episodeId) => `trailer_${episodeId}.mp3`,
      fileField: 'trailerFileName',
    },
    {
      kind: 'cover',
      label: 'Cover image',
      description: 'Drop or choose the .jpg/.jpeg cover image.',
      accept: '.jpg,.jpeg,image/jpeg',
      displayName: (episodeId) => `episode_${episodeId}.jpeg`,
      fileField: 'coverFileName',
    },
    {
      kind: 'coverLow',
      label: 'Cover webp',
      description: 'Drop or choose the .webp cover image.',
      accept: '.webp,image/webp',
      displayName: (episodeId) => `episode_${episodeId}.webp`,
      fileField: 'coverLowFileName',
    },
  ];

  constructor(private readonly apiService: ApiService) {}

  getEditorState(tab: ManageTab): EpisodeEditorState {
    return tab === 'add' ? this.addEditorState : this.episodesEditorState;
  }

  get currentEditorState(): EpisodeEditorState {
    return this.getEditorState(this.activeTab);
  }

  get formModel(): EpisodeFormState {
    return this.currentEditorState.formModel;
  }

  get selectedMembers(): string[] {
    return this.currentEditorState.selectedMembers;
  }

  get listDrafts(): Record<EpisodeListField, string> {
    return this.currentEditorState.listDrafts;
  }

  get editingEpisodeId(): number | null {
    return this.currentEditorState.editingEpisodeId;
  }

  get filteredEpisodes(): Episode[] {
    const titleQuery = this.episodeSearchText.trim().toLowerCase();
    const guestQuery = this.episodeGuestSearchText.trim().toLowerCase();

    return this.episodes.filter((episode) => {
      const matchesTitle = !titleQuery || episode.title.toLowerCase().includes(titleQuery);
      const matchesGuests = !guestQuery || this.matchesGuestQuery(episode, guestQuery);
      return matchesTitle && matchesGuests;
    });
  }

  get pagedEpisodes(): Episode[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEpisodes.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredEpisodes.length / this.pageSize));
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get displayedRangeStart(): number {
    if (this.filteredEpisodes.length === 0) {
      return 0;
    }

    return ((this.currentPage - 1) * this.pageSize) + 1;
  }

  get displayedRangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredEpisodes.length);
  }

  get episodesTabActive(): boolean {
    return this.activeTab === 'episodes';
  }

  get addTabActive(): boolean {
    return this.activeTab === 'add';
  }

  ngOnInit(): void {
    this.loadEpisodes();
  }

  startEdit(episode: Episode): void {
    this.activeTab = 'episodes';
    const editor = this.episodesEditorState;
    editor.editingEpisodeId = episode.episodeId;
    editor.formModel = {
      episodeId: episode.episodeId,
      title: episode.title,
      summary: episode.summary,
      pubDate: this.toDateTimeLocalValue(episode.pubDate),
      duration: episode.duration,
      explicit: episode.explicit,
      bytes: episode.bytes,
      episodeNumber: episode.episodeNumber ?? episode.episodeId,
      episodeType: episode.episodeType ?? 'Nenhum',
      authors: [...(episode.authors ?? [])],
      guests: this.parseStructuredEntries(episode.guests ?? []),
      tags: [...(episode.tags ?? ['podcast', 'rpg', 'dragaocareca', 'humor'])],
      citations: this.parseStructuredEntries(episode.citations ?? []),
      youtube: episode.youtube,
      spotifyId: episode.spotifyId,
      musicCredits: this.parseStructuredEntries(episode.musicCredits ?? []),
      coverCredits: [...(episode.coverCredits ?? [])],
      fileName: episode.fileName,
      coverFileName: episode.coverFileName,
      coverLowFileName: episode.coverLowFileName,
      trailerFileName: episode.trailerFileName,
    };
    editor.selectedMembers = [...(episode.authors ?? [])];
    editor.formModel.episodeId = episode.episodeId;
    editor.formModel.episodeNumber = episode.episodeNumber ?? episode.episodeId;
  }

  resetForm(): void {
    const editor = this.currentEditorState;
      editor.editingEpisodeId = null;
      editor.formModel = this.buildEmptyFormModel();
      editor.selectedMembers = [];
      editor.listDrafts = this.buildEmptyListDrafts();
    }

  saveEpisode(editor: EpisodeEditorState): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!editor.formModel.episodeId || !editor.formModel.title || !editor.formModel.pubDate) {
      this.errorMessage = 'Episode ID, title and pubDate are required.';
      return;
    }

    const payload = this.buildPayload(editor);
    const request = editor.editingEpisodeId
      ? this.apiService.updateEpisode(editor.editingEpisodeId, payload)
      : this.apiService.createEpisode(payload);

    request.subscribe({
      next: () => {
        this.successMessage = editor.editingEpisodeId ? 'Episode updated.' : 'Episode saved.';
        if (editor === this.addEditorState) {
          this.resetEditor(this.addEditorState);
        } else {
          this.resetEditor(this.episodesEditorState);
        }
        this.loadEpisodes();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not save episode.';
      },
    });
  }

  toggleMember(editor: EpisodeEditorState, member: MemberOption): void {
    const next = new Set(editor.selectedMembers);
    if (next.has(member.name)) {
      next.delete(member.name);
    } else {
      next.add(member.name);
    }
    editor.selectedMembers = [...next];
    editor.formModel.authors = [...editor.selectedMembers];
  }

  isMemberSelected(editor: EpisodeEditorState, member: MemberOption): boolean {
    return editor.selectedMembers.includes(member.name);
  }

  addStructuredEntry(editor: EpisodeEditorState, field: 'guests' | 'musicCredits' | 'citations'): void {
    const entries = editor.formModel[field];
    const lastEntry = entries[entries.length - 1];
    if (!lastEntry || (!lastEntry.name.trim() && !lastEntry.draftUrl.trim())) {
      return;
    }

    entries.push(this.buildEmptyEntry());
  }

  removeStructuredEntry(editor: EpisodeEditorState, field: 'guests' | 'musicCredits' | 'citations', index: number): void {
    if (field !== 'citations') {
      this.clearStructuredEntrySuggestionState(editor, field, index);
    }
    editor.formModel[field].splice(index, 1);
  }

  addCitationLink(editor: EpisodeEditorState, index: number): void {
    const entry = editor.formModel.citations[index];
    const label = entry.name.trim();
    const url = entry.draftUrl.trim();
    if (!label || !url) {
      return;
    }

    entry.links.push({ label, url });
    entry.draftUrl = '';
  }

  removeCitationLink(editor: EpisodeEditorState, entryIndex: number, linkIndex: number): void {
    editor.formModel.citations[entryIndex].links.splice(linkIndex, 1);
  }

  addStructuredLink(editor: EpisodeEditorState, field: 'guests' | 'musicCredits' | 'citations', index: number): void {
    const entry = editor.formModel[field][index];
    const label = entry.draftLabel.trim();
    const url = entry.draftUrl.trim();
    if (!label || !url) {
      return;
    }
    entry.links.push({ label, url });
    entry.draftLabel = '';
    entry.draftUrl = '';
  }

  removeStructuredLink(editor: EpisodeEditorState, field: 'guests' | 'musicCredits' | 'citations', entryIndex: number, linkIndex: number): void {
    editor.formModel[field][entryIndex].links.splice(linkIndex, 1);
  }

  onStructuredEntryNameFocus(editor: EpisodeEditorState, field: 'guests' | 'musicCredits', index: number): void {
    const entry = editor.formModel[field][index];
    if (!entry.name.trim()) {
      return;
    }

    this.scheduleStructuredEntrySuggestions(editor, field, index);
  }

  onStructuredEntryNameInput(editor: EpisodeEditorState, field: 'guests' | 'musicCredits', index: number): void {
    const entry = editor.formModel[field][index];
    this.clearStructuredEntrySuggestionTimer(editor, field, index);
    entry.suggestionsOpen = false;
    entry.suggestions = [];

    if (!entry.name.trim()) {
      return;
    }

    this.scheduleStructuredEntrySuggestions(editor, field, index);
  }

  onStructuredEntryNameBlur(editor: EpisodeEditorState, field: 'guests' | 'musicCredits', index: number): void {
    this.clearStructuredEntrySuggestionTimer(editor, field, index);
    window.setTimeout(() => {
      const entry = editor.formModel[field][index];
      if (entry) {
        entry.suggestionsOpen = false;
      }
    }, 150);
  }

  hasStructuredEntrySuggestions(editor: EpisodeEditorState, field: 'guests' | 'musicCredits', index: number): boolean {
    const entry = editor.formModel[field][index];
    return Boolean(entry?.suggestionsOpen && entry.suggestions.length > 0);
  }

  getStructuredEntrySuggestions(editor: EpisodeEditorState, field: 'guests' | 'musicCredits', index: number): StructuredEntrySuggestion[] {
    return editor.formModel[field][index]?.suggestions ?? [];
  }

  applyStructuredEntrySuggestion(
    editor: EpisodeEditorState,
    field: 'guests' | 'musicCredits',
    index: number,
    suggestion: StructuredEntrySuggestion,
    event?: MouseEvent
  ): void {
    event?.preventDefault();
    event?.stopPropagation();

    const entry = editor.formModel[field][index];
    if (!entry) {
      return;
    }

    entry.name = suggestion.name;
    entry.links = suggestion.links.map((link) => ({ ...link }));
    entry.draftLabel = suggestion.links[0]?.label ?? '';
    entry.draftUrl = suggestion.links[0]?.url ?? '';
    entry.suggestions = [];
    entry.suggestionsOpen = false;
    this.clearStructuredEntrySuggestionTimer(editor, field, index);
  }

  addListItem(editor: EpisodeEditorState, field: EpisodeListField): void {
    const value = editor.listDrafts[field].trim();
    if (!value) {
      return;
    }

    const current = [...(editor.formModel[field] ?? [])];
    current.push(value);
    editor.formModel[field] = current;
    editor.listDrafts[field] = '';
  }

  removeListItem(editor: EpisodeEditorState, field: EpisodeListField, index: number): void {
    const current = [...(editor.formModel[field] ?? [])];
    current.splice(index, 1);
    editor.formModel[field] = current;
  }

  onListDraftKeydown(editor: EpisodeEditorState, event: KeyboardEvent, field: EpisodeListField): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addListItem(editor, field);
    }
  }

  onEpisodeFilterChange(): void {
    this.currentPage = 1;
  }

  onCurrentPageChange(value: number | string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      this.currentPage = 1;
      return;
    }

    const nextPage = Math.min(Math.max(Math.trunc(parsed), 1), this.totalPages);
    this.currentPage = nextPage;
  }

  switchTab(tab: ManageTab): void {
    this.activeTab = tab;
    if (tab === 'episodes') this.currentPage = 1;
  }

  openDeleteEpisode(episode: Episode): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEpisodeLive(episode)) {
      this.errorMessage = 'Live episodes cannot be deleted.';
      return;
    }

    this.episodePendingDelete = episode;
  }

  cancelDeleteEpisode(): void {
    if (this.deletingEpisode) {
      return;
    }

    this.episodePendingDelete = null;
  }

  confirmDeleteEpisode(): void {
    if (!this.episodePendingDelete || this.deletingEpisode) {
      return;
    }

    if (this.isEpisodeLive(this.episodePendingDelete)) {
      this.errorMessage = 'Live episodes cannot be deleted.';
      this.episodePendingDelete = null;
      return;
    }

    this.deletingEpisode = true;
    this.errorMessage = '';
    this.successMessage = '';

    const episodeId = this.episodePendingDelete.episodeId;
    this.apiService.deleteEpisode(episodeId)
      .pipe(finalize(() => {
        this.deletingEpisode = false;
      }))
      .subscribe({
        next: () => {
          this.successMessage = `Episode ${episodeId} deleted and backed up.`;
          if (this.currentEditorState.editingEpisodeId === episodeId) {
            this.resetForm();
          }
          this.episodePendingDelete = null;
          this.loadEpisodes();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message ?? 'Could not delete episode.';
        },
      });
  }

  get pendingDeleteTitle(): string {
    return this.episodePendingDelete ? `${this.episodePendingDelete.episodeId} — ${this.episodePendingDelete.title}` : '';
  }

  get tableEmptyMessage(): string {
    return this.filteredEpisodes.length === 0
      ? 'No episodes match the current filters.'
      : '';
  }

  isEpisodeLive(episode: Episode): boolean {
    const pubDate = new Date(episode.pubDate);
    if (Number.isNaN(pubDate.getTime())) {
      return false;
    }

    return pubDate.getTime() <= Date.now();
  }

  getEpisodeLiveLabel(episode: Episode): string {
    return this.isEpisodeLive(episode) ? 'Live' : 'Scheduled';
  }

  getEpisodeDeleteDisabledReason(episode: Episode): string {
    return this.isEpisodeLive(episode) ? 'Live episodes cannot be deleted.' : '';
  }

  getUploadFilename(editor: EpisodeEditorState, kind: UploadKind): string {
    const definition = this.uploadDefinitions.find((item) => item.kind === kind);
    if (!definition) {
      return '';
    }

    const currentFileName = editor.formModel[definition.fileField];
    if (currentFileName) {
      return currentFileName;
    }

    return definition.displayName(editor.formModel.episodeId || this.suggestedNextEpisodeId);
  }

  canUpload(editor: EpisodeEditorState): boolean {
    return Number.isInteger(editor.formModel.episodeId) && editor.formModel.episodeId > 0;
  }

  isUploadBusy(kind: UploadKind): boolean {
    return this.uploadStates[kind].busy || this.uploadStates[kind].deleting;
  }

  hasUploadedFile(editor: EpisodeEditorState, kind: UploadKind): boolean {
    const definition = this.uploadDefinitions.find((item) => item.kind === kind);
    if (!definition) {
      return false;
    }

    return Boolean(editor.formModel[definition.fileField]);
  }

  canDeleteUpload(editor: EpisodeEditorState, kind: UploadKind): boolean {
    return this.hasUploadedFile(editor, kind) && !this.isEpisodeEditorLive(editor);
  }

  isEpisodeEditorLive(editor: EpisodeEditorState): boolean {
    const pubDate = new Date(editor.formModel.pubDate);
    if (Number.isNaN(pubDate.getTime())) {
      return false;
    }

    return pubDate.getTime() <= Date.now();
  }

  getUploadProgress(kind: UploadKind): number {
    return this.uploadStates[kind].progress;
  }

  isUploadDragOver(kind: UploadKind): boolean {
    return this.uploadStates[kind].dragOver;
  }

  onUploadDragOver(event: DragEvent, kind: UploadKind): void {
    event.preventDefault();
    event.stopPropagation();
    this.uploadStates[kind] = { ...this.uploadStates[kind], dragOver: true };
  }

  onUploadDragLeave(event: DragEvent, kind: UploadKind): void {
    event.preventDefault();
    event.stopPropagation();
    this.uploadStates[kind] = { ...this.uploadStates[kind], dragOver: false };
  }

  onUploadDrop(editor: EpisodeEditorState, event: DragEvent, kind: UploadKind): void {
    event.preventDefault();
    event.stopPropagation();
    this.uploadStates[kind] = { ...this.uploadStates[kind], dragOver: false };

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.uploadMedia(editor, kind, file);
    }
  }

  onUploadInputChange(editor: EpisodeEditorState, event: Event, kind: UploadKind): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (file) {
      this.uploadMedia(editor, kind, file);
    }

    if (input) {
      input.value = '';
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage += 1;
    }
  }

  private loadEpisodes(): void {
    this.apiService.listEpisodes().subscribe({
      next: (episodes) => {
        this.episodes = episodes;
        this.rebuildStructuredEntrySuggestionCache(episodes);
        this.loadStructuredEntryCatalog();
        this.suggestedNextPubDate = this.computeSuggestedNextPubDate(episodes);
        this.suggestedNextEpisodeId = this.computeSuggestedNextEpisodeId(episodes);
        this.suggestedNextEpisodeNumber = this.computeSuggestedNextEpisodeNumber(episodes);
        if (this.addEditorState.editingEpisodeId === null) {
          this.addEditorState.formModel.episodeId = this.suggestedNextEpisodeId;
          this.addEditorState.formModel.episodeNumber = this.suggestedNextEpisodeNumber;
          this.addEditorState.formModel.pubDate = this.suggestedNextPubDate;
        }
        this.currentPage = 1;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not load episodes.';
      },
    });
  }

  selectedMemberCards(editor: EpisodeEditorState): MemberOption[] {
    return this.memberOptions.filter((member) => editor.selectedMembers.includes(member.name));
  }

  private buildEditorState(): EpisodeEditorState {
    return {
      formModel: this.buildEmptyFormModel(),
      selectedMembers: [],
      listDrafts: this.buildEmptyListDrafts(),
      editingEpisodeId: null,
    };
  }

  private buildEmptyListDrafts(): Record<EpisodeListField, string> {
    return {
      coverCredits: '',
      tags: '',
    };
  }

  resetEditor(editor: EpisodeEditorState): void {
    editor.formModel = this.buildEmptyFormModel();
    editor.selectedMembers = [];
    editor.listDrafts = this.buildEmptyListDrafts();
    editor.editingEpisodeId = null;
  }

  private buildEmptyFormModel(): EpisodeFormState {
    return {
      episodeId: this.suggestedNextEpisodeId,
      title: '',
      summary: '',
      pubDate: this.suggestedNextPubDate,
      explicit: 'no',
      duration: '',
      bytes: undefined,
      episodeNumber: this.suggestedNextEpisodeNumber,
      episodeType: 'Nenhum',
      authors: [],
      guests: [this.buildEmptyEntry()],
      tags: ['podcast', 'rpg', 'dragaocareca', 'humor'],
      citations: [this.buildEmptyEntry()],
      youtube: '',
      spotifyId: '',
      musicCredits: [this.buildEmptyEntry()],
      coverCredits: [],
      fileName: '',
      coverFileName: '',
      coverLowFileName: '',
      trailerFileName: '',
    };
  }

  private buildEmptyEntry(): StructuredEntry {
    return {
      name: '',
      links: [],
      draftLabel: '',
      draftUrl: '',
      suggestions: [],
      suggestionsOpen: false,
    };
  }

  buildPayload(editor: EpisodeEditorState): EpisodeWriteInput {
    return {
      episodeId: editor.formModel.episodeId,
      title: editor.formModel.title,
      summary: editor.formModel.summary,
      pubDate: this.toIsoDateTime(editor.formModel.pubDate),
      duration: editor.formModel.duration,
      explicit: editor.formModel.explicit,
      bytes: editor.formModel.bytes,
      episodeNumber: editor.formModel.episodeNumber,
      episodeType: editor.formModel.episodeType,
      authors: [...editor.selectedMembers],
      guests: this.serializeStructuredEntries(editor.formModel.guests),
      tags: editor.formModel.tags ?? [],
      citations: this.serializeStructuredEntries(editor.formModel.citations),
      fileName: editor.formModel.fileName,
      coverFileName: editor.formModel.coverFileName,
      coverLowFileName: editor.formModel.coverLowFileName,
      trailerFileName: editor.formModel.trailerFileName,
      youtube: editor.formModel.youtube,
      spotifyId: editor.formModel.spotifyId,
      musicCredits: this.serializeStructuredEntries(editor.formModel.musicCredits),
      coverCredits: editor.formModel.coverCredits ?? [],
    };
  }

  uploadMedia(editor: EpisodeEditorState, kind: UploadKind, file: File): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.canUpload(editor)) {
      this.errorMessage = 'Enter a valid episode ID before uploading media files.';
      return;
    }

    const episodeId = editor.formModel.episodeId;
    if (!Number.isInteger(episodeId) || episodeId <= 0) {
      this.errorMessage = 'Enter a valid episode ID before uploading media files.';
      return;
    }

    const definition = this.uploadDefinitions.find((item) => item.kind === kind);
    if (!definition) {
      this.errorMessage = 'Invalid upload type.';
      return;
    }

    this.uploadStates[kind] = { busy: true, deleting: false, dragOver: false, progress: 0 };

    this.getUploadRequest(kind, episodeId, file)
      .pipe(finalize(() => {
        this.uploadStates[kind] = { ...this.uploadStates[kind], busy: false, dragOver: false };
      }))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const total = event.total ?? file.size;
            const progress = total > 0 ? Math.round((100 * event.loaded) / total) : 0;
            this.uploadStates[kind] = { ...this.uploadStates[kind], progress };
            return;
          }

          if (event.type === HttpEventType.Response) {
            const episode = event.body;
            if (!episode) {
              return;
            }
            editor.formModel[definition.fileField] = episode[definition.fileField] ?? editor.formModel[definition.fileField];
            this.successMessage = `${definition.label} staged.`;
            this.uploadStates[kind] = { ...this.uploadStates[kind], progress: 100 };
          }
        },
        error: (error) => {
          this.errorMessage = error?.error?.message ?? `Could not upload ${definition.label.toLowerCase()}.`;
          this.uploadStates[kind] = { ...this.uploadStates[kind], progress: 0 };
        },
      });
  }

  deleteUpload(editor: EpisodeEditorState, kind: UploadKind): void {
    if (!this.canUpload(editor)) {
      this.errorMessage = 'Enter a valid episode ID before deleting media files.';
      return;
    }

    const episodeId = editor.formModel.episodeId;
    if (!Number.isInteger(episodeId) || episodeId <= 0) {
      this.errorMessage = 'Enter a valid episode ID before deleting media files.';
      return;
    }

    const definition = this.uploadDefinitions.find((item) => item.kind === kind);
    if (!definition) {
      this.errorMessage = 'Invalid delete type.';
      return;
    }

    if (!this.hasUploadedFile(editor, kind)) {
      this.successMessage = `${definition.label} is already empty.`;
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.uploadStates[kind] = { ...this.uploadStates[kind], deleting: true };

    this.getDeleteRequest(kind, episodeId)
      .pipe(finalize(() => {
        this.uploadStates[kind] = { ...this.uploadStates[kind], deleting: false, progress: 0 };
      }))
      .subscribe({
        next: (episode) => {
          editor.formModel[definition.fileField] = episode[definition.fileField] ?? '';
          this.successMessage = `${definition.label} removed.`;
        },
        error: (error) => {
          this.errorMessage = error?.error?.message ?? `Could not delete ${definition.label.toLowerCase()}.`;
        },
      });
  }

  private getUploadRequest(kind: UploadKind, episodeId: number, file: File) {
    switch (kind) {
      case 'audio':
        return this.apiService.uploadEpisodeAudio(episodeId, file);
      case 'trailer':
        return this.apiService.uploadEpisodeTrailer(episodeId, file);
      case 'cover':
        return this.apiService.uploadEpisodeCover(episodeId, file);
      case 'coverLow':
        return this.apiService.uploadEpisodeCoverWebp(episodeId, file);
    }
  }

  private getDeleteRequest(kind: UploadKind, episodeId: number) {
    switch (kind) {
      case 'audio':
        return this.apiService.deleteEpisodeAudio(episodeId);
      case 'trailer':
        return this.apiService.deleteEpisodeTrailer(episodeId);
      case 'cover':
        return this.apiService.deleteEpisodeCover(episodeId);
      case 'coverLow':
        return this.apiService.deleteEpisodeCoverWebp(episodeId);
    }
  }

  private serializeStructuredEntries(entries: StructuredEntry[]): string[] {
    return entries
      .filter((entry) => entry.name.trim().length > 0 || entry.links.length > 0)
      .map((entry) =>
        JSON.stringify({
          name: entry.name.trim(),
          links: entry.links
            .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
            .filter((link) => link.label.length > 0 || link.url.length > 0),
        })
      );
  }

  private parseStructuredEntries(values: string[]): StructuredEntry[] {
    if (values.length === 0) {
      return [this.buildEmptyEntry()];
    }

    const parsed = values.map((value) => {
      try {
        const decoded = JSON.parse(value) as { name?: string; links?: LinkItem[] };
        const entry: StructuredEntry = {
          name: decoded.name ?? '',
          links: (decoded.links ?? []).map((link) => ({
            label: link.label ?? '',
            url: link.url ?? '',
          })),
          draftLabel: '',
          draftUrl: '',
          suggestions: [],
          suggestionsOpen: false,
        };
        return entry;
      } catch {
        const entry: StructuredEntry = {
          name: value,
          links: [],
          draftLabel: '',
          draftUrl: '',
          suggestions: [],
          suggestionsOpen: false,
        };
        return entry;
      }
    });

    return parsed.length > 0 ? parsed : [this.buildEmptyEntry()];
  }

  private computeSuggestedNextPubDate(episodes: Episode[]): string {
    if (episodes.length === 0) {
      return this.toDateTimeLocalValue(new Date().toISOString());
    }

    const latest = episodes.reduce((acc, current) => {
      return new Date(current.pubDate).getTime() > new Date(acc.pubDate).getTime() ? current : acc;
    });

    const next = new Date(latest.pubDate);
    next.setDate(next.getDate() + 7);
    return this.toDateTimeLocalValue(next.toISOString());
  }

  private computeSuggestedNextEpisodeId(episodes: Episode[]): number {
    if (episodes.length === 0) {
      return 1;
    }

    const latest = episodes.reduce((acc, current) => {
      return new Date(current.pubDate).getTime() > new Date(acc.pubDate).getTime() ? current : acc;
    });

    return (latest.episodeId ?? 0) + 1;
  }

  private computeSuggestedNextEpisodeNumber(episodes: Episode[]): number {
    if (episodes.length === 0) {
      return 1;
    }

    const latest = episodes.reduce((acc, current) => {
      return new Date(current.pubDate).getTime() > new Date(acc.pubDate).getTime() ? current : acc;
    });

    const baseNumber = latest.episodeNumber ?? latest.episodeId ?? 0;
    return baseNumber + 1;
  }

  private toDateTimeLocalValue(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private toIsoDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toISOString();
  }

  private matchesGuestQuery(episode: Episode, guestQuery: string): boolean {
    return (episode.guests ?? []).some((guest) => {
      const name = this.extractGuestName(guest);
      return name.includes(guestQuery);
    });
  }

  private extractGuestName(guest: string): string {
    try {
      const parsed = JSON.parse(guest) as { name?: string };
      return (parsed.name ?? guest).toLowerCase();
    } catch {
      return guest.toLowerCase();
    }
  }

  private scheduleStructuredEntrySuggestions(editor: EpisodeEditorState, field: 'guests' | 'musicCredits', index: number): void {
    const entry = editor.formModel[field][index];
    const query = entry?.name.trim().toLowerCase() ?? '';
    if (!entry || !query) {
      return;
    }

    this.clearStructuredEntrySuggestionTimer(editor, field, index);
    const sourceEntry = entry;

    const timer = window.setTimeout(() => {
      if (sourceEntry.name.trim().toLowerCase() !== query) {
        return;
      }

      const suggestions = this.structuredEntrySuggestionCache[field]
        .filter((suggestion) => suggestion.name.toLowerCase().includes(query))
        .slice(0, 6)
        .map((suggestion) => ({
          name: suggestion.name,
          links: suggestion.links.map((link) => ({ ...link })),
        }));

      sourceEntry.suggestions = suggestions;
      sourceEntry.suggestionsOpen = suggestions.length > 0;
    }, this.structuredEntrySuggestionDelayMs);

    this.structuredEntrySuggestionTimers.set(entry, timer);
  }

  private clearStructuredEntrySuggestionTimer(editor: EpisodeEditorState, field: 'guests' | 'musicCredits', index: number): void {
    const entry = editor.formModel[field][index];
    if (!entry) {
      return;
    }

    const timer = this.structuredEntrySuggestionTimers.get(entry);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.structuredEntrySuggestionTimers.delete(entry);
    }
  }

  private clearStructuredEntrySuggestionState(editor: EpisodeEditorState, field: 'guests' | 'musicCredits', index: number): void {
    this.clearStructuredEntrySuggestionTimer(editor, field, index);
    const entry = editor.formModel[field][index];
    if (entry) {
      entry.suggestions = [];
      entry.suggestionsOpen = false;
    }
  }

  private rebuildStructuredEntrySuggestionCache(episodes: Episode[]): void {
    this.structuredEntrySuggestionCache.guests = this.buildStructuredEntrySuggestionCache(episodes, 'guests');
    this.structuredEntrySuggestionCache.musicCredits = this.buildStructuredEntrySuggestionCache(episodes, 'musicCredits');
  }

  private buildStructuredEntrySuggestionCache(episodes: Episode[], field: 'guests' | 'musicCredits'): StructuredEntrySuggestion[] {
    const suggestions = new Map<string, StructuredEntrySuggestion>();

    for (const episode of episodes) {
      const values = episode[field] ?? [];
      for (const value of values) {
        const parsed = this.parseStructuredEntrySuggestionValue(value);
        if (!parsed?.name) {
          continue;
        }

        const key = parsed.name.toLowerCase();
        const existing = suggestions.get(key);
        if (!existing) {
          suggestions.set(key, {
            name: parsed.name,
            links: this.uniqueLinks(parsed.links),
          });
          continue;
        }

        existing.links = this.uniqueLinks([...existing.links, ...parsed.links]);
      }
    }

    return [...suggestions.values()].sort((left, right) => left.name.localeCompare(right.name));
  }

  private loadStructuredEntryCatalog(): void {
    this.apiService.listStructuredEntryCatalog().subscribe({
      next: (catalog) => {
        this.mergeStructuredEntryCatalogIntoCache(catalog);
      },
      error: () => {
        // Keep the episode-derived cache when the normalized catalog is unavailable.
      },
    });
  }

  private mergeStructuredEntryCatalogIntoCache(catalog: StructuredEntryCatalogResponse): void {
    this.structuredEntrySuggestionCache.guests = this.mergeSuggestionSources(
      this.structuredEntrySuggestionCache.guests,
      catalog.guests
    );
    this.structuredEntrySuggestionCache.musicCredits = this.mergeSuggestionSources(
      this.structuredEntrySuggestionCache.musicCredits,
      catalog.musicCredits
    );
  }

  private mergeSuggestionSources(
    primary: StructuredEntrySuggestion[],
    secondary: Array<{ name: string; links: Array<{ label: string; url: string }> }>
  ): StructuredEntrySuggestion[] {
    const merged = new Map<string, StructuredEntrySuggestion>();

    for (const source of [...primary, ...secondary]) {
      const name = source.name.trim();
      if (!name) {
        continue;
      }

      const key = name.toLowerCase();
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          name,
          links: this.uniqueLinks(source.links),
        });
        continue;
      }

      existing.links = this.uniqueLinks([...existing.links, ...source.links]);
    }

    return [...merged.values()].sort((left, right) => left.name.localeCompare(right.name));
  }

  private uniqueLinks(links: Array<{ label: string; url: string }>): LinkItem[] {
    const unique = new Map<string, LinkItem>();

    for (const link of links) {
      const label = link.label.trim();
      const url = this.normalizeReferenceUrl(link.url);
      if (!label && !url) {
        continue;
      }

      const key = `${label.toLowerCase()}|${url.toLowerCase()}`;
      if (!unique.has(key)) {
        unique.set(key, { label, url });
      }
    }

    return [...unique.values()];
  }

  private normalizeReferenceUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    const prepared = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/\//, '')}`;
    try {
      const parsed = new URL(prepared);
      parsed.hash = '';
      parsed.search = '';
      parsed.hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    } catch {
      return trimmed
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/+$/, '');
    }
  }

  private parseStructuredEntrySuggestionValue(value: string): StructuredEntrySuggestion | null {
    const fallbackName = value.trim();
    if (!fallbackName) {
      return null;
    }

    try {
      const decoded = JSON.parse(value) as { name?: string; links?: Array<Partial<LinkItem>> };
      const name = (decoded.name ?? fallbackName).trim();
      const links = (decoded.links ?? [])
        .map((link) => ({
          label: (link.label ?? '').trim(),
          url: (link.url ?? '').trim(),
        }))
        .filter((link) => link.label.length > 0 || link.url.length > 0);

      return name ? { name, links } : null;
    } catch {
      return { name: fallbackName, links: [] };
    }
  }
}
