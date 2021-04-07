# Leaflet Markercluster

There are no permissions or settings to configure. If this module is enabled,
it works out-of-the-box for all maps created by the Geofield formatter or
Leaflet Views module.

This module does not itself have a UI to set MarkerCluster configuration
parameters. However parameters may be set through Backdrop code as part of the
creation of the map and will thus be passed to the underlying javascript
library. See the section below.


## FOR PROGRAMMERS

You can set Leaflet MarkerCluster parameters in the same way that you set
Leaflet map parameters.

Example:
```
  $map_id = 'OSM Mapnik'; // default map that comes with Leaflet
  $map = leaflet_map_get_info($map_id);

  $map['settings']['zoom']                    = 10; // Leaflet parameter
  $map['settings']['maxClusterRadius']        = 50; // Leaflet MarkerCluster parameter
  $map['settings']['disableClusteringAtZoom'] = 2;  // Leaflet MarkerCluster parameter

  $features = ... // see the README.txt of the Leaflet module

  $output = '<div>' . leaflet_render_map($map, $features, '300px') . '</div>';
```

The following MarkerCluster parameters may be configured this way:
```
  animateAddingMarkers (default: FALSE)
  disableClusteringAtZoom (NULL)
  maxClusterRadius (80)
  showCoverageOnHover (TRUE)
  singleMarkerMode (FALSE)
  skipDuplicateAddTesting (FALSE)
  spiderfyOnMaxZoom (TRUE)
  zoomToBoundsOnClick (TRUE)
  addRegionToolTips (FALSE)
```

### See the bottom reference for an explanation of these parameters.

References:

- https://leafletjs.com/reference-1.7.1.html
- https://github.com/Leaflet/Leaflet.markercluster
