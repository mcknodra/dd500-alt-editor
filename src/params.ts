// Parameter table for the Boss DD-500 (offsets from the Ver.2 MIDI implementation).
// Offsets are patch-relative; o(hi, lo) converts the two 7-bit address bytes.
export const o = (h: number, l: number) => h * 128 + l;
export const F = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
  800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000,
];
export const fmtF = (v: number) =>
  v >= 1000 ? `${+(v / 1000).toFixed(2)}k` : `${v}`;
export const FN = F.map(fmtF);
export const HCV = [
  630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000,
  12500, 16000, 0,
]; // 0 = flat
export const HCN = HCV.map((v) => (v ? fmtF(v) : "Flat"));
export const QS = [0.5, 1, 2, 4, 8, 16];
export const MODES = [
  "Standard",
  "Tera Echo",
  "Slow Attack",
  "Filter",
  "Shimmer",
  "SFX",
  "Reverse",
  "Pattern",
  "Dual",
  "Vintage",
  "Tape",
  "Analog",
];
export const NOTES = [
  "16th",
  "8th trip",
  "dot 16th",
  "8th",
  "1/4 trip",
  "dot 8th",
  "1/4",
  "1/2 trip",
  "dot 1/4",
  "1/2",
  "whole trip",
  "dot 1/2",
  "whole",
];
const OF = ["Off", "On"];
const dB = (v: number) => `${v - 20 > 0 ? "+" : ""}${v - 20} dB`;
const sg = (v: number) => `${v - 50 > 0 ? "+" : ""}${v - 50}`;
const pan = (v: number) =>
  v < 50 ? "L" + (50 - v) : v > 50 ? "R" + (v - 50) : "C";

export interface Param {
  key: string;
  label: string;
  off: number;
  min: number;
  max: number;
  n: 1 | 4; // 1 byte, or 4 nibble-coded bytes
  opts?: readonly (string | number)[];
  d?: (v: number) => string;
  log?: number;
}
export const PARAMS: Record<string, Param> = {};
export const GROUPS: Record<string, string[]> = {};
type Extra = Partial<Pick<Param, "min" | "n" | "opts" | "d" | "log">>;
function add(
  g: string,
  key: string,
  label: string,
  off: number,
  max: number,
  x: Extra = {},
) {
  PARAMS[key] = { key, label, off, max, min: 0, n: 1, ...x };
  (GROUPS[g] ??= []).push(key);
}

add("main", "time", "Time", o(0, 0x11), 10000, {
  n: 4,
  min: 1,
  log: 1,
  d: (v) => (v < 1000 ? v + " ms" : (v / 1000).toFixed(2) + " s"),
});
add("main", "note", "Note", o(0, 0x1b), 12, { opts: NOTES });
add("main", "fb", "Feedback", o(0, 0x1c), 100);
add("main", "tone", "Tone", o(0, 0x1d), 100, { d: sg });
add("main", "elevel", "Effect level", o(0, 0x1e), 120);
add("main", "direct", "Direct level", o(0, 0x1f), 100);
add("main", "mdepth", "Mod depth", o(0, 0x20), 100);
add("main", "mrate", "Mod rate", o(0, 0x21), 100);
add("main", "carry", "Carryover", o(0, 0x22), 1, { opts: OF });
add("main", "inlvl", "Input level", o(2, 8), 100);
add("main", "outg", "Output gain", o(3, 0x48), 12, { d: (v) => v - 6 + " dB" });
add("eq", "eqsw", "EQ position", o(0, 0x23), 3, {
  opts: ["Off", "Pre", "FB loop", "Post"],
});
add("eq", "eqtot", "EQ level", o(0, 0x24), 40, { d: dB });
add("eq", "lowcut", "Low cut", o(0, 0x25), 17, {
  opts: ["Flat", ...FN.slice(0, 17)],
});
add("eq", "lowgain", "Low gain", o(0, 0x26), 40, { d: dB });
add("eq", "lmgain", "Low-mid gain", o(0, 0x27), 40, { d: dB });
add("eq", "lmfreq", "Low-mid freq", o(0, 0x28), 27, { opts: FN });
add("eq", "lmq", "Low-mid Q", o(0, 0x29), 5, { opts: QS });
add("eq", "hmgain", "High-mid gain", o(0, 0x2a), 40, { d: dB });
add("eq", "hmfreq", "High-mid freq", o(0, 0x2b), 27, { opts: FN });
add("eq", "hmq", "High-mid Q", o(0, 0x2c), 5, { opts: QS });
add("eq", "higain", "High gain", o(0, 0x2d), 40, { d: dB });
add("eq", "hicut", "High cut", o(0, 0x2e), 15, { opts: HCN });
add("oth", "lodamp", "Low damp", o(0, 0x2f), 20, { d: (v) => v - 20 + " dB" });
add("oth", "lodampf", "Low damp freq", o(0, 0x30), 16, {
  opts: FN.slice(0, 17),
});
add("oth", "hidamp", "High damp", o(0, 0x31), 20, { d: (v) => v - 20 + " dB" });
add("oth", "hidampf", "High damp freq", o(0, 0x32), 14, {
  opts: HCN.slice(0, 15),
});
add("oth", "dsens", "Duck sensitivity", o(0, 0x33), 100);
add("oth", "dpre", "Duck pre depth", o(0, 0x34), 100);
add("oth", "dpost", "Duck post depth", o(0, 0x35), 100);
add("oth", "epan", "Effect pan", o(0, 0x36), 100, { d: pan });
add("oth", "dpan", "Direct pan", o(0, 0x37), 100, { d: pan });
add("1", "treso", "Resonance", o(2, 9), 100);
add("2", "sasens", "Sensitivity", o(2, 0xa), 100);
add("2", "sarise", "Rise time", o(2, 0xb), 100);
add("2", "sacurve", "Curve", o(2, 0x76), 100, { d: sg });
add("3", "fmode", "Mode", o(2, 0x77), 1, { opts: ["Auto", "Touch"] });
add("3", "flfo", "LFO type", o(2, 0xc), 2, { opts: ["Tri", "Sin", "Sqr"] });
add("3", "frate", "LFO rate", o(2, 0xd), 100);
add("3", "fdepth", "LFO depth", o(2, 0xe), 100);
add("3", "ftype", "Filter type", o(2, 0xf), 2, { opts: ["LPF", "BPF", "HPF"] });
add("3", "fcut", "Cutoff", o(2, 0x10), 19, { opts: FN.slice(7, 27) });
add("3", "freso", "Resonance", o(2, 0x11), 100);
add("3", "fpos", "Position", o(2, 0x12), 1, { opts: ["Pre", "Post"] });
add("4", "shtype", "Type", o(2, 0x7f), 1, { opts: ["Pitch", "Overtone"] });
add("4", "shrise", "Rise time", o(2, 0x7e), 10);
add("4", "shpit", "Pitch", o(2, 0x13), 48, { d: (v) => v - 24 + " st" });
add("4", "shfine", "Fine", o(2, 0x14), 100, { d: sg });
add("4", "shbal", "Pitch/direct", o(2, 0x15), 100);
add("4", "shfb", "Pitch feedback", o(3, 4), 100);
add("4", "shup", "Overtone upper", o(3, 0), 100);
add("4", "shlo", "Overtone lower", o(3, 1), 100);
add("5", "sfxt", "Type", o(3, 9), 1, { opts: ["Tremolo", "Phaser"] });
add("5", "tbit", "Lo-fi bit depth", o(2, 0x17), 15);
add("5", "trate", "Lo-fi sample rate", o(2, 0x18), 31);
add("5", "tbal", "Lo-fi balance", o(2, 0x19), 100);
add("5", "twave", "Trem wave", o(2, 0x1a), 100);
add("5", "trr", "Trem rate", o(2, 0x1b), 100);
add("5", "trd", "Trem depth", o(2, 0x1c), 100);
add("5", "prate", "Phaser rate", o(3, 0xa), 100);
add("5", "pdep", "Phaser depth", o(3, 0xb), 100);
add("5", "pres", "Phaser resonance", o(3, 0xc), 100);
add("5", "pman", "Phaser manual", o(3, 0xd), 100);
add("7", "pat", "Pattern", o(2, 0x1e), 10, {
  opts: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "User"],
});
add("7", "pnote", "Pattern note", o(2, 0x5f), 12, { opts: NOTES });
add("7", "ptype", "Type", o(3, 0xe), 1, { opts: ["Delay", "Gate"] });
add("7", "pstep", "Steps", o(3, 0xf), 3, { opts: [8, 12, 16, 24] });
add("8", "dmode", "Dual mode", o(2, 0x60), 4, {
  opts: ["Series", "Parallel", "A/B", "A/B series", "A/B parallel"],
});
add("8", "d1t", "Delay 1 type", o(2, 0x61), 2, {
  opts: ["Standard", "Analog", "Tape"],
});
add("8", "d1l", "Delay 1 level", o(2, 0x62), 100);
add("8", "dlink", "Link", o(2, 0x63), 1, { opts: OF });
add("8", "d2t", "Delay 2 type", o(3, 0x40), 2, {
  opts: ["Standard", "Analog", "Tape"],
});
add("8", "d2time", "Delay 2 time", o(2, 0x64), 5000, {
  n: 4,
  min: 1,
  log: 1,
  d: (v) => v + " ms",
});
add("8", "d2fb", "Delay 2 feedback", o(2, 0x69), 100);
add("8", "d2l", "Delay 2 level", o(2, 0x6b), 100);
add("9", "vtype", "Type", o(2, 0x6c), 2, {
  opts: ["SDE-2000", "SDE-3000", "DD-2"],
});
add("9", "vfil", "Filter", o(2, 0x6d), 1, { opts: OF });
add("9", "vx2", "Time ×2", o(2, 0x6e), 1, { opts: OF });
add("9", "vdp", "Delay phase", o(2, 0x71), 1, { opts: ["Normal", "Inverted"] });
add("9", "vfp", "Feedback phase", o(2, 0x72), 1, {
  opts: ["Normal", "Inverted"],
});
add("10", "tptype", "Type", o(2, 0x6f), 2, {
  opts: ["RE-201", "EchoP", "EchoR"],
});
add("10", "thead", "Heads (RE-201/EchoP)", o(2, 0x73), 6, {
  opts: ["1", "2", "3", "1+2", "1+3", "2+3", "1+2+3"],
});
add("10", "twow", "Wow & flutter", o(3, 0x41), 100);
add("10", "tmod", "Mod rate", o(3, 0x42), 100);
add("10", "teh", "EchoR head", o(3, 0x43), 11, {
  opts: [
    "1",
    "2",
    "3",
    "4",
    "1+2",
    "2+3",
    "3+4",
    "1+3",
    "2+4",
    "1+2+3",
    "2+3+4",
    "1+2+3+4",
  ],
});
add("10", "tesel", "EchoR selector", o(3, 0x44), 2, {
  opts: ["Echo", "Repeat", "Swell"],
});
add("11", "astage", "Stage", o(2, 0x70), 2, {
  opts: ["4096", "4096×2", "4096×4"],
});

export const MODE_OFF = o(0, 0x10);
export const PATCH_LEN = 476; // bytes of patch data requested per letter
export const BUF = 512;
const DEFAULTS: Record<string, number> = {
  time: 400,
  note: 6,
  fb: 30,
  tone: 50,
  elevel: 60,
  direct: 100,
  mrate: 20,
  carry: 1,
  inlvl: 50,
  outg: 6,
  eqtot: 20,
  lowgain: 20,
  lmgain: 20,
  lmfreq: 13,
  lmq: 2,
  hmgain: 20,
  hmfreq: 22,
  hmq: 2,
  higain: 20,
  hicut: 15,
  lodamp: 20,
  lodampf: 8,
  hidamp: 20,
  hidampf: 8,
  epan: 50,
  dpan: 50,
  d2time: 300,
};

/** Value a slider returns to on double-click: the middle of its travel (log sliders: middle of the log scale). */
export const centerValue = (p: Param) =>
  p.log
    ? Math.round(p.min * Math.pow(p.max / p.min, 0.5))
    : Math.round((p.min + p.max) / 2);
export const display = (p: Param, v: number) =>
  p.opts ? String(p.opts[v] ?? v) : p.d ? p.d(v) : String(v);
export function readParam(b: Uint8Array, p: Param): number {
  const a = p.off;
  return p.n === 4
    ? ((b[a] & 3) << 12) |
        ((b[a + 1] & 15) << 8) |
        ((b[a + 2] & 15) << 4) |
        (b[a + 3] & 15)
    : b[a];
}
/** Clamp + write value into buffer; returns the raw bytes written. */
export function writeParam(b: Uint8Array, p: Param, v: number): number[] {
  const x = Math.max(p.min, Math.min(p.max, Math.round(v)));
  const bytes =
    p.n === 4 ? [(x >> 12) & 3, (x >> 8) & 15, (x >> 4) & 15, x & 15] : [x];
  bytes.forEach((y, i) => (b[p.off + i] = y));
  return bytes;
}
export const modeOf = (b: Uint8Array) => b[MODE_OFF];
export const nameOf = (b: Uint8Array) =>
  String.fromCharCode(...b.slice(0, 16)).trimEnd();
export const nameBytes = (t: string) =>
  t
    .padEnd(16)
    .slice(0, 16)
    .split("")
    .map((c) => {
      const n = c.charCodeAt(0);
      return n >= 32 && n <= 126 ? n : 32;
    });
export function defaultPatch(): Uint8Array {
  const b = new Uint8Array(BUF);
  for (const p of Object.values(PARAMS))
    writeParam(b, p, DEFAULTS[p.key] ?? (p.max === 100 ? 50 : p.min));
  nameBytes("Init Patch").forEach((n, i) => (b[i] = n));
  return b;
}
