import type { TransportModeId } from '../types'

export interface ModeConfig {
  id: TransportModeId
  names: Record<'en' | 'zh-CN' | 'ms', string>
  defaultColor: string
  lineStyle: 'solid' | 'dashed'
  symbol: string
}

export const MODE_CONFIG: ModeConfig[] = [
  { id: 'mrt', names: { en: 'MRT', 'zh-CN': '地铁', ms: 'MRT' }, defaultColor: '#1f6feb', lineStyle: 'solid', symbol: 'Ⓜ' },
  { id: 'lrt', names: { en: 'LRT', 'zh-CN': '轻轨', ms: 'LRT' }, defaultColor: '#d73a49', lineStyle: 'solid', symbol: 'Ⓛ' },
  { id: 'monorail', names: { en: 'Monorail', 'zh-CN': '单轨', ms: 'Monorel' }, defaultColor: '#8250df', lineStyle: 'solid', symbol: 'Ⓝ' },
  { id: 'commuter', names: { en: 'Commuter Rail', 'zh-CN': '通勤铁路', ms: 'Rel Komuter' }, defaultColor: '#2da44e', lineStyle: 'solid', symbol: 'Ⓒ' },
  { id: 'brt', names: { en: 'BRT', 'zh-CN': '快速巴士', ms: 'BRT' }, defaultColor: '#fb8500', lineStyle: 'dashed', symbol: 'Ⓑ' },
  { id: 'bus', names: { en: 'Bus', 'zh-CN': '巴士', ms: 'Bas' }, defaultColor: '#57606a', lineStyle: 'dashed', symbol: '🚌' },
]

export const MODE_BY_ID = Object.fromEntries(MODE_CONFIG.map((mode) => [mode.id, mode])) as Record<TransportModeId, ModeConfig>
