import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  mosaicTiles: string[] = [];
  private mosaicSourceTiles: string[] = [];

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

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

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshMosaicTiles();
  }

  private refreshMosaicTiles(): void {
    if (this.mosaicSourceTiles.length === 0) {
      this.mosaicTiles = [];
      return;
    }

    const tileSize = window.innerWidth <= 700 ? 148 : 230;
    const columns = Math.max(1, Math.ceil(window.innerWidth / tileSize));
    const rows = Math.max(1, Math.ceil(window.innerHeight / tileSize));
    // One extra row and column prevent gaps caused by centering and browser zoom.
    const requiredTiles = (columns + 1) * (rows + 1);

    this.mosaicTiles = Array.from(
      { length: requiredTiles },
      (_, index) => this.mosaicSourceTiles[index % this.mosaicSourceTiles.length],
    );
  }
}
