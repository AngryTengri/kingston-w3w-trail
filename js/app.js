(function () {
  var PLACES = [
    { n: "1",  w3w: "sank.media.policy",       name: "Lower Marsh Lane",                                lat: 51.400132, lng: -0.284340 },
    { n: "2",  w3w: "firm.agents.name",        name: "Car park circle thing",                           lat: 51.410158, lng: -0.300376 },
    { n: "3",  w3w: "posed.sweat.loyal",       name: "Canbury Gardens / bandstand",                     lat: 51.417084, lng: -0.306529 },
    { n: "4",  w3w: "blank.stored.short",      name: "Riverside Walk",                                  lat: 51.410940, lng: -0.308113 },
    { n: "5",  w3w: "spirit.prompting.forget", name: "Ham Common",                                      lat: 51.432527, lng: -0.307092 },
    { n: "6",  w3w: "games.many.gums",         name: "Raven's Ait",                                     lat: 51.397814, lng: -0.310793 },
    { n: "7",  w3w: "today.costs.noisy",       name: "Berrylands station",                              lat: 51.399081, lng: -0.280191 },
    { n: "8",  w3w: "behind.answer.lakes",     name: "Hampton ferry / island / Shakespeare's Temple",   lat: 51.412557, lng: -0.362012 },
    { n: "9",  w3w: "spots.puts.easy",         name: "Banquet Records / Spuds",                         lat: 51.409269, lng: -0.303229 },
    { gap: "10 and 11 not in your list" },
    { n: "12", w3w: "extra.unfair.claps",      name: "Hogsmill, Clattern Bridge and the King's Stone",  lat: 51.408568, lng: -0.306557 }
  ];

  var map = L.map("map", { zoomControl: true }).setView([51.412, -0.31], 13);

  var PROVIDERS = {
    street: [
      { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", o: { maxZoom: 19, className: "tiles-mono", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } },
      { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", o: { maxZoom: 19, className: "tiles-mono", attribution: "Tiles &copy; Esri" } }
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
  var selected = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function w3wUrl(p) { return "https://what3words.com/" + p.w3w; }
  function gmapsUrl(p) { return "https://www.google.com/maps/search/?api=1&query=" + p.lat + "," + p.lng; }
  function coords(p) { return p.lat.toFixed(5) + ", " + p.lng.toFixed(5); }

  function linkButtons(p, cls) {
    return '<a class="' + cls + '" href="' + w3wUrl(p) + '" target="_blank" rel="noopener">Exact square</a>' +
      '<a class="' + cls + '" href="' + gmapsUrl(p) + '" target="_blank" rel="noopener">Google Maps</a>';
  }

  function popupHtml(p) {
    return '<div class="pop"><h3>' + esc(p.n + ". " + p.name) + "</h3>" +
      '<a class="w3w" href="' + w3wUrl(p) + '" target="_blank" rel="noopener">///' + esc(p.w3w) + "</a>" +
      '<div class="c">' + coords(p) + "</div>" +
      linkButtons(p, "plink") + "</div>";
  }

  function setSelected(n) {
    if (selected && markers[selected]) markers[selected].getElement().querySelector(".pin").classList.remove("sel");
    selected = n;
    if (markers[n]) markers[n].getElement().querySelector(".pin").classList.add("sel");
    document.querySelectorAll(".item").forEach(function (el) { el.classList.toggle("active", el.dataset.n === n); });
  }

  PLACES.forEach(function (p) {
    if (p.gap) return;
    var icon = L.divIcon({ className: "", html: '<div class="pin">' + esc(p.n) + "</div>", iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -15] });
    var m = L.marker([p.lat, p.lng], { icon: icon, title: p.name, keyboard: true }).addTo(map);
    m.bindPopup(popupHtml(p));
    m.on("click", function () {
      setSelected(p.n);
      var el = document.querySelector('.item[data-n="' + p.n + '"]');
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    markers[p.n] = m;
  });

  // Separate landmark: Kingston School of Art, Knights Park campus (coordinates from kingston.ac.uk)
  var CAMPUS = { name: "Kingston School of Art, Knights Park", sub: "Kingston University, Grange Road, KT1 2QJ", lat: 51.405224, lng: -0.299891 };
  L.marker([CAMPUS.lat, CAMPUS.lng], {
    icon: L.divIcon({ className: "", html: '<div class="campus-pin" aria-label="' + esc(CAMPUS.name) + '"></div>', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12] }),
    title: CAMPUS.name, zIndexOffset: -100
  }).addTo(map).bindPopup(
    '<div class="pop"><h3>' + esc(CAMPUS.name) + "</h3>" +
    '<div class="c">' + esc(CAMPUS.sub) + "<br>" + coords(CAMPUS) + "</div>" +
    '<a class="plink" href="' + gmapsUrl(CAMPUS) + '" target="_blank" rel="noopener">Google Maps</a></div>'
  );

  var list = document.getElementById("list");
  PLACES.forEach(function (p) {
    if (p.gap) {
      var g = document.createElement("div"); g.className = "gap"; g.textContent = p.gap; list.appendChild(g); return;
    }
    var d = document.createElement("div");
    d.className = "item";
    d.dataset.n = p.n;
    d.innerHTML =
      '<div class="row"><div class="badge">' + esc(p.n) + '</div><div class="meta">' +
      '<div class="name">' + esc(p.name) + "</div>" +
      '<a class="w3w" href="' + w3wUrl(p) + '" target="_blank" rel="noopener">///' + esc(p.w3w) + "</a>" +
      '<div class="status">' + coords(p) + "</div>" +
      '<div class="actions">' + linkButtons(p, "btn") + "</div>" +
      "</div></div>";
    d.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      setSelected(p.n);
      var m = markers[p.n];
      map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 16), { duration: 0.8 });
      setTimeout(function () { m.openPopup(); }, 850);
    });
    list.appendChild(d);
  });

  function fitAll() {
    var pts = Object.keys(markers).map(function (k) { return markers[k].getLatLng(); });
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
  document.getElementById("fitBtn").onclick = fitAll;
  document.getElementById("copyBtn").onclick = function () {
    var lines = PLACES.filter(function (p) { return !p.gap; }).map(function (p) {
      return "Location " + p.n + "  ///" + p.w3w + "  " + p.name + "  " + p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    });
    var text = lines.join("\n");
    var box = document.getElementById("copybox");
    function fallback() { box.value = text; box.classList.add("show"); box.select(); toast("Select and copy the text below"); }
    try {
      navigator.clipboard.writeText(text).then(function () { toast("Copied " + lines.length + " locations"); box.classList.remove("show"); }, fallback);
    } catch (e) { fallback(); }
  };

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  fitAll();
})();
