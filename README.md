Leaflet
=======

Maps can be rendered via the included field formatter for Geofield, by using 
the API directly, or by taking advantage of an additional module, like
http://drupal.org/project/ip_geoloc


Installation
------------

- Install this module using the official Backdrop CMS instructions at
  https://backdropcms.org/guide/modules

- The module comes packaged with Leaflet library version 0.7.5, and a set
  of leaflet plugins.
  Alternatively, you can build the library from source. If so, follow the
  instructions at: http://leafletjs.com/download.html#leaflet-source-code

- Enable leaflet_views for using Views and Leaflet (see below), or use the
  display formatters for fields display.


API Usage
---------

Building a map is as simple as calling a single method, leaflet_build_map(),
which takes 3 parameters.

$map (array)
An associative array defining a map. See hook_leaflet_map_info(). The module
defines a default map with a OpenStreet Maps base layer.

$features (array)
This is the tricky part. This is an associative array of all the features you
want to plot on the map. A feature can be a point, linestring, polygon,
multilinestring, multipolygon, or json object. Additionally, features can be
grouped into layer groups so they can be controlled together,
http://leaflet.cloudmade.com/reference.html#layergroup. A feature will look
something like:

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

$height (string)
Height of the map expressed in pixels. Append 'px'. Default: '400px'.

Views integration
-----------------

To render a map using Views, enable the module leaflet_views.

You need to add at least one geofield to the Fields list, and select the 
Leaflet Map style in Format.

In the settings of the style, select the geofield as the Data Source and 
select a field for Title and Description (which will be rendered in the popup).

As a more powerful alternative, you can use node view modes to be rendered in 
the popup. In the Description field, select "<entire node>" and then select a View mode.

For a tutorial, please read http://marzeelabs.org/blog/2012/09/24/building-maps-in-drupal-using-leaflet-views/

Roadmap
-------

* UI for managing maps
* Better documentation

Current Maintainers
-------------------

- Wes Jones (https://github.com/earthday47)
- gifad (https://github.com/gifad)

Credits
-------

- Ported to Backdrop CMS by gifad (https://github.com/gifad)
- Originally written for Drupal by [levelos](http://drupal.org/user/54135) and 
  [pvhee](http://drupal.org/user/108811)
