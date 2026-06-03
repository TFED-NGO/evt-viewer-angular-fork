import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { SiteEditionEntry } from '../models/site-config';

@Injectable({
  providedIn: 'root',
})
export class EditionDefaultViewGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): UrlTree {
    const edition = route.parent?.data?.edition as SiteEditionEntry | undefined;
    const slug = route.parent?.paramMap.get('editionSlug') ?? edition?.slug;
    const view = edition?.defaultViewMode ?? 'readingText';

    return this.router.createUrlTree([slug, view]);
  }
}
