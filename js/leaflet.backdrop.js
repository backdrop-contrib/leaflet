/**
 * @file
 * Leaflet class extensions and backdrop behavior.
 */
(function ($) {
  'use strict';

  // Zoomswitch method cribbed liberally from:
  // http://www.makina-corpus.org/blog/leaflet-zoom-switcher
  L.TileLayerZoomSwitch = L.TileLayer.extend({
    includes: L.Evented.prototype,
    options: {
      // switchZoomUnder: when zoom < switchZoomUnder, then switch to switchLayer
      switchZoomUnder: -1,
      // switchZoomAbove: when zoom >= switchZoomAbove, then switch to switchLayer
      switchZoomAbove: -1,
      switchLayer: null
    },
    setSwitchLayer: function (layer) {
      this.options.switchLayer = layer;
    },
    getSwitchZoomUnder: function () {
      return this.options.switchZoomUnder;
    },
    getSwitchZoomAbove: function () {
      return this.options.switchZoomAbove;
    },
    getSwitchLayer: function () {
      return this.options.switchLayer;
    }
  });

  /**
   * Obviously not in use here, but keep it for bc.
   */
  L.tileLayerZoomSwitch = function (url, options) {
    return new L.TileLayerZoomSwitch(url, options);
  };

  /**
   * SwitchLayerManager is a custom class for managing base layer automatic
   * switching according to the current zoom level
   */
  const SwitchLayerManager = L.Class.extend({
    _map: null,
    options: {
      baseLayers: null
    },
    initialize: function (map, options) {
      this._map = map;
      L.Util.setOptions(this, options);

      this._map.on({
        'zoomend': this._update
      }, this);
    },
    _update: function (e) {
      var zoom = this._map.getZoom();
      for (let i in this.options.baseLayers) {
        var curBL = this.options.baseLayers[i];
        var zoomUnder = curBL.getSwitchZoomUnder();
        var zoomAbove = curBL.getSwitchZoomAbove();
        var switchLayer = curBL.getSwitchLayer();

        // If layer got a switchlayer, and if layer actually displayed
        if (switchLayer && curBL._map !== null) {
          if(zoomUnder !== -1 && zoom < zoomUnder) {
            this._map.removeLayer(curBL);
            this._map.addLayer(switchLayer, false);
          }
          if(zoomAbove !== -1 && zoom >= zoomAbove) {
            this._map.removeLayer(curBL);
            this._map.addLayer(switchLayer, false);
          }
        }
      }
    }
  });

  Backdrop.behaviors.leaflet = {
    attach:function (context, backdropSettings) {

      $(backdropSettings.leaflet).each(function () {
        // skip to the next iteration if the map already exists
        var container = L.DomUtil.get(this.mapId);
        if (!container || container._leaflet_id || container._leaflet) {
          return;
        }

        // New setting - defensive handling.
        var popupMinWidth = 50;
        if (this.map.popupMinWidth !== 'undefined') {
          popupMinWidth = this.map.popupMinWidth;
        }

        // load a settings object with all of our map settings
        var settings = {
          'fullscreenControl': true,
        };
        for (let setting in this.map.settings) {
          settings[setting] = this.map.settings[setting];
        }
        settings.zoomControl = false; // replaced by L.Control.Zoomslider

        // Workaround for Safari bug.
        // @see https://github.com/backdrop-contrib/leaflet/issues/17
        settings.tap = false;

        // instantiate our new map
        var lMap = new L.Map(this.mapId, settings);
        lMap.bounds = [];

        // add map layers
        var layers = {}, overlays = {};
        var i = 0;
        for (let key in this.map.layers) {
          var layer = this.map.layers[key];
          var map_layer = Backdrop.leaflet.create_layer(layer, key);

          // keep the reference of first layer
          // Distinguish between "base layers" and "overlays", fallback to "base"
          // in case "layer_type" has not been defined in hook_leaflet_map_info()
          layer.layer_type = (typeof layer.layer_type === 'undefined') ? 'base' : layer.layer_type;
          // as written in the doc (http://leafletjs.com/examples/layers-control.html)
          // Always add overlays layers when instantiate, and keep track of
          // them for Control.Layers.
          // Only add the very first "base layer" when instantiating the map
          // if we have map controls enabled
          switch (layer.layer_type) {
            case 'overlay':
              //Enable overlay layers if enabled is set to true
              if (layer.enabled) {
                lMap.addLayer(map_layer);
              }
              overlays[key] = map_layer;
              break;
            default:
              if (i === 0 || !this.map.settings.layerControl) {
                lMap.addLayer(map_layer);
                i++;
              }
              layers[key] = map_layer;
              break;
          }
          i++;
        }
        // We loop through the layers once they have all been created to connect them to their switchlayer if necessary.
        var switchEnable = false;
        for (let key in layers) {
          if (layers[key].options.switchLayer) {
            layers[key].setSwitchLayer(layers[layers[key].options.switchLayer]);
            switchEnable = true;
          }
        }
        if (switchEnable) {
          new SwitchLayerManager(lMap, {baseLayers: layers});
        }

        // keep an instance of leaflet layers
        this.map.lLayers = layers;

        // keep an instance of map_id
        this.map.map_id = this.mapId;

        // Add features, update overlays.
        overlays = Backdrop.leaflet.addFeatures(lMap, this.features, overlays, popupMinWidth);

        // add layer switcher
        if (this.map.settings.layerControl) {
          lMap.addControl(new L.Control.Layers(layers, overlays));
        }

        // add scale control //+
          lMap.addControl(new L.control.scale({imperial: false}));

        // add Zoomslider control //+
          lMap.addControl(new L.Control.Zoomslider());

        // Small box with lat/lon coordinates of mouse click event on map.
        var c = new L.Control.Coordinates({
          promptText: Backdrop.t('Press Ctrl+C to copy coordinates'),
          precision: 5
        });
        c.addTo(lMap);
        lMap.on('click', function(e) {
          c.setCoordinates(e);
          // Hide the coordinates box again after 4 seconds.
          if (typeof this.hideTimer !== 'undefined') {
            clearTimeout(this.hideTimer);
          }
          this.hideTimer = window.setTimeout(function() {
            c._container.classList.add('hidden');
          }, 4000);
        });

        let zoom = this.map.settings.zoom ? this.map.settings.zoom : this.map.settings.zoomDefault;
        // Init ViewCenter plugin with some defaults.
        let viewCenter = new L.Control.ViewCenter({
          position: 'topleft',
          title: Backdrop.t('Back to the starting point'),
          forceSeparateButton: true,
          vcLatLng: [0, 0],
          vcZoom: zoom
        });
        lMap.addControl(viewCenter);

        // center the map
        if (this.map.center && (this.map.center.force || this.features.length === 0)) {
          lMap.setView(new L.LatLng(this.map.center.lat, this.map.center.lon), zoom);
        }
        else if (this.features.length > 0) {
          Backdrop.leaflet.fitbounds(lMap);
          if (this.map.settings.zoom) { // or: if (zoom) ?
            lMap.setZoom(zoom);
          }
        }
        else if (this.map.center === undefined) {
          // No points, for instance an empty views result and no default
          // center set. This prevents js errors in the library.
          lMap.setView(new L.LatLng(0, 0), this.map.settings.minZoom);

          // Center to current position, if module geoip_tokens is available.
          // We get the values via ajax, so there might be a slight delay.
          if (typeof Backdrop.geoipTokens === 'object') {
            if (typeof Backdrop.geoipTokens.getData === 'function') {
              Backdrop.geoipTokens.getData('latlon').done(function (data) {
                lMap.setView(new L.LatLng(data.latitude, data.longitude), zoom);
                viewCenter.options.vcLatLng = [data.latitude, data.longitude];
              });
            }
          }
        }

        // Associate the center and zoom level proprerties to the built lMap.
        // useful for post-interaction with it
        lMap.center = lMap.getCenter();
        lMap.zoom = lMap.getZoom();

        // Update viewCenter options.
        viewCenter.options.vcLatLng = [lMap.center.lat, lMap.center.lng];
        viewCenter.options.vcZoom = lMap.zoom;

        // add attribution
        if (this.map.settings.attributionControl && this.map.attribution) {
          lMap.attributionControl.setPrefix(this.map.attribution.prefix);
          lMap.attributionControl.addAttribution(this.map.attribution.text);
        }

        // add the leaflet map to our settings object to make it accessible
        this.lMap = lMap;

        // allow other modules to get access to the map object using jQuery's trigger method
        $(document).trigger('leaflet.map', [this.map, lMap]);

        // Destroy features so that an AJAX reload does not get parts of the old set.
        // Required when the View has "Use AJAX" set to Yes.
        this.features = null;
      });
    }
  };

  /**
   * Utility functions.
   */
  Backdrop.leaflet = {
    isOldVersion: function () {
      // Since the lib ships with this module, this check is obsolete.
      // Keep for bc, just in case someone uses it.
      return false;
    },
    leaflet_create_feature: function (feature, lMap) {
      var lFeature;
      switch (feature.type) {
        case 'point':
          lFeature = Backdrop.leaflet.create_point(feature, lMap);
          break;
        case 'linestring':
          lFeature = Backdrop.leaflet.create_linestring(feature, lMap);
          break;
        case 'polygon':
          lFeature = Backdrop.leaflet.create_polygon(feature, lMap);
          break;
        case 'multipolyline':
          feature.multipolyline = true;
          // no break;
          /* falls through */
        case 'multipolygon':
          lFeature = Backdrop.leaflet.create_multipoly(feature, lMap);
          break;
        case 'json':
          lFeature = Backdrop.leaflet.create_json(feature.json, lMap);
          break;
        case 'popup':
          lFeature = Backdrop.leaflet.create_popup(feature, lMap);
          break;
        case 'circle':
          lFeature = Backdrop.leaflet.create_circle(feature, lMap);
          break;
        case 'circlemarker':
          lFeature = Backdrop.leaflet.create_circlemarker(feature, lMap);
          break;
        case 'rectangle':
          lFeature = Backdrop.leaflet.create_rectangle(feature, lMap);
          break;
      }

      // assign our given unique ID, useful for associating nodes
      if (feature.leaflet_id) {
        lFeature._leaflet_id = feature.leaflet_id;
      }

      var options = {};
      if (feature.options) {
        for (var option in feature.options) {
          options[option] = feature.options[option];
        }
        lFeature.setStyle(options);
      }

      return lFeature;
    },
    /**
     * @param object lMap
     *   Leaflet map.
     * @param array features
     *   Array of feature objects.
     * @param object overlays
     *   Overlay objects, keyed by name.
     * @param int popupMinWidth
     *
     * @return object
     *   Updated overlays or original object.
     */
    addFeatures: function (lMap, features, overlays, popupMinWidth) {
      let len = features.length;
      for (let i = 0; i < len; i++) {
        var feature = features[i];
        var lFeature;

        // dealing with a layer group
        if (feature.group) {
          var lGroup = new L.LayerGroup();
          for (var groupKey in feature.features) {
            var groupFeature = feature.features[groupKey];
            lFeature = Backdrop.leaflet.leaflet_create_feature(groupFeature, lMap);
            if (groupFeature.popup) {
              lFeature.bindPopup(groupFeature.popup);
            }
            lGroup.addLayer(lFeature);

            // Allow others to do something with the feature within a group.
            $(document).trigger('leaflet.feature', [lFeature, feature]);
          }

          // add the group to the layer switcher
          overlays[feature.label] = lGroup;

          lMap.addLayer(lGroup);
        }
        else {
          lFeature = Backdrop.leaflet.leaflet_create_feature(feature, lMap);
          lMap.addLayer(lFeature);

          if (feature.popup) {
            lFeature.bindPopup(feature.popup, {minWidth: popupMinWidth});
          }

          // Allow others to do something with the feature.
          $(document).trigger('leaflet.feature', [lFeature, feature]);
        }

      }
      // Return updated overlays.
      return overlays;
    },
    create_layer: function (layer, key) {
      let map_layer;
      if (layer.type === 'wms') {
        // WMS layers require options.
        map_layer = new L.tileLayer.wms(layer.urlTemplate, layer.options);
      }
      else {
        // Use a Zoomswitch Layer extension to enable zoom-switch option.
        map_layer = new L.TileLayerZoomSwitch(layer.urlTemplate);
      }
      map_layer._leaflet_id = key;

      if (layer.options) {
        for (var option in layer.options) {
          map_layer.options[option] = layer.options[option];
        }
      }

      // layers served from TileStream need this correction in the y coordinates
      // TODO: Need to explore this more and find a more elegant solution
      if (layer.type === 'tilestream') {
        map_layer.getTileUrl = function (tilePoint) {
          this._adjustTilePoint(tilePoint);
          var zoom = this._getZoomForUrl();
          return L.Util.template(this._url, L.Util.extend({
            s: this._getSubdomain(tilePoint),
            z: zoom,
            x: tilePoint.x,
            y: Math.pow(2, zoom) - tilePoint.y - 1
          }, this.options));
        };
      }
      return map_layer;
    },
    create_circle: function(circle, lMap) {
      var latLng = new L.LatLng(circle.lat, circle.lon);
      latLng = latLng.wrap();
      lMap.bounds.push(latLng);
      if (circle.radius) {
        // @deprecated
        return L.circle(latLng, circle.radius, circle.options);
      }
      return new L.Circle(latLng, circle.options);
    },
    create_circlemarker: function(circle, lMap) {
      var latLng = new L.LatLng(circle.lat, circle.lon);
      latLng = latLng.wrap();
      lMap.bounds.push(latLng);
      return new L.CircleMarker(latLng, circle.options);
    },
    create_rectangle: function(box, lMap) {
      var bounds = box.bounds,
        southWest = new L.LatLng(bounds.s, bounds.w),
        northEast = new L.LatLng(bounds.n, bounds.e),
        latLng = new L.LatLngBounds(southWest, northEast);
      lMap.bounds.push(latLng);
      return new L.Rectangle(latLng, box.settings);
    },
    create_point: function(marker, lMap) {
      var latLng = new L.LatLng(marker.lat, marker.lon);
      latLng = latLng.wrap();
      lMap.bounds.push(latLng);
      var lMarker;

      if (marker.html) {
        let icon;
        if (marker.html_class) {
          icon = new L.DivIcon({html: marker.html, className: marker.html_class});
        }
        else {
          icon = new L.DivIcon({html: marker.html});
        }
        // override applicable marker defaults
        if (marker.icon.iconSize) {
          icon.options.iconSize = new L.Point(parseInt(marker.icon.iconSize.x, 10), parseInt(marker.icon.iconSize.y, 10));
        }
        if (marker.icon.iconAnchor) {
          icon.options.iconAnchor = new L.Point(parseFloat(marker.icon.iconAnchor.x), parseFloat(marker.icon.iconAnchor.y));
        }
        lMarker = new L.Marker(latLng, {icon:icon});
      }
      else if (marker.icon) {
        let icon = new L.Icon({iconUrl: marker.icon.iconUrl});

        // override applicable marker defaults
        if (marker.icon.iconSize) {
          icon.options.iconSize = new L.Point(parseInt(marker.icon.iconSize.x, 10), parseInt(marker.icon.iconSize.y, 10));
        }
        if (marker.icon.iconAnchor) {
          icon.options.iconAnchor = new L.Point(parseFloat(marker.icon.iconAnchor.x), parseFloat(marker.icon.iconAnchor.y));
        }
        if (marker.icon.popupAnchor) {
          icon.options.popupAnchor = new L.Point(parseFloat(marker.icon.popupAnchor.x), parseFloat(marker.icon.popupAnchor.y));
        }
        if (marker.icon.shadowUrl !== undefined) {
          icon.options.shadowUrl = marker.icon.shadowUrl;
        }
        if (marker.icon.shadowSize) {
          icon.options.shadowSize = new L.Point(parseInt(marker.icon.shadowSize.x, 10), parseInt(marker.icon.shadowSize.y, 10));
        }
        if (marker.icon.shadowAnchor) {
          icon.options.shadowAnchor = new L.Point(parseInt(marker.icon.shadowAnchor.x, 10), parseInt(marker.icon.shadowAnchor.y, 10));
        }
        if (marker.icon.zIndexOffset) {
          icon.options.zIndexOffset = marker.icon.zIndexOffset;
        }
        if (marker.icon.className) {
          icon.options.className = marker.icon.className;
        }
        var options = {icon:icon};
        if (marker.zIndexOffset) {
          options.zIndexOffset = marker.zIndexOffset;
        }
        lMarker = new L.Marker(latLng, options);
      }
      else {
        lMarker = new L.Marker(latLng);
      }

      if (marker.label) {
        lMarker.options.title = marker.label;
      }

      return lMarker;
    },
    create_linestring: function(polyline, lMap) {
      var latlngs = [];
      for (var i = 0; i < polyline.points.length; i++) {
        var latlng = new L.LatLng(polyline.points[i].lat, polyline.points[i].lon);
        latlng = latlng.wrap();
        latlngs.push(latlng);
        lMap.bounds.push(latlng);
      }
      return new L.Polyline(latlngs);
    },
    create_polygon: function(polygon, lMap) {
      var latlngs = [];
      for (var i = 0; i < polygon.points.length; i++) {
        var latlng = new L.LatLng(polygon.points[i].lat, polygon.points[i].lon);
        latlng = latlng.wrap();
        latlngs.push(latlng);
        lMap.bounds.push(latlng);
      }
      return new L.Polygon(latlngs);
    },
    create_multipoly: function(multipoly, lMap) {
      var polygons = [];
      for (var x = 0; x < multipoly.component.length; x++) {
        var latlngs = [];
        var polygon = multipoly.component[x];
        for (var i = 0; i < polygon.points.length; i++) {
          var latlng = new L.LatLng(polygon.points[i].lat, polygon.points[i].lon);
          latlng = latlng.wrap();
          latlngs.push(latlng);
          lMap.bounds.push(latlng);
        }
        polygons.push(latlngs);
      }
      return multipoly.multipolyline ? new L.Polyline(polygons): new L.Polygon(polygons);
    },
    create_json:function(json, lMap) {
      let lJSON = new L.GeoJSON(json, {
        onEachFeature:function (feature, layer) {
          var has_properties = (typeof feature.properties !== 'undefined');

          // bind popups
          if (has_properties && typeof feature.properties.popup !== 'undefined') {
            layer.bindPopup(feature.properties.popup);
          }

          for (var layer_id in layer._layers) {
            for (var i in layer._layers[layer_id]._latlngs) {
              lMap.bounds.push(layer._layers[layer_id]._latlngs[i]);
            }
          }

          if (has_properties && typeof feature.properties.style !== 'undefined') {
            layer.setStyle(feature.properties.style);
          }

          if (has_properties && typeof feature.properties.leaflet_id !== 'undefined') {
            layer._leaflet_id = feature.properties.leaflet_id;
          }
        }
      });

      return lJSON;
    },
    create_popup: function(popup) {
      var latLng = new L.LatLng(popup.lat, popup.lon);
      this.bounds.push(latLng);
      var lPopup = new L.Popup();
      lPopup.setLatLng(latLng);
      if (popup.content) {
        lPopup.setContent(popup.content);
      }
      return lPopup;
    },
    fitbounds: function (lMap) {
      if (lMap.bounds.length > 0) {
        lMap.fitBounds(new L.LatLngBounds(lMap.bounds));
      }
    }
  };
})(jQuery);
