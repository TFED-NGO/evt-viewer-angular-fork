import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { EditionContextService } from '../services/edition-context.service';

@Injectable({
  providedIn: 'root',
})
export class EditionSlugGuard implements CanActivate {
  constructor(
    private editionContext: EditionContextService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const slug = route.paramMap.get('editionSlug');
    if (slug && this.editionContext.isValidSlug(slug)) {
      return true;
    }

    return this.router.createUrlTree(['/']);
  }
}
