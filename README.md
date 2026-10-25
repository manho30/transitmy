# Transit Malaysia

Map-first transit network planning sandbox for Klang Valley.

## Stack
- React 19 + TypeScript (strict)
- Vite
- Tailwind CSS v4
- PixiJS v8 renderer
- Zustand state store with undo/redo
- IndexedDB persistence with in-memory fallback
- Vitest

## Run
```bash
npm install
npm run dev
```

## Validation
```bash
npm run test
npm run typecheck
npm run build
npm run lint
```

## Data sources and attribution
- Geographic reference data: OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0)
- Region metadata and bundled sample layers: `src/data/regions/klang-valley/*`
- GTFS reference snapshot metadata: `src/data/gtfs/reference.json`

## Reproducible data pipeline
- Geographic preprocessing skeleton: `scripts/prepare-geodata.mjs`
  - Accepts an exported OSM GeoJSON
  - Filters relevant transport/geographic features
  - Writes a processed preview artifact

## Current implementation scope
- Real-coordinate Klang Valley map extent and visible attribution
- Layer toggles for roads/highways/waterways/rail/existing transport/existing stations/place labels
- Proposed route drafting by mode (MRT/LRT/Monorail/Commuter/BRT/Bus)
- Proposed station placement, rename, delete, and route linking for interchanges
- Undo/redo, project save, export/import, and locale switching (`en`, `zh-CN`, `ms`)
- Lightweight analytics: route/station counts, route length, mode lengths, interchanges, disconnected routes, orphan stations, approximate station coverage

## Known limitations
- Bundled geographic and GTFS reference snapshots are intentionally lightweight and not full-network coverage.
- GTFS download/update automation is scaffolded but not yet connected to live feed ingestion.
- Route geometry editing currently supports draft creation and deletion; point-by-point editing of existing routes is still limited.
