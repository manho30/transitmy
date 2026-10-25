export type TransportModeId = 'mrt' | 'lrt' | 'monorail' | 'commuter' | 'brt' | 'bus'

export interface GeoPoint {
  lon: number
  lat: number
}

export interface RoutePoint {
  id: string
  coord: GeoPoint
}

export interface ProposedRoute {
  id: string
  name: string
  modeId: TransportModeId
  color: string
  pointIds: string[]
  stationIds: string[]
}

export interface Station {
  id: string
  name: string
  coord: GeoPoint
  routeIds: string[]
  interchangeGroupId?: string
  notes?: string
}

export interface RegionMetadata {
  id: string
  name: string
  bbox: [number, number, number, number]
  crs: string
  datasetVersion: string
  extractedAt: string
  attribution: string
  supportedLayers: string[]
}

export interface PolylineFeature {
  id: string
  name?: string
  kind: 'road' | 'highway' | 'waterway' | 'railway' | 'existing_route'
  coordinates: GeoPoint[]
}

export interface PointFeature {
  id: string
  name: string
  kind: 'place' | 'existing_station'
  coord: GeoPoint
}

export interface RegionDataset {
  metadata: RegionMetadata
  lines: PolylineFeature[]
  points: PointFeature[]
}

export interface ProjectData {
  id: string
  name: string
  regionId: string
  datasetVersion: string
  createdAt: string
  updatedAt: string
  routePoints: Record<string, RoutePoint>
  routes: Record<string, ProposedRoute>
  stations: Record<string, Station>
}

export interface RouteDraft {
  modeId: TransportModeId
  color: string
  name: string
  points: GeoPoint[]
}

export type ToolMode = 'pan' | 'drawRoute' | 'placeStation' | 'select'

export interface LayerVisibility {
  roads: boolean
  highways: boolean
  waterways: boolean
  existingRailways: boolean
  existingTransportRoutes: boolean
  existingStations: boolean
  proposedRoutes: boolean
  proposedStations: boolean
  placeLabels: boolean
}

export interface PlannerState {
  locale: 'en' | 'zh-CN' | 'ms'
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  activeProjectId: string | null
  projects: Record<string, ProjectData>
  toolMode: ToolMode
  layerVisibility: LayerVisibility
  selectedRouteId: string | null
  selectedStationId: string | null
  draftRoute: RouteDraft | null
  history: Omit<PlannerState, 'history' | 'future'>[]
  future: Omit<PlannerState, 'history' | 'future'>[]
}
