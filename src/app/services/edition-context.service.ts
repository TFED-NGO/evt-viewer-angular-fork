import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { SiteConfig, SiteEditionEntry } from '../models/site-config';

@Injectable({
  providedIn: 'root',
})
export class EditionContextService {
  private siteConfigValue: SiteConfig;
  private readonly editionChangeSubject = new BehaviorSubject<string | null>(null);
  private readonly activeEditionSubject = new BehaviorSubject<SiteEditionEntry | null>(null);

  readonly editionChange$ = this.editionChangeSubject.asObservable().pipe(
    filter((slug): slug is string => !!slug),
    distinctUntilChanged(),
  );

  readonly activeEdition$ = this.activeEditionSubject.asObservable();

  readonly activeSlug$: Observable<string> = this.activeEdition$.pipe(
    filter((e): e is SiteEditionEntry => !!e),
    map((e) => e.slug),
    distinctUntilChanged(),
  );

  get siteConfig(): SiteConfig {
    return this.siteConfigValue;
  }

  get activeEdition(): SiteEditionEntry | null {
    return this.activeEditionSubject.getValue();
  }

  get activeSlug(): string | null {
    return this.activeEdition?.slug ?? null;
  }

  get defaultEditionSlug(): string {
    return this.siteConfigValue?.defaultEdition ?? this.enabledEditions[0]?.slug ?? 'pelavicino';
  }

  get enabledEditions(): SiteEditionEntry[] {
    return (this.siteConfigValue?.editions ?? []).filter((e) => e.enabled !== false);
  }

  setSiteConfig(config: SiteConfig): void {
    this.siteConfigValue = config;
  }

  getEditionEntry(slug: string): SiteEditionEntry | undefined {
    return this.enabledEditions.find((e) => e.slug === slug);
  }

  isValidSlug(slug: string): boolean {
    return !!this.getEditionEntry(slug);
  }

  getFileConfigUrl(configBase: string): string {
    const base = configBase.endsWith('/') ? configBase.slice(0, -1) : configBase;
    return `${base}/file_config.json`;
  }

  setActiveEdition(entry: SiteEditionEntry): void {
    this.activeEditionSubject.next(entry);
    this.editionChangeSubject.next(entry.slug);
  }
}
