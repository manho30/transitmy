import { useEffect, useRef } from 'react'
import { Application, Color, Container, Graphics, Text } from 'pixi.js'
import type { GeoPoint, LayerVisibility, ProjectData, RegionDataset, ToolMode } from '../types'

interface MapCanvasProps {
  dataset: RegionDataset
  project: ProjectData | null
  layers: LayerVisibility
  toolMode: ToolMode
  draftPoints: GeoPoint[]
  onMapClick: (coord: GeoPoint) => void
  onStationSelect: (stationId: string) => void
  onRouteSelect: (routeId: string) => void
}

const projectPoint = (point: GeoPoint, bbox: [number, number, number, number], width: number, height: number): { x: number; y: number } => {
  const [minLon, minLat, maxLon, maxLat] = bbox
  const x = ((point.lon - minLon) / (maxLon - minLon)) * width
  const y = height - ((point.lat - minLat) / (maxLat - minLat)) * height
  return { x, y }
}

const unprojectPoint = (x: number, y: number, bbox: [number, number, number, number], width: number, height: number): GeoPoint => {
  const [minLon, minLat, maxLon, maxLat] = bbox
  const lon = minLon + (x / width) * (maxLon - minLon)
  const lat = minLat + ((height - y) / height) * (maxLat - minLat)
  return { lon, lat }
}

export function MapCanvas({ dataset, project, layers, toolMode, draftPoints, onMapClick, onStationSelect, onRouteSelect }: MapCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    if (!hostRef.current) return

    const app = new Application()
    appRef.current = app

    void (async () => {
      await app.init({ background: '#08121e', resizeTo: hostRef.current ?? undefined, antialias: true })
      hostRef.current?.append(app.canvas)

      const draw = () => {
        app.stage.removeChildren()
        const container = new Container()
        app.stage.addChild(container)
        const { width, height } = app.screen

        for (const line of dataset.lines) {
          const visibility =
            (line.kind === 'road' && layers.roads) ||
            (line.kind === 'highway' && layers.highways) ||
            (line.kind === 'waterway' && layers.waterways) ||
            (line.kind === 'railway' && layers.existingRailways) ||
            (line.kind === 'existing_route' && layers.existingTransportRoutes)
          if (!visibility) continue

          const color =
            line.kind === 'road'
              ? '#334155'
              : line.kind === 'highway'
                ? '#f59e0b'
                : line.kind === 'waterway'
                  ? '#38bdf8'
                  : line.kind === 'railway'
                    ? '#22c55e'
                    : '#a855f7'
          const graphics = new Graphics().setStrokeStyle({ width: line.kind === 'highway' ? 3 : 2, color: new Color(color) })
          line.coordinates.forEach((coord, index) => {
            const { x, y } = projectPoint(coord, dataset.metadata.bbox, width, height)
            if (index === 0) {
              graphics.moveTo(x, y)
            } else {
              graphics.lineTo(x, y)
            }
          })
          container.addChild(graphics.stroke())
        }

        if (layers.placeLabels) {
          for (const point of dataset.points.filter((feature) => feature.kind === 'place')) {
            const { x, y } = projectPoint(point.coord, dataset.metadata.bbox, width, height)
            const label = new Text({ text: point.name, style: { fill: '#cbd5e1', fontSize: 12 } })
            label.x = x + 4
            label.y = y + 4
            container.addChild(label)
          }
        }

        if (layers.existingStations) {
          for (const point of dataset.points.filter((feature) => feature.kind === 'existing_station')) {
            const { x, y } = projectPoint(point.coord, dataset.metadata.bbox, width, height)
            const marker = new Graphics().circle(x, y, 4).fill(new Color('#f97316')).stroke({ color: new Color('#ffffff'), width: 1 })
            container.addChild(marker)
          }
        }

        if (project) {
          if (layers.proposedRoutes) {
            Object.values(project.routes).forEach((route) => {
              const graphics = new Graphics().setStrokeStyle({ width: 3, color: new Color(route.color) })
              route.pointIds
                .map((pointId) => project.routePoints[pointId])
                .filter((value): value is NonNullable<typeof value> => value !== undefined)
                .forEach((point, index) => {
                  const projected = projectPoint(point.coord, dataset.metadata.bbox, width, height)
                  if (index === 0) graphics.moveTo(projected.x, projected.y)
                  else graphics.lineTo(projected.x, projected.y)
                })
              const g = graphics.stroke()
              g.eventMode = 'static'
              g.cursor = 'pointer'
              g.on('pointertap', () => onRouteSelect(route.id))
              container.addChild(g)
            })
          }

          if (layers.proposedStations) {
            Object.values(project.stations).forEach((station) => {
              const { x, y } = projectPoint(station.coord, dataset.metadata.bbox, width, height)
              const marker = new Graphics().circle(x, y, station.routeIds.length > 1 ? 7 : 5).fill(new Color('#f8fafc')).stroke({
                color: new Color(station.routeIds.length > 1 ? '#22c55e' : '#3b82f6'),
                width: 2,
              })
              marker.eventMode = 'static'
              marker.cursor = 'pointer'
              marker.on('pointertap', () => onStationSelect(station.id))
              container.addChild(marker)
            })
          }
        }

        if (draftPoints.length > 0) {
          const draft = new Graphics().setStrokeStyle({ width: 2, color: new Color('#60a5fa') })
          draftPoints.forEach((coord, index) => {
            const projected = projectPoint(coord, dataset.metadata.bbox, width, height)
            if (index === 0) draft.moveTo(projected.x, projected.y)
            else draft.lineTo(projected.x, projected.y)
          })
          container.addChild(draft.stroke())
        }
      }

      draw()

      app.stage.eventMode = 'static'
      app.stage.hitArea = app.screen
      app.stage.on('pointertap', (event) => {
        if (toolMode === 'pan') return
        const point = event.global
        const coord = unprojectPoint(point.x, point.y, dataset.metadata.bbox, app.screen.width, app.screen.height)
        onMapClick(coord)
      })

      app.renderer.on('resize', draw)
      ;(app as Application & { __draw?: () => void }).__draw = draw
    })()

    return () => {
      app.destroy(true, { children: true })
      appRef.current = null
    }
  }, [])

  useEffect(() => {
    const draw = (appRef.current as (Application & { __draw?: () => void }) | null)?.__draw
    draw?.()
  }, [dataset, project, layers, draftPoints, toolMode])

  return <div ref={hostRef} className="h-full w-full" />
}
