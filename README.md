# Leaflet

Integration with a recent version of the [Leaflet](https://leafletjs.com/) JS
 mapping library, a modern, lightweight Open-Source library for interactive
 maps.

*The Leaflet module features:*

- Field formatter for the [Geofield](https://backdropcms.org/project/geofield)
  to render geospatial data as maps (main module)
- Views integration that plots data on a map (using the sub module Leaflet Views)
- Animated marker clustering functionality using the Leaflet MarkerCluster library
  (in a sub module)
- A lot more attractive map styles from a variety of providers (in another sub module)
- A demo block for all those map styles (in its own sub module)
- Lightweight and easy to use API for defining maps and displaying data on a map

**Coming from Drupal 7?**

The formerly extra contrib projects *Leaflet Markercluster* and *Leaflet More
Maps* now both ship with this module. And so do the required Javascript
libraries. This makes the Leaflet module your "one-stop shop" for mapping in
Backdrop.


## Installation

- Install this module using the
  [official Backdrop CMS instructions](https://docs.backdropcms.org/documentation/extend-with-modules)

- The module comes packaged with Leaflet library, and a set of leaflet plugins.

## Related modules

The [Leaflet Widget](https://backdropcms.org/project/leaflet_widget)
 utilizes this module's library to input Geospacial data by interactively
 setting markers on a map. Recommended if you don't want to deal with
 [geocoding](https://backdropcms.org/project/geocoder).

If you need a *legacy version* of the leaflet library:
 [Leaflet library](https://backdropcms.org/project/leaflet_lib) ships with
 version 1.2.0. Note that the library module is no dependency of this
 module, as this one ships with the most recent version of Leaflet.

## Issues

Bugs and feature requests should be reported in the
[Issue Queue](https://github.com/backdrop-contrib/leaflet/issues).


## Views integration

To render a map using Views, enable the module leaflet_views.

You need to add at least one geofield to the Fields list, and select the
Leaflet Map style in Format.

In the settings of the style, select the geofield as the Data Source and
select a field for Title and Description (which will be rendered in the popup).

As a more powerful alternative, you can use node view modes to be rendered in
the popup. In the Description field, select "<entire node>" and then select a View mode.

For a tutorial, please read this (relatively old) blog post
https://marzeelabs.org/blog/2012-09-24-building-maps-in-drupal-using-leaflet-views


## API Usage

Building a map is as simple as calling a single method, `leaflet_build_map()`,
which takes 3 parameters.

`$map` (array)
An associative array defining a map. See `hook_leaflet_map_info()`. The module
defines a default map with a OpenStreet Maps base layer.

`$features` (array)
This is the tricky part. This is an associative array of all the features you
want to plot on the map. A feature can be a point, linestring, polygon,
multilinestring, multipolygon, or json object. Additionally, features can be
grouped into layer groups so they can be controlled together,
http://leaflet.cloudmade.com/reference.html#layergroup. A feature will look
something like:

```php
$features = array(
  array(
    'type' => 'point',
    'lat' => 12.32,
    'lon' => 123.45,
    'icon' => array(
      'iconUrl' => 'sites/default/files/mymarker.png'
    ),
    'popup' => l($node->title, 'node/' . $node->nid),
    'leaflet_id' => 'some unique ID'
  ),
  array(
    'type' => 'linestring',
    'points' => array(
      0 => array('lat' => 13.24, 'lon' => 123.2),
      1 => array('lat' => 13.24, 'lon' => 123.2),
      2 => array('lat' => 13.24, 'lon' => 123.2),
      3 => array('lat' => 13.24, 'lon' => 123.2),
      4 => array('lat' => 13.24, 'lon' => 123.2),
    ),
    'popup' => l($node->title, 'node/' . $node->nid),
    'leaflet_id' => 'some unique ID'
  ),
  array(
    'type' => 'json',
    'json' => [JSON OBJECT],
    'properties' = array(
      'style' => [style settings],
      'leaflet_id' => 'some unique ID'
    )
  )
);
```

`$height` (string)
Height of the map expressed in pixels. Append 'px'. Default: '400px'.

## Current Maintainers

- Wes Jones (https://github.com/earthday47)
- Indigoxela (https://github.com/indigoxela)

## Credits

- Ported to Backdrop CMS by gifad (https://www.drupal.org/u/gifad)
- Originally written for Drupal by [levelos](http://drupal.org/user/54135) and 
  [pvhee](http://drupal.org/user/108811)

This module wouldn't be possible without the fabulous [Leaflet](https://leafletjs.com/)
Javascript library, see their [LICENSE file](https://github.com/Leaflet/Leaflet/blob/master/LICENSE)
for details.

The also bundled Leaflet.markercluster library by the same team uses
[MIT License](https://github.com/Leaflet/Leaflet.markercluster/blob/master/MIT-LICENCE.txt)

This module also ships with several Leaflet plugins, see the README.md file in
the libraries/leaflet_plugins directory for details.

The default map style provided by the main module is "OSM Mapnik", which
relies on [OpenStreetMap](https://www.openstreetmap.org/copyright) data.


## License

This project is GPL v2 software. See the LICENSE.txt file in this directory for complete text.
