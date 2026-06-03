import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig, EditionConfig } from '../app.config';
import { ViewMode } from '../models/evt-models';
import { SiteEditionEntry } from '../models/site-config';
import { EditionContextService } from '../services/edition-context.service';
import { EVTModelService } from '../services/evt-model.service';
import { EVTStatusService } from '../services/evt-status.service';
import { ThemesService } from '../services/themes.service';
import { EVTBtnClickEvent } from '../ui-components/button/button.component';
import { normalizeUrl } from '../utils/js-utils';

@Component({
  selector: 'evt-main-header',
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss'],
})
export class MainHeaderComponent {
  public title$ = combineLatest([
    of(AppConfig?.evtSettings?.edition?.editionTitle),
    this.evtModelService.title$,
  ]).pipe(
    map(([configTitle, editionTitle]) => configTitle ?? editionTitle ?? 'defaultTitle'),
  );

  public viewModes: ViewMode[] = [];
  public editions: SiteEditionEntry[] = [];
  public activeEditionSlug: string | null = null;
  public currentViewMode$ = this.evtStatusService.currentViewMode$;
  public mainMenuOpened = false;
  public editionConfig: EditionConfig;
  get editionHome() { return normalizeUrl(this.editionConfig?.editionHome); }

  get logoUrl() {
    return AppConfig?.evtSettings?.files?.logoUrl ?? 'assets/images/logo_white.png';
  }

  constructor(
    public themes: ThemesService,
    private evtModelService: EVTModelService,
    private evtStatusService: EVTStatusService,
    private editionContext: EditionContextService,
    private router: Router,
  ) {
    this.editions = this.editionContext.enabledEditions;
    this.editionContext.editionChange$.subscribe(() => this.refreshFromConfig());
    this.editionContext.activeEdition$.subscribe((entry) => {
      this.activeEditionSlug = entry?.slug ?? null;
    });
    if (AppConfig.evtSettings) {
      this.refreshFromConfig();
    }
  }

  private refreshFromConfig() {
    this.editionConfig = AppConfig.evtSettings?.edition;
    this.viewModes = AppConfig.evtSettings?.ui?.availableViewModes?.filter((e) => e.enable) ?? [];
  }

  onEditionSelect(slug: string) {
    const entry = this.editions.find((e) => e.slug === slug);
    if (entry) {
      this.selectEdition(entry);
    }
  }

  selectEdition(entry: SiteEditionEntry) {
    const viewMode = this.evtStatusService.updateViewMode$.getValue()?.id ?? entry.defaultViewMode ?? 'readingText';
    this.router.navigate([entry.slug, viewMode]);
  }

  trackEditions(_index: number, item: SiteEditionEntry) {
    return item.slug;
  }

  selectViewMode(viewMode: ViewMode) {
    this.evtStatusService.updateViewMode$.next(viewMode);
  }

  toggleMainMenu(clickEvent: EVTBtnClickEvent) {
    clickEvent.event.stopPropagation();
    this.mainMenuOpened = !this.mainMenuOpened;
  }

  handleItemClicked(itemClicked: string) {
    if (itemClicked) {
      this.mainMenuOpened = (itemClicked === 'theme' || itemClicked === 'language');
    }
  }

  // tslint:disable-next-line: variable-name
  trackViewModes(_index: number, item: ViewMode) {
    return item.id;
  }

  openEditionHome() {
    if (this.editionHome) {
      window.open(this.editionHome, '_blank');
    }
  }

}
