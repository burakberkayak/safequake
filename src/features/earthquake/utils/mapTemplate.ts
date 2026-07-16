import { Earthquake } from '../types/earthquake.types';

export const getLeafletMapTemplate = (theme: 'light' | 'dark'): string => {
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>SafeQuake Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: ${theme === 'dark' ? '#121212' : '#f5f5f5'};
    }
    
    /* Custom pulsing marker animation for focused earthquake & user location */
    @keyframes pulse {
      0% {
        transform: scale(0.85);
        opacity: 0.5;
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      70% {
        transform: scale(1.1);
        opacity: 1;
        box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
      }
      100% {
        transform: scale(0.85);
        opacity: 0.5;
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
    }
    .pulsing-marker {
      border-radius: 50%;
      animation: pulse 1.8s infinite ease-in-out;
    }

    @keyframes user-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.4);
      }
      70% {
        box-shadow: 0 0 0 15px rgba(0, 122, 255, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
      }
    }
    .user-location-pulse {
      border-radius: 50%;
      animation: user-pulse 2s infinite ease-in-out;
    }

    /* Leaflet popup customization */
    .leaflet-popup-content-wrapper {
      background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
      color: ${theme === 'dark' ? '#ffffff' : '#000000'};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 1px solid ${theme === 'dark' ? '#333333' : '#e0e0e0'};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
    }
    .leaflet-popup-tip {
      background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
    }
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    window.onerror = function(message, source, lineno, colno, error) {
      var errData = JSON.stringify({
        type: 'CONSOLE_ERROR',
        payload: { message: message, line: lineno, source: source }
      });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(errData);
      } else {
        window.parent.postMessage(errData, '*');
      }
      return false;
    };
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([39.0, 35.0], 6); // Default centered on Turkey

    // Add CartoDB Tile Layer
    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${attribution}'
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' }).addTo(map);

    var earthquakesGroup = L.layerGroup().addTo(map);
    var locationsGroup = L.layerGroup().addTo(map);
    var userLocationGroup = L.layerGroup().addTo(map);

    var userMarker = null;
    var focusedMarker = null;

    // SVGs for custom layer markers
    var SVGS = {
      shelter: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      hospital: '<svg viewBox="0 0 24 24" width="12" height="12" fill="#ffffff"><path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/></svg>',
      pharmacy: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>'
    };

    // Helper to get color by magnitude
    function getMagColor(mag) {
      if (mag >= 5.0) return '#ef4444'; // Red
      if (mag >= 4.0) return '#f97316'; // Orange
      if (mag >= 3.0) return '#eab308'; // Yellow
      return '#3b82f6'; // Blue
    }

    // Handle React Native postMessages
    function sendToReactNative(type, payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
      } else {
        window.parent.postMessage(JSON.stringify({ type: type, payload: payload }), '*');
      }
    }

    // Function to render map components based on state sent from React Native
    function updateMapData(data) {
      var earthquakes = data.earthquakes || [];
      var locations = data.locations || [];
      var userLocation = data.userLocation;
      var focusedId = data.focusedEarthquakeId;
      var focusedLoc = data.focusedLocation;
      var toggles = data.toggles || { showEarthquakes: true, showShelters: true, showHospitals: true, showPharmacies: true };

      // Clear layers
      earthquakesGroup.clearLayers();
      locationsGroup.clearLayers();
      userLocationGroup.clearLayers();
      focusedMarker = null;

      var bounds = [];

      // 1. Render User Location
      if (userLocation) {
        var userHtml = '<div class="user-location-pulse" style="' +
          'background-color:#007AFF;' +
          'width:14px;height:14px;' +
          'border-radius:50%;' +
          'border:2px solid #ffffff;' +
          'box-shadow:0 0 10px rgba(0, 122, 255, 0.5);' +
          '"></div>';

        var userIcon = L.divIcon({
          className: 'user-location-container',
          html: userHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon, zIndexOffset: 1000 });
        userMarker.bindPopup('<strong>Konumunuz</strong>', { closeButton: false });
        userLocationGroup.addLayer(userMarker);
      }

      // 2. Render Earthquakes
      if (toggles.showEarthquakes) {
        earthquakes.forEach(function(eq) {
          var isFocused = eq.id === focusedId;
          var color = getMagColor(eq.magnitude);
          
          var markerHtml = '<div style="' +
            'background-color:' + color + ';' +
            'width:100%;height:100%;' +
            'border-radius:50%;' +
            'border:2px solid #ffffff;' +
            'box-shadow:0 2px 5px rgba(0,0,0,0.3);' +
            '"></div>';

          var size = isFocused ? 24 : 16;

          var customIcon = L.divIcon({
            className: isFocused ? 'pulsing-marker' : '',
            html: markerHtml,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
          });

          var marker = L.marker([eq.latitude, eq.longitude], { icon: customIcon });

          var popupContent = '<strong>' + eq.province + '</strong><br/>' +
            'Büyüklük: ' + eq.magnitude + ' M<br/>' +
            'Derinlik: ' + eq.depthKm + ' km<br/>' +
            'Konum: ' + eq.location;
          marker.bindPopup(popupContent, { closeButton: false });

          marker.on('click', function() {
            sendToReactNative('SELECT_EARTHQUAKE', eq);
          });

          earthquakesGroup.addLayer(marker);
          
          if (!focusedId) {
            bounds.push([eq.latitude, eq.longitude]);
          }

          if (isFocused) {
            focusedMarker = marker;
            marker.openPopup();
          }
        });
      }

      // 3. Render Shelters, Hospitals, Pharmacies
      locations.forEach(function(loc) {
        if (loc.type === 'shelter' && !toggles.showShelters) return;
        if (loc.type === 'hospital' && !toggles.showHospitals) return;
        if (loc.type === 'pharmacy' && !toggles.showPharmacies) return;

        var details = {
          shelter: { color: '#2E7D32', svg: SVGS.shelter },
          hospital: { color: '#C62828', svg: SVGS.hospital },
          pharmacy: { color: '#EF6C00', svg: SVGS.pharmacy }
        }[loc.type] || { color: '#666', svg: '' };

        var locHtml = '<div style="' +
          'background-color:' + details.color + ';' +
          'width:24px;height:24px;' +
          'border-radius:50%;' +
          'border:1.5px solid #ffffff;' +
          'display:flex;justify-content:center;align-items:center;' +
          'box-shadow:0 2px 4px rgba(0,0,0,0.35);' +
          '">' + details.svg + '</div>';

        var locIcon = L.divIcon({
          className: 'location-marker',
          html: locHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        var marker = L.marker([loc.latitude, loc.longitude], { icon: locIcon });
        marker.bindPopup('<strong>' + loc.name + '</strong><br/>' + loc.address, { closeButton: false });

        marker.on('click', function() {
          sendToReactNative('SELECT_LOCATION', loc);
        });

        locationsGroup.addLayer(marker);
      });

      // 4. Render Focused Emergency Location if any
      if (focusedLoc) {
        var tempHtml = '<div style="' +
          'background-color:#2E7D32;' +
          'width:24px;height:24px;' +
          'border-radius:50%;' +
          'border:1.5px solid #ffffff;' +
          'display:flex;justify-content:center;align-items:center;' +
          'box-shadow:0 2px 4px rgba(0,0,0,0.35);' +
          '">' + SVGS.shelter + '</div>';

        var tempIcon = L.divIcon({
          className: 'focused-temp-marker pulsing-marker',
          html: tempHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        var tempMarker = L.marker([focusedLoc.latitude, focusedLoc.longitude], { icon: tempIcon, zIndexOffset: 900 });
        tempMarker.bindPopup('<strong>' + focusedLoc.name + '</strong><br/>Yakınınızın Son Konumu', { closeButton: false });
        
        tempMarker.on('click', function() {
          sendToReactNative('SELECT_LOCATION', {
            id: 'focused_temp',
            type: 'shelter',
            name: focusedLoc.name,
            address: 'Yakınınızın Bildirdiği Son Konum',
            latitude: focusedLoc.latitude,
            longitude: focusedLoc.longitude,
          });
        });

        locationsGroup.addLayer(tempMarker);
        tempMarker.openPopup();
        map.setView([focusedLoc.latitude, focusedLoc.longitude], 12);
      } else if (focusedMarker && focusedId) {
        var eq = earthquakes.find(function(e) { return e.id === focusedId; });
        if (eq) {
          map.flyTo([eq.latitude, eq.longitude], 10, { animate: true, duration: 1.2 });
        }
      } else if (userLocation) {
        map.setView([userLocation.latitude, userLocation.longitude], 13);
      } else if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    // Recenter map on user location
    function recenterUser() {
      if (userMarker) {
        map.setView(userMarker.getLatLng(), 14);
        userMarker.openPopup();
      }
    }

    // Handle incoming messages from React Native WebView
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'UPDATE_DATA') {
          updateMapData(data.payload);
        } else if (data.type === 'RECENTER_USER') {
          recenterUser();
        }
      } catch (err) {
        console.error('Error handling message from React Native:', err);
      }
    });

    // Notify React Native that map is ready (with robust mobile injection checks)
    if (window.ReactNativeWebView) {
      sendToReactNative('MAP_READY', {});
    } else {
      var checkInterval = setInterval(function() {
        if (window.ReactNativeWebView) {
          clearInterval(checkInterval);
          sendToReactNative('MAP_READY', {});
        }
      }, 30);
      
      // Fallback for Web/iframe (triggers ready quickly)
      setTimeout(function() {
        clearInterval(checkInterval);
        sendToReactNative('MAP_READY', {});
      }, 250);
    }
  </script>
</body>
</html>
  `;
};
