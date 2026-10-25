import { create } from 'zustand'
import { MODE_BY_ID } from '../config/modes'
import { stableId } from '../lib/ids'
import { deleteProject, listProjects, saveProject } from '../lib/persistence'
import type { GeoPoint, LayerVisibility, PlannerState, ProjectData, TransportModeId } from '../types'

interface PlannerActions {
  initialize: () => Promise<void>
  setLocale: (locale: PlannerState['locale']) => void
  setToolMode: (mode: PlannerState['toolMode']) => void
  setLayerVisibility: (layer: keyof LayerVisibility, value: boolean) => void
  beginRouteDraft: (modeId: TransportModeId) => void
  appendDraftPoint: (coord: GeoPoint) => void
  finishRouteDraft: () => void
  cancelRouteDraft: () => void
  selectRoute: (id: string | null) => void
  selectStation: (id: string | null) => void
  addStation: (coord: GeoPoint) => void
  moveStation: (stationId: string, coord: GeoPoint) => void
  renameStation: (stationId: string, name: string) => void
  toggleRouteAtStation: (stationId: string, routeId: string) => void
  deleteRoute: (routeId: string) => void
  deleteStation: (stationId: string) => void
  undo: () => void
  redo: () => void
  saveActiveProject: () => Promise<void>
  setActiveProject: (projectId: string) => void
  createProject: (name: string, regionId: string, datasetVersion: string) => void
  removeProject: (projectId: string) => Promise<void>
}

type PlannerStore = PlannerState & PlannerActions

const defaultLayers: LayerVisibility = {
  roads: true,
  highways: true,
  waterways: true,
  existingRailways: true,
  existingTransportRoutes: true,
  existingStations: true,
  proposedRoutes: true,
  proposedStations: true,
  placeLabels: true,
}

const projectTemplate = (name: string, regionId: string, datasetVersion: string): ProjectData => {
  const id = stableId('project')
  const now = new Date().toISOString()
  return {
    id,
    name,
    regionId,
    datasetVersion,
    createdAt: now,
    updatedAt: now,
    routes: {},
    stations: {},
    routePoints: {},
  }
}

const snapshot = (state: PlannerStore): Omit<PlannerState, 'history' | 'future'> => ({
  locale: state.locale,
  saveStatus: state.saveStatus,
  activeProjectId: state.activeProjectId,
  projects: state.projects,
  toolMode: state.toolMode,
  layerVisibility: state.layerVisibility,
  selectedRouteId: state.selectedRouteId,
  selectedStationId: state.selectedStationId,
  draftRoute: state.draftRoute,
})

const withHistory = (set: (partial: Partial<PlannerStore> | ((state: PlannerStore) => Partial<PlannerStore>)) => void, mutate: (state: PlannerStore) => Partial<PlannerStore>) => {
  set((state) => {
    const previous = snapshot(state)
    const next = mutate(state)
    return {
      ...next,
      history: [...state.history, previous],
      future: [],
    }
  })
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  locale: 'en',
  saveStatus: 'idle',
  activeProjectId: null,
  projects: {},
  toolMode: 'pan',
  layerVisibility: defaultLayers,
  selectedRouteId: null,
  selectedStationId: null,
  draftRoute: null,
  history: [],
  future: [],

  initialize: async () => {
    const projects = await listProjects()
    const mapped = Object.fromEntries(projects.map((project) => [project.id, project]))
    const first = projects[0]?.id ?? null
    set({ projects: mapped, activeProjectId: first })
  },

  setLocale: (locale) => set({ locale }),
  setToolMode: (toolMode) => set({ toolMode }),
  setLayerVisibility: (layer, value) => set((state) => ({ layerVisibility: { ...state.layerVisibility, [layer]: value } })),

  beginRouteDraft: (modeId) => {
    const mode = MODE_BY_ID[modeId]
    withHistory(set, () => ({
      draftRoute: { modeId, color: mode.defaultColor, name: `New ${mode.names.en}`, points: [] },
      toolMode: 'drawRoute',
      selectedRouteId: null,
      selectedStationId: null,
    }))
  },

  appendDraftPoint: (coord) => {
    set((state) => {
      if (!state.draftRoute) {
        return state
      }
      return { draftRoute: { ...state.draftRoute, points: [...state.draftRoute.points, coord] } }
    })
  },

  finishRouteDraft: () => {
    withHistory(set, (state) => {
      if (!state.draftRoute || !state.activeProjectId || state.draftRoute.points.length < 2) {
        return {}
      }
      const project = state.projects[state.activeProjectId]
      if (!project) {
        return {}
      }
      const routeId = stableId('route')
      const pointEntries = state.draftRoute.points.map((coord) => {
        const id = stableId('point')
        return [id, { id, coord }] as const
      })
      const route = {
        id: routeId,
        name: state.draftRoute.name,
        color: state.draftRoute.color,
        modeId: state.draftRoute.modeId,
        pointIds: pointEntries.map(([id]) => id),
        stationIds: [],
      }
      const updatedProject: ProjectData = {
        ...project,
        updatedAt: new Date().toISOString(),
        routes: { ...project.routes, [routeId]: route },
        routePoints: { ...project.routePoints, ...Object.fromEntries(pointEntries) },
      }
      return {
        projects: { ...state.projects, [project.id]: updatedProject },
        selectedRouteId: routeId,
        draftRoute: null,
        toolMode: 'select',
      }
    })
  },

  cancelRouteDraft: () => set({ draftRoute: null, toolMode: 'pan' }),

  selectRoute: (selectedRouteId) => set({ selectedRouteId, selectedStationId: null }),
  selectStation: (selectedStationId) => set({ selectedStationId, selectedRouteId: null }),

  addStation: (coord) => {
    withHistory(set, (state) => {
      if (!state.activeProjectId) {
        return {}
      }
      const project = state.projects[state.activeProjectId]
      if (!project) {
        return {}
      }
      const stationId = stableId('station')
      const selectedRoute = state.selectedRouteId ? project.routes[state.selectedRouteId] : undefined
      const routeIds = selectedRoute ? [selectedRoute.id] : []
      const station = {
        id: stationId,
        name: `Station ${Object.keys(project.stations).length + 1}`,
        coord,
        routeIds,
        interchangeGroupId: routeIds.length > 1 ? `int_${stationId}` : undefined,
      }
      const routes = selectedRoute
        ? {
            ...project.routes,
            [selectedRoute.id]: { ...selectedRoute, stationIds: [...selectedRoute.stationIds, stationId] },
          }
        : project.routes
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
        stations: { ...project.stations, [stationId]: station },
        routes,
      }
      return {
        projects: { ...state.projects, [project.id]: updatedProject },
        selectedStationId: stationId,
      }
    })
  },

  moveStation: (stationId, coord) => {
    withHistory(set, (state) => {
      if (!state.activeProjectId) return {}
      const project = state.projects[state.activeProjectId]
      const station = project?.stations[stationId]
      if (!project || !station) return {}
      const updated = { ...station, coord }
      return {
        projects: {
          ...state.projects,
          [project.id]: {
            ...project,
            updatedAt: new Date().toISOString(),
            stations: { ...project.stations, [stationId]: updated },
          },
        },
      }
    })
  },

  renameStation: (stationId, name) => {
    withHistory(set, (state) => {
      if (!state.activeProjectId) return {}
      const project = state.projects[state.activeProjectId]
      const station = project?.stations[stationId]
      if (!project || !station) return {}
      return {
        projects: {
          ...state.projects,
          [project.id]: {
            ...project,
            updatedAt: new Date().toISOString(),
            stations: { ...project.stations, [stationId]: { ...station, name } },
          },
        },
      }
    })
  },

  toggleRouteAtStation: (stationId, routeId) => {
    withHistory(set, (state) => {
      if (!state.activeProjectId) return {}
      const project = state.projects[state.activeProjectId]
      const station = project?.stations[stationId]
      const route = project?.routes[routeId]
      if (!project || !station || !route) return {}
      const hasRoute = station.routeIds.includes(routeId)
      const routeIds = hasRoute ? station.routeIds.filter((value) => value !== routeId) : [...station.routeIds, routeId]
      const stationIds = hasRoute ? route.stationIds.filter((value) => value !== stationId) : [...route.stationIds, stationId]
      return {
        projects: {
          ...state.projects,
          [project.id]: {
            ...project,
            updatedAt: new Date().toISOString(),
            stations: {
              ...project.stations,
              [stationId]: {
                ...station,
                routeIds,
                interchangeGroupId: routeIds.length > 1 ? `int_${stationId}` : undefined,
              },
            },
            routes: {
              ...project.routes,
              [routeId]: {
                ...route,
                stationIds,
              },
            },
          },
        },
      }
    })
  },

  deleteRoute: (routeId) => {
    withHistory(set, (state) => {
      if (!state.activeProjectId) return {}
      const project = state.projects[state.activeProjectId]
      if (!project) return {}
      const route = project.routes[routeId]
      if (!route) return {}
      const routes = { ...project.routes }
      delete routes[routeId]
      const stations = Object.fromEntries(
        Object.entries(project.stations).map(([id, station]) => {
          const routeIds = station.routeIds.filter((candidate) => candidate !== routeId)
          return [id, { ...station, routeIds, interchangeGroupId: routeIds.length > 1 ? `int_${id}` : undefined }]
        }),
      )
      return {
        projects: {
          ...state.projects,
          [project.id]: { ...project, updatedAt: new Date().toISOString(), routes, stations },
        },
        selectedRouteId: null,
      }
    })
  },

  deleteStation: (stationId) => {
    withHistory(set, (state) => {
      if (!state.activeProjectId) return {}
      const project = state.projects[state.activeProjectId]
      const station = project?.stations[stationId]
      if (!project || !station) return {}
      const stations = { ...project.stations }
      delete stations[stationId]
      const routes = Object.fromEntries(
        Object.entries(project.routes).map(([id, route]) => [id, { ...route, stationIds: route.stationIds.filter((value) => value !== stationId) }]),
      )
      return {
        projects: {
          ...state.projects,
          [project.id]: { ...project, updatedAt: new Date().toISOString(), routes, stations },
        },
        selectedStationId: null,
      }
    })
  },

  undo: () => {
    set((state) => {
      const previous = state.history[state.history.length - 1]
      if (!previous) return state
      const current = snapshot(state)
      return {
        ...state,
        ...previous,
        history: state.history.slice(0, -1),
        future: [...state.future, current],
      }
    })
  },

  redo: () => {
    set((state) => {
      const next = state.future[state.future.length - 1]
      if (!next) return state
      const current = snapshot(state)
      return {
        ...state,
        ...next,
        history: [...state.history, current],
        future: state.future.slice(0, -1),
      }
    })
  },

  saveActiveProject: async () => {
    const state = get()
    if (!state.activeProjectId) return
    const project = state.projects[state.activeProjectId]
    if (!project) return
    set({ saveStatus: 'saving' })
    try {
      await saveProject(project)
      set({ saveStatus: 'saved' })
    } catch {
      set({ saveStatus: 'error' })
    }
  },

  setActiveProject: (activeProjectId) => set({ activeProjectId, selectedRouteId: null, selectedStationId: null, draftRoute: null }),

  createProject: (name, regionId, datasetVersion) => {
    withHistory(set, (state) => {
      const project = projectTemplate(name, regionId, datasetVersion)
      return {
        projects: { ...state.projects, [project.id]: project },
        activeProjectId: project.id,
      }
    })
  },

  removeProject: async (projectId) => {
    await deleteProject(projectId)
    withHistory(set, (state) => {
      const projects = { ...state.projects }
      delete projects[projectId]
      const nextProject = Object.keys(projects)[0] ?? null
      return { projects, activeProjectId: nextProject }
    })
  },
}))
