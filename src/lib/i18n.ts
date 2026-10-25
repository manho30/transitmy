import { createContext, useContext } from 'react'

export const translations = {
  en: {
    appTitle: 'Transit Malaysia',
    save: 'Save',
    saved: 'Saved',
    undo: 'Undo',
    redo: 'Redo',
    settings: 'Settings',
    drawRoute: 'New route',
    placeStation: 'Place station',
    pan: 'Pan',
    select: 'Select',
    finishRoute: 'Finish route',
    cancel: 'Cancel',
    routes: 'Proposed routes',
    stations: 'Proposed stations',
    analytics: 'Analytics',
    import: 'Import',
    export: 'Export',
    delete: 'Delete',
    region: 'Region',
    layers: 'Layers',
    disconnectedRoutes: 'Disconnected routes',
    orphanStations: 'Stations without routes',
    coverage: 'Approximate station coverage',
  },
  'zh-CN': {
    appTitle: '马来西亚交通规划',
    save: '保存',
    saved: '已保存',
    undo: '撤销',
    redo: '重做',
    settings: '设置',
    drawRoute: '新建线路',
    placeStation: '放置车站',
    pan: '平移',
    select: '选择',
    finishRoute: '完成线路',
    cancel: '取消',
    routes: '规划线路',
    stations: '规划车站',
    analytics: '统计',
    import: '导入',
    export: '导出',
    delete: '删除',
    region: '区域',
    layers: '图层',
    disconnectedRoutes: '未连接线路',
    orphanStations: '未关联车站',
    coverage: '车站近似覆盖范围',
  },
  ms: {
    appTitle: 'Transit Malaysia',
    save: 'Simpan',
    saved: 'Disimpan',
    undo: 'Buat asal',
    redo: 'Buat semula',
    settings: 'Tetapan',
    drawRoute: 'Laluan baharu',
    placeStation: 'Letak stesen',
    pan: 'Gerak peta',
    select: 'Pilih',
    finishRoute: 'Siapkan laluan',
    cancel: 'Batal',
    routes: 'Laluan cadangan',
    stations: 'Stesen cadangan',
    analytics: 'Analitik',
    import: 'Import',
    export: 'Eksport',
    delete: 'Padam',
    region: 'Rantau',
    layers: 'Lapisan',
    disconnectedRoutes: 'Laluan terputus',
    orphanStations: 'Stesen tanpa laluan',
    coverage: 'Liputan anggaran stesen',
  },
}

export type Locale = keyof typeof translations

type I18nContextValue = {
  locale: Locale
  t: (key: keyof (typeof translations)['en']) => string
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: (key) => translations.en[key],
})

export const useI18n = (): I18nContextValue => useContext(I18nContext)
