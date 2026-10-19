/* Strava activity -> GPX. Self-contained: no external scripts. */
(function () {
  var m = location.pathname.match(/\/activities\/(\d+)/);
  if (location.hostname.indexOf('strava.com') === -1 || !m) {
    alert('Open a Strava activity page first.');
    return;
  }
  var id = m[1];

  var level = prompt('GPX detail: min (lat/lng, altitude), default (+time, names), full (+HR, cadence, power, temp)', 'full');
  if (level === null) return;
  level = level.trim().toLowerCase();
  if (['min', 'default', 'full'].indexOf(level) === -1) {
    alert('Unknown detail level: ' + level);
    return;
  }

  var nameEl = document.querySelector('.activity-name');
  var trackName = prompt('Track name', nameEl ? nameEl.textContent.trim() : document.title);
  if (trackName === null) return;
  var athleteEl = document.querySelector('header > h1 > span.title > a');
  var athleteName = athleteEl ? athleteEl.textContent.trim() : '';

  var types = ['latlng', 'time', 'altitude', 'heartrate', 'cadence', 'watts', 'temp'];
  var url = '/activities/' + id + '/streams?' + types.map(function (t) { return 'stream_types[]=' + t; }).join('&');

  fetch(url, {
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  }).then(function (res) {
    return res.text().then(function (body) {
      if (body.indexOf('<title>Log In | Strava</title>') !== -1) throw new Error('Please log in to Strava first.');
      if (!res.ok) throw new Error('Strava returned HTTP ' + res.status + '.');
      return JSON.parse(body);
    });
  }).then(function (data) {
    if (!data.latlng || !data.latlng.length) throw new Error('This activity has no GPS data.');

    var esc = function (s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    };
    var iso = function (ms) { return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z'); };
    var pad = function (n) { return ('00000' + n).slice(-5); };
    var has = function (arr, i) { return arr && arr[i] !== undefined && arr[i] !== null; };

    /* The streams endpoint has no absolute start time, so points are timed from "now minus 7 days" (same as the original tool). Relative timing is correct. */
    var base = Date.now() - 7 * 864e5;
    var time = data.time, ele = data.altitude, hr = data.heartrate, cad = data.cadence, pow = data.watts, temp = data.temp;

    var pts = data.latlng.map(function (ll, i) {
      var p = '   <trkpt lat="' + ll[0] + '" lon="' + ll[1] + '">';
      if (has(ele, i)) p += '<ele>' + ele[i] + '</ele>';
      if (level !== 'min') {
        var sec = has(time, i) ? Number(time[i]) : i + 1;
        p += '<name>TP' + pad(i + 1) + '</name><time>' + iso(base + sec * 1000) + '</time>';
      }
      if (level === 'full' && (has(hr, i) || has(cad, i) || has(pow, i) || has(temp, i))) {
        p += '<extensions>';
        if (has(hr, i)) p += '<gpxtpx:TrackPointExtension><gpxtpx:hr>' + hr[i] + '</gpxtpx:hr></gpxtpx:TrackPointExtension><heartrate>' + hr[i] + '</heartrate><gpxdata:hr>' + hr[i] + '</gpxdata:hr>';
        if (has(cad, i)) p += '<gpxdata:cadence>' + cad[i] + '</gpxdata:cadence><cadence>' + cad[i] + '</cadence>';
        if (has(pow, i)) p += '<power>' + pow[i] + '</power>';
        if (has(temp, i)) p += '<gpxx:Temperature>' + temp[i] + '</gpxx:Temperature>';
        p += '</extensions>';
      }
      return p + '</trkpt>';
    });

    var page = esc(location.href);
    var gpx = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' +
      '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxdata="http://www.cluetrust.com/XML/GPXDATA/1/0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" creator="strava-gpx bookmarklet" version="1.1">\n' +
      ' <metadata>\n' +
      '  <name>' + esc(trackName) + '</name>\n' +
      '  <author>\n   <name>' + esc(athleteName) + '</name>\n   <link href="' + page + '"/>\n  </author>\n' +
      '  <time>' + iso(Date.now()) + '</time>\n' +
      ' </metadata>\n' +
      ' <trk>\n  <name>' + esc(trackName) + '</name>\n  <link href="' + page + '"/>\n  <number>1</number>\n  <trkseg>\n' +
      pts.join('\n') +
      '\n  </trkseg>\n </trk>\n</gpx>\n';

    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([gpx], { type: 'application/gpx+xml' }));
    a.download = 'strava_' + id + '_' + level + '.gpx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }).catch(function (err) {
    alert('GPX export failed: ' + err.message);
  });
})();
