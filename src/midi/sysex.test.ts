import { describe, it, expect } from 'vitest'
import { checksum, enc, dec, rq1, dt1, parseDT1, patchAddr, locate, TEMP, writeMessages } from './sysex'
import { PARAMS, readParam, writeParam, defaultPatch } from '../params'

describe('sysex', () => {
  it('matches the Roland checksum example', () => expect(checksum([0x40, 0, 0x7f, 0, 0])).toBe(0x41))
  it('encodes/decodes 7-bit addresses', () => { for (const a of [0, 127, 128, TEMP, TEMP + 65536 + 2048 + 475]) expect(dec(enc(a))).toBe(a) })
  it('addresses patch A of bank 1 at 30 04 10 00', () => expect(enc(patchAddr(0, 0, 1))).toEqual([0x30, 4, 0x10, 0]))
  it('builds an RQ1 for one patch', () => {
    const m = rq1(patchAddr(0), 476)
    expect(m.slice(0, 8)).toEqual([0xf0, 0x41, 0x7f, 0, 0, 0, 0x4d, 0x11])
    expect(m.slice(8, 12)).toEqual([0x30, 0, 0x10, 0]); expect(m.slice(12, 16)).toEqual([0, 0, 3, 92]); expect(m.at(-1)).toBe(0xf7)
  })
  it('round-trips DT1 and rejects bad checksums', () => {
    const m = dt1(patchAddr(1, 17), [1, 2, 3])
    expect(parseDT1(m)).toEqual({ addr: patchAddr(1, 17), data: [1, 2, 3] })
    const bad = [...m]; bad[bad.length - 2] ^= 1; expect(parseDT1(bad)).toBeNull()
  })
  it('locates live-buffer addresses', () => {
    expect(locate(patchAddr(2, 5))).toEqual({ L: 2, idx: 5 }); expect(locate(TEMP)).toBeNull(); expect(locate(patchAddr(0, 600))).toBeNull()
  })
  it('chunks large writes', () => expect(writeMessages(0, 0, new Array(476).fill(0)).length).toBe(8))
})
describe('params', () => {
  it('round-trips 4-byte nibble values', () => { const b = defaultPatch(); const p = PARAMS.time; writeParam(b, p, 10000); expect(readParam(b, p)).toBe(10000) })
  it('clamps to range', () => { const b = defaultPatch(); writeParam(b, PARAMS.fb, 999); expect(readParam(b, PARAMS.fb)).toBe(100); writeParam(b, PARAMS.time, 0); expect(readParam(b, PARAMS.time)).toBe(1) })
  it('has no overlapping byte offsets', () => { const seen = new Map<number, string>(); for (const p of Object.values(PARAMS)) for (let i = 0; i < p.n; i++) { expect(seen.get(p.off + i), `${p.key} vs ${seen.get(p.off + i)}`).toBeUndefined(); seen.set(p.off + i, p.key) } })
})
