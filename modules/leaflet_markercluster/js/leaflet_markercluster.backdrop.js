/**
 * @file
 * Override Backdrop.leaflet.addFeatures to handle markerclusters.
 */
(function ($) {
  'use strict';

  const LEAFLET_MARKERCLUSTER_EXCLUDE_FROM_CLUSTER = 0x01;
  Backdrop.leaflet.addFeatures = function (lMap, features, overlays, popupMinWidth) {
    let len = features.length;
    if (!len) {
      return;
    }
    // Inherit options from map, as markercluster settings are supposed to get
    // added the same way. Unrelated (leaflet) options are ignored.
    let settings = lMap.options;
    // @RdB create marker cluster layers if leaflet.markercluster.js is included
    // There will be one cluster layer for each "clusterGroup".
    let clusterLayers = {};
    if (typeof L.MarkerClusterGroup !== 'undefined') {

      // If we specified a custom cluster icon, use that.
      if (lMap.markercluster_icon) {
        let icon_settings = lMap.markercluster_icon;
        settings.iconCreateFunction = function(cluster) {
          let icon = new L.Icon({iconUrl: icon_settings.iconUrl});

          // override applicable marker defaults
          if (icon_settings.iconSize) {
            icon.options.iconSize = new L.Point(parseInt(icon_settings.iconSize.x), parseInt(icon_settings.iconSize.y));
          }
          if (icon_settings.iconAnchor) {
            icon.options.iconAnchor = new L.Point(parseFloat(icon_settings.iconAnchor.x), parseFloat(icon_settings.iconAnchor.y));
          }
          if (icon_settings.popupAnchor) {
            icon.options.popupAnchor = new L.Point(parseFloat(icon_settings.popupAnchor.x), parseFloat(icon_settings.popupAnchor.y));
          }
          if (icon_settings.shadowUrl !== undefined) {
            icon.options.shadowUrl = icon_settings.shadowUrl;
          }
          if (icon_settings.shadowSize) {
            icon.options.shadowSize = new L.Point(parseInt(icon_settings.shadowSize.x), parseInt(icon_settings.shadowSize.y));
          }
          if (icon_settings.shadowAnchor) {
            icon.options.shadowAnchor = new L.Point(parseInt(icon_settings.shadowAnchor.x), parseInt(icon_settings.shadowAnchor.y));
          }

          return icon;
        };
      }
    }

    for (let i = 0; i < len; i++) {
      let feature = features[i];
      let cluster = (feature.type === 'point' || feature.type === 'json') &&
        (!feature.flags || !(feature.flags & LEAFLET_MARKERCLUSTER_EXCLUDE_FROM_CLUSTER));
      let clusterGroup = 'global';
      if (cluster) {
        if (feature.clusterGroup) {
          clusterGroup = feature.clusterGroup;
        }
        if (!clusterLayers[clusterGroup]) {
          // Note: only applicable settings will be used, remainder are ignored
          clusterLayers[clusterGroup] = new L.MarkerClusterGroup(settings);
          lMap.addLayer(clusterLayers[clusterGroup]);
        }
      }
      let lFeature;

      // dealing with a layer group
      if (feature.group) {
        let lGroup = new L.LayerGroup();
        for (let groupKey in feature.features) {
          let groupFeature = feature.features[groupKey];
          lFeature = Backdrop.leaflet.leaflet_create_feature(groupFeature, lMap);
          lFeature.options.regions = feature.regions;
          if (groupFeature.popup) {
            lFeature.bindPopup(groupFeature.popup);
          }
          lGroup.addLayer(lFeature);

          // Allow others to do something with the feature within a group. //?
          $(document).trigger('leaflet.feature', [lFeature, feature]);
        }

        // add the group to the layer switcher
        overlays[feature.label] = lGroup;

        if (cluster && clusterLayers[clusterGroup])  {
          clusterLayers[clusterGroup].addLayer(lGroup);
        } else {
          lMap.addLayer(lGroup);
        }
      }
      else {
        lFeature = Backdrop.leaflet.leaflet_create_feature(feature, lMap);
        // @RdB add to cluster layer if one is defined, else to map
        if (cluster && clusterLayers[clusterGroup]) {
          lFeature.options.regions = feature.regions;
          clusterLayers[clusterGroup].addLayer(lFeature);
        }
        else {
          lMap.addLayer(lFeature);
        }
        if (feature.popup) {
          lFeature.bindPopup(feature.popup, {minWidth: popupMinWidth});
        }

        // Allow others to do something with the feature. //?
        $(document).trigger('leaflet.feature', [lFeature, feature]);
      }
    }
    return overlays;
  };
})(jQuery);
