import { useState, useSyncExternalStore } from "react";
import {
  PARAMS,
  PATCH_LEN,
  MODE_OFF,
  defaultPatch,
  nameBytes,
  readParam,
  writeParam,
  modeOf,
  nameOf,
} from "./params";
import { patchAddr, rq1, writeMessages, parseDT1, locate } from "./midi/sysex";
import type { Preset } from "./presets";

export interface PortInfo {
  id: string;
  name: string;
}

/** Holds the 3 patch letters of the live buffer and talks to the pedal. Components subscribe via usePedal(). */
export class Pedal {
  patches = [0, 1, 2].map(() => defaultPatch());
  loaded = [false, false, false];
  cur = 0;
  bank = 1;
  channel = 0;
  status = "Offline: edits stay in the browser until you connect.";
  connected = false;
  outs: PortInfo[] = [];
  ins: PortInfo[] = [];
  outId = "";
  inId = "";
  version = 0;
  private listeners = new Set<() => void>();
  private access: MIDIAccess | null = null;
  private out: MIDIOutput | null = null;
  private inp: MIDIInput | null = null;
  private msb = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  private emit() {
    this.version++;
    this.listeners.forEach((l) => l());
  }
  private say(s: string) {
    this.status = s;
    this.emit();
  }

  get patch() {
    return this.patches[this.cur];
  }
  get mode() {
    return modeOf(this.patch);
  }
  get name() {
    return nameOf(this.patch);
  }
  get = (key: string) => readParam(this.patch, PARAMS[key]);

  private send(m: number[]) {
    try {
      this.out?.send(m);
    } catch (e) {
      this.say("Send failed: " + (e as Error).message);
    }
  }
  private sendAll(ms: number[][]) {
    ms.forEach((m) => this.send(m));
  }

  /** Last non-off EQ position (Pre / FB loop / Post), restored when the EQ is switched back on. */
  eqPos = 1;
  get eqOn() {
    return this.get("eqsw") > 0;
  }
  /** Edit an EQ parameter; switches the EQ on first if it was off. */
  setEq = (key: string, v: number) => {
    if (key !== "eqsw" && !this.eqOn) this.set("eqsw", this.eqPos);
    this.set(key, v);
  };
  toggleEq = () => {
    this.set("eqsw", this.eqOn ? 0 : this.eqPos);
  };

  set = (key: string, v: number) => {
    const p = PARAMS[key];
    if (key === "eqsw") {
      if (v > 0) this.eqPos = v;
      else if (this.eqOn) this.eqPos = this.get("eqsw");
    }
    const bytes = writeParam(this.patch, p, v);
    this.sendAll(writeMessages(this.cur, p.off, bytes));
    this.emit();
  };
  setMode(i: number) {
    this.patch[MODE_OFF] = i;
    this.sendAll(writeMessages(this.cur, MODE_OFF, [i]));
    this.emit();
  }
  setName(t: string) {
    const b = nameBytes(t);
    b.forEach((n, i) => (this.patch[i] = n));
    this.sendAll(writeMessages(this.cur, 0, b));
    this.emit();
  }
  apply(p: Preset) {
    if (typeof p.params.mode === "number") this.setMode(p.params.mode);
    for (const [k, v] of Object.entries(p.params))
      if (PARAMS[k]) this.set(k, v);
    this.setName(p.name);
  }

  requestAll() {
    [0, 1, 2].forEach((L) =>
      setTimeout(() => this.send(rq1(patchAddr(L), PATCH_LEN)), L * 180),
    );
  }
  selectPatch(bank: number, L: number) {
    this.bank = Math.max(1, Math.min(99, bank));
    this.cur = L;
    const n = (this.bank - 1) * 3 + L,
      ch = this.channel;
    this.send([0xb0 | ch, 0, n >> 7]);
    this.send([0xb0 | ch, 0x20, 0]);
    this.send([0xc0 | ch, n & 127]);
    setTimeout(() => this.requestAll(), 300);
    this.emit();
  }
  /** Copy the live buffer's three patches into stored bank `target`. */
  writeSlot(target: number): string {
    if (!this.out) return "Connect the pedal first.";
    if (!this.loaded.some(Boolean))
      return "Read the pedal first so unmapped bytes are preserved.";
    this.loaded.forEach((ok, L) => {
      if (ok)
        setTimeout(
          () =>
            this.sendAll(
              writeMessages(
                L,
                0,
                [...this.patches[L].slice(0, PATCH_LEN)],
                target,
              ),
            ),
          L * 250,
        );
    });
    return `Wrote buffer to bank ${target}.`;
  }

  async connect() {
    if (!navigator.requestMIDIAccess)
      return this.say("This browser has no Web MIDI. Use Chrome or Edge.");
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: true });
    } catch (e) {
      return this.say("MIDI access blocked: " + (e as Error).message);
    }
    this.access.onstatechange = () => this.refreshPorts();
    this.refreshPorts();
  }
  setOutId(id: string) {
    this.outId = id;
    this.bind();
  }
  setInId(id: string) {
    this.inId = id;
    this.bind();
  }
  setChannel(c: number) {
    this.channel = c;
    this.emit();
  }
  private refreshPorts() {
    const a = this.access;
    if (!a) return;
    const list = (m: MIDIOutputMap | MIDIInputMap) =>
      [...m.values()].map((p) => ({ id: p.id, name: p.name ?? p.id }));
    this.outs = list(a.outputs);
    this.ins = list(a.inputs);
    const pick = (l: PortInfo[], cur: string) =>
      l.some((p) => p.id === cur)
        ? cur
        : (l.find((p) => /dd-?500/i.test(p.name))?.id ?? l[0]?.id ?? "");
    this.outId = pick(this.outs, this.outId);
    this.inId = pick(this.ins, this.inId);
    this.bind();
  }
  private bind() {
    if (this.inp) this.inp.onmidimessage = null;
    this.out = this.access?.outputs.get(this.outId) ?? null;
    this.inp = this.access?.inputs.get(this.inId) ?? null;
    if (this.inp) this.inp.onmidimessage = this.onMessage;
    this.connected = !!(this.out && this.inp);
    if (this.connected) {
      this.say(`Connected to ${this.out?.name}. Reading patch…`);
      this.requestAll();
    } else this.say("No DD-500 found. Connect it by USB and pick its ports.");
  }
  private onMessage = (e: MIDIMessageEvent) => {
    const d = e.data;
    if (!d) return;
    if (d[0] === 0xf0) {
      const m = parseDT1(d);
      if (!m) return;
      m.data.forEach((v, i) => {
        const l = locate(m.addr + i);
        if (l) {
          this.patches[l.L][l.idx] = v;
          this.loaded[l.L] = true;
        }
      });
      clearTimeout(this.timer);
      this.timer = setTimeout(
        () => this.say("Read patch data from pedal."),
        60,
      );
    } else if ((d[0] & 0xf0) === 0xb0 && d[1] === 0) this.msb = d[2];
    else if ((d[0] & 0xf0) === 0xc0) {
      const n = this.msb * 128 + d[1];
      if (n > 296) return;
      this.bank = Math.floor(n / 3) + 1;
      this.cur = n % 3;
      this.emit();
      setTimeout(() => this.requestAll(), 150);
    }
  };
}
export function usePedal(): Pedal {
  const [p] = useState(() => new Pedal());
  useSyncExternalStore(p.subscribe, () => p.version);
  return p;
}
