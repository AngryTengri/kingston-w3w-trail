(function () {
  var PLACES = [
    { key: "1",  n: "1",  w3w: "sank.media.policy",       name: "Lower Marsh Lane",                                lat: 51.4006, lng: -0.2946 },
    { key: "2",  n: "2",  w3w: "firm.agents.name",        name: "Car park circle thing",                           lat: null,    lng: null },
    { key: "3",  n: "3",  w3w: "posed.sweat.loyal",       name: "Canbury Gardens / bandstand",                     lat: 51.4176, lng: -0.3063 },
    { key: "4",  n: "4",  w3w: "blank.stored.short",      name: "Riverside Walk",                                  lat: 51.4097, lng: -0.3087 },
    { key: "5",  n: "5",  w3w: "spirit.prompting.forget", name: "Ham Common",                                      lat: 51.4375, lng: -0.3040 },
    { key: "6",  n: "6",  w3w: "games.many.gums",         name: "Raven's Ait",                                     lat: 51.39861, lng: -0.31111 },
    { key: "7",  n: "7",  w3w: "today.costs.noisy",       name: "Berrylands station",                              lat: 51.3988, lng: -0.2802 },
    { key: "8",  n: "8",  w3w: "behind.answer.lakes",     name: "Hampton ferry / island / Shakespeare's Temple",   lat: 51.4124, lng: -0.3594 },
    { key: "9",  n: "9",  w3w: "spots.puts.easy",         name: "Banquet Records / Spuds",                         lat: 51.4092, lng: -0.3027 },
    { key: "gap", gap: "10 and 11 not in your list" },
    { key: "12", n: "12", w3w: "extra.unfair.claps",      name: "Hogsmill, Clattern Bridge and the King's Stone",  lat: 51.40852, lng: -0.30676 },
    { key: "next", n: "?", w3w: "flesh.head.nests",       name: "Next location",                                   lat: null,    lng: null, next: true }
  ];
  var STORE = "w3w-trail-kingston-v1";

  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(overrides)); } catch (e) {} }
  var overrides = load();

  function pos(p) {
    var o = overrides[p.key];
    if (o) return { lat: o.lat, lng: o.lng, src: "user" };
    if (p.lat != null) return { lat: p.lat, lng: p.lng, src: "landmark" };
    return null;
  }

  var map = L.map("map", { zoomControl: true }).setView([51.412, -0.31], 13);
  var PROVIDERS = {
    street: [
      { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", o: { subdomains: "abcd", maxZoom: 20, attribution: "&copy; OpenStreetMap contributors &copy; CARTO" } },
      { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", o: { maxZoom: 19, attribution: "Tiles &copy; Esri" } },
      { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", o: { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" } }
    ],
    sat: [
      { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", o: { maxZoom: 19, attribution: "Imagery &copy; Esri" } }
    ]
  };
  var currentBase = null, baseTimer = null;
  function showNotice(on) { document.getElementById("tileNotice").classList.toggle("show", on); }
  function useProvider(kind, i) {
    if (currentBase) map.removeLayer(currentBase);
    clearTimeout(baseTimer);
    var pr = PROVIDERS[kind][i];
    var layer = L.tileLayer(pr.url, pr.o);
    var loaded = 0, failed = 0;
    function giveUp() {
      if (layer !== currentBase || loaded) return;
      if (i + 1 < PROVIDERS[kind].length) useProvider(kind, i + 1);
      else showNotice(true);
    }
    layer.on("tileload", function () { if (layer !== currentBase) return; loaded++; showNotice(false); });
    layer.on("tileerror", function () { if (layer !== currentBase) return; failed++; if (!loaded && failed >= 4) giveUp(); });
    currentBase = layer.addTo(map);
    baseTimer = setTimeout(giveUp, 6000);
  }
  useProvider("street", 0);

  var markers = {};
  var route = L.polyline([], { color: "#1565a8", weight: 3, opacity: 0.55, dashArray: "6 8" });
  var routeNext = L.polyline([], { color: "#e8590c", weight: 3, opacity: 0.7, dashArray: "2 8" });
  var showRoute = true;
  var placing = null;
  var selected = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function w3wUrl(p) { return "https://what3words.com/" + p.w3w; }

  function popupHtml(p, q) {
    var c = q.lat.toFixed(5) + ", " + q.lng.toFixed(5);
    return '<div class="pop"><h3>' + esc(p.next ? "Next location: ///" + p.w3w : p.n + ". " + p.name) + "</h3>" +
      '<a class="w3w" href="' + w3wUrl(p) + '" target="_blank" rel="noopener">///' + esc(p.w3w) + "</a>" +
      '<div class="c">' + c + (q.src === "landmark" ? "  (landmark, approx)" : "  (set by you)") + "</div>" +
      '<a href="' + w3wUrl(p) + '" target="_blank" rel="noopener">Exact square</a>' +
      '<a href="https://www.google.com/maps/search/?api=1&query=' + q.lat + "," + q.lng + '" target="_blank" rel="noopener">Google Maps</a>' +
      '<div class="hint">Drag the pin to correct it.</div></div>';
  }

  function iconFor(p, q) {
    var cls = "pin" + (p.next ? " next" : q.src === "user" ? " user" : "") + (selected === p.key ? " sel" : "");
    return L.divIcon({ className: "", html: '<div class="' + cls + '">' + esc(p.n) + "</div>", iconSize: p.next ? [34, 34] : [30, 30], iconAnchor: p.next ? [17, 17] : [15, 15], popupAnchor: [0, -16] });
  }

  function renderMarkers() {
    PLACES.forEach(function (p) {
      if (p.gap) return;
      var q = pos(p);
      if (markers[p.key]) { map.removeLayer(markers[p.key]); delete markers[p.key]; }
      if (!q) return;
      var m = L.marker([q.lat, q.lng], { icon: iconFor(p, q), draggable: true, zIndexOffset: p.next ? 1000 : 0, title: p.name });
      m.bindPopup(popupHtml(p, q));
      m.on("dragend", function () {
        var ll = m.getLatLng();
        overrides[p.key] = { lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6) };
        save(); refresh(); toast("Moved " + (p.n === "?" ? "next location" : "#" + p.n));
      });
      m.on("click", function () { select(p.key, false); });
      m.addTo(map);
      markers[p.key] = m;
    });
    renderRoute();
  }

  function renderRoute() {
    var pts = [], last = null, nextPt = null;
    PLACES.forEach(function (p) {
      if (p.gap) return;
      var q = pos(p);
      if (!q) return;
      if (p.next) nextPt = [q.lat, q.lng];
      else { pts.push([q.lat, q.lng]); last = [q.lat, q.lng]; }
    });
    route.setLatLngs(pts);
    routeNext.setLatLngs(last && nextPt ? [last, nextPt] : []);
    [route, routeNext].forEach(function (l) {
      if (showRoute) { if (!map.hasLayer(l)) l.addTo(map); } else map.removeLayer(l);
    });
  }

  function renderList() {
    var el = document.getElementById("list");
    el.innerHTML = "";
    var ordered = PLACES.filter(function (p) { return p.next; }).concat(PLACES.filter(function (p) { return !p.next; }));
    ordered.forEach(function (p) {
      if (p.gap) {
        var g = document.createElement("div"); g.className = "gap"; g.textContent = p.gap; el.appendChild(g); return;
      }
      var q = pos(p);
      var d = document.createElement("div");
      d.className = "item" + (p.next ? " next" : "") + (q ? "" : " unplaced") + (selected === p.key ? " active" : "");
      var status = !q ? '<div class="status none">Not on the map yet</div>'
        : q.src === "user" ? '<div class="status user">Set by you</div>'
        : '<div class="status">Landmark position (approx)</div>';
      d.innerHTML =
        '<div class="row"><div class="badge">' + esc(p.n) + '</div><div class="meta">' +
        '<div class="name">' + esc(p.next ? "Next location (unknown)" : p.name) + "</div>" +
        '<a class="w3w" href="' + w3wUrl(p) + '" target="_blank" rel="noopener">///' + esc(p.w3w) + "</a>" + status +
        '<div class="actions">' +
          '<button class="' + (q ? "" : (p.next ? "warn" : "primary")) + '" data-act="place">' + (q ? "Move by click" : "Place by click") + "</button>" +
          '<button data-act="coords">Paste coordinates</button>' +
          (q && q.src === "user" && p.lat != null ? '<button data-act="revert">Revert</button>' : "") +
          (q && q.src === "user" && p.lat == null ? '<button data-act="revert">Remove</button>' : "") +
        "</div>" +
        '<div class="coord-input"><input placeholder="51.4123, -0.3045" aria-label="Latitude, longitude"><button class="primary" data-act="setc">Set</button></div>' +
        "</div></div>";
      d.addEventListener("click", function (e) {
        var act = e.target.getAttribute && e.target.getAttribute("data-act");
        if (e.target.tagName === "A" || e.target.tagName === "INPUT") return;
        if (act === "place") { startPlacing(p); return; }
        if (act === "coords") { d.querySelector(".coord-input").classList.toggle("open"); d.querySelector("input").focus(); return; }
        if (act === "revert") { delete overrides[p.key]; save(); refresh(); return; }
        if (act === "setc") {
          var v = d.querySelector("input").value.match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
          if (!v) { toast("Use the format 51.4123, -0.3045"); return; }
          var lat = parseFloat(v[1]), lng = parseFloat(v[2]);
          if (Math.abs(lat) > 90 || Math.abs(lng) > 180) { toast("Those numbers are out of range"); return; }
          overrides[p.key] = { lat: lat, lng: lng }; save(); selected = p.key; refresh();
          map.flyTo([lat, lng], 17, { duration: 0.8 }); setTimeout(function () { if (markers[p.key]) markers[p.key].openPopup(); }, 850);
          return;
        }
        select(p.key, true);
      });
      d.querySelector("input").addEventListener("keydown", function (e) { if (e.key === "Enter") d.querySelector('[data-act="setc"]').click(); });
      el.appendChild(d);
    });
  }

  function select(key, fly) {
    selected = key;
    refresh();
    var m = markers[key];
    if (m && fly) { map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 16), { duration: 0.8 }); setTimeout(function () { m.openPopup(); }, 850); }
    else if (m) m.openPopup();
    var act = document.querySelector(".item.active");
    if (act && !fly) act.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function startPlacing(p) {
    placing = p;
    document.getElementById("app").classList.add("placing");
    document.getElementById("bannerText").textContent = "Click the map to place " + (p.next ? "the next location" : "#" + p.n + " " + p.name);
    document.getElementById("banner").classList.add("show");
  }
  function stopPlacing() {
    placing = null;
    document.getElementById("app").classList.remove("placing");
    document.getElementById("banner").classList.remove("show");
  }
  map.on("click", function (e) {
    if (!placing) return;
    var p = placing;
    overrides[p.key] = { lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) };
    save(); stopPlacing(); selected = p.key; refresh();
    if (markers[p.key]) markers[p.key].openPopup();
  });
  document.getElementById("cancelPlace").onclick = stopPlacing;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") stopPlacing(); });

  function fitAll() {
    var pts = [];
    Object.keys(markers).forEach(function (k) { pts.push(markers[k].getLatLng()); });
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16 });
  }

  document.querySelectorAll("#basemaps button").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll("#basemaps button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      showNotice(false);
      useProvider(b.getAttribute("data-b"), 0);
    };
  });
  document.getElementById("routeToggle").onchange = function (e) { showRoute = e.target.checked; renderRoute(); };
  document.getElementById("fitBtn").onclick = fitAll;
  document.getElementById("resetBtn").onclick = function () {
    var box = this;
    if (box.dataset.confirm !== "1") { box.dataset.confirm = "1"; box.textContent = "Click again to reset"; setTimeout(function () { box.dataset.confirm = ""; box.textContent = "Reset pins"; }, 2500); return; }
    overrides = {}; save(); box.dataset.confirm = ""; box.textContent = "Reset pins"; refresh(); fitAll(); toast("Pins reset to landmarks");
  };
  document.getElementById("copyBtn").onclick = function () {
    var lines = [];
    PLACES.forEach(function (p) {
      if (p.gap) return;
      var q = pos(p);
      lines.push((p.n === "?" ? "Next" : "Location " + p.n) + "  ///" + p.w3w + "  " + p.name + "  " + (q ? q.lat.toFixed(6) + ", " + q.lng.toFixed(6) + (q.src === "user" ? "" : " (approx)") : "not placed"));
    });
    var text = lines.join("\n");
    var box = document.getElementById("copybox");
    function fallback() { box.value = text; box.classList.add("show"); box.select(); toast("Select and copy the text below"); }
    try {
      navigator.clipboard.writeText(text).then(function () { toast("Copied " + lines.length + " positions"); box.classList.remove("show"); }, fallback);
    } catch (e) { fallback(); }
  };

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  function refresh() { renderMarkers(); renderList(); }
  refresh();
  fitAll();
})();
