import { Component, OnInit } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ApiService, Episode, EpisodeWriteInput } from '../../core/api.service';

type EpisodeListField = 'coverCredits' | 'tags';
type UploadKind = 'audio' | 'trailer' | 'cover' | 'coverLow';

interface MemberOption {
  name: string;
  character: string;
}

interface LinkItem {
  label: string;
  url: string;
}

interface StructuredEntry {
  name: string;
  links: LinkItem[];
  draftLabel: string;
  draftUrl: string;
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

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss']
})
export class ManageComponent implements OnInit {
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
  editingEpisodeId: number | null = null;
  episodePendingDelete: Episode | null = null;
  deletingEpisode = false;
  episodeSearchText = '';
  episodeGuestSearchText = '';
  pageSize = 5;
  currentPage = 1;
  private suggestedNextPubDate = new Date().toISOString();
  private suggestedNextEpisodeId = 1;
  private suggestedNextEpisodeNumber = 1;

  formModel: EpisodeFormState = this.buildEmptyFormModel();
  selectedMembers: string[] = [];
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

  listDrafts: Record<EpisodeListField, string> = {
    coverCredits: '',
    tags: '',
  };

  constructor(private readonly apiService: ApiService) {}

  get selectedMemberCards(): MemberOption[] {
    return this.memberOptions.filter((member) => this.selectedMembers.includes(member.name));
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

  ngOnInit(): void {
    this.loadEpisodes();
  }

  startEdit(episode: Episode): void {
    this.editingEpisodeId = episode.episodeId;
    this.formModel = {
      episodeId: episode.episodeId,
      title: episode.title,
      summary: episode.summary,
      pubDate: episode.pubDate,
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
    this.selectedMembers = [...(episode.authors ?? [])];
    this.formModel.episodeId = episode.episodeId;
    this.formModel.episodeNumber = episode.episodeNumber ?? episode.episodeId;
  }

  resetForm(): void {
    this.editingEpisodeId = null;
    this.formModel = this.buildEmptyFormModel();
    this.selectedMembers = [];
    this.resetDrafts();
  }

  saveEpisode(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formModel.episodeId || !this.formModel.title || !this.formModel.pubDate) {
      this.errorMessage = 'Episode ID, title and pubDate are required.';
      return;
    }

    const payload = this.buildPayload();
    const request = this.editingEpisodeId
      ? this.apiService.updateEpisode(this.editingEpisodeId, payload)
      : this.apiService.createEpisode(payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingEpisodeId ? 'Episode updated.' : 'Episode saved.';
        this.resetForm();
        this.loadEpisodes();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not save episode.';
      },
    });
  }

  toggleMember(member: MemberOption): void {
    const next = new Set(this.selectedMembers);
    if (next.has(member.name)) {
      next.delete(member.name);
    } else {
      next.add(member.name);
    }
    this.selectedMembers = [...next];
    this.formModel.authors = [...this.selectedMembers];
  }

  isMemberSelected(member: MemberOption): boolean {
    return this.selectedMembers.includes(member.name);
  }

  addStructuredEntry(field: 'guests' | 'musicCredits' | 'citations'): void {
    const entries = this.formModel[field];
    const lastEntry = entries[entries.length - 1];
    if (!lastEntry || (!lastEntry.name.trim() && !lastEntry.draftUrl.trim())) {
      return;
    }

    entries.push(this.buildEmptyEntry());
  }

  removeStructuredEntry(field: 'guests' | 'musicCredits' | 'citations', index: number): void {
    this.formModel[field].splice(index, 1);
  }

  addCitationLink(index: number): void {
    const entry = this.formModel.citations[index];
    const label = entry.name.trim();
    const url = entry.draftUrl.trim();
    if (!label || !url) {
      return;
    }

    entry.links.push({ label, url });
    entry.draftUrl = '';
  }

  removeCitationLink(entryIndex: number, linkIndex: number): void {
    this.formModel.citations[entryIndex].links.splice(linkIndex, 1);
  }

  addStructuredLink(field: 'guests' | 'musicCredits' | 'citations', index: number): void {
    const entry = this.formModel[field][index];
    const label = entry.draftLabel.trim();
    const url = entry.draftUrl.trim();
    if (!label || !url) {
      return;
    }
    entry.links.push({ label, url });
    entry.draftLabel = '';
    entry.draftUrl = '';
  }

  removeStructuredLink(field: 'guests' | 'musicCredits' | 'citations', entryIndex: number, linkIndex: number): void {
    this.formModel[field][entryIndex].links.splice(linkIndex, 1);
  }

  addListItem(field: EpisodeListField): void {
    const value = this.listDrafts[field].trim();
    if (!value) {
      return;
    }

    const current = [...(this.formModel[field] ?? [])];
    current.push(value);
    this.formModel[field] = current;
    this.listDrafts[field] = '';
  }

  removeListItem(field: EpisodeListField, index: number): void {
    const current = [...(this.formModel[field] ?? [])];
    current.splice(index, 1);
    this.formModel[field] = current;
  }

  onListDraftKeydown(event: KeyboardEvent, field: EpisodeListField): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addListItem(field);
    }
  }

  onEpisodeFilterChange(): void {
    this.currentPage = 1;
  }

  openDeleteEpisode(episode: Episode): void {
    this.errorMessage = '';
    this.successMessage = '';
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
          if (this.editingEpisodeId === episodeId) {
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

  getUploadFilename(kind: UploadKind): string {
    const definition = this.uploadDefinitions.find((item) => item.kind === kind);
    if (!definition) {
      return '';
    }

    const currentFileName = this.formModel[definition.fileField];
    if (currentFileName) {
      return currentFileName;
    }

    return definition.displayName(this.formModel.episodeId || this.suggestedNextEpisodeId);
  }

  canUpload(): boolean {
    return Number.isInteger(this.formModel.episodeId) && this.formModel.episodeId > 0;
  }

  isUploadBusy(kind: UploadKind): boolean {
    return this.uploadStates[kind].busy || this.uploadStates[kind].deleting;
  }

  hasUploadedFile(kind: UploadKind): boolean {
    const definition = this.uploadDefinitions.find((item) => item.kind === kind);
    if (!definition) {
      return false;
    }

    return Boolean(this.formModel[definition.fileField]);
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

  onUploadDrop(event: DragEvent, kind: UploadKind): void {
    event.preventDefault();
    event.stopPropagation();
    this.uploadStates[kind] = { ...this.uploadStates[kind], dragOver: false };

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.uploadMedia(kind, file);
    }
  }

  onUploadInputChange(event: Event, kind: UploadKind): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (file) {
      this.uploadMedia(kind, file);
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
        this.suggestedNextPubDate = this.computeSuggestedNextPubDate(episodes);
        this.suggestedNextEpisodeId = this.computeSuggestedNextEpisodeId(episodes);
        this.suggestedNextEpisodeNumber = this.computeSuggestedNextEpisodeNumber(episodes);
        if (this.editingEpisodeId === null) {
          this.formModel.episodeId = this.suggestedNextEpisodeId;
          this.formModel.episodeNumber = this.suggestedNextEpisodeNumber;
          this.formModel.pubDate = this.suggestedNextPubDate;
        }
        this.currentPage = 1;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not load episodes.';
      },
    });
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
    };
  }

  private resetDrafts(): void {
    this.listDrafts = {
      coverCredits: '',
      tags: '',
    };
  }

  private buildPayload(): EpisodeWriteInput {
    return {
      episodeId: this.formModel.episodeId,
      title: this.formModel.title,
      summary: this.formModel.summary,
      pubDate: this.formModel.pubDate,
      duration: this.formModel.duration,
      explicit: this.formModel.explicit,
      bytes: this.formModel.bytes,
      episodeNumber: this.formModel.episodeNumber,
      episodeType: this.formModel.episodeType,
      authors: [...this.selectedMembers],
      guests: this.serializeStructuredEntries(this.formModel.guests),
      tags: this.formModel.tags ?? [],
      citations: this.serializeStructuredEntries(this.formModel.citations),
      fileName: this.formModel.fileName,
      coverFileName: this.formModel.coverFileName,
      coverLowFileName: this.formModel.coverLowFileName,
      trailerFileName: this.formModel.trailerFileName,
      youtube: this.formModel.youtube,
      spotifyId: this.formModel.spotifyId,
      musicCredits: this.serializeStructuredEntries(this.formModel.musicCredits),
      coverCredits: this.formModel.coverCredits ?? [],
    };
  }

  private uploadMedia(kind: UploadKind, file: File): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.canUpload()) {
      this.errorMessage = 'Enter a valid episode ID before uploading media files.';
      return;
    }

    const episodeId = this.formModel.episodeId;
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
            this.formModel[definition.fileField] = episode[definition.fileField] ?? this.formModel[definition.fileField];
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

  deleteUpload(kind: UploadKind): void {
    if (!this.canUpload()) {
      this.errorMessage = 'Enter a valid episode ID before deleting media files.';
      return;
    }

    const episodeId = this.formModel.episodeId;
    if (!Number.isInteger(episodeId) || episodeId <= 0) {
      this.errorMessage = 'Enter a valid episode ID before deleting media files.';
      return;
    }

    const definition = this.uploadDefinitions.find((item) => item.kind === kind);
    if (!definition) {
      this.errorMessage = 'Invalid delete type.';
      return;
    }

    if (!this.hasUploadedFile(kind)) {
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
          this.formModel[definition.fileField] = episode[definition.fileField] ?? '';
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
        };
        return entry;
      } catch {
        const entry: StructuredEntry = {
          name: value,
          links: [],
          draftLabel: '',
          draftUrl: '',
        };
        return entry;
      }
    });

    return parsed.length > 0 ? parsed : [this.buildEmptyEntry()];
  }

  private computeSuggestedNextPubDate(episodes: Episode[]): string {
    if (episodes.length === 0) {
      return new Date().toISOString();
    }

    const latest = episodes.reduce((acc, current) => {
      return new Date(current.pubDate).getTime() > new Date(acc.pubDate).getTime() ? current : acc;
    });

    const next = new Date(latest.pubDate);
    next.setDate(next.getDate() + 7);
    return next.toISOString();
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
}
