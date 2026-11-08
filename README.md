# Kingston what3words trail

An interactive map of a what3words trail around Kingston upon Thames, built with [Leaflet](https://leafletjs.com/).

Open `index.html` in a browser, or view it on GitHub Pages if that's enabled for this repo.

## What it does

- Numbered pins for each location, with a dashed line joining them in order
- Street and satellite basemaps (CARTO, Esri and OpenStreetMap, with automatic fallback if one is blocked)
- Every pin links to its exact what3words square
- Drag a pin, click the map, or paste coordinates to correct a position; changes are saved in your browser's localStorage
- "Copy positions" exports every location with its coordinates

## Positions

Pins start on the named landmark, not the exact what3words square, so some are 50 to 200 m off. The locations live in the `PLACES` array at the top of `js/app.js`. Paste the exact coordinates there to make a correction permanent for everyone.

## Credits

Map data © OpenStreetMap contributors, tiles © CARTO and Esri. Leaflet is BSD-2-Clause licensed (see `vendor/leaflet/LICENSE`).
