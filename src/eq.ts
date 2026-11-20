// Approximate EQ response model (RBJ biquads). Shelf corners / slopes are assumptions, not pedal data.
import { F, HCV, QS } from './params'
export type Coef = [number, number, number, number, number, number]
type Kind = 'pk' | 'ls' | 'hs' | 'hp' | 'lp'
const FS = 48000

export function biquad(t: Kind, f0: number, g: number, Q: number): Coef {
  const A = Math.pow(10, g / 40), w = (2 * Math.PI * f0) / FS, cs = Math.cos(w), sn = Math.sin(w)
  const al = sn / (2 * Q), sq = 2 * Math.sqrt(A) * (sn / 2) * Math.SQRT2
  switch (t) {
    case 'pk': return [1 + al * A, -2 * cs, 1 - al * A, 1 + al / A, -2 * cs, 1 - al / A]
    case 'ls': return [A * (A + 1 - (A - 1) * cs + sq), 2 * A * (A - 1 - (A + 1) * cs), A * (A + 1 - (A - 1) * cs - sq), A + 1 + (A - 1) * cs + sq, -2 * (A - 1 + (A + 1) * cs), A + 1 + (A - 1) * cs - sq]
    case 'hs': return [A * (A + 1 + (A - 1) * cs + sq), -2 * A * (A - 1 + (A + 1) * cs), A * (A + 1 + (A - 1) * cs - sq), A + 1 - (A - 1) * cs + sq, 2 * (A - 1 - (A + 1) * cs), A + 1 - (A - 1) * cs - sq]
    case 'hp': return [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2, 1 + al, -2 * cs, 1 - al]
    default: return [(1 - cs) / 2, 1 - cs, (1 - cs) / 2, 1 + al, -2 * cs, 1 - al]
  }
}
export function magDb(c: Coef, f: number): number {
  const w = (2 * Math.PI * f) / FS, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w)
  const nr = c[0] + c[1] * c1 + c[2] * c2, ni = -(c[1] * s1 + c[2] * s2)
  const dr = c[3] + c[4] * c1 + c[5] * c2, di = -(c[4] * s1 + c[5] * s2)
  return 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di))
}
export function eqFilters(get: (k: string) => number): Coef[] {
  const g = (k: string) => get(k) - 20, fs: Coef[] = []
  const lc = get('lowcut'); if (lc > 0) fs.push(biquad('hp', F[lc - 1], 0, 0.707))
  fs.push(biquad('ls', 100, g('lowgain'), 1), biquad('pk', F[get('lmfreq')], g('lmgain'), QS[get('lmq')]),
    biquad('pk', F[get('hmfreq')], g('hmgain'), QS[get('hmq')]), biquad('hs', 8000, g('higain'), 1))
  const hc = HCV[get('hicut')]; if (hc) fs.push(biquad('lp', hc, 0, 0.707))
  return fs
}
export const responseDb = (fs: Coef[], offset: number, f: number) => fs.reduce((d, c) => d + magDb(c, f), offset)

export interface EqNode { g: string; fk?: string; fixed?: number }
export const NODES: EqNode[] = [{ g: 'lowgain', fixed: 100 }, { g: 'lmgain', fk: 'lmfreq' }, { g: 'hmgain', fk: 'hmfreq' }, { g: 'higain', fixed: 8000 }]
export const nodeFreq = (n: EqNode, get: (k: string) => number) => (n.fk ? F[get(n.fk)] : (n.fixed as number))
