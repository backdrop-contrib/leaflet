/**
 * @file
 * Leaflet-V1-polyfill adds a bunch of global helper functions.
 * We don't need all for 3rd party plugins, but many.
 */
(function () {
  'use strict';

  // Needed by all plugins:
  window.applyDomUtilPolyfill();
  // Needed by fullscreen, markercluster:
  window.applyUtilPolyfill();
  // Needed by markercluster (spiderfy), zoomslider:
  window.applyMouseEventPolyfill();
  // Needed by markercluster:
  window.applyDeprecatedMethodsPolyfill();
  // Needed by fullscreen, zoomslider, viewcenter:
  window.applyFactoryMethodsPolyfill();

})();
