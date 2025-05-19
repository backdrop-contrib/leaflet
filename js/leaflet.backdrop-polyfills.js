/**
 * @file
 */
(function () {
  'use strict';

  // Leaflet-V1-polyfill adds a bunch of global helper functions,
  // let's see what we need - apparently most of them, but not all.
  // @todo verify.
  applyDomUtilPolyfill();
  applyUtilPolyfill();
  applyMouseEventPolyfill();
  applyDomEventPolyfill();
  applyDeprecatedMethodsPolyfill();
  applyFactoryMethodsPolyfill();

})();
