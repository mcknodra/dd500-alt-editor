// Roland SysEx helpers (DT1 = 0x12 data set, RQ1 = 0x11 data request) for the DD-500.
import { BUF } from '../params'
export const TEMP = 0x30 * 128 ** 3            // temporary (live) patch area
export const enc = (a: number) => [(a >> 21) & 127, (a >> 14) & 127, (a >> 7) & 127, a & 127]
export const dec = (b: ArrayLike<number>) => ((b[0] * 128 + b[1]) * 128 + b[2]) * 128 + b[3]
export const checksum = (b: number[]) => (128 - (b.reduce((a, c) => a + c, 0) % 128)) % 128

function build(cmd: 0x11 | 0x12, addr: number, data: number[], dev = 0x7f) {
  const body = [...enc(addr), ...data]
  return [0xf0, 0x41, dev, 0x00, 0x00, 0x00, 0x4d, cmd, ...body, checksum(body), 0xf7]
}
export const rq1 = (addr: number, size: number) => build(0x11, addr, enc(size))
export const dt1 = (addr: number, data: number[]) => build(0x12, addr, data)

/** Address of byte `off` in patch letter L (0..2). bank=0 is the live buffer, 1..99 a stored bank. */
export const patchAddr = (L: number, off = 0, bank = 0) => TEMP + bank * 65536 + 2048 * (L + 1) + off

/** Split a write into <=64-byte DT1 messages. */
export function writeMessages(L: number, off: number, bytes: number[], bank = 0): number[][] {
  const out: number[][] = []
  for (let i = 0; i < bytes.length; i += 64) out.push(dt1(patchAddr(L, off + i, bank), bytes.slice(i, i + 64)))
  return out
}
export function parseDT1(m: ArrayLike<number>): { addr: number; data: number[] } | null {
  const n = m.length
  if (n < 14 || m[0] !== 0xf0 || m[1] !== 0x41 || m[3] !== 0 || m[4] !== 0 || m[5] !== 0 || m[6] !== 0x4d || m[7] !== 0x12) return null
  const body = Array.from(m).slice(8, n - 2)
  if (checksum(body) !== m[n - 2]) return null
  return { addr: dec(body), data: body.slice(4) }
}
/** Map an absolute address in the live buffer to patch letter + index, if it is one we keep. */
export function locate(addr: number): { L: number; idx: number } | null {
  const rel = addr - TEMP
  if (rel < 2048 || rel >= 8192) return null
  const idx = rel & 2047
  return idx < BUF ? { L: (rel >> 11) - 1, idx } : null
}
