import { Component, OnInit } from '@angular/core';
import { ApiService, HealthStatus, MetaConnectionStatus } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.scss']
})
export class HealthComponent implements OnInit {
  healthStatus?: HealthStatus;
  metaStatus?: MetaConnectionStatus;
  authBypassEnabled = false;
  botExpanded = true;

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authBypassEnabled = this.authService.isAuthBypassEnabled();
    this.apiService.getHealth().subscribe({
      next: (status) => {
        this.healthStatus = status;
      },
      error: () => {
        this.healthStatus = undefined;
      },
    });
    this.apiService.getMetaConnectionStatus().subscribe({
      next: (status) => this.metaStatus = status,
      error: () => this.metaStatus = undefined,
    });
  }

  get metaTaggingLabel(): string {
    return this.metaStatus?.accountTagging ?? 'unavailable';
  }

  get metaGateRows(): Array<{ label: string; value: string; note: string; tone: string; level: number }> {
    const status = this.metaStatus;
    return [
      { label: 'Instagram Reel gate', value: status?.gates.instagram.status ?? 'unavailable', note: status?.gates.instagram.reasons.join(' ') || 'API-owned gate', tone: status?.gates.instagram.status === 'ready' ? 'good' : status ? 'warn' : 'muted', level: 0 },
      { label: 'Facebook Reel gate', value: status?.gates.facebookReel.status ?? 'unavailable', note: status?.gates.facebookReel.reasons.join(' ') || 'API-owned gate', tone: status?.gates.facebookReel.status === 'ready' ? 'good' : status ? 'warn' : 'muted', level: 0 },
      { label: 'Graph version', value: status?.graphApiVersion ?? 'unavailable', note: 'Pinned API contract', tone: status?.checks.version ? 'good' : 'warn', level: 0 },
      { label: 'Token lifecycle', value: status?.token.status ?? 'unavailable', note: 'Category only; credentials remain API-only', tone: status?.token.status === 'valid' ? 'good' : 'warn', level: 0 },
      { label: 'Account tagging', value: this.metaTaggingLabel, note: 'Caption @handles are mentions, not verified tags', tone: status?.accountTagging === 'proven' ? 'good' : 'warn', level: 0 },
    ];
  }

  get botEnabledLabel(): string {
    if (this.healthStatus?.bot?.enabled === undefined) {
      return 'unavailable';
    }

    return this.healthStatus.bot.enabled ? 'enabled' : 'disabled';
  }

  get botRunningLabel(): string {
    if (this.healthStatus?.bot?.running === undefined) {
      return 'unavailable';
    }

    return this.healthStatus.bot.running ? 'running' : 'stopped';
  }

  get pendingLaunchNotifications(): number {
    return this.healthStatus?.bot?.pendingLaunchNotifications ?? 0;
  }

  get humanReadableUptime(): string {
    const uptimeSeconds = Math.max(0, Math.floor(this.healthStatus?.uptime ?? 0));
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0 || parts.length > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0 || parts.length > 0) {
      parts.push(`${minutes}m`);
    }
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  get nextPendingEpisodeLabel(): string {
    const nextEpisode = this.healthStatus?.bot?.nextPendingEpisode;
    if (!nextEpisode) {
      return 'none';
    }

    return `#${nextEpisode.episodeId} ${nextEpisode.title}`;
  }

  get botStatusTone(): string {
    if (!this.healthStatus?.bot) {
      return 'muted';
    }

    return this.healthStatus.bot.running ? 'good' : 'warn';
  }

  get pendingQueueTone(): string {
    return this.pendingLaunchNotifications > 0 ? 'warn' : 'good';
  }

  toggleBotSection(): void {
    this.botExpanded = !this.botExpanded;
  }

  get statusRows(): Array<{ label: string; value: string; note: string; tone: string; level: number }> {
    return [
      {
        label: 'Backend status',
        value: this.healthStatus?.status || 'unavailable',
        note: `Uptime: ${this.humanReadableUptime}`,
        tone: this.healthStatus ? 'good' : 'muted',
        level: 0,
      },
      {
        label: 'Auth bypass',
        value: this.authBypassEnabled ? 'enabled' : 'disabled',
        note: 'Frontend access mode',
        tone: this.authBypassEnabled ? 'good' : 'muted',
        level: 0,
      },
    ];
  }

  get botDetailRows(): Array<{ label: string; value: string; note: string; tone: string; level: number }> {
    return [
      {
        label: 'Enabled',
        value: this.botEnabledLabel,
        note: this.healthStatus?.bot?.reason || 'Launch worker readiness',
        tone: this.botStatusTone,
        level: 1,
      },
      {
        label: 'Running',
        value: this.botRunningLabel,
        note: 'Worker process state',
        tone: this.botStatusTone,
        level: 1,
      },
      {
        label: 'Pending notifications',
        value: String(this.pendingLaunchNotifications),
        note: this.nextPendingEpisodeLabel,
        tone: this.pendingQueueTone,
        level: 1,
      },
      {
        label: 'Next pending episode',
        value: this.nextPendingEpisodeLabel,
        note: 'Earliest episode waiting for notification',
        tone: this.pendingQueueTone,
        level: 1,
      },
    ];
  }
}
