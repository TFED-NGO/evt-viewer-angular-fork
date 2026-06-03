import { Router } from '@angular/router';
import { parseGhPagesRedirectUrl } from '../utils/gh-pages-url';

/**
 * Fallback if index.html redirect script did not run (e.g. cached bundle order).
 */
export function normalizeGhPagesUrl(router: Router): () => void {
  return () => {
    const target = parseGhPagesRedirectUrl();
    if (target) {
      router.navigateByUrl(target, { replaceUrl: true });
    }
  };
}
