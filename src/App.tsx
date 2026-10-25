import { useEffect, useMemo } from 'react'
import { MODE_CONFIG } from './config/modes'
import { MapCanvas } from './components/MapCanvas'
import { klangValleyDataset } from './data/regions'
import { I18nContext, translations } from './lib/i18n'
import { calculateAnalytics, routeLengthKm } from './lib/geo'
import { importProject } from './lib/persistence'
import { usePlannerStore } from './store/plannerStore'

function App() {
  const store = usePlannerStore()

  useEffect(() => {
    void store.initialize()
    if (!store.activeProjectId) {
      store.createProject('Klang Valley Sandbox', klangValleyDataset.metadata.id, klangValleyDataset.metadata.datasetVersion)
    }
  }, [])

  const project = store.activeProjectId ? store.projects[store.activeProjectId] ?? null : null
  const analytics = useMemo(
    () =>
      project
        ? calculateAnalytics(project.routes, project.routePoints, project.stations, 0.8)
        : null,
    [project],
  )

  const t = (key: keyof (typeof translations)['en']) => translations[store.locale][key]

  const selectedRoute = project && store.selectedRouteId ? project.routes[store.selectedRouteId] : null
  const selectedStation = project && store.selectedStationId ? project.stations[store.selectedStationId] : null

  return (
    <I18nContext.Provider value={{ locale: store.locale, t }}>
      <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
        <header className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 text-sm">
          <span className="font-semibold">{t('appTitle')}</span>
          <span className="text-slate-400">{t('region')}: {klangValleyDataset.metadata.name}</span>
          <span className="text-slate-400">{store.saveStatus === 'saved' ? t('saved') : store.saveStatus}</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => store.undo()} className="rounded bg-slate-800 px-2 py-1">{t('undo')}</button>
            <button onClick={() => store.redo()} className="rounded bg-slate-800 px-2 py-1">{t('redo')}</button>
            <button onClick={() => void store.saveActiveProject()} className="rounded bg-blue-700 px-2 py-1">{t('save')}</button>
            <button onClick={() => {
              if (!project) return
              const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `${project.name}.json`
              a.click()
              URL.revokeObjectURL(a.href)
            }} className="rounded bg-slate-800 px-2 py-1">{t('export')}</button>
            <label className="cursor-pointer rounded bg-slate-800 px-2 py-1">
              {t('import')}
              <input type="file" accept="application/json" className="hidden" onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const text = await file.text()
                const imported = importProject(text)
                store.createProject(imported.name, imported.regionId, imported.datasetVersion)
                const newProjectId = usePlannerStore.getState().activeProjectId
                if (!newProjectId) return
                usePlannerStore.setState((state) => ({
                  projects: {
                    ...state.projects,
                    [newProjectId]: { ...imported, id: newProjectId },
                  },
                }))
              }} />
            </label>
            <select value={store.locale} onChange={(e) => store.setLocale(e.target.value as typeof store.locale)} className="rounded bg-slate-800 px-2 py-1">
              <option value="en">EN</option>
              <option value="zh-CN">简中</option>
              <option value="ms">MS</option>
            </select>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr_320px]">
          <aside className="overflow-auto border-r border-slate-800 p-3 text-sm">
            <h2 className="mb-2 font-semibold">Tools</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              <button className="rounded bg-slate-800 px-2 py-1" onClick={() => store.setToolMode('pan')}>{t('pan')}</button>
              <button className="rounded bg-slate-800 px-2 py-1" onClick={() => store.setToolMode('select')}>{t('select')}</button>
              <button className="rounded bg-slate-800 px-2 py-1" onClick={() => store.setToolMode('placeStation')}>{t('placeStation')}</button>
            </div>

            <h3 className="mb-2 font-semibold">{t('drawRoute')}</h3>
            <div className="mb-3 grid gap-2">
              {MODE_CONFIG.map((mode) => (
                <button key={mode.id} onClick={() => store.beginRouteDraft(mode.id)} className="rounded border border-slate-700 px-2 py-1 text-left">
                  <span className="mr-2" style={{ color: mode.defaultColor }}>●</span>
                  {mode.names[store.locale]}
                </button>
              ))}
            </div>
            {store.draftRoute && (
              <div className="mb-4 flex gap-2">
                <button className="rounded bg-blue-700 px-2 py-1" onClick={() => store.finishRouteDraft()}>{t('finishRoute')}</button>
                <button className="rounded bg-slate-800 px-2 py-1" onClick={() => store.cancelRouteDraft()}>{t('cancel')}</button>
              </div>
            )}

            <h3 className="mb-2 font-semibold">{t('layers')}</h3>
            <div className="space-y-1">
              {Object.entries(store.layerVisibility).map(([layer, visible]) => (
                <label key={layer} className="flex items-center gap-2">
                  <input type="checkbox" checked={visible} onChange={(event) => store.setLayerVisibility(layer as keyof typeof store.layerVisibility, event.target.checked)} />
                  <span>{layer}</span>
                </label>
              ))}
            </div>
          </aside>

          <main className="relative min-h-0">
            <MapCanvas
              dataset={klangValleyDataset}
              project={project}
              layers={store.layerVisibility}
              toolMode={store.toolMode}
              draftPoints={store.draftRoute?.points ?? []}
              onMapClick={(coord) => {
                if (store.toolMode === 'drawRoute') {
                  store.appendDraftPoint(coord)
                } else if (store.toolMode === 'placeStation') {
                  store.addStation(coord)
                }
              }}
              onStationSelect={(id) => store.selectStation(id)}
              onRouteSelect={(id) => store.selectRoute(id)}
            />

            {analytics && (
              <section className="absolute bottom-3 left-3 rounded bg-slate-900/90 p-3 text-xs text-slate-200">
                <div>{t('routes')}: {analytics.proposedRouteCount}</div>
                <div>{t('stations')}: {analytics.proposedStationCount}</div>
                <div>Total length: {analytics.totalRouteLengthKm.toFixed(2)} km</div>
                <div>{t('coverage')}: {analytics.approximateCoverageKm2.toFixed(2)} km²</div>
                <div>{t('disconnectedRoutes')}: {analytics.disconnectedRoutes.length}</div>
                <div>{t('orphanStations')}: {analytics.orphanStations.length}</div>
              </section>
            )}
          </main>

          <aside className="overflow-auto border-l border-slate-800 p-3 text-sm">
            <h2 className="mb-2 font-semibold">Inspector</h2>
            {selectedRoute && project && (
              <div className="space-y-2">
                <div className="font-semibold">{selectedRoute.name}</div>
                <div>Mode: {selectedRoute.modeId}</div>
                <div>Length: {routeLengthKm(selectedRoute, project.routePoints).toFixed(2)} km</div>
                <div>Stations: {selectedRoute.stationIds.length}</div>
                <button className="rounded bg-red-700 px-2 py-1" onClick={() => store.deleteRoute(selectedRoute.id)}>{t('delete')}</button>
              </div>
            )}

            {selectedStation && project && (
              <div className="space-y-2">
                <input className="w-full rounded bg-slate-800 px-2 py-1" value={selectedStation.name} onChange={(e) => store.renameStation(selectedStation.id, e.target.value)} />
                <div>Lat: {selectedStation.coord.lat.toFixed(5)}, Lon: {selectedStation.coord.lon.toFixed(5)}</div>
                <div>Interchange: {selectedStation.routeIds.length > 1 ? 'Yes' : 'No'}</div>
                <div className="space-y-1">
                  {Object.values(project.routes).map((route) => (
                    <label key={route.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedStation.routeIds.includes(route.id)}
                        onChange={() => store.toggleRouteAtStation(selectedStation.id, route.id)}
                      />
                      <span>{route.name}</span>
                    </label>
                  ))}
                </div>
                <button className="rounded bg-red-700 px-2 py-1" onClick={() => store.deleteStation(selectedStation.id)}>{t('delete')}</button>
              </div>
            )}
          </aside>
        </div>

        <footer className="border-t border-slate-800 px-3 py-2 text-xs text-slate-400">
          {klangValleyDataset.metadata.attribution} · Dataset {klangValleyDataset.metadata.datasetVersion}
        </footer>
      </div>
    </I18nContext.Provider>
  )
}

export default App
