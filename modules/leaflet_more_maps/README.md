# Leaflet More Maps

You select your favorite map when you format a single field (eg Geofield) as a
map or when you format a View (of multiple nodes or users) as a map. The module
"IP Geolocation Views and Maps" is particularly good for this.

You can assemble your own map from the available layers at the Leaflet More Maps
configuration page: admin/config/system/leaflet_more_maps. A layer switcher will
automatically appear in the upper right-hand corner.

The included submodule Leaflet Demo introduces a block that you can enable on a
page to showcase all maps available, centered on your current location, or any
other location for which you specify lat/long coordinates.

Not all maps are available at all coordinates and zoom levels.
All maps show at lat=31, long=-89, zoom=4


## FOR PROGRAMMERS

You can add your own map by implementing hook_leaflet_map_info(). See
leaflet_leaflet_map_info() in leaflet.module for an example. Or check out the
Catalonian map with 3 layers defined in leaflet_catalunya_leaflet_map_info(),
file leaflet_more_maps.api.php.

You can alter the default settings of any Leaflet More Maps map on your system
by implementing hook_leaflet_map_info_alter().
In this example snippet the default zoom of all maps is set to 2:

```
  function MYMODULE_leaflet_map_info_alter(&$map_info) {
    foreach ($map_info as $map_id => $info) {
      $map_info[$map_id]['settings']['zoom'] = 2;
      $map_info[$map_id]['label'] += ' ' . t('default zoom=2');
    }
  }
```

## References and licensing terms:

- https://leafletjs.com
- https://www.openstreetmap.org/copyright
- https://www.mapbox.com/legal/tos
- http://maps.stamen.com/
- https://www.thunderforest.com/
- https://www.esri.com/en-us/home
- https://www.google.com/intl/en_au/help/terms_maps/
- https://yandex.ru/legal/maps_termsofuse/?lang=en
- https://www.microsoft.com/en-us/maps/product
