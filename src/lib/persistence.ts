import { openDB } from 'idb'
import type { ProjectData } from '../types'

const DB_NAME = 'transitmy-planner'
const STORE_NAME = 'projects'

const inMemory = new Map<string, ProjectData>()

const hasIndexedDb = (): boolean => typeof indexedDB !== 'undefined'

const getDb = async () =>
  openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    },
  })

export const listProjects = async (): Promise<ProjectData[]> => {
  if (!hasIndexedDb()) {
    return [...inMemory.values()]
  }
  const db = await getDb()
  return db.getAll(STORE_NAME)
}

export const saveProject = async (project: ProjectData): Promise<void> => {
  if (!hasIndexedDb()) {
    inMemory.set(project.id, project)
    return
  }
  const db = await getDb()
  await db.put(STORE_NAME, project)
}

export const deleteProject = async (id: string): Promise<void> => {
  if (!hasIndexedDb()) {
    inMemory.delete(id)
    return
  }
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

export const importProject = (raw: string): ProjectData => {
  const parsed = JSON.parse(raw) as Partial<ProjectData>
  if (!parsed.id || !parsed.name || !parsed.regionId || !parsed.datasetVersion) {
    throw new Error('Invalid project metadata')
  }
  if (!parsed.routes || !parsed.routePoints || !parsed.stations) {
    throw new Error('Invalid project network payload')
  }
  return parsed as ProjectData
}
