import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  mosaicTiles: string[] = [];

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
      this.mosaicTiles = tiles.length > 0 ? Array.from({ length: 4 }, () => tiles).flat() : [];
      this.changeDetectorRef.detectChanges();
    } catch {
      this.mosaicTiles = [];
      this.changeDetectorRef.detectChanges();
    }
  }
}
