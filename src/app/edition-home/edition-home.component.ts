import { Component } from '@angular/core';
import { SiteEditionEntry } from '../models/site-config';
import { EditionContextService } from '../services/edition-context.service';

@Component({
  selector: 'evt-edition-home',
  templateUrl: './edition-home.component.html',
  styleUrls: ['./edition-home.component.scss'],
})
export class EditionHomeComponent {
  editions: SiteEditionEntry[] = [];

  constructor(private editionContext: EditionContextService) {
    this.editions = this.editionContext.enabledEditions;
  }

  editionLink(entry: SiteEditionEntry): string[] {
    const view = entry.defaultViewMode ?? 'readingText';
    return [entry.slug, view];
  }

  trackEditions(_index: number, item: SiteEditionEntry) {
    return item.slug;
  }
}
