import { useRef } from "react";
import { centerValue, display, GROUPS, PARAMS, type Param } from "../params";
const toLog = (p: Param, v: number) =>
  Math.round(
    (Math.log(Math.max(v, p.min) / p.min) / Math.log(p.max / p.min)) * 1000,
  );
const fromLog = (p: Param, t: number) =>
  p.min * Math.pow(p.max / p.min, t / 1000);

export function Control({
  p,
  value,
  onChange,
}: {
  p: Param;
  value: number;
  onChange: (v: number) => void;
}) {
  const lastTap = useRef(0);
  const reset = () => onChange(centerValue(p));
  // Touch screens don't fire dblclick on range inputs, so detect a double-tap ourselves.
  const tap = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    if (e.timeStamp - lastTap.current < 300) {
      reset();
      lastTap.current = 0;
    } else lastTap.current = e.timeStamp;
  };
  return (
    <label className="c">
      <span>{p.label}</span>
      <output>{display(p, value)}</output>
      {p.opts ? (
        <select
          value={Math.min(value, p.opts.length - 1)}
          onChange={(e) => onChange(+e.target.value)}
        >
          {p.opts.map((t, i) => (
            <option key={i} value={i}>
              {t}
            </option>
          ))}
        </select>
      ) : p.log ? (
        <input
          type="range"
          min={0}
          max={1000}
          value={toLog(p, value)}
          onChange={(e) => onChange(fromLog(p, +e.target.value))}
          onDoubleClick={reset}
          onPointerUp={tap}
          title="Double-click to center"
        />
      ) : (
        <input
          type="range"
          min={p.min}
          max={p.max}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          onDoubleClick={reset}
          onPointerUp={tap}
          title="Double-click to center"
        />
      )}
    </label>
  );
}
export function ControlGrid({
  group,
  get,
  set,
  className = "",
}: {
  group: string;
  get: (k: string) => number;
  set: (k: string, v: number) => void;
  className?: string;
}) {
  const keys = GROUPS[group] ?? [];
  if (!keys.length)
    return (
      <span className="hint">
        Selected delay mode has no additional parameters to edit.
      </span>
    );
  return (
    <div className={`grid ${className}`}>
      {keys.map((k) => (
        <Control
          key={k}
          p={PARAMS[k]}
          value={get(k)}
          onChange={(v) => set(k, v)}
        />
      ))}
    </div>
  );
}
