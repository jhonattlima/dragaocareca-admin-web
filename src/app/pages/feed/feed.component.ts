import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { forkJoin } from 'rxjs';

type XmlNode = {
  name: string;
  text?: string;
  attributes: Array<{ name: string; value: string }>;
  children: XmlNode[];
  open: boolean;
  depth: number;
};

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  feedTree: XmlNode | null = null;
  feedStatus: { generatedAt: string; publishedCount: number; scheduledCount: number; nextScheduled: { episodeId: number; pubDate: string; title: string } | null } | null = null;
  errorMessage = '';
  loading = true;

  constructor(
    private readonly apiService: ApiService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      feedXml: this.apiService.getFeedPreviewXml(),
      feedStatus: this.apiService.getFeedStatus(),
    }).subscribe({
      next: ({ feedXml, feedStatus }) => {
        this.feedTree = this.parseXml(feedXml);
        this.feedStatus = feedStatus;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Could not load feed.';
        this.loading = false;
      },
    });
  }

  toggleNode(node: XmlNode): void {
    node.open = !node.open;
  }

  private parseXml(xml: string): XmlNode | null {
    const parser = new DOMParser();
    const document = parser.parseFromString(xml, 'application/xml');
    const errorNode = document.querySelector('parsererror');
    if (errorNode) {
      this.errorMessage = 'Could not parse feed XML.';
      return null;
    }

    const root = document.documentElement;
    return this.toNode(root, 0);
  }

  private toNode(element: Element, depth: number): XmlNode {
    const attributes = Array.from(element.attributes).map((attribute) => ({
      name: attribute.name,
      value: attribute.value,
    }));

    const childElements = Array.from(element.children).map((child) => this.toNode(child, depth + 1));
    const textContent = element.childNodes.length
      ? Array.from(element.childNodes)
          .filter((child) => child.nodeType === Node.TEXT_NODE)
          .map((child) => child.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' ')
      : '';

    return {
      name: element.tagName,
      text: textContent || undefined,
      attributes,
      children: childElements,
      open: true,
      depth,
    };
  }
}
