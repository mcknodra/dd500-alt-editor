import { useState } from "react";
import { MODES } from "../params";
import type { Pedal } from "../pedal";
import {
  STARTERS,
  loadLib,
  parsePreset,
  saveLib,
  snapshot,
  type Preset,
} from "../presets";

export function PatchPanel({ p }: { p: Pedal }) {
  const slot = () => {
    const t = Number(
      prompt(
        "Write the three patches (A/B/C) in the pedal buffer to bank number (1-99)?\nThis overwrites that bank.",
        String(p.bank),
      ),
    );
    if (t >= 1 && t <= 99) alert(p.writeSlot(t));
  };
  return (
    <section className="card">
      <h2>Patch</h2>
      <div className="row">
        <button
          onClick={() => p.selectPatch(p.bank > 1 ? p.bank - 1 : 99, p.cur)}
          aria-label="Previous bank"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={99}
          value={p.bank}
          style={{ width: 64 }}
          onChange={(e) => p.selectPatch(+e.target.value || 1, p.cur)}
        />
        <button
          onClick={() => p.selectPatch(p.bank < 99 ? p.bank + 1 : 1, p.cur)}
          aria-label="Next bank"
        >
          +
        </button>
        <span>
          Patch {String(p.bank).padStart(2, "0")}
          {"ABC"[p.cur]}
        </span>
      </div>
      <div className="row">
        {["A", "B", "C"].map((l, i) => (
          <button
            key={l}
            className={i === p.cur ? "on" : ""}
            style={{ minWidth: 44 }}
            onClick={() => p.selectPatch(p.bank, i)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="row">
        <input
          type="text"
          maxLength={16}
          placeholder="Patch name"
          defaultValue={p.name}
          key={`${p.bank}-${p.cur}-${p.name}`}
          onBlur={(e) => e.target.value !== p.name && p.setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </div>
      <div className="row">
        <button onClick={slot}>Write to bank slot…</button>
      </div>
      <p className="hint">
        Switching patch sends bank select + program change. Edits go to the
        pedal's live buffer; write them to a slot to keep them.
      </p>
    </section>
  );
}

export function PresetPanel({ p }: { p: Pedal }) {
  const [lib, setLib] = useState<Preset[]>(loadLib);
  const [note, setNote] = useState("");
  const update = (l: Preset[]) => {
    setLib(l);
    saveLib(l);
  };
  const exportFile = () => {
    const s = snapshot(p.patch),
      a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(s, null, 1)], { type: "application/json" }),
    );
    a.download = `${s.name || "preset"}.dd500.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importFile = async (f?: File) => {
    if (!f) return;
    const pr = parsePreset(await f.text());
    if (pr) {
      p.apply(pr);
      setNote("");
    } else setNote("That file is not a DD-500 preset.");
  };
  return (
    <section className="card">
      <h2>Presets</h2>
      <div className="row">
        <button onClick={() => update([...lib, snapshot(p.patch)])}>
          Save to library
        </button>
        <button onClick={exportFile}>Export file</button>
        <label className="btn">
          Import file
          <input
            type="file"
            accept=".json"
            hidden
            onChange={(e) => {
              void importFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {note && <p className="hint">{note}</p>}
      {lib.length === 0 && (
        <p className="hint">
          No saved presets yet. Save the current patch to keep it here.
        </p>
      )}
      {lib.map((pr, i) => (
        <div className="lib" key={i}>
          <span>{pr.name}</span>
          <button onClick={() => p.apply(pr)}>Load</button>
          <button onClick={() => update(lib.filter((_, j) => j !== i))}>
            Delete
          </button>
        </div>
      ))}
      <h2 style={{ marginTop: 12 }}>Starters</h2>
      {STARTERS.map((s) => (
        <button
          key={s.name}
          style={{ margin: "0 6px 6px 0" }}
          onClick={() => p.apply(s)}
        >
          {s.name}
        </button>
      ))}
    </section>
  );
}

export function ModeButtons({ p }: { p: Pedal }) {
  return (
    <div id="modes">
      {MODES.map((m, i) => (
        <button
          key={m}
          className={i === p.mode ? "on" : ""}
          onClick={() => p.setMode(i)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
