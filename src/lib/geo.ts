import type { GeoPoint, ProposedRoute, RoutePoint, Station } from '../types'

const EARTH_RADIUS_KM = 6371

export const haversineKm = (a: GeoPoint, b: GeoPoint): number => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export const polylineLengthKm = (coordinates: GeoPoint[]): number => {
  let total = 0
  for (let i = 1; i < coordinates.length; i += 1) {
    total += haversineKm(coordinates[i - 1], coordinates[i])
  }
  return total
}

export const routeLengthKm = (route: ProposedRoute, routePoints: Record<string, RoutePoint>): number => {
  const coordinates = route.pointIds
    .map((pointId) => routePoints[pointId]?.coord)
    .filter((value): value is GeoPoint => value !== undefined)
  return polylineLengthKm(coordinates)
}

export const calculateAnalytics = (
  routes: Record<string, ProposedRoute>,
  routePoints: Record<string, RoutePoint>,
  stations: Record<string, Station>,
  coverageRadiusKm: number,
) => {
  const routeList = Object.values(routes)
  const stationList = Object.values(stations)
  const totalRouteLengthKm = routeList.reduce((acc, route) => acc + routeLengthKm(route, routePoints), 0)
  const lengthByMode = routeList.reduce<Record<string, number>>((acc, route) => {
    acc[route.modeId] = (acc[route.modeId] ?? 0) + routeLengthKm(route, routePoints)
    return acc
  }, {})

  const disconnectedRoutes = routeList.filter((route) => route.stationIds.length < 2).map((route) => route.id)
  const orphanStations = stationList.filter((station) => station.routeIds.length === 0).map((station) => station.id)
  const interchangeCount = stationList.filter((station) => station.routeIds.length > 1).length

  return {
    proposedRouteCount: routeList.length,
    proposedStationCount: stationList.length,
    totalRouteLengthKm,
    lengthByMode,
    interchangeCount,
    disconnectedRoutes,
    orphanStations,
    approximateCoverageKm2: Math.PI * coverageRadiusKm * coverageRadiusKm * stationList.length,
  }
}
