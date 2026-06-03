import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { SiteEditionEntry } from '../models/site-config';
import { EditionContextService } from '../services/edition-context.service';

@Injectable({
  providedIn: 'root',
})
export class EditionResolver implements Resolve<SiteEditionEntry> {
  constructor(
    private appConfig: AppConfig,
    private editionContext: EditionContextService,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<SiteEditionEntry> {
    const slug = route.paramMap.get('editionSlug');
    const entry = this.editionContext.getEditionEntry(slug);
    const fileConfigUrl = this.editionContext.getFileConfigUrl(entry.configBase);

    return from(this.appConfig.loadEditionBundle(fileConfigUrl)).pipe(
      tap(() => this.editionContext.setActiveEdition(entry)),
      map(() => entry),
    );
  }
}
