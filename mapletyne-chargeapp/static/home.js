// ── Session Resumption ──────────────────────────────────────────
(function () {
  var sid = localStorage.getItem('active_session_id');
  if (!sid) return;
  fetch('/api/sessions/' + sid + '/poll')
    .then(function (r) { return r.json(); })
    .then(function (s) {
      if (s && (s.mollie_status === 'paid' || s.mollie_status === 'authorized') && !s.stopped_at) {
        window.location.href = '/session/' + sid;
      } else {
        localStorage.removeItem('active_session_id');
      }
    })
    .catch(function () { localStorage.removeItem('active_session_id'); });
})();

// ── Hash-based tab switching (scan tab via /#scan) ───────────────────────
var scannerActive = false;

function checkHashTab() {
  var hash = location.hash;
  var mapTab = document.getElementById('tab-map');
  var scanTab = document.getElementById('tab-scan');
  if (!mapTab || !scanTab) return;

  if (hash === '#scan') {
    mapTab.classList.add('hidden');
    scanTab.classList.remove('hidden');
    startScanner();
  } else {
    scanTab.classList.add('hidden');
    mapTab.classList.remove('hidden');
    stopScanner();
    if (map) setTimeout(function () { map.invalidateSize(); }, 100);
  }
}

window.addEventListener('hashchange', checkHashTab);

// ── Pin SVG ─────────────────────────────────────────────────────
function pinSVG(color) {
  return '<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 16 24 16 24S32 26.667 32 16C32 7.163 24.837 0 16 0z" fill="' + color + '" fill-opacity="0.92"/>' +
    '<circle cx="16" cy="16" r="9" fill="rgba(255,255,255,0.15)"/>' +
    '<circle cx="16" cy="16" r="6" fill="white" fill-opacity="0.9"/>' +
    '<circle cx="16" cy="16" r="3.5" fill="' + color + '"/>' +
    '</svg>';
}

function statusColor(status) {
  if (!status) return '#64748b';
  var s = (status + '').toLowerCase();
  if (s === 'available') return '#22c55e';
  if (s === 'charging' || s === 'occupied') return '#00B0E4';
  if (s === 'faulted') return '#ef4444';
  return '#64748b';
}

// ── Map ─────────────────────────────────────────────────────────
var map, userMarker, chargerLayer, tileLayer;
var chargerCache = { data: null, ts: 0 };
var CACHE_TTL = 30000;
var fetchDebounce = null;
var isDark = true;

var TILE_DARK  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var TILE_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var TILE_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function initMap() {
  map = L.map('charger-map', {
    center: [52.3942, 4.8666],
    zoom: 14,
    zoomControl: false,
    attributionControl: true,
  });

  tileLayer = L.tileLayer(TILE_DARK, { attribution: TILE_ATTR, maxZoom: 19 });
  tileLayer.addTo(map);
  chargerLayer = L.layerGroup().addTo(map);

  map.on('moveend', scheduleFetch);
  map.on('zoomend', scheduleFetch);
  map.on('click', closeSheet);

  document.getElementById('zoom-in').addEventListener('click', function () { map.zoomIn(); });
  document.getElementById('zoom-out').addEventListener('click', function () { map.zoomOut(); });
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('geo-btn').addEventListener('click', locateUser);
  document.getElementById('locate-banner-btn').addEventListener('click', locateUser);
  document.getElementById('sheet-handle').addEventListener('click', closeSheet);

  // Touch isolation for map overlays to prevent drag bleed
  var sheetEl = document.getElementById('charger-sheet');
  var searchWrap = document.getElementById('map-search-wrap');
  if (sheetEl) {
    L.DomEvent.disableScrollPropagation(sheetEl);
    L.DomEvent.disableClickPropagation(sheetEl);
  }
  if (searchWrap) {
    L.DomEvent.disableScrollPropagation(searchWrap);
    L.DomEvent.disableClickPropagation(searchWrap);
  }

  // Show locate banner, let user trigger location manually
  document.getElementById('locate-banner').classList.remove('hidden');
  fetchNearby();
}

function toggleTheme() {
  isDark = !isDark;
  tileLayer.setUrl(isDark ? TILE_DARK : TILE_LIGHT);
}

function scheduleFetch() {
  clearTimeout(fetchDebounce);
  fetchDebounce = setTimeout(fetchNearby, 500);
}

function fetchNearby() {
  if (!map) return;
  var center = map.getCenter();
  var bounds = map.getBounds();
  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();
  var latDiff = Math.abs(ne.lat - sw.lat) / 2;
  var lngDiff = Math.abs(ne.lng - sw.lng) / 2;
  var radiusKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
  var radius = Math.min(Math.round(radiusKm * 1000), 5000);

  var now = Date.now();
  if (chargerCache.data && (now - chargerCache.ts) < CACHE_TTL) {
    renderChargers(chargerCache.data);
    return;
  }

  var loading = document.getElementById('map-loading');
  var apiBase = window.location.pathname.startsWith('/app') ? '/app' : '';
  var url = apiBase + '/api/chargers/nearby?lat=' + center.lat + '&lng=' + center.lng + '&radius=' + radius;
  fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error('API error ' + r.status);
      return r.json();
    })
    .then(function (data) {
      chargerCache = { data: data, ts: Date.now() };
      renderChargers(data);
    })
    .catch(function (e) {
      console.error('Charger fetch failed:', e);
    })
    .finally(function () {
      loading.style.display = 'none';
    });
}

function renderChargers(data) {
  chargerLayer.clearLayers();
  var chargers = Array.isArray(data) ? data : (data.chargers || data.results || []);

  var hasCentered = false;
  chargers.forEach(function (cp) {
    var lat = cp.lat || cp.latitude;
    var lng = cp.lng || cp.longitude;
    if (lat == null || lng == null) return;

    if (!hasCentered && !userMarker) {
      map.setView([lat, lng], 14);
      hasCentered = true;
    }

    var connectors = cp.connectors || [];
    var firstConn = connectors[0];
    var firstStatus = firstConn ? firstConn.status : cp.status;
    var color = statusColor(firstStatus || cp.status);

    var icon = L.divIcon({
      className: 'charger-marker-wrap',
      html: '<div class="pin-marker pin-pulse">' + pinSVG(color) + '</div>',
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -44],
    });

    var marker = L.marker([lat, lng], { icon: icon });
    marker.on('click', (function (charger) {
      return function (e) {
        L.DomEvent.stopPropagation(e);
        openSheet(charger);
      };
    })(cp));
    marker.addTo(chargerLayer);
  });

  var badge = document.getElementById('charger-badge');
  var I18N = window.I18N || {};
  badge.textContent = '⚡ ' + chargers.length + ' ' + (chargers.length === 1 ? (I18N.charger_singular || 'charger') : (I18N.chargers_badge || 'chargers'));
  badge.style.opacity = '1';
  setTimeout(function () { badge.style.opacity = '0'; }, 5000);
}

function locateUser() {
  if (!navigator.geolocation) {
    document.getElementById('locate-banner').classList.remove('hidden');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;

      if (userMarker) userMarker.remove();
      var userIcon = L.divIcon({
        className: 'charger-marker-wrap',
        html: '<div class="user-dot-outer"><div class="user-dot-inner"></div></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

      map.setView([lat, lng], 15);
      document.getElementById('locate-banner').classList.add('hidden');
    },
    function () {
      document.getElementById('locate-banner').classList.remove('hidden');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ── Distance helper ─────────────────────────────────────────────
function distTo(lat, lng) {
  if (!userMarker) return null;
  var u = userMarker.getLatLng();
  var R = 6371000;
  var dLat = (lat - u.lat) * Math.PI / 180;
  var dLng = (lng - u.lng) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(u.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var d = 2 * R * Math.asin(Math.sqrt(a));
  return d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1) + ' km';
}

// ── Bottom Sheet ────────────────────────────────────────────────
function openSheet(cp) {
  var lat = cp.lat || cp.latitude;
  var lng = cp.lng || cp.longitude;
  var dist = distTo(lat, lng);
  var connectors = cp.connectors || [];
  var cpId = cp.cp_id || cp.id || '';
  var powerKw = cp.power_kw || cp.max_power_kw || 22;
  var tariffKwh = cp.tariff_kwh || cp.energy_rate || 0.35;

  var I18N = window.I18N || {};
  var connHTML = '';
  if (connectors.length > 0) {
    connectors.forEach(function (c) {
      var sc = statusColor(c.status);
      var label = c.status || (I18N.unknown_status || 'Available');
      var cid = c.connector_id || c.id || 1;
      var type = c.type || c.connector_type || (powerKw >= 50 ? 'CCS2 Fast' : 'Type 2 AC');
      var startBtn = '<a href="/app/charge/' + encodeURIComponent(cpId) + '/' + encodeURIComponent(cid) + '" ' +
        'style="padding:6px 14px;background:var(--accent);color:#0C2340;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;margin-left:8px;display:inline-flex;align-items:center;gap:4px;">' +
        '⚡ Start →</a>';
      
      connHTML += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">' +
        '<div>' +
        '<div style="font-size:14px;font-weight:700;color:var(--text);">' + (I18N.connector || 'Connector') + ' ' + cid + ' · ' + type + '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + sc + ';"></span>' +
        '<span style="font-size:12px;color:' + sc + ';font-weight:600;">' + label + '</span>' +
        '</div>' +
        '</div>' +
        '<div>' + startBtn + '</div>' +
        '</div>';
    });
  } else {
    // Default connector action card if station has single/auto connector
    var defaultBtn = '<a href="/app/charge/' + encodeURIComponent(cpId) + '/1" ' +
      'style="padding:10px 16px;background:var(--accent);color:#0C2340;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;display:block;text-align:center;margin-top:12px;">' +
      '⚡ Start Charging →</a>';
    connHTML = '<div style="padding:8px 0;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--text2);">' +
      '<span>Standard Connector (CCS2 / Type 2)</span>' +
      '<span style="color:#22c55e;font-weight:600;">● Available</span>' +
      '</div>' +
      defaultBtn +
      '</div>';
  }

  var name = cp.name || cp.display_name || cpId || (I18N.charger || 'Charging Station');
  var addr = cp.address || cp.city ? ((cp.address || '') + (cp.city ? ', ' + cp.city : '')) : '';

  var badgesHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;">' +
    '<div style="background:var(--card);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;color:var(--accent);">' +
    '⚡ ' + powerKw + ' kW' +
    '</div>' +
    '<div style="background:var(--card);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;color:var(--text);">' +
    '💳 £' + Number(tariffKwh).toFixed(2) + ' / kWh' +
    '</div>' +
    '</div>';

  var navBtn = (lat && lng)
    ? '<a href="https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng +
      '" target="_blank" rel="noopener" class="sheet-btn sheet-btn-nav" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;padding:8px 16px;border-radius:8px;background:var(--card);border:1px solid var(--border);color:var(--text2);font-size:13px;font-weight:600;margin-top:10px;width:100%;">' +
      '🧭 ' + (I18N.navigate || 'Get Directions') + '</a>'
    : '';

  document.getElementById('sheet-content').innerHTML =
    '<div class="sheet-charger-name" style="font-size:18px;font-weight:700;color:var(--text);">' + name + '</div>' +
    (addr ? '<div class="sheet-charger-addr" style="font-size:13px;color:var(--text2);margin-top:2px;">📍 ' + addr + '</div>' : '') +
    (dist ? '<div class="map-popup-dist" style="font-size:12px;color:var(--text3);margin-top:2px;">' + dist + ' ' + (I18N.distance_from_you || 'from you') + '</div>' : '') +
    badgesHTML +
    '<div class="sheet-connector-list">' + connHTML + '</div>' +
    navBtn;

  document.getElementById('charger-sheet').classList.add('open');
}

function closeSheet() {
  document.getElementById('charger-sheet').classList.remove('open');
}

// ── QR Scanner ──────────────────────────────────────────────────
var videoStream = null;
var scanInterval = null;
var barcodeDetector = null;

function startScanner() {
  if (scannerActive) return;

  var video = document.getElementById('scan-video');
  var errDiv = document.getElementById('camera-error');
  var status = document.getElementById('scan-status');

  if ('BarcodeDetector' in window) {
    try { barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { barcodeDetector = null; }
  }

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
  })
    .then(function (stream) {
      videoStream = stream;
      video.srcObject = stream;
      errDiv.classList.add('hidden');
      scannerActive = true;

      var I18N = window.I18N || {};
      if (barcodeDetector) {
        status.textContent = I18N.camera_active_qr || 'Camera actief — richt op QR-code';
        scanInterval = setInterval(detectQR, 300);
      } else {
        status.textContent = I18N.camera_active_manual || 'Camera actief — voer code handmatig in';
      }
    })
    .catch(function () {
      var I18N = window.I18N || {};
      errDiv.classList.remove('hidden');
      status.textContent = I18N.camera_no_access || 'Geen cameratoegang';
    });
}

function stopScanner() {
  scannerActive = false;
  clearInterval(scanInterval);
  scanInterval = null;
  if (videoStream) {
    videoStream.getTracks().forEach(function (t) { t.stop(); });
    videoStream = null;
  }
  var video = document.getElementById('scan-video');
  if (video) video.srcObject = null;
}

function detectQR() {
  if (!barcodeDetector || !scannerActive) return;
  var video = document.getElementById('scan-video');
  if (!video || video.readyState < 2) return;

  barcodeDetector.detect(video)
    .then(function (codes) {
      if (codes.length > 0) {
        clearInterval(scanInterval);
        scannerActive = false;
        navigateToCode(codes[0].rawValue);
      }
    })
    .catch(function () { /* silent */ });
}

function submitManualCode() {
  var input = document.getElementById('manual-code');
  var code = input.value.trim();
  if (code) navigateToCode(code);
}

function navigateToCode(code) {
  // If the code is a URL containing /c/, extract just the code part
  var urlMatch = code.match(/\/c\/([^/?#\s]+)/);
  var finalCode = urlMatch ? urlMatch[1] : code;
  window.location.href = '/c/' + encodeURIComponent(finalCode);
}

// ── Search & Autocomplete ───────────────────────────────────────
var searchDebounce = null;

function initSearch() {
  var input = document.getElementById('map-search-input');
  var clearBtn = document.getElementById('map-search-clear');
  var resultsDiv = document.getElementById('map-search-results');
  if (!input || !resultsDiv) return;

  input.addEventListener('input', function () {
    var query = input.value.trim();
    if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';
    if (!query) {
      resultsDiv.style.display = 'none';
      resultsDiv.innerHTML = '';
      return;
    }
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function () {
      performSearch(query);
    }, 280);
  });

  input.addEventListener('focus', function () {
    if (input.value.trim() && resultsDiv.innerHTML) {
      resultsDiv.style.display = 'block';
    }
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      resultsDiv.style.display = 'none';
    } else if (e.key === 'Enter') {
      var firstItem = resultsDiv.querySelector('.search-result-item');
      if (firstItem) firstItem.click();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = '';
      clearBtn.style.display = 'none';
      resultsDiv.style.display = 'none';
      resultsDiv.innerHTML = '';
      input.focus();
    });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#map-search-wrap')) {
      resultsDiv.style.display = 'none';
    }
  });
}

function performSearch(query) {
  var resultsDiv = document.getElementById('map-search-results');
  var qLower = query.toLowerCase();
  var html = '';

  // 1. Filter local network charging stations
  var matchedStations = [];
  if (chargerCache.data) {
    var all = Array.isArray(chargerCache.data) ? chargerCache.data : (chargerCache.data.chargers || chargerCache.data.results || []);
    matchedStations = all.filter(function (cp) {
      var name = (cp.name || cp.display_name || '').toLowerCase();
      var id = (cp.id || cp.cp_id || '').toLowerCase();
      var addr = (cp.address || '').toLowerCase();
      var city = (cp.city || '').toLowerCase();
      return name.includes(qLower) || id.includes(qLower) || addr.includes(qLower) || city.includes(qLower);
    });
  }

  if (matchedStations.length > 0) {
    html += '<div style="padding:8px 14px 4px;font-size:11px;font-weight:700;color:var(--accent,#48e260);text-transform:uppercase;letter-spacing:0.05em;">⚡ Charging Stations</div>';
    matchedStations.slice(0, 5).forEach(function (cp) {
      var name = cp.name || cp.display_name || cp.id;
      var loc = cp.address || cp.city ? ((cp.address || '') + (cp.city ? ', ' + cp.city : '')) : 'Network Station';
      var kw = cp.power_kw || cp.max_power_kw || 22;
      var lat = cp.lat || cp.latitude;
      var lng = cp.lng || cp.longitude;

      html += '<div class="search-result-item" data-type="station" data-lat="' + lat + '" data-lng="' + lng + '" data-id="' + cp.id + '" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border,#1e3a5f);display:flex;align-items:center;justify-content:space-between;transition:background 0.15s;" onmouseover="this.style.background=\'var(--card-hover,rgba(255,255,255,0.06))\'" onmouseout="this.style.background=\'none\'">' +
        '<div style="min-width:0;padding-right:10px;">' +
        '<div style="font-size:14px;font-weight:600;color:var(--text,#f1f5f9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>' +
        '<div style="font-size:12px;color:var(--text2,#94a3b8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📍 ' + loc + '</div>' +
        '</div>' +
        '<div style="flex-shrink:0;font-size:11px;font-weight:700;color:var(--accent,#48e260);background:rgba(72,226,96,0.15);padding:3px 8px;border-radius:12px;">' + kw + ' kW</div>' +
        '</div>';
    });
  }

  // 2. Query OpenStreetMap Nominatim for locations & cities globally
  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=5')
    .then(function (r) { return r.json(); })
    .then(function (places) {
      if (places && places.length > 0) {
        html += '<div style="padding:8px 14px 4px;font-size:11px;font-weight:700;color:var(--text3,#64748b);text-transform:uppercase;letter-spacing:0.05em;border-top:1px solid var(--border,#1e3a5f);">📍 Cities & Places</div>';
        places.forEach(function (p) {
          var label = p.display_name;
          var lat = parseFloat(p.lat);
          var lon = parseFloat(p.lon);
          html += '<div class="search-result-item" data-type="place" data-lat="' + lat + '" data-lng="' + lon + '" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border,#1e3a5f);transition:background 0.15s;" onmouseover="this.style.background=\'var(--card-hover,rgba(255,255,255,0.06))\'" onmouseout="this.style.background=\'none\'">' +
            '<div style="font-size:13px;color:var(--text,#f1f5f9);line-height:1.4;">' + label + '</div>' +
            '</div>';
        });
      }

      if (!html) {
        html = '<div style="padding:16px 14px;text-align:center;color:var(--text3,#64748b);font-size:13px;">No matching stations or locations found</div>';
      }

      resultsDiv.innerHTML = html;
      resultsDiv.style.display = 'block';

      // Bind click handlers on items
      resultsDiv.querySelectorAll('.search-result-item').forEach(function (item) {
        item.addEventListener('click', function () {
          var lat = parseFloat(item.dataset.lat);
          var lng = parseFloat(item.dataset.lng);
          var type = item.dataset.type;
          var id = item.dataset.id;

          resultsDiv.style.display = 'none';

          if (type === 'station') {
            var stationObj = matchedStations.find(function (s) { return s.id === id; });
            map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
            if (stationObj) {
              setTimeout(function () { openSheet(stationObj); }, 600);
            }
          } else {
            map.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });
          }
        });
      });
    })
    .catch(function () {
      if (html) {
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
      }
    });
}

// ── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  initMap();
  initSearch();
  checkHashTab(); // Check if we should start on scan tab

  document.getElementById('manual-submit').addEventListener('click', submitManualCode);
  document.getElementById('manual-code').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') submitManualCode();
  });
});
