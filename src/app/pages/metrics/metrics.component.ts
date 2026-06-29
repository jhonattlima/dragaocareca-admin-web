import { Component, HostListener, OnInit } from '@angular/core';
import {
  ApiService,
  SpotifyMetricsErrorResponse,
  SpotifyMetricsSnapshot,
  YouTubeMetricsErrorResponse,
  YouTubeMetricsSnapshot,
} from '../../core/api.service';

type MetricsSection = {
  title: string;
  summary: string;
  expanded: boolean;
  rows: Array<{ label: string; value: string; detail?: string }>;
};

type MetricSummaryCard = {
  label: string;
  value: string;
  change?: string;
  tone: 'good' | 'warn' | 'muted';
  description: string;
  metricKey?: YouTubeChartMetricKey;
};

type TrendCard = {
  label: string;
  currentValue: string;
  previousValue: string;
  changeLabel: string;
  tone: 'good' | 'warn' | 'muted';
  path: string;
  areaPath: string;
};

type DailyPoint = {
  date: string;
  label: string;
  tooltipLabel: string;
  plays: number;
};

type YouTubeDailyPoint = {
  date: string;
  label: string;
  tooltipLabel: string;
  views: number;
  estimatedMinutesWatched: number;
  subscribersGained: number;
  subscribersLost: number;
  subscribersCurrent: number;
  likes: number;
  comments: number;
  shares: number;
};

type ChartMetricKey = 'plays' | 'followers';
type YouTubeChartMetricKey = 'views' | 'estimatedMinutesWatched' | 'subscribersCurrent' | 'netSubscribers' | 'likes' | 'comments' | 'shares';

type ChartPoint = DailyPoint & {
  x: number;
  y: number;
};

type YouTubeChartPoint = YouTubeDailyPoint & {
  x: number;
  y: number;
};

type PresetRangeKey = '90' | '30' | '7';
type RangeKey = PresetRangeKey;

type RangeOption = {
  key: RangeKey;
  label: string;
  subtitle: string;
};

type RangeSummary = {
  current: number | null;
  previous: number | null;
  deltaPercent: number | null;
};

type PresetSummary = {
  plays?: RangeSummary;
  followers?: RangeSummary;
};

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
})
export class MetricsComponent implements OnInit {
  metrics?: SpotifyMetricsSnapshot;
  metricsError?: SpotifyMetricsErrorResponse;
  youtubeMetrics?: YouTubeMetricsSnapshot;
  youtubeMetricsError?: YouTubeMetricsErrorResponse;
  loading = true;
  youtubeLoading = true;
  sections: MetricsSection[] = [];
  summaryCards: MetricSummaryCard[] = [];
  youtubeSummaryCards: MetricSummaryCard[] = [];
  trendCards: TrendCard[] = [];
  rangeOptions: Array<{ key: RangeKey; label: string; subtitle: string }> = [
    { key: '90', label: 'Últimos 90 dias', subtitle: 'Visão trimestral' },
    { key: '30', label: 'Últimos 30 dias', subtitle: 'Comparação mensal' },
    { key: '7', label: 'Últimos 7 dias', subtitle: 'Leitura rápida' },
  ];
  selectedRangeKey: RangeKey = '30';
  youtubeSelectedRangeKey: RangeKey = '30';
  rangeMenuOpen = false;
  youtubeRangeMenuOpen = false;
  selectedPoint?: DailyPoint;
  hoveredPoint?: DailyPoint;
  selectedYouTubeChartMetric: YouTubeChartMetricKey = 'views';

  private metricsRequestSeq = 0;
  private youtubeMetricsRequestSeq = 0;
  private allTimeSnapshot?: SpotifyMetricsSnapshot;
  private allTimeYouTubeSnapshot?: YouTubeMetricsSnapshot;
  private presetSummaries: Partial<Record<PresetRangeKey, PresetSummary>> = {};
  private allTimeSeries: DailyPoint[] = [];
  private allTimeFollowersSeries: DailyPoint[] = [];
  private allTimeListenerSeries: Array<{ date: string; value: number }> = [];
  private allTimeYouTubeSeries: YouTubeDailyPoint[] = [];
  private activePlaysSeries: DailyPoint[] = [];
  private activeFollowersSeries: DailyPoint[] = [];
  private activePlaysSummary: RangeSummary = { current: null, previous: null, deltaPercent: null };
  private activeFollowersSummary: RangeSummary = { current: null, previous: null, deltaPercent: null };
  private activeYouTubeSeries: YouTubeDailyPoint[] = [];
  private activeYouTubeSummary = {
    views: { current: null, previous: null, deltaPercent: null } as RangeSummary,
    estimatedMinutesWatched: { current: null, previous: null, deltaPercent: null } as RangeSummary,
    subscribersCurrent: { current: null, previous: null, deltaPercent: null } as RangeSummary,
    netSubscribers: { current: null, previous: null, deltaPercent: null } as RangeSummary,
    likes: { current: null, previous: null, deltaPercent: null } as RangeSummary,
    comments: { current: null, previous: null, deltaPercent: null } as RangeSummary,
    shares: { current: null, previous: null, deltaPercent: null } as RangeSummary,
    averageViewDurationSeconds: { current: null, previous: null, deltaPercent: null } as RangeSummary,
  };
  selectedChartMetric: ChartMetricKey = 'plays';
  selectedYouTubePoint?: YouTubeDailyPoint;
  hoveredYouTubePoint?: YouTubeDailyPoint;

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadRangeSnapshots();
    this.loadYouTubeRangeSnapshots();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.metrics-range-dropdown')) {
      this.rangeMenuOpen = false;
    }
    if (!target?.closest('.metrics-youtube-range-dropdown')) {
      this.youtubeRangeMenuOpen = false;
    }
  }

  private loadRangeSnapshots(): void {
    const requestId = ++this.metricsRequestSeq;
    this.loading = true;

    this.apiService.getSpotifyMetrics(4000).subscribe({
      next: (response) => {
        if (requestId !== this.metricsRequestSeq) {
          return;
        }

        if ('ok' in response && response.ok === false) {
          this.loading = false;
          this.metricsError = response as SpotifyMetricsErrorResponse;
          this.resetMetricsState();
          return;
        }

        this.allTimeSnapshot = response as SpotifyMetricsSnapshot;
        this.presetSummaries = this.readPresetSummaries(this.allTimeSnapshot);
        this.allTimeSeries = this.buildPlaysSeries(this.allTimeSnapshot);
        this.allTimeFollowersSeries = this.buildFollowersSeries(this.allTimeSnapshot);
        this.allTimeListenerSeries = this.buildListenerSeries(this.allTimeSnapshot);
        this.loading = false;
        this.metricsError = undefined;
        this.applySelectedRange();
      },
      error: () => {
        if (requestId !== this.metricsRequestSeq) {
          return;
        }
        this.loading = false;
        this.metricsError = {
          source: 'spotify-connector',
          fetchedAt: new Date().toISOString(),
          ok: false,
          message: 'Could not load Spotify metrics.',
          details: undefined,
        };
        this.resetMetricsState();
      },
    });
  }

  private loadYouTubeRangeSnapshots(): void {
    const requestId = ++this.youtubeMetricsRequestSeq;
    this.youtubeLoading = true;

    this.apiService.getYouTubeMetrics(90).subscribe({
      next: (response) => {
        if (requestId !== this.youtubeMetricsRequestSeq) {
          return;
        }

        if ('ok' in response && response.ok === false) {
          this.youtubeLoading = false;
          this.youtubeMetricsError = response as YouTubeMetricsErrorResponse;
          this.resetYouTubeMetricsState();
          return;
        }

        this.allTimeYouTubeSnapshot = response as YouTubeMetricsSnapshot;
        this.allTimeYouTubeSeries = this.buildYouTubeSeries(this.allTimeYouTubeSnapshot);
        this.youtubeLoading = false;
        this.youtubeMetricsError = undefined;
        this.applySelectedRange();
      },
      error: () => {
        if (requestId !== this.youtubeMetricsRequestSeq) {
          return;
        }
        this.youtubeLoading = false;
        this.youtubeMetricsError = {
          source: 'youtube-analytics',
          fetchedAt: new Date().toISOString(),
          ok: false,
          message: 'Could not load YouTube metrics.',
          details: undefined,
          code: 'fetch_failed',
        };
        this.resetYouTubeMetricsState();
      },
    });
  }

  private resetMetricsState(): void {
    this.metrics = undefined;
    this.sections = [];
    this.summaryCards = [];
    this.trendCards = [];
    this.selectedPoint = undefined;
    this.hoveredPoint = undefined;
    this.allTimeSnapshot = undefined;
    this.presetSummaries = {};
    this.allTimeSeries = [];
    this.allTimeFollowersSeries = [];
    this.activePlaysSeries = [];
    this.activeFollowersSeries = [];
    this.activePlaysSummary = { current: null, previous: null, deltaPercent: null };
    this.activeFollowersSummary = { current: null, previous: null, deltaPercent: null };
  }

  private resetYouTubeMetricsState(): void {
    this.youtubeMetrics = undefined;
    this.youtubeSummaryCards = [];
    this.selectedYouTubePoint = undefined;
    this.hoveredYouTubePoint = undefined;
    this.allTimeYouTubeSnapshot = undefined;
    this.allTimeYouTubeSeries = [];
    this.activeYouTubeSeries = [];
    this.activeYouTubeSummary = {
      views: { current: null, previous: null, deltaPercent: null },
      estimatedMinutesWatched: { current: null, previous: null, deltaPercent: null },
      subscribersCurrent: { current: null, previous: null, deltaPercent: null },
      netSubscribers: { current: null, previous: null, deltaPercent: null },
      likes: { current: null, previous: null, deltaPercent: null },
      comments: { current: null, previous: null, deltaPercent: null },
      shares: { current: null, previous: null, deltaPercent: null },
      averageViewDurationSeconds: { current: null, previous: null, deltaPercent: null },
    };
  }

  toggleRangeMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.rangeMenuOpen = !this.rangeMenuOpen;
  }

  toggleYouTubeRangeMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.youtubeRangeMenuOpen = !this.youtubeRangeMenuOpen;
  }

  selectRange(key: RangeKey): void {
    this.selectedRangeKey = key;
    this.rangeMenuOpen = false;

    this.applySelectedRange();
  }

  selectYouTubeRange(key: RangeKey): void {
    this.youtubeSelectedRangeKey = key;
    this.youtubeRangeMenuOpen = false;

    this.applySelectedRange();
  }

  private applySelectedRange(): void {
    const snapshot = this.allTimeSnapshot;
    if (snapshot) {
      this.metrics = snapshot;
      this.sections = this.buildSections(snapshot);
      this.summaryCards = this.buildSummaryCards(snapshot, this.selectedRangeKey);
      this.trendCards = this.buildTrendCards(snapshot);
      this.activePlaysSeries = this.sliceWindow(this.allTimeSeries, this.selectedRangeKey);
      this.activeFollowersSeries = this.sliceWindow(this.allTimeFollowersSeries, this.selectedRangeKey);
      const presetSummary = this.presetSummaries[this.selectedRangeKey];
      this.activePlaysSummary = this.toRangeSummary(presetSummary?.plays ?? snapshot.summary.plays);
      this.activeFollowersSummary = this.toRangeSummary(presetSummary?.followers ?? snapshot.summary.followers);
      const series = this.displayedSeries;
      this.selectedPoint = series[series.length - 1];
      this.hoveredPoint = undefined;
    }

    const youtubeSnapshot = this.allTimeYouTubeSnapshot;
    if (youtubeSnapshot) {
      this.youtubeMetrics = youtubeSnapshot;
      this.youtubeSummaryCards = this.buildYouTubeSummaryCards(this.youtubeSelectedRangeKey);
      this.activeYouTubeSeries = this.sliceWindow(this.allTimeYouTubeSeries, this.youtubeSelectedRangeKey);
      this.activeYouTubeSummary = this.buildYouTubeRangeSummaries(this.youtubeSelectedRangeKey);
      const series = this.displayedYouTubeSeries;
      this.selectedYouTubePoint = series[series.length - 1];
      this.hoveredYouTubePoint = undefined;
    }
  }

  selectChartMetric(metric: ChartMetricKey): void {
    this.selectedChartMetric = metric;
    const series = this.displayedSeries;
    this.selectedPoint = series[series.length - 1];
    this.hoveredPoint = undefined;
  }

  selectPoint(point: DailyPoint): void {
    this.selectedPoint = point;
    this.hoveredPoint = point;
  }

  selectYouTubePoint(point: YouTubeDailyPoint): void {
    this.selectedYouTubePoint = point;
    this.hoveredYouTubePoint = point;
  }

  selectYouTubeChartMetric(metric: YouTubeChartMetricKey): void {
    this.selectedYouTubeChartMetric = metric;
    const series = this.displayedYouTubeSeries;
    this.selectedYouTubePoint = series[series.length - 1];
    this.hoveredYouTubePoint = undefined;
  }

  hoverPoint(point: DailyPoint): void {
    this.hoveredPoint = point;
  }

  hoverYouTubePoint(point: YouTubeDailyPoint): void {
    this.hoveredYouTubePoint = point;
  }

  clearHover(): void {
    this.hoveredPoint = undefined;
  }

  clearYouTubeHover(): void {
    this.hoveredYouTubePoint = undefined;
  }

  handleChartPointerMove(event: MouseEvent): void {
    const svg = event.currentTarget as SVGSVGElement | null;
    if (!svg || !this.chartPoints.length) {
      return;
    }

    const bounds = svg.getBoundingClientRect();
    const offsetX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const clampedX = Math.max(0, Math.min(100, offsetX));

    let closest = this.chartPoints[0];
    let closestDistance = Math.abs(closest.x - clampedX);

    for (const point of this.chartPoints.slice(1)) {
      const distance = Math.abs(point.x - clampedX);
      if (distance < closestDistance) {
        closest = point;
        closestDistance = distance;
      }
    }

    this.hoveredPoint = closest;
  }

  handleYouTubeChartPointerMove(event: MouseEvent): void {
    const svg = event.currentTarget as SVGSVGElement | null;
    if (!svg || !this.youtubeChartPoints.length) {
      return;
    }

    const bounds = svg.getBoundingClientRect();
    const offsetX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const clampedX = Math.max(0, Math.min(100, offsetX));

    let closest = this.youtubeChartPoints[0];
    let closestDistance = Math.abs(closest.x - clampedX);

    for (const point of this.youtubeChartPoints.slice(1)) {
      const distance = Math.abs(point.x - clampedX);
      if (distance < closestDistance) {
        closest = point;
        closestDistance = distance;
      }
    }

    this.hoveredYouTubePoint = closest;
  }

  get hasMetrics(): boolean {
    return !!this.metrics;
  }

  get hasAnyMetrics(): boolean {
    return !!this.metrics || !!this.youtubeMetrics;
  }

  get generatedAtLabel(): string {
    return this.metrics ? new Date(this.metrics.fetchedAt).toLocaleString() : 'unavailable';
  }

  get spotifyUpdatedAtLabel(): string {
    return this.metrics ? `Atualizado em ${new Date(this.metrics.fetchedAt).toLocaleString('pt-BR')}` : 'Atualização indisponível';
  }

  get aggregateCount(): number {
    return this.metrics ? Object.keys(this.metrics.current.aggregate || {}).length : 0;
  }

  get episodeCount(): number {
    return this.metrics?.episodes?.length ?? 0;
  }

  get selectedRangeLabel(): string {
    switch (this.selectedRangeKey) {
      case '7':
        return 'Últimos 7 dias';
      case '30':
        return 'Últimos 30 dias';
      case '90':
        return 'Últimos 90 dias';
      default:
        return 'Últimos 30 dias';
    }
  }

  get youtubeSelectedRangeLabel(): string {
    switch (this.youtubeSelectedRangeKey) {
      case '7':
        return 'Últimos 7 dias';
      case '30':
        return 'Últimos 30 dias';
      case '90':
        return 'Últimos 90 dias';
      default:
        return 'Últimos 30 dias';
    }
  }

  get selectedPlaysSummary(): RangeSummary {
    return this.activePlaysSummary;
  }

  get selectedFollowersSummary(): RangeSummary {
    return this.activeFollowersSummary;
  }

  get selectedYouTubeSummary(): typeof this.activeYouTubeSummary {
    return this.activeYouTubeSummary;
  }

  get displayedPlaysSeries(): DailyPoint[] {
    return this.activePlaysSeries;
  }

  get displayedFollowersSeries(): DailyPoint[] {
    return this.activeFollowersSeries;
  }

  get displayedYouTubeSeries(): YouTubeDailyPoint[] {
    return this.activeYouTubeSeries;
  }

  get displayedSeries(): DailyPoint[] {
    return this.selectedChartMetric === 'followers' ? this.displayedFollowersSeries : this.displayedPlaysSeries;
  }

  get chartLabel(): string {
    return this.selectedChartMetric === 'followers' ? 'Followers por dia' : 'Plays por dia';
  }

  get chartMax(): number {
    return Math.max(...this.displayedSeries.map((point) => point.plays), 1);
  }

  get chartPath(): string {
    return this.buildSeriesPath(this.displayedSeries);
  }

  get chartAreaPath(): string {
    return this.buildSeriesAreaPath(this.displayedSeries);
  }

  get chartPoints(): ChartPoint[] {
    return this.buildChartCoordinates(this.displayedSeries);
  }

  get pinnedPoint(): DailyPoint | undefined {
    return this.hoveredPoint ?? this.selectedPoint ?? this.displayedSeries[this.displayedSeries.length - 1];
  }

  get metricsErrorMessage(): string {
    if (!this.metricsError) {
      return '';
    }
    const details = this.metricsError.details ? this.metricsError.details.split('\n')[0].slice(0, 220) : '';
    return details ? `${this.metricsError.message}: ${details}` : this.metricsError.message;
  }

  get chartLabels(): Array<{ label: string; x: number }> {
    const points = this.displayedSeries;
    if (!points.length) {
      return [];
    }

    const interval = points.length >= 90 ? 5 : points.length >= 30 ? 5 : 1;

    return points
      .map((point, index) => ({ point, index }))
      .filter(({ index }) => index === points.length - 1 || index % interval === 0)
      .map(({ point, index }) => ({
        label: point.label,
        x: points.length === 1 ? 50 : 5 + index * (90 / (points.length - 1)),
      }));
  }

  get chartTooltipPoint(): DailyPoint | undefined {
    return this.hoveredPoint;
  }

  get chartTooltipPosition(): { x: number; y: number } | null {
    const point = this.chartPoints.find((item) => item.date === this.chartTooltipPoint?.date);
    return point ? { x: point.x, y: point.y } : null;
  }

  get youtubeChartLabel(): string {
    return `${this.youtubeMetricLabel(this.selectedYouTubeChartMetric)} por dia`;
  }

  get youtubeChartMax(): number {
    return Math.max(...this.displayedYouTubeSeries.map((point) => this.getYouTubeMetricValue(point, this.selectedYouTubeChartMetric)), 1);
  }

  get youtubeChartPath(): string {
    return this.buildYouTubeSeriesPath(this.displayedYouTubeSeries);
  }

  get youtubeChartAreaPath(): string {
    return this.buildYouTubeSeriesAreaPath(this.displayedYouTubeSeries);
  }

  get youtubeChartPoints(): YouTubeChartPoint[] {
    return this.buildYouTubeChartCoordinates(this.displayedYouTubeSeries);
  }

  get youtubePinnedPoint(): YouTubeDailyPoint | undefined {
    return this.hoveredYouTubePoint ?? this.selectedYouTubePoint ?? this.displayedYouTubeSeries[this.displayedYouTubeSeries.length - 1];
  }

  get youtubeChartTooltipPoint(): YouTubeDailyPoint | undefined {
    return this.hoveredYouTubePoint;
  }

  get youtubeChartTooltipMetricLabel(): string {
    return this.youtubeMetricLabel(this.selectedYouTubeChartMetric);
  }

  get youtubeChartTooltipValue(): number {
    const point = this.youtubeChartTooltipPoint ?? this.selectedYouTubePoint ?? this.displayedYouTubeSeries[this.displayedYouTubeSeries.length - 1];
    return point ? this.getYouTubeMetricValue(point, this.selectedYouTubeChartMetric) : 0;
  }

  get youtubeChartTooltipPosition(): { x: number; y: number } | null {
    const point = this.youtubeChartPoints.find((item) => item.date === this.youtubeChartTooltipPoint?.date);
    return point ? { x: point.x, y: point.y } : null;
  }

  get youtubeChartLabels(): Array<{ label: string; x: number }> {
    const points = this.displayedYouTubeSeries;
    if (!points.length) {
      return [];
    }

    const interval = points.length >= 90 ? 5 : points.length >= 30 ? 5 : 1;

    return points
      .map((point, index) => ({ point, index }))
      .filter(({ index }) => index === points.length - 1 || index % interval === 0)
      .map(({ point, index }) => ({
        label: point.label,
        x: points.length === 1 ? 50 : 5 + index * (90 / (points.length - 1)),
      }));
  }

  get youtubeMetricsErrorMessage(): string {
    if (!this.youtubeMetricsError) {
      return '';
    }
    const details = this.youtubeMetricsError.details ? this.youtubeMetricsError.details.split('\n')[0].slice(0, 220) : '';
    return details ? `${this.youtubeMetricsError.message}: ${details}` : this.youtubeMetricsError.message;
  }

  get youtubeUpdatedAtLabel(): string {
    return this.youtubeMetrics ? `Atualizado em ${new Date(this.youtubeMetrics.fetchedAt).toLocaleString('pt-BR')}` : 'Atualização indisponível';
  }

  private buildSections(snapshot: SpotifyMetricsSnapshot): MetricsSection[] {
    return [
      {
        title: 'Metadata',
        summary: 'Show-level snapshot and top-line identifiers.',
        expanded: true,
        rows: Object.entries(snapshot.metadata || {}).map(([label, value]) => ({
          label,
          value: this.stringifyValue(value),
        })),
      },
      {
        title: 'Aggregate',
        summary: 'Age, country, gender and other summary buckets.',
        expanded: false,
        rows: Object.entries(snapshot.current.aggregate || {}).map(([label, value]) => ({
          label,
          value: this.stringifyValue(value),
        })),
      },
      {
        title: 'Listeners',
        summary: 'Listener distribution for the selected window.',
        expanded: false,
        rows: Object.entries(snapshot.current.listeners || {}).map(([label, value]) => ({
          label,
          value: this.stringifyValue(value),
        })),
      },
      {
        title: 'Episodes',
        summary: 'Episode-level performance payload returned by Spotify.',
        expanded: false,
        rows: (snapshot.episodes || []).map((episode, index) => ({
          label: `Episode ${index + 1}`,
          value: this.stringifyValue(episode),
        })),
      },
      {
        title: 'Sample performance',
        summary: 'Raw payload for the first episode performance call.',
        expanded: false,
        rows: snapshot.samplePerformance
          ? Object.entries(snapshot.samplePerformance).map(([label, value]) => ({
              label,
              value: this.stringifyValue(value),
            }))
          : [],
      },
    ];
  }

  private buildSummaryCards(snapshot: SpotifyMetricsSnapshot, key: PresetRangeKey): MetricSummaryCard[] {
    const presetSummary = this.presetSummaries[key];
    const plays = presetSummary?.plays ?? snapshot.summary.plays;
    const followers = presetSummary?.followers ?? snapshot.summary.followers;
    const consumingTime = snapshot.summary.consumingTime;

    return [
      {
        label: 'Plays',
        value: this.formatNumber(plays.current),
        change: this.formatPercent(plays.deltaPercent),
        tone: this.toneFromDelta(plays.deltaPercent),
        description: 'Quantidade de plays concluídos no período selecionado.',
      },
      {
        label: 'Followers',
        value: this.formatNumber(followers.current),
        change: this.formatPercent(followers.deltaPercent),
        tone: this.toneFromDelta(followers.deltaPercent),
        description: 'Total de seguidores registrados no intervalo mostrado.',
      },
      {
        label: 'Consuming time',
        value: this.formatNumber(consumingTime.current),
        change: this.formatPercent(consumingTime.deltaPercent),
        tone: this.toneFromDelta(consumingTime.deltaPercent),
        description: 'Tempo total consumido nos episódios do período.',
      },
      {
        label: 'Followers',
        value: this.formatNumber(snapshot.summary.followersCurrent ?? followers.current),
        tone: 'good',
        description: 'Total de seguidores atuais do podcast no Spotify.',
      },
      {
        label: 'Range',
        value: this.selectedRangeLabel,
        tone: 'muted',
        description: 'Intervalo usado para calcular as métricas acima.',
      },
    ];
  }

  private readPresetSummaries(snapshot: SpotifyMetricsSnapshot): Partial<Record<PresetRangeKey, PresetSummary>> {
    const debug = snapshot.debug as { presetSummaries?: Partial<Record<PresetRangeKey, PresetSummary>> } | undefined;
    return debug?.presetSummaries ?? {};
  }

  private toRangeSummary(summary: RangeSummary): RangeSummary {
    return {
      current: summary.current,
      previous: summary.previous,
      deltaPercent: summary.deltaPercent,
    };
  }

  private getWindowSize(key: PresetRangeKey): number {
    switch (key) {
      case '90':
        return 90;
      case '30':
        return 30;
      case '7':
      default:
        return 7;
    }
  }

  private sliceWindow<T>(series: T[], key: PresetRangeKey): T[] {
    const size = this.getWindowSize(key);
    return series.slice(Math.max(0, series.length - size));
  }

  private buildWindowSummary<T extends { date: string }>(
    series: T[],
    fullSeries: T[],
    getValue: (point: T) => number
  ): RangeSummary {
    if (!series.length || !fullSeries.length) {
      return { current: null, previous: null, deltaPercent: null };
    }

    const current = series.reduce((total, point) => total + getValue(point), 0);
    const endIndex = fullSeries.findIndex((point) => point.date === series[series.length - 1].date);
    if (endIndex < 0) {
      return { current, previous: null, deltaPercent: null };
    }

    const windowSize = series.length;
    const previousEnd = endIndex - windowSize;
    const previousStart = Math.max(0, previousEnd - windowSize + 1);
    const previousSeries = previousEnd >= 0 ? fullSeries.slice(previousStart, previousEnd + 1) : [];
    const previous = previousSeries.reduce((total, point) => total + getValue(point), 0);

    return {
      current,
      previous: previous || null,
      deltaPercent: previous > 0 ? ((current - previous) / previous) * 100 : null,
    };
  }

  private buildTrendCards(snapshot: SpotifyMetricsSnapshot): TrendCard[] {
    const plays = snapshot.summary.plays;
    const followers = snapshot.summary.followers;
    const consumingTime = snapshot.summary.consumingTime;

    return [
      this.buildTrendCard('Plays', plays.current, plays.previous, plays.deltaPercent, 'plays', 'streams'),
      this.buildTrendCard('Followers', followers.current, followers.previous, followers.deltaPercent, 'followers', 'followers'),
      this.buildTrendCard('Consuming time', consumingTime.current, consumingTime.previous, consumingTime.deltaPercent, 'min', 'min'),
    ];
  }

  private buildPlaysSeries(snapshot: SpotifyMetricsSnapshot): DailyPoint[] {
    const debug = snapshot.debug as Record<string, unknown> | undefined;
    const summary = (debug?.['currentStreamsSummary'] as Array<{ date?: string; starts?: number }> | undefined) ?? [];
    return summary
      .filter((item): item is { date: string; starts: number } => !!item?.date && typeof item.starts === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: item.date,
        label: new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        tooltipLabel: new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        plays: item.starts,
      }));
  }

  private buildFollowersSeries(snapshot: SpotifyMetricsSnapshot): DailyPoint[] {
    const debug = snapshot.debug as Record<string, unknown> | undefined;
    const samples = (debug?.['metricSamples'] as Array<{ date?: string; followers?: number }> | undefined) ?? [];
    return samples
      .filter((item): item is { date: string; followers: number } => !!item?.date && typeof item.followers === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: item.date,
        label: new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        tooltipLabel: new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        plays: item.followers,
      }));
  }

  private buildListenerSeries(snapshot: SpotifyMetricsSnapshot): Array<{ date: string; value: number }> {
    const debug = snapshot.debug as Record<string, unknown> | undefined;
    const summary = (debug?.['currentListenersSummary'] as Array<{ date?: string; count?: number; listeners?: number; unique?: number }> | undefined) ?? [];
    return summary
      .filter((item): item is { date: string; count?: number; listeners?: number; unique?: number } => !!item?.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: item.date,
        value:
          typeof item.unique === 'number'
            ? item.unique
            : typeof item.listeners === 'number'
              ? item.listeners
              : typeof item.count === 'number'
                ? item.count
                : 0,
      }));
  }

  private buildYouTubeSeries(snapshot: YouTubeMetricsSnapshot): YouTubeDailyPoint[] {
    return (snapshot.series || [])
      .filter((item): item is YouTubeMetricsSnapshot['series'][number] => !!item?.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: item.date,
        label: new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        tooltipLabel: new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        views: item.views,
        estimatedMinutesWatched: item.estimatedMinutesWatched,
        subscribersGained: item.subscribersGained,
        subscribersLost: item.subscribersLost,
        subscribersCurrent: item.subscribersCurrent,
        likes: item.likes,
        comments: item.comments,
        shares: item.shares,
      }));
  }

  private buildYouTubeSummaryCards(key: RangeKey): MetricSummaryCard[] {
    const activeSeries = this.sliceWindow(this.allTimeYouTubeSeries, key);
    const viewsSummary = this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.views);
    const watchTimeSummary = this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.estimatedMinutesWatched);
    const subscribersCurrentSummary = this.buildPointInTimeSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.subscribersCurrent);
    const subscribersSummary = this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.subscribersGained - point.subscribersLost);
    const likesSummary = this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.likes);
    const commentsSummary = this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.comments);
    const sharesSummary = this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.shares);
    const averageDurationSummary = this.buildAverageDurationSummary(activeSeries, this.allTimeYouTubeSeries);

    return [
      {
        label: 'Visualizações',
        value: this.formatNumber(viewsSummary.current),
        change: this.formatPercent(viewsSummary.deltaPercent),
        tone: this.toneFromDelta(viewsSummary.deltaPercent),
        description: 'Visualizações acumuladas no intervalo selecionado.',
        metricKey: 'views',
      },
      {
        label: 'Tempo de exibição',
        value: this.formatDuration(watchTimeSummary.current === null ? null : watchTimeSummary.current * 60),
        change: this.formatPercent(watchTimeSummary.deltaPercent),
        tone: this.toneFromDelta(watchTimeSummary.deltaPercent),
        description: 'Tempo total assistido pelos espectadores no período.',
        metricKey: 'estimatedMinutesWatched',
      },
      {
        label: 'Inscritos',
        value: this.formatNumber(subscribersCurrentSummary.current),
        change: this.formatPercent(subscribersCurrentSummary.deltaPercent),
        tone: this.toneFromDelta(subscribersCurrentSummary.deltaPercent),
        description: 'Número atual de inscritos no canal para o recorte selecionado.',
        metricKey: 'subscribersCurrent',
      },
      {
        label: 'Inscritos líquidos',
        value: this.formatNumber(subscribersSummary.current),
        change: this.formatPercent(subscribersSummary.deltaPercent),
        tone: this.toneFromDelta(subscribersSummary.deltaPercent),
        description: 'Saldo entre inscritos ganhos e perdidos no período.',
        metricKey: 'netSubscribers',
      },
      {
        label: 'Duração média',
        value: this.formatDuration(averageDurationSummary.current),
        change: this.formatPercent(averageDurationSummary.deltaPercent),
        tone: this.toneFromDelta(averageDurationSummary.deltaPercent),
        description: 'Duração média por visualização no período.',
      },
      {
        label: 'Curtidas',
        value: this.formatNumber(likesSummary.current),
        change: this.formatPercent(likesSummary.deltaPercent),
        tone: this.toneFromDelta(likesSummary.deltaPercent),
        description: 'Quantidade de likes recebidos no intervalo selecionado.',
        metricKey: 'likes',
      },
      {
        label: 'Comentários',
        value: this.formatNumber(commentsSummary.current),
        change: this.formatPercent(commentsSummary.deltaPercent),
        tone: this.toneFromDelta(commentsSummary.deltaPercent),
        description: 'Comentários recebidos nos vídeos do período.',
        metricKey: 'comments',
      },
      {
        label: 'Compartilhamentos',
        value: this.formatNumber(sharesSummary.current),
        change: this.formatPercent(sharesSummary.deltaPercent),
        tone: this.toneFromDelta(sharesSummary.deltaPercent),
        description: 'Compartilhamentos realizados nos vídeos do período.',
        metricKey: 'shares',
      },
    ];
  }

  private buildYouTubeRangeSummaries(key: RangeKey): typeof this.activeYouTubeSummary {
    const activeSeries = this.sliceWindow(this.allTimeYouTubeSeries, key);
    return {
      views: this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.views),
      estimatedMinutesWatched: this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.estimatedMinutesWatched),
      subscribersCurrent: this.buildPointInTimeSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.subscribersCurrent),
      netSubscribers: this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.subscribersGained - point.subscribersLost),
      likes: this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.likes),
      comments: this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.comments),
      shares: this.buildWindowSummary(activeSeries, this.allTimeYouTubeSeries, (point) => point.shares),
      averageViewDurationSeconds: this.buildAverageDurationSummary(activeSeries, this.allTimeYouTubeSeries),
    };
  }

  private buildAverageDurationSummary(series: YouTubeDailyPoint[], fullSeries: YouTubeDailyPoint[]): RangeSummary {
    if (!series.length || !fullSeries.length) {
      return { current: null, previous: null, deltaPercent: null };
    }

    const currentViews = series.reduce((total, point) => total + point.views, 0);
    const currentWatchTime = series.reduce((total, point) => total + point.estimatedMinutesWatched, 0);
    const current = currentViews > 0 ? (currentWatchTime * 60) / currentViews : null;

    const endIndex = fullSeries.findIndex((point) => point.date === series[series.length - 1].date);
    if (endIndex < 0) {
      return { current, previous: null, deltaPercent: null };
    }

    const windowSize = series.length;
    const previousEnd = endIndex - windowSize;
    const previousStart = Math.max(0, previousEnd - windowSize + 1);
    const previousSeries = previousEnd >= 0 ? fullSeries.slice(previousStart, previousEnd + 1) : [];
    const previousViews = previousSeries.reduce((total, point) => total + point.views, 0);
    const previousWatchTime = previousSeries.reduce((total, point) => total + point.estimatedMinutesWatched, 0);
    const previous = previousViews > 0 ? (previousWatchTime * 60) / previousViews : null;

    return {
      current,
      previous,
      deltaPercent: current !== null && previous !== null && previous > 0 ? ((current - previous) / previous) * 100 : null,
    };
  }

  private buildPointInTimeSummary<T extends { date: string }>(
    series: T[],
    fullSeries: T[],
    getValue: (point: T) => number
  ): RangeSummary {
    if (!series.length || !fullSeries.length) {
      return { current: null, previous: null, deltaPercent: null };
    }

    const currentPoint = series[series.length - 1];
    const current = getValue(currentPoint);
    const endIndex = fullSeries.findIndex((point) => point.date === currentPoint.date);
    if (endIndex < 0) {
      return { current, previous: null, deltaPercent: null };
    }

    const previousIndex = Math.max(0, endIndex - series.length);
    const previousPoint = fullSeries[previousIndex];
    const previous = getValue(previousPoint);

    return {
      current,
      previous: previous || null,
      deltaPercent: previous > 0 ? ((current - previous) / previous) * 100 : null,
    };
  }

  private buildTrendCard(
    label: string,
    current: number | null,
    previous: number | null,
    deltaPercent: number | null,
    currentLabel: string,
    previousLabel: string
  ): TrendCard {
    return {
      label,
      currentValue: this.formatNumber(current),
      previousValue: this.formatNumber(previous),
      changeLabel: this.formatPercent(deltaPercent),
      tone: this.toneFromDelta(deltaPercent),
      path: this.buildLinePath(previous, current),
      areaPath: this.buildAreaPath(previous, current),
    };
  }

  private buildLinePath(previous: number | null, current: number | null): string {
    const points = this.buildPoints(previous, current);
    if (!points.length) {
      return '';
    }
    const [first, ...rest] = points;
    const controls = this.buildCurveControls(points);
    let path = `M ${first.x} ${first.y}`;
    rest.forEach((point, index) => {
      const control = controls[index];
      path += ` C ${control.c1x} ${control.c1y}, ${control.c2x} ${control.c2y}, ${point.x} ${point.y}`;
    });
    return path;
  }

  private buildAreaPath(previous: number | null, current: number | null): string {
    const points = this.buildPoints(previous, current);
    if (points.length < 2) {
      return '';
    }
    const linePath = this.buildLinePath(previous, current);
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} 110 L ${first.x} 110 Z`;
  }

  private buildPoints(previous: number | null, current: number | null): Array<{ x: number; y: number }> {
    const max = Math.max(previous ?? 0, current ?? 0, 1);
    const scale = (value: number | null, x: number) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return { x, y: 92 };
      }
      const percent = value / max;
      return { x, y: Math.max(14, 92 - Math.round(percent * 72)) };
    };
    return [scale(previous, 10), scale(current, 94)];
  }

  private buildSeriesPath(points: DailyPoint[]): string {
    const svgPoints = this.buildChartCoordinates(points);
    if (!svgPoints.length) {
      return '';
    }
    const [first, ...rest] = svgPoints;
    return rest.reduce((path, point) => `${path} L ${point.x} ${point.y}`, `M ${first.x} ${first.y}`);
  }

  private buildSeriesAreaPath(points: DailyPoint[]): string {
    if (points.length < 2) {
      return '';
    }
    const path = this.buildSeriesPath(points);
    const lastX = 94;
    return `${path} L ${lastX} 110 L 6 110 Z`;
  }

  private buildCurveControls(points: Array<{ x: number; y: number }>): Array<{ c1x: number; c1y: number; c2x: number; c2y: number }> {
    return points.slice(1).map((point, index) => {
      const prev = points[index];
      const midX = (prev.x + point.x) / 2;
      return {
        c1x: midX,
        c1y: prev.y,
        c2x: midX,
        c2y: point.y,
      };
    });
  }

  private buildChartCoordinates(points: DailyPoint[]): ChartPoint[] {
    if (!points.length) {
      return [];
    }

    const values = points.map((point) => point.plays);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    const step = points.length === 1 ? 0 : 100 / (points.length - 1);

    return points.map((point, index) => {
      const x = points.length === 1 ? 50 : 5 + index * step * 0.9;
      const normalized = (point.plays - min) / range;
      const y = Math.max(10, 82 - Math.round(normalized * 64));
      return { ...point, x, y };
    });
  }

  private buildYouTubeSeriesPath(points: YouTubeDailyPoint[]): string {
    const svgPoints = this.buildYouTubeChartCoordinates(points);
    if (!svgPoints.length) {
      return '';
    }
    const [first, ...rest] = svgPoints;
    return rest.reduce((path, point) => `${path} L ${point.x} ${point.y}`, `M ${first.x} ${first.y}`);
  }

  private buildYouTubeSeriesAreaPath(points: YouTubeDailyPoint[]): string {
    if (points.length < 2) {
      return '';
    }
    const path = this.buildYouTubeSeriesPath(points);
    const lastX = 94;
    return `${path} L ${lastX} 110 L 6 110 Z`;
  }

  private buildYouTubeChartCoordinates(points: YouTubeDailyPoint[]): YouTubeChartPoint[] {
    if (!points.length) {
      return [];
    }

    const values = points.map((point) => this.getYouTubeMetricValue(point, this.selectedYouTubeChartMetric));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    const step = points.length === 1 ? 0 : 100 / (points.length - 1);

    return points.map((point, index) => {
      const x = points.length === 1 ? 50 : 5 + index * step * 0.9;
      const normalized = (this.getYouTubeMetricValue(point, this.selectedYouTubeChartMetric) - min) / range;
      const y = Math.max(10, 82 - Math.round(normalized * 64));
      return { ...point, x, y };
    });
  }

  private getYouTubeMetricValue(point: YouTubeDailyPoint, metric: YouTubeChartMetricKey): number {
    switch (metric) {
      case 'estimatedMinutesWatched':
        return point.estimatedMinutesWatched;
      case 'subscribersCurrent':
        return point.subscribersCurrent;
      case 'netSubscribers':
        return point.subscribersGained - point.subscribersLost;
      case 'likes':
        return point.likes;
      case 'comments':
        return point.comments;
      case 'shares':
        return point.shares;
      case 'views':
      default:
        return point.views;
    }
  }

  private youtubeMetricLabel(metric: YouTubeChartMetricKey): string {
    switch (metric) {
      case 'estimatedMinutesWatched':
        return 'Tempo de exibição';
      case 'subscribersCurrent':
        return 'Inscritos';
      case 'netSubscribers':
        return 'Inscritos líquidos';
      case 'likes':
        return 'Curtidas';
      case 'comments':
        return 'Comentários';
      case 'shares':
        return 'Compartilhamentos';
      case 'views':
      default:
        return 'Visualizações';
    }
  }

  formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'n/a';
    }
    const abs = Math.abs(value);
    if (abs >= 100000) {
      return new Intl.NumberFormat('pt-BR', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(value);
    }
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'n/a';
    }
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1).replace('.', ',')}%`;
  }

  formatDuration(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'n/a';
    }

    const rounded = Math.max(0, Math.round(value));
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    const seconds = rounded % 60;

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    }

    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  toneFromDelta(value: number | null | undefined): 'good' | 'warn' | 'muted' {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'muted';
    }
    if (value > 0) {
      return 'good';
    }
    if (value < 0) {
      return 'warn';
    }
    return 'muted';
  }

  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
