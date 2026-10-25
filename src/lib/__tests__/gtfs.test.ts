import { describe, expect, it } from 'vitest'
import { parseGtfsStatic } from '../gtfs'

describe('GTFS parser', () => {
  it('parses available files and tolerates missing optional files', () => {
    const parsed = parseGtfsStatic({
      'routes.txt': 'route_id,route_short_name\nr1,KG',
      'stops.txt': 'stop_id,stop_name,stop_lat,stop_lon\ns1,KL Sentral,3.1346,101.6865',
    })

    expect(parsed.routes?.rows[0]?.route_id).toBe('r1')
    expect(parsed.stops?.rows[0]?.stop_name).toBe('KL Sentral')
    expect(parsed.shapes).toBeUndefined()
  })
})
