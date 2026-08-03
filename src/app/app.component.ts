import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  mosaicTiles: string[] = [];
  private mosaicSourceTiles: string[] = [];
  private mosaicResizeObserver: ResizeObserver | null = null;

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly hostElement: ElementRef<HTMLElement>,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/assets/cover-mosaic.json`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { tiles?: unknown };
      const tiles = Array.isArray(payload.tiles) ? payload.tiles.filter((value): value is string => typeof value === 'string') : [];
      this.mosaicSourceTiles = tiles;
      this.refreshMosaicTiles();
      this.changeDetectorRef.detectChanges();
    } catch {
      this.mosaicSourceTiles = [];
      this.mosaicTiles = [];
      this.changeDetectorRef.detectChanges();
    }
  }

  ngAfterViewInit(): void {
    this.mosaicResizeObserver = new ResizeObserver(() => this.refreshMosaicTiles());
    this.mosaicResizeObserver.observe(this.hostElement.nativeElement);
  }

  ngOnDestroy(): void {
    this.mosaicResizeObserver?.disconnect();
    this.mosaicResizeObserver = null;
  }

  private refreshMosaicTiles(): void {
    if (this.mosaicSourceTiles.length === 0) {
      this.mosaicTiles = [];
      return;
    }

    const tileSize = window.innerWidth <= 700 ? 148 : 230;
    const columns = Math.max(1, Math.ceil(window.innerWidth / tileSize));
    const contentHeight = Math.max(this.hostElement.nativeElement.scrollHeight, window.innerHeight);
    const rows = Math.max(1, Math.ceil(contentHeight / tileSize));
    const requiredTiles = columns * rows;

    this.mosaicTiles = Array.from(
      { length: requiredTiles },
      (_, index) => this.mosaicSourceTiles[index % this.mosaicSourceTiles.length],
    );
  }
}
