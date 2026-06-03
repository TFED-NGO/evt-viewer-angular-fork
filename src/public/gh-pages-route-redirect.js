/**
 * GitHub Pages serves 404.html for deep links; that script redirects to ?/route/here.
 * Normalize the URL before Angular boots so path-based routing and reloads work.
 */
(function (global) {
  'use strict';

  var location = global.location;
  if (!location || !location.search || location.search.indexOf('?/') !== 0) {
    return;
  }

  var remainder = location.search.slice(2);
  var ampIndex = remainder.indexOf('&');
  var routePart = ampIndex === -1 ? remainder : remainder.substring(0, ampIndex);
  var extraQuery = ampIndex === -1 ? '' : remainder.substring(ampIndex);

  routePart = decodeURIComponent(routePart).replace(/%2F/gi, '/');
  if (!routePart) {
    return;
  }

  if (extraQuery.charAt(0) === '&') {
    extraQuery = '?' + extraQuery.slice(1);
  }

  var baseElement = document.querySelector('base');
  var baseHref = (baseElement && baseElement.getAttribute('href')) || '/';

  try {
    var baseUrl = new global.URL(baseHref, location.origin);
    var basePath = baseUrl.pathname.replace(/\/$/, '') || '';
    var routePath = '/' + routePart.replace(/^\/+/, '');
    var newPathname = (basePath + routePath).replace(/\/+/g, '/');
    var newUrl = newPathname + extraQuery + (location.hash || '');

    if (location.pathname + location.search + location.hash !== newUrl) {
      global.history.replaceState(null, '', newUrl);
    }
  } catch (err) {
    console.warn('gh-pages-route-redirect:', err);
  }
})(typeof window !== 'undefined' ? window : this);
