import { PARAMS, GROUPS, readParam, modeOf, nameOf } from './params'
export interface Preset { name: string; params: Record<string, number> }
export const STARTERS: Preset[] = [
  { name: 'Slapback', params: { mode: 0, time: 120, fb: 12, tone: 55, elevel: 55, mdepth: 0 } },
  { name: 'Dotted eighth', params: { mode: 0, time: 430, note: 5, fb: 35, tone: 45, elevel: 60 } },
  { name: 'Tape drift', params: { mode: 10, time: 480, fb: 40, tone: 42, elevel: 58, twow: 35, tmod: 30 } },
  { name: 'Shimmer wash', params: { mode: 4, time: 700, fb: 55, elevel: 60, shtype: 0, shpit: 36, shbal: 50, shfb: 40, shrise: 4 } },
  { name: 'Dark analog', params: { mode: 11, time: 350, fb: 45, tone: 35, elevel: 55, hidamp: 12, hidampf: 5 } }
]
export function snapshot(b: Uint8Array): Preset {
  const params: Record<string, number> = { mode: modeOf(b) }
  const active = new Set([...GROUPS.main, ...GROUPS.eq, ...GROUPS.oth, ...(GROUPS[String(modeOf(b))] ?? [])])
  for (const k of active) params[k] = readParam(b, PARAMS[k])
  return { name: nameOf(b) || 'Preset', params }
}
export function parsePreset(text: string): Preset | null {
  try {
    const p = JSON.parse(text)
    if (!p || typeof p.params !== 'object') return null
    const params: Record<string, number> = {}
    for (const [k, v] of Object.entries(p.params)) if ((k === 'mode' || PARAMS[k]) && typeof v === 'number') params[k] = v
    return { name: String(p.name ?? 'Preset').slice(0, 16), params }
  } catch { return null }
}
const KEY = 'dd500lib'
export const loadLib = (): Preset[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
export const saveLib = (l: Preset[]) => { try { localStorage.setItem(KEY, JSON.stringify(l)) } catch { /* storage unavailable */ } }
