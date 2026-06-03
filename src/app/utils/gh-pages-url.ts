/**
 * Parses GitHub Pages ?/route redirects into an in-app router URL.
 */
export function parseGhPagesRedirectUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const { search } = window.location;
  if (!search || search.indexOf('?/') !== 0) {
    return null;
  }

  let remainder = search.slice(2);
  const ampIndex = remainder.indexOf('&');
  let routePart = ampIndex === -1 ? remainder : remainder.substring(0, ampIndex);
  let extraQuery = ampIndex === -1 ? '' : remainder.substring(ampIndex);

  routePart = decodeURIComponent(routePart).replace(/%2F/gi, '/');
  if (!routePart) {
    return null;
  }

  if (extraQuery.charAt(0) === '&') {
    extraQuery = '?' + extraQuery.slice(1);
  }

  const path = '/' + routePart.replace(/^\/+/, '');
  return path + extraQuery + (window.location.hash || '');
}
