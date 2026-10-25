import { describe, expect, it } from 'vitest'
import { calculateAnalytics, haversineKm, polylineLengthKm } from '../geo'

describe('geo utilities', () => {
  it('calculates haversine distance for geographic coordinates', () => {
    const distance = haversineKm({ lon: 101.6869, lat: 3.139 }, { lon: 101.7069, lat: 3.1548 })
    expect(distance).toBeGreaterThan(2)
    expect(distance).toBeLessThan(4)
  })

  it('calculates polyline length and analytics', () => {
    const routePoints = {
      p1: { id: 'p1', coord: { lon: 101.6869, lat: 3.139 } },
      p2: { id: 'p2', coord: { lon: 101.7069, lat: 3.1548 } },
    }
    const routes = {
      r1: { id: 'r1', name: 'Test', modeId: 'mrt' as const, color: '#000', pointIds: ['p1', 'p2'], stationIds: ['s1'] },
    }
    const stations = {
      s1: { id: 's1', name: 'A', coord: { lon: 101.6869, lat: 3.139 }, routeIds: ['r1'] },
      s2: { id: 's2', name: 'B', coord: { lon: 101.7, lat: 3.15 }, routeIds: [] },
    }

    expect(polylineLengthKm([routePoints.p1.coord, routePoints.p2.coord])).toBeGreaterThan(0)

    const analytics = calculateAnalytics(routes, routePoints, stations, 0.8)
    expect(analytics.proposedRouteCount).toBe(1)
    expect(analytics.orphanStations).toEqual(['s2'])
  })
})
