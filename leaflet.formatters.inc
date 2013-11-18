<?php

/**
 * Implements hook_field_formatter_info().
 */
function leaflet_field_formatter_info() {
  $formatters = array();

  if (module_exists('geofield')) {
    $formatters['geofield_leaflet'] = array(
      'label' => t('Leaflet'),
      'field types' => array('geofield'),
      'settings' => array(
        'leaflet_map' => '',
        'icon' => '',
        'height' => 400,
        'popup' => 0,
        'options' => '',
      ),
    );
  }

  return $formatters;
}

/**
 * Implements hook_field_formatter_settings_form().
 */
function leaflet_field_formatter_settings_form($field, $instance, $view_mode, $form, &$form_state) {
  $display = $instance['display'][$view_mode];
  $settings = $display['settings'];
  $entity_type = $instance['entity_type'];

  $element = array();

  if ($display['type'] == 'geofield_leaflet') {
    $options = array('' => t('-- Select --'));
    foreach (leaflet_map_get_info() as $key => $map) {
      $options[$key] = t($map['label']);
    }

    $element['leaflet_map'] = array(
      '#title' => t('Leaflet Map'),
      '#type' => 'select',
      '#options' => $options,
      '#default_value' => $settings['leaflet_map'],
      '#required' => TRUE,
    );

    $element['height'] = array(
      '#title' => t('Map Height'),
      '#type' => 'textfield',
      '#default_value' => $settings['height'],
      '#field_suffix' => t('px'),
      '#element_validate' => array('element_validate_integer_positive'),
    );

    $element['popup']['show'] = array(
      '#title' => t('Popup'),
      '#description' => t('Show a popup for single location fields.'),
      '#type' => 'checkbox',
      '#default_value' => $settings['popup']['show'],
    );
    $element['popup']['text'] = array(
      '#title' => t('Popup text'),
      '#description' => t('Enter the text for the popup.'),
      '#type' => 'textfield',
      '#default_value' => $settings['popup']['text'],
      '#states' => array(
        'visible' => array(
          ':input[name$="[popup][show]"]' => array('checked' => TRUE),
        ),
      ),
    );
    $element['popup']['tokens'] = array(
      '#type' => 'container',
      '#theme' => 'token_tree',
      '#token_types' => array($entity_type),
      '#dialog' => TRUE,
      '#states' => array(
        'visible' => array(
          ':input[name$="[popup][show]"]' => array('checked' => TRUE),
        ),
      ),
    );
    $element['options'] = array(
      '#title' => t('Options'),
      '#description' => t('These settings will overwrite the default options and constants shared between vector overlays (Polygon, Polyline, Circle). For mor information visit !url', array('!url' => l(t('dash pattern'), 'https://developer.mozilla.org/en/SVG/Attribute/stroke-dasharray'))),
      '#type' => 'fieldset',
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
    );
    $element['options']['stroke'] = array(
      '#title' => t('Stroke'),
      '#description' => t('Whether to draw stroke along the path. Set it to false to disable borders on polygons or circles. Default: true'),
      '#type' => 'checkbox',
      '#default_value' => isset($settings['options']['stroke']) ? $settings['options']['stroke'] : 1,
    );
    $element['options']['color'] = array(
      '#title' => t('Stroke Color'),
      '#description' => t('Stroke color. Default: #03f'),
      '#type' => 'textfield',
      '#default_value' => isset($settings['options']['color']) ? $settings['options']['color'] : '',
    );
    $element['options']['weight'] = array(
      '#title' => t('Stroke Weight'),
      '#description' => t('Stroke width in pixels. Default: 5'),
      '#type' => 'textfield',
      '#default_value' => isset($settings['options']['weight']) ? $settings['options']['weight'] : '',
    );
    $element['options']['opacity'] = array(
      '#title' => t('Stroke Opacity'),
      '#description' => t('Stroke opacity. Default: 0.5'),
      '#type' => 'textfield',
      '#default_value' => isset($settings['options']['opacity']) ? $settings['options']['opacity'] : '',
    );
    $element['options']['dashArray'] = array(
      '#title' => t('Dash Array'),
      '#description' => t("A string that defines the stroke !url. Doesn't work on canvas-powered layers (e.g. Android 2). Sample: 5, 5", array('!url' => l(t('dash pattern'), 'https://developer.mozilla.org/en/SVG/Attribute/stroke-dasharray'))),
      '#type' => 'textfield',
      '#default_value' => isset($settings['options']['dashArray']) ? $settings['options']['dashArray'] : '',
    );
    $element['options']['fill'] = array(
      '#title' => t('Fill'),
      '#description' => t('Whether to fill the path with color. Set it to false to disable filling on polygons or circles. Default: depends'),
      '#type' => 'checkbox',
      '#default_value' => isset($settings['options']['fill']) ? $settings['options']['fill'] : 1,
    );
    $element['options']['fillColor'] = array(
      '#title' => t('Fill Color'),
      '#description' => t('Fill color. Default: #03f'),
      '#type' => 'textfield',
      '#default_value' => isset($settings['options']['fillColor']) ? $settings['options']['fillColor'] : '',
    );
    $element['options']['fillOpacity'] = array(
      '#title' => t('Fill Opacity'),
      '#description' => t('Fill opacity. Default: 0.2'),
      '#type' => 'textfield',
      '#default_value' => isset($settings['options']['fillOpacity']) ? $settings['options']['fillOpacity'] : '',
    );
    $element['options']['clickable'] = array(
      '#title' => t('Clickable'),
      '#description' => t('If false, the vector will not emit mouse events and will act as a part of the underlying map. Default: true'),
      '#type' => 'checkbox',
      '#default_value' => isset($settings['options']['clickable']) ? $settings['options']['clickable'] : 1,
    );
    foreach($form['#fields'] as $field) {
      $field_options[$field] = $field;
    foreach ($form['#fields'] as $fieldname) {
      $field_options[$fieldname] = $fieldname;
    }
    $fieldpath = 'fields[' . $field['field_name'] . '][settings_edit_form][settings]';
    $element['icon'] = leaflet_form_elements('icon', $settings, array('path' => $fieldpath, 'fields' => $field_options));
  }
  return $element;
}

/**
 * Validation callback for icon urls.
 */
function leaflet_icon_validate($element, &$form_state, $form) {
  if (!empty($element['#value']) && !valid_url($element['#value'])) {
    form_error($element, t('Icon URL is invalid'));
  }
}

/**
 * Implements hook_field_formatter_settings_summary().
 */
function leaflet_field_formatter_settings_summary($field, $instance, $view_mode) {
  $display = $instance['display'][$view_mode];
  $settings = $display['settings'];

  $summary = '';

  if ($display['type'] == 'geofield_leaflet') {
    $summary = t('Leaflet map: @map', array('@map' => $settings['leaflet_map']));
  }

  return $summary;
}

/**
 * Implements hook_field_formatter_view().
 */
function leaflet_field_formatter_view($entity_type, $entity, $field, $instance, $langcode, $items, $display) {
  $element = array();
  $settings = $display['settings'];

  if (count($items) == 0) {
    return '';
  }
  else {
    switch ($display['type']) {
      case 'geofield_leaflet':
        $map = leaflet_map_get_info($settings['leaflet_map']);

        $features = leaflet_process_geofield($items);

        // If only a single feature, set the popup content to the entity title:
        if ($settings['popup'] && count($items) == 1) {
          $features[0]['popup'] = token_replace($settings['popup']['text'], array($entity_type => $entity), array('clear' => TRUE));
        }

        if (!empty($settings['icon'])) {
          $use_html_marker = 'html' == $settings['icon']['iconType'];
          if ($use_html_marker) {
            $icon_display = array(
              'label' => 'hidden',
            );
            $icon_field = field_view_field($entity_type, $entity, $settings['icon']['html'], $icon_display);
            // Clean the user-entered classes.
            $classes = explode(' ', $settings['icon']['htmlClass']);
            array_walk($classes, 'drupal_html_class');
            $classes = implode(' ', $classes);

            foreach ($features as $key => $point) {
              $features[$key]['html'] = render($icon_field);
              $features[$key]['html_class'] = $classes;
            }
          }
          elseif ($settings['icon']['iconUrl']) {
            foreach ($features as $key => $feature) {
              $features[$key]['icon'] = $settings['icon'];
            }
          }
        }

        if (!empty($settings['options'])) {
          foreach ($features as $key => $feature) {
            if ($feature['type'] != 'point') {
              // To avoid overwrite the options with empty values removes all
              // NULL, FALSE and empty Strings and leaves zero values.
              $options = array_filter($settings['options'], 'strlen');
              $features[$key]['options'] = $options;
            }
          }
        }

        $element[0] = array(
          '#markup' => leaflet_render_map($map, $features, $settings['height'] . 'px'),
        );

        break;
    }

    return $element;
  }
}

/**
 * Convert a geofield into an array of map points.
 *
 * @param array $items
 *   A collection of geofield values.
 *
 * @return array
 *   Points built for consumption by the leaflet module as expected by
 * leaflet_render_map().
 */
function leaflet_process_geofield($items = array()) {
  $data = array();

  geophp_load();

  foreach ($items as $delta => $item) {
    // Translate linestring to polyline:
    if ($item['geo_type'] == 'multilinestring') {
      $item['geo_type'] = 'multipolyline';
    }
    // Geofield 7.x-2.x compatibility.
    if (!isset($item['wkt']) && isset($item['geom'])) {
      $item['wkt'] = $item['geom'];
    }
    $datum = array('type' => $item['geo_type']);
    switch ($item['geo_type']) {
      case 'point':
        $datum += array(
          'lat' => (float) $item['lat'],
          'lon' => (float) $item['lon'],
        );

        $data[] = $datum;
        break;

      case 'linestring':
        $geom = geoPHP::load($item['wkt'], 'wkt');
        $components = $geom->getComponents();

        foreach ($components as $component) {
          $datum['points'][] = array(
            'lat' => $component->getY(),
            'lon' => $component->getX(),
          );
        }

        $data[] = $datum;
        break;

      case 'polygon':
        $geom = geoPHP::load($item['wkt'], 'wkt');
        $tmp = $geom->getComponents();
        $components = $tmp[0]->getComponents();

        foreach ($components as $component) {
          $datum['points'][] = array(
            'lat' => $component->getY(),
            'lon' => $component->getX(),
          );
        }

        $data[] = $datum;
        break;

      case 'multipolygon':
        $geom = geoPHP::load($item['wkt'], 'wkt');

        $tmp = $geom->getComponents();
        foreach ($tmp as $polygon) {
          $polygon_component = $polygon->getComponents();
          foreach ($polygon_component as $linestring) {
            $components[] = $linestring;
          }
        }
        foreach ($components as $key => $component) {
          $subcomponents = $component->getComponents();
          foreach ($subcomponents as $subcomponent) {
            $datum['component'][$key]['points'][] = array(
              'lat' => $subcomponent->getY(),
              'lon' => $subcomponent->getX(),
            );
          }
          unset($subcomponent);
        }

        $data[] = $datum;
        break;

      case 'multipolyline':
        $geom = geoPHP::load($item['wkt'], 'wkt');
        $components = $geom->getComponents();
        foreach ($components as $key => $component) {
          $subcomponents = $component->getComponents();
          foreach ($subcomponents as $subcomponent) {
            $datum['component'][$key]['points'][] = array(
              'lat' => $subcomponent->getY(),
              'lon' => $subcomponent->getX(),
            );
          }
          unset($subcomponent);
        }
        break;

      case 'geometrycollection':
        $geom = geoPHP::load($item['wkt'], 'wkt');
        foreach ($geom as $geom_items) {
          foreach ($geom_items as $geom_item) {
            $class = get_class($geom_item);
            switch ($class) {
              case 'Point':
                $datum = array();
                $datum['type'] = 'point';
                $datum += array(
                  'lat' => (float) $geom_item->coords[1],
                  'lon' => (float) $geom_item->coords[0],
                );
                $data[] = $datum;
                break;

              case 'LineString':
                $points = $geom_item->getComponents();
                $datum = array();
                $datum['type'] = 'linestring';
                foreach ($points as $component) {
                  $datum['points'][] = array(
                    'lat' => $component->getY(),
                    'lon' => $component->getX(),
                  );
                }
                $data[] = $datum;
                break;
            }
          }
        }
        break;
    }
  }

  return $data;
}

/**
 * Helper function to standardize forms between views and field formatters.
 * 
 * $group - String
 *  The name of the group element to generate.
 * 
 * $settings - Array
 *  Current form settings (for defaults, etc)
 * 
 * $options - Array
 *  Special options needed for this form element, if necessary.
 * 
 * Return - A fully loaded form element.
 */
function leaflet_form_elements($group, $settings, $options = NULL) {
  $form_element = NULL;
  switch ($group) {
    case 'icon':
      $form_element = array(
        '#title' => t('Point Icon'),
        '#description' => t('These settings will overwrite the icon settings defined in the map definition.'),
        '#type' => 'fieldset',
        '#collapsible' => TRUE,
        '#collapsed' => TRUE,
      );

      $form_element['iconType'] = array(
        '#type' => 'radios',
        '#title' => t('Icon Source'),
        '#default_value' => isset($settings[$group]['iconType']) ? $settings[$group]['iconType'] : 'marker',
        '#options' => array(
          'marker' => "Icon File",
          'html' => "Field (html DivIcon)",
        ),
      );
      $form_element['iconUrl'] = array(
        '#title' => t('Icon URL'),
        '#description' => t('Can be an absolute or relative URL.'),
        '#type' => 'textfield',
        '#maxlength' => 999,
        '#default_value' => isset($settings[$group]['iconUrl']) ? $settings[$group]['iconUrl'] : '',
        '#element_validate' => array('leaflet_icon_validate'),
        '#states' => array(
          'visible' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'marker'),
          ),
        ),
      );
      $form_element['shadowUrl'] = array(
        '#title' => t('Icon Shadow URL'),
        '#type' => 'textfield',
        '#maxlength' => 999,
        '#default_value' => isset($settings[$group]['shadowUrl']) ? $settings[$group]['shadowUrl'] : '',
        '#element_validate' => array('leaflet_icon_validate'),
        '#states' => array(
          'visible' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'marker'),
          ),
        ),
      );
      $form_element['iconSize'] = array(
        '#title' => t('Icon Size'),
        '#type' => 'fieldset',
        '#collapsible' => FALSE,
        '#description' => t('Size of the icon image in pixels.'),
        '#states' => array(
          'visible' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'marker'),
          ),
        ),
      );
      $form_element['iconSize']['x'] = array(
        '#title' => t('Width'),
        '#type' => 'textfield',
        '#maxlength' => 3,
        '#size' => 3,
        '#default_value' => isset($settings[$group]['iconSize']['x']) ? $settings[$group]['iconSize']['x'] : '',
        '#element_validate' => array('element_validate_integer_positive'),
      );
      $form_element['iconSize']['y'] = array(
        '#title' => t('Height'),
        '#type' => 'textfield',
        '#maxlength' => 3,
        '#size' => 3,
        '#default_value' => isset($settings[$group]['iconSize']['y']) ? $settings[$group]['iconSize']['y'] : '',
        '#element_validate' => array('element_validate_integer_positive'),
      );
      $form_element['iconAnchor'] = array(
        '#title' => t('Icon Anchor'),
        '#type' => 'fieldset',
        '#collapsible' => FALSE,
        '#description' => t("The coordinates of the 'tip' of the icon (relative to its top left corner). The icon will be aligned so that this point is at the marker's geographical location."),
        '#states' => array(
          'visible' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'marker'),
          ),
        ),
      );
      $form_element['iconAnchor']['x'] = array(
        '#title' => t('X'),
        '#type' => 'textfield',
        '#maxlength' => 3,
        '#size' => 3,
        '#default_value' => isset($settings[$group]['iconAnchor']['x']) ? $settings[$group]['iconAnchor']['x'] : '',
        '#element_validate' => array('element_validate_number'),
      );
      $form_element['iconAnchor']['y'] = array(
        '#title' => t('Y'),
        '#type' => 'textfield',
        '#maxlength' => 3,
        '#size' => 3,
        '#default_value' => isset($settings[$group]['iconAnchor']['y']) ? $settings[$group]['iconAnchor']['y'] : '',
        '#element_validate' => array('element_validate_number'),
      );
      $form_element['shadowAnchor'] = array(
        '#title' => t('Shadow Anchor'),
        '#type' => 'fieldset',
        '#collapsible' => FALSE,
        '#description' => t('The point from which the shadow is shown.'),
        '#states' => array(
          'visible' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'marker'),
          ),
        ),
      );
      $form_element['shadowAnchor']['x'] = array(
        '#title' => t('X'),
        '#type' => 'textfield',
        '#maxlength' => 3,
        '#size' => 3,
        '#default_value' => isset($settings[$group]['shadowAnchor']['x']) ? $settings[$group]['shadowAnchor']['x'] : '',
        '#element_validate' => array('element_validate_number'),
      );
      $form_element['shadowAnchor']['y'] = array(
        '#title' => t('Y'),
        '#type' => 'textfield',
        '#maxlength' => 3,
        '#size' => 3,
        '#default_value' => isset($settings[$group]['shadowAnchor']['y']) ? $settings[$group]['shadowAnchor']['y'] : '',
        '#element_validate' => array('element_validate_number'),
      );
      $form_element['popupAnchor'] = array(
        '#title' => t('Popup Anchor'),
        '#type' => 'fieldset',
        '#collapsible' => FALSE,
        '#description' => t('The point from which the marker popup opens, relative to the anchor point.'),
        '#states' => array(
          'visible' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'marker'),
          ),
        ),
      );
      $form_element['popupAnchor']['x'] = array(
        '#title' => t('X'),
        '#type' => 'textfield',
        '#maxlength' => 3,
        '#size' => 3,
        '#default_value' => isset($settings[$group]['popupAnchor']['x']) ? $settings[$group]['popupAnchor']['x'] : '',
        '#element_validate' => array('element_validate_number'),
      );
      $form_element['popupAnchor']['y'] = array(
        '#title' => t('Y'),
        '#type' => 'textfield',
        '#maxlength' => 3,
        '#size' => 3,
        '#default_value' => isset($settings[$group]['popupAnchor']['y']) ? $settings[$group]['popupAnchor']['y'] : '',
        '#element_validate' => array('element_validate_number'),
      );
      $form_element['html'] = array(
        '#type' => 'select',
        '#title' => t('Marker HTML field'),
        '#description' => t('Views field to use as output for a map marker.'),
        '#options' => array_merge(array('' => ''), $options['fields']),
        '#default_value' => isset($settings[$group]['html']) ? $settings[$group]['html'] : '',
        '#states' => array(
          'visible' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'html'),
          ),
          'required' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'html'),
          ),
        ),
      );
      $form_element['htmlClass'] = array(
        '#type' => 'textfield',
        '#title' => t('Marker HTML class'),
        '#description' => t('Optional class name for the div used to wrap field output. For multiple classes, separate with a space.'),
        '#default_value' => isset($settings[$group]['htmlClass']) ? $settings[$group]['htmlClass'] : '',
        '#states' => array(
          'visible' => array(
            ':input[name="' . $options['path'] . '[icon][iconType]"]' => array('value' => 'html'),
          ),
        ),
      );
      break;

  }
  return $form_element;
}
