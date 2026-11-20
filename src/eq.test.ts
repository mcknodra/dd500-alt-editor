import { describe, it, expect } from 'vitest'
import { eqFilters, responseDb } from './eq'
import { F } from './params'
const flat: Record<string, number> = { lowcut: 0, lowgain: 20, lmgain: 20, lmfreq: 13, lmq: 2, hmgain: 20, hmfreq: 22, hmq: 2, higain: 20, hicut: 15 }
const getter = (over: Record<string, number> = {}) => (k: string) => ({ ...flat, ...over })[k] as number
describe('eq', () => {
  it('is flat with neutral settings', () => { const fs = eqFilters(getter()); for (const f of [50, 1000, 12000]) expect(Math.abs(responseDb(fs, 0, f))).toBeLessThan(0.01) })
  it('boosts at the low-mid centre frequency', () => { const fs = eqFilters(getter({ lmgain: 30 })); expect(responseDb(fs, 0, F[13])).toBeCloseTo(10, 0) })
  it('rolls off below the low cut', () => { const fs = eqFilters(getter({ lowcut: 10 })); expect(responseDb(fs, 0, 40)).toBeLessThan(-6) })
})
