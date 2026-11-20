import { usePedal } from "./pedal";
import { useFullscreen, useInstall } from "./hooks";
import { MODES } from "./params";
import { ControlGrid } from "./components/Control";
import { EqGraph } from "./components/EqGraph";
import { ModeButtons, PatchPanel, PresetPanel } from "./components/Panels";

export function App() {
  const p = usePedal(),
    install = useInstall(),
    [fs, toggleFs] = useFullscreen();
  const g = p.get,
    s = p.set;
  return (
    <>
      <header>
        <h1>DD-500 Editor</h1>
        <button onClick={() => void p.connect()}>Connect pedal</button>
        <select
          value={p.outId}
          onChange={(e) => p.setOutId(e.target.value)}
          title="MIDI output"
        >
          {p.outs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          value={p.inId}
          onChange={(e) => p.setInId(e.target.value)}
          title="MIDI input"
        >
          {p.ins.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          value={p.channel}
          onChange={(e) => p.setChannel(+e.target.value)}
          title="MIDI channel for patch changes"
        >
          {Array.from({ length: 16 }, (_, c) => (
            <option key={c} value={c}>
              Ch {c + 1}
            </option>
          ))}
        </select>
        <button
          onClick={() => (p.connected ? p.requestAll() : void p.connect())}
        >
          Read from pedal
        </button>
        {install && <button onClick={install}>Install app</button>}
        <button onClick={toggleFs}>
          {fs ? "Exit full screen" : "Full screen"}
        </button>
        <div id="st">
          <span id="dot" className={p.connected ? "on" : ""} />
          <span>{p.status}</span>
        </div>
      </header>
      <main>
        <div className="col">
          <PatchPanel p={p} />
          <PresetPanel p={p} />
        </div>
        <div className="col">
          <section className="card">
            <h2>Delay mode</h2>
            <ModeButtons p={p} />
          </section>
          <section className="card">
            <h2>Delay</h2>
            <ControlGrid group="main" get={g} set={s} />
          </section>
          <section className="card">
            <h2>{MODES[p.mode] ?? "Mode"} settings</h2>
            <ControlGrid group={String(p.mode)} get={g} set={s} />
          </section>
        </div>
        <div className="col">
          <section className={`card ${p.eqOn ? "" : "eqoff"}`}>
            <div className="hd">
              <h2>Equalizer</h2>
              <div className="eq-toggle-row">
                <button
                  role="switch"
                  aria-checked={p.eqOn}
                  aria-label="Equalizer on/off"
                  className={`sw ${p.eqOn ? "on" : ""}`}
                  onClick={p.toggleEq}
                >
                  <i />
                </button>
                <span className="sub">{p.eqOn ? "On" : "Off"}</span>
              </div>
            </div>
            <EqGraph get={g} set={p.setEq} />
            <p className="hint">
              Drag the dots; double-click one to zero it. Moving any EQ setting
              switches the EQ on. The curve is an approximation: shelf corners
              and filter slopes are assumed, not read from the pedal.
            </p>
            <div style={{ marginTop: 10 }}>
              <ControlGrid group="eq" get={g} set={p.setEq} />
            </div>
          </section>
          <section className="card">
            <h2>Feedback damping, ducking, pan</h2>
            <ControlGrid group="oth" get={g} set={s} />
          </section>
        </div>
      </main>
    </>
  );
}
