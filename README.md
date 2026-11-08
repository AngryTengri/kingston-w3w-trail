# Kingston what3words trail

An interactive map of a what3words trail around Kingston upon Thames, built with [Leaflet](https://leafletjs.com/).

View it on GitHub Pages at https://angrytengri.github.io/kingston-w3w-trail/, or run it locally:

```
python3 -m http.server 8000
```

then open http://localhost:8000. Opening `index.html` straight from disk works too, but OpenStreetMap may refuse tiles to `file://` pages; the map then falls back to Esri.

## What it does

- Numbered pins for each location
- Street and satellite basemaps (OpenStreetMap and Esri, with automatic fallback to Esri if OpenStreetMap is blocked)
- Every location links to its exact what3words square and to Google Maps, from both the list and the pin
- "Copy locations" copies every location with its coordinates

## Positions

Each pin uses the exact coordinates of its what3words square. The locations live in the `PLACES` array at the top of `js/app.js`.

## Credits

Map data and tiles © OpenStreetMap contributors, Esri tiles © Esri. Leaflet is BSD-2-Clause licensed (see `vendor/leaflet/LICENSE`).
