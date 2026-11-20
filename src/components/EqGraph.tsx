import { useEffect, useRef } from "react";
import { F, fmtF } from "../params";
import { NODES, eqFilters, nodeFreq, responseDb, type EqNode } from "../eq";

const PAD = 28;
export function EqGraph({
  get,
  set,
}: {
  get: (k: string) => number;
  set: (k: string, v: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef<EqNode | null>(null);
  const size = useRef({ W: 0, H: 0 });
  const X = (f: number) =>
    PAD + (Math.log(f / 20) / Math.log(1000)) * (size.current.W - PAD * 1.5);
  const Y = (d: number) => 12 + ((20 - d) / 40) * (size.current.H - 30);
  const pos = (n: EqNode): [number, number] => [
    X(nodeFreq(n, get)),
    Y(get(n.g) - 20),
  ];

  const draw = () => {
    const cv = ref.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect(),
      dp = devicePixelRatio || 1;
    if (!r.width) return;
    cv.width = r.width * dp;
    cv.height = r.height * dp;
    const cx = cv.getContext("2d")!;
    cx.setTransform(dp, 0, 0, dp, 0, 0);
    size.current = { W: r.width, H: r.height };
    const { W, H } = size.current;
    const on = get("eqsw") > 0;
    cx.font = "10px system-ui";
    cx.lineWidth = 1;
    [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].forEach((f) => {
      cx.strokeStyle = "#26303c";
      cx.beginPath();
      cx.moveTo(X(f), 12);
      cx.lineTo(X(f), H - 18);
      cx.stroke();
      cx.fillStyle = on ? "#4fc3d9" : "#6b7785";
      cx.fillText(fmtF(f), X(f) - 8, H - 5);
    });
    [-20, -10, 0, 10, 20].forEach((d) => {
      cx.strokeStyle = d ? "#26303c" : "#3a4756";
      cx.beginPath();
      cx.moveTo(PAD, Y(d));
      cx.lineTo(W - PAD / 2, Y(d));
      cx.stroke();
      cx.fillStyle = "#8b98a8";
      cx.fillText((d > 0 ? "+" : "") + d, 2, Y(d) + 3);
    });
    const fs = eqFilters(get),
      off = get("eqtot") - 20;
    cx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const f = 20 * Math.pow(1000, i / 240),
        d = Math.max(-20, Math.min(20, responseDb(fs, off, f)));
      if (i) cx.lineTo(X(f), Y(d));
      else cx.moveTo(X(f), Y(d));
    }
    cx.strokeStyle = on ? "#4fc3d9" : "#5d6b7a";
    cx.lineWidth = 2.5;
    cx.stroke();
    NODES.forEach((n) => {
      const [x, y] = pos(n);
      cx.beginPath();
      cx.arc(x, y, 7, 0, Math.PI * 2);
      cx.fillStyle = on ? "#ff9a3d" : "#6b7785";
      cx.fill();
    });
  };
  const latest = useRef(draw);
  latest.current = draw;
  useEffect(draw);
  useEffect(() => {
    const ro = new ResizeObserver(() => latest.current());
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const local = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const down = (e: React.PointerEvent) => {
    const [x, y] = local(e);
    let best = 26;
    drag.current = null;
    NODES.forEach((n) => {
      const [nx, ny] = pos(n),
        d = Math.hypot(nx - x, ny - y);
      if (d < best) {
        best = d;
        drag.current = n;
      }
    });
    if (drag.current) ref.current!.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const n = drag.current;
    if (!n) return;
    const [x, y] = local(e),
      { W, H } = size.current;
    set(n.g, Math.round(40 - ((y - 12) / (H - 30)) * 40));
    if (n.fk) {
      const f = 20 * Math.pow(1000, (x - PAD) / (W - PAD * 1.5));
      let b = 0;
      F.forEach((v, i) => {
        if (Math.abs(Math.log(v / f)) < Math.abs(Math.log(F[b] / f))) b = i;
      });
      set(n.fk, b);
    }
  };
  const dbl = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect(),
      x = e.clientX - r.left,
      y = e.clientY - r.top;
    let best = 26,
      hit: EqNode | null = null;
    for (const n of NODES) {
      const [nx, ny] = pos(n),
        d = Math.hypot(nx - x, ny - y);
      if (d < best) {
        best = d;
        hit = n;
      }
    }
    if (hit) set(hit.g, 20);
  };
  return (
    <canvas
      ref={ref}
      onDoubleClick={dbl}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      aria-label="EQ response graph"
    />
  );
}
