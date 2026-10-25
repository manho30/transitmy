import { describe, expect, it } from 'vitest'
import { importProject, saveProject, listProjects } from '../persistence'

const project = {
  id: 'p1',
  name: 'Sandbox',
  regionId: 'my-klang-valley',
  datasetVersion: 'v1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  routes: {},
  routePoints: {},
  stations: {},
}

describe('persistence', () => {
  it('saves and lists projects in memory fallback', async () => {
    await saveProject(project)
    const projects = await listProjects()
    expect(projects.find((candidate) => candidate.id === project.id)).toBeDefined()
  })

  it('rejects invalid imports', () => {
    expect(() => importProject('{"id":"x"}')).toThrow(/Invalid/)
  })
})
