import geography from './regions/klang-valley/geography.json'
import metadata from './regions/klang-valley/metadata.json'
import type { GeoPoint, PointFeature, PolylineFeature, RegionDataset } from '../types'

const toPoint = (value: unknown): GeoPoint => {
  const raw = value as { lon: number; lat: number }
  return { lon: raw.lon, lat: raw.lat }
}

const lines: PolylineFeature[] = (geography.lines as Array<{ id: string; name?: string; kind: PolylineFeature['kind']; coordinates: unknown[] }>).map((line) => ({
  id: line.id,
  name: line.name,
  kind: line.kind,
  coordinates: line.coordinates.map(toPoint),
}))

const points: PointFeature[] = (geography.points as Array<{ id: string; kind: PointFeature['kind']; name: string; coord: unknown }>).map((point) => ({
  id: point.id,
  kind: point.kind,
  name: point.name,
  coord: toPoint(point.coord),
}))

export const klangValleyDataset: RegionDataset = {
  metadata: {
    ...metadata,
    bbox: metadata.bbox as [number, number, number, number],
  },
  lines,
  points,
}
