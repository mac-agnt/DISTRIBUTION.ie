import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { who } from "./db";

/* ---------- navigation context ---------- */
export type Rec = Record<string, string>;
export type Dx = {
  page: string; sub: string; rec: Rec; acted: Record<string, string>;
  drawer: { kind: string; id: string } | null; canBack: boolean; toast: { text: string; t: number } | null;
  go: (module: string, sub?: string, rec?: Rec) => void;
  open: (kind: string, id: string) => void;
  close: () => void;
  back: () => void;
  act: (key: string, done: string, toast?: string) => void;
  ask: (q: string) => void;
};
const Ctx = createContext<Dx | null>(null);
export const DxProvider = Ctx.Provider;
export const useDx = () => useContext(Ctx) as Dx;

/* ---------- tones ---------- */
export type Tone = "bad" | "warn" | "ok" | "accent" | "neutral" | "brand";
export const INK: Record<Tone, string> = { bad: "var(--bad)", warn: "var(--warn)", ok: "var(--ok)", accent: "var(--accent)", neutral: "var(--dim)", brand: "var(--brand)" };
export const SOFT: Record<Tone, string> = { bad: "var(--bad-soft)", warn: "var(--warn-soft)", ok: "var(--ok-soft)", accent: "var(--accent-soft)", neutral: "var(--track)", brand: "var(--accent-soft)" };
export const riskTone = (r: string): Tone =>
  /CRITICAL|HIGH|LATE|STOCKOUT|CRITICAL|EXCEEDED|HELD|FAIL|AT RISK|OVERDUE|90\+/i.test(r) ? "bad"
  : /MEDIUM|LOW STOCK|^LOW$|WATCH|PENDING|WAITING|PART|SHORT|EXCESS|NEEDS|DECLIN|DUE TODAY|LOADING/i.test(r) ? "warn"
  : /ON TRACK|HEALTHY|OK|DELIVERED|READY|PREFERRED|GROWING|APPROVED|AVAILABLE|COMPLETED|RECEIVED|WON|CONNECTED/i.test(r) ? "ok"
  : "neutral";

/* ---------- layout ---------- */
export function Page({ eyebrow, title, sub, right, children }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="dx-page">
      <div className="dx-head">
        <div style={{ flex: "1", minWidth: 0 }}>
          {eyebrow && <div className="dx-eyebrow">{eyebrow}</div>}
          <h1 className="dx-h1">{title}</h1>
          {sub && <div className="dx-sub">{sub}</div>}
        </div>
        {right && <div className="dx-head-right">{right}</div>}
      </div>
      {children}
    </div>
  );
}

export function Grid({ cols = "repeat(12,1fr)", gap = 14, children, style }: { cols?: string; gap?: number; children: ReactNode; style?: CSSProperties }) {
  return <div className="dx-grid" style={{ gridTemplateColumns: cols, gap, ...style }}>{children}</div>;
}

export function Card({ title, sub, right, children, pad = true, span, onClick, tone, style, className }: {
  title?: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; pad?: boolean; span?: number; onClick?: () => void; tone?: Tone; style?: CSSProperties; className?: string;
}) {
  return (
    <section className={"dx-card" + (onClick ? " dx-click" : "") + (tone ? " dx-tone-" + tone : "") + (className ? " " + className : "")}
      onClick={onClick} style={{ gridColumn: span ? "span " + span : undefined, ...style }}>
      {(title || right) && (
        <div className="dx-card-head">
          <div style={{ flex: "1", minWidth: 0 }}>
            {title && <div className="dx-card-title">{title}</div>}
            {sub && <div className="dx-card-sub">{sub}</div>}
          </div>
          {right && <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>{right}</div>}
        </div>
      )}
      <div style={pad ? { padding: title || right ? "0 20px 18px" : "18px 20px" } : undefined}>{children}</div>
    </section>
  );
}

/* ---------- figures ---------- */
export function Kpi({ label, value, sub, tone, subTone, onClick, spark, hero }: {
  label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; subTone?: Tone; onClick?: () => void; spark?: number[]; hero?: boolean;
}) {
  return (
    <div className={"dx-kpi" + (onClick ? " dx-click" : "") + (hero ? " dx-kpi-hero" : "")} onClick={onClick}>
      <div className="dx-kpi-label">{label}</div>
      <div className="dx-kpi-value" style={{ color: tone ? INK[tone] : undefined }}>{value}</div>
      {sub && <div className="dx-kpi-sub" style={{ color: subTone ? INK[subTone] : undefined }}>{sub}</div>}
      {spark && <Spark data={spark} />}
    </div>
  );
}
export function KpiRow({ children, n }: { children: ReactNode; n?: number }) {
  return <div className="dx-kpis" style={{ gridTemplateColumns: "repeat(" + (n || 6) + ",minmax(0,1fr))" }}>{children}</div>;
}

export function Badge({ tone = "neutral", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className="dx-badge" style={{ color: INK[tone], background: SOFT[tone] }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: INK[tone], flex: "none" }} />}
      {children}
    </span>
  );
}
export const Risk = ({ r }: { r: string }) => <Badge tone={riskTone(r)}>{r}</Badge>;

export function Btn({ kind = "ghost", onClick, children, done, small, icon }: {
  kind?: "primary" | "ghost" | "quiet" | "danger"; onClick?: () => void; children: ReactNode; done?: string; small?: boolean; icon?: string;
}) {
  if (done) return <span className={"dx-btn dx-btn-done" + (small ? " dx-btn-sm" : "")}><Icon d="M5 12.5l4.2 4.2L19 7" s={13} w={2.2} />{done}</span>;
  return (
    <button className={"dx-btn dx-btn-" + kind + (small ? " dx-btn-sm" : "")} onClick={e => { e.stopPropagation(); onClick && onClick(); }}>
      {icon && <Icon d={icon} s={13} w={2} />}{children}
    </button>
  );
}
/* A button that records a decision: once pressed it shows what happened. */
export function ActBtn({ id, label, done, toast, kind = "ghost", small }: { id: string; label: string; done: string; toast?: string; kind?: "primary" | "ghost" | "quiet" | "danger"; small?: boolean }) {
  const dx = useDx();
  return <Btn kind={kind} small={small} done={dx.acted[id]} onClick={() => dx.act(id, done, toast)}>{label}</Btn>;
}

export function Icon({ d, s = 16, w = 1.7, style }: { d: string; s?: number; w?: number; style?: CSSProperties }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", ...style }}>
      <path d={d} />
    </svg>
  );
}
export const IC = {
  arrow: "M5 12h14 M13 6l6 6-6 6",
  chev: "m9 6 6 6-6 6",
  spark: "M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  alert: "M12 8.5v4.5 M12 16.5h.01 M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  truck: "M3 6.5h11v9H3z M14 9.5h3.6l3.4 3.4v2.6H14 M7 18.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z M17 18.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
  box: "M12 3 4 7v10l8 4 8-4V7l-8-4Z M4 7l8 4 8-4 M12 11v10",
  cart: "M3 4h2.2l2.2 11h10.4l2.2-7.5H6.5 M9.5 20a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z M17 20a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z",
  user: "M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  euro: "M17.5 6.5A6.5 6.5 0 1 0 17.5 17.5 M4.5 10.5h9 M4.5 13.5h9",
  factory: "M3 20V9l5 3V9l5 3V9l5 3V4h3v16H3Z",
  doc: "M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  check: "M5 12.5l4.2 4.2L19 7",
  x: "M6 6l12 12 M18 6 6 18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2",
  swap: "M7 7h13l-4-4 M17 17H4l4 4",
  mail: "M4 6.5h16v11H4z M4 7l8 6 8-6",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z",
  chat: "M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z",
};

/* ---------- people ---------- */
export function Avatar({ id, size = 24 }: { id: string; size?: number }) {
  const p = who(id);
  return (
    <span title={p.name + " · " + p.role} className="dx-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: p.tint }}>{p.ini}</span>
  );
}
export function Person({ id, role }: { id: string; role?: boolean }) {
  const p = who(id);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <Avatar id={id} size={22} />
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {p.name}{role && <span style={{ color: "var(--faint)" }}> · {p.role}</span>}
      </span>
    </span>
  );
}

/* ---------- record links: every id is a door to the connected record ---------- */
export function RecLink({ kind, id, children, plain }: { kind: "order" | "cust" | "sku" | "po" | "supplier" | "route" | "quote"; id: string; children?: ReactNode; plain?: boolean }) {
  const dx = useDx();
  const go = () => {
    if (kind === "order") dx.go("Orders", "detail", { order: id });
    else if (kind === "cust") dx.go("Customers", "detail", { cust: id });
    else dx.open(kind, id);
  };
  return (
    <button className={plain ? "dx-link dx-link-plain" : "dx-link"} onClick={e => { e.stopPropagation(); go(); }}>{children || id}</button>
  );
}

/* ---------- tables ---------- */
export type Col<T> = { k: string; label: string; w?: string; align?: "left" | "right" | "center"; render?: (r: T, i: number) => ReactNode; mono?: boolean };
export function Table<T>({ cols, rows, onRow, dense, empty, rowTone }: {
  cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; dense?: boolean; empty?: string; rowTone?: (r: T) => Tone | undefined;
}) {
  const tpl = cols.map(c => c.w || "1fr").join(" ");
  return (
    <div className="dx-table" role="table">
      <div className="dx-tr dx-th" style={{ gridTemplateColumns: tpl }} role="row">
        {cols.map(c => <div key={c.k} role="columnheader" style={{ textAlign: c.align || "left" }}>{c.label}</div>)}
      </div>
      {rows.map((r, i) => {
        const t = rowTone && rowTone(r);
        return (
          <div key={i} role="row" className={"dx-tr" + (onRow ? " dx-click" : "") + (dense ? " dx-dense" : "")}
            style={{ gridTemplateColumns: tpl, boxShadow: t ? "inset 3px 0 0 " + INK[t] : undefined }} onClick={onRow ? () => onRow(r) : undefined}>
            {cols.map(c => (
              <div key={c.k} role="cell" className={c.mono ? "dx-num" : undefined} style={{ textAlign: c.align || "left", justifyContent: c.align === "right" ? "flex-end" : c.align === "center" ? "center" : undefined }}>
                {c.render ? c.render(r, i) : String((r as any)[c.k] ?? "")}
              </div>
            ))}
          </div>
        );
      })}
      {!rows.length && <div className="dx-empty">{empty || "Nothing here right now."}</div>}
    </div>
  );
}

/* ---------- small data marks ---------- */
export function Meter({ value, max = 100, tone = "accent", h = 6, w }: { value: number; max?: number; tone?: Tone; h?: number; w?: number | string }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="dx-meter" style={{ height: h, width: w ?? "100%" }}>
      <span style={{ width: p + "%", background: INK[tone] }} />
    </span>
  );
}
export function Spark({ data, tone = "accent", h = 28 }: { data: number[]; tone?: Tone; h?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * (w - 4) + 2, h - 3 - ((d - min) / rng) * (h - 6)]);
  return (
    <div ref={ref} style={{ height: h, marginTop: 10 }}>
      {w > 0 && (
        <svg width={w} height={h}>
          <polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke={INK[tone]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill={INK[tone]} stroke="var(--surface)" strokeWidth={2} />
        </svg>
      )}
    </div>
  );
}

export function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* Horizontal bars: one series, one colour, value at the tip. */
export function HBars({ items, max, fmt, tone = "accent", onClick }: {
  items: { label: ReactNode; value: number; note?: ReactNode; tone?: Tone; id?: string }[]; max?: number; fmt: (n: number) => string; tone?: Tone; onClick?: (i: number) => void;
}) {
  const m = max ?? Math.max(...items.map(i => i.value));
  return (
    <div className="dx-hbars">
      {items.map((it, i) => (
        <div key={i} className={"dx-hbar" + (onClick ? " dx-click" : "")} onClick={onClick ? () => onClick(i) : undefined} title={typeof it.label === "string" ? it.label + ": " + fmt(it.value) : undefined}>
          <div className="dx-hbar-label">{it.label}</div>
          <div className="dx-hbar-track"><span style={{ width: Math.max(1.5, (it.value / m) * 100) + "%", background: INK[it.tone || tone] }} /></div>
          <div className="dx-hbar-val dx-num">{fmt(it.value)}{it.note && <span className="dx-hbar-note">{it.note}</span>}</div>
        </div>
      ))}
    </div>
  );
}

/* Proportion strip: a part-to-whole in one bar, 2px surface gap between segments. */
export function Strip({ parts, fmt, h = 12 }: { parts: { label: string; value: number; tone: Tone | string }[]; fmt: (n: number) => string; h?: number }) {
  const total = parts.reduce((a, b) => a + b.value, 0);
  const color = (t: string) => (INK as any)[t] || t;
  return (
    <div>
      <div className="dx-strip" style={{ height: h }}>
        {parts.map((p, i) => <span key={i} title={p.label + ": " + fmt(p.value)} style={{ flex: p.value / total, background: color(p.tone) }} />)}
      </div>
      <div className="dx-legend">
        {parts.map((p, i) => (
          <span key={i}><i style={{ background: color(p.tone) }} />{p.label}<b className="dx-num">{fmt(p.value)}</b></span>
        ))}
      </div>
    </div>
  );
}

/* Column chart with a per-column hover tooltip. */
export function Columns({ data, fmt, h = 170, highlight, target, targetLabel, tone = "accent" }: {
  data: { label: string; value: number; tone?: Tone | string }[]; fmt: (n: number) => string; h?: number; highlight?: number; target?: number; targetLabel?: string; tone?: Tone;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hov, setHov] = useState<number | null>(null);
  const axis = 20, top = 14;
  const max = Math.max(...data.map(d => d.value), target || 0) * 1.08;
  const band = w / data.length, bw = Math.min(24, band * 0.56);
  const y = (v: number) => top + (h - axis - top) * (1 - v / max);
  const color = (d: { tone?: string }, i: number) => d.tone ? ((INK as any)[d.tone] || d.tone) : (highlight !== undefined && i !== highlight ? "var(--chart-muted)" : INK[tone]);
  return (
    <div ref={ref} style={{ position: "relative", height: h }} onMouseLeave={() => setHov(null)}>
      {w > 0 && (
        <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
          {[0.25, 0.5, 0.75, 1].map(g => <line key={g} x1={0} x2={w} y1={y(max * g / 1.08)} y2={y(max * g / 1.08)} stroke="var(--grid-line)" strokeWidth={1} />)}
          <line x1={0} x2={w} y1={h - axis} y2={h - axis} stroke="var(--border-strong)" strokeWidth={1} />
          {target !== undefined && (
            <g>
              <line x1={0} x2={w} y1={y(target)} y2={y(target)} stroke="var(--ink)" strokeOpacity={0.5} strokeWidth={1} />
              <text x={w - 2} y={y(target) - 5} textAnchor="end" fontSize={10.5} fill="var(--dim)">{targetLabel || "Target " + fmt(target)}</text>
            </g>
          )}
          {data.map((d, i) => {
            const x = i * band + (band - bw) / 2, yy = y(d.value), bh = h - axis - yy, r = Math.min(4, bh);
            return (
              <g key={i} onMouseEnter={() => setHov(i)}>
                <rect x={i * band} y={top} width={band} height={h - axis - top} fill="transparent" />
                <path d={`M${x},${h - axis} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${h - axis} Z`} fill={color(d, i)} opacity={hov === null || hov === i ? 1 : 0.55} />
                <text x={i * band + band / 2} y={h - 5} textAnchor="middle" fontSize={10.5} fill="var(--faint)">{d.label}</text>
                {(i === (highlight ?? data.length - 1)) && <text x={i * band + band / 2} y={yy - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">{fmt(d.value)}</text>}
              </g>
            );
          })}
        </svg>
      )}
      {hov !== null && w > 0 && (
        <div className="dx-tip" style={{ left: Math.min(w - 130, Math.max(0, hov * band + band / 2 - 60)), top: Math.max(0, y(data[hov].value) - 52) }}>
          <div className="dx-tip-k">{data[hov].label}</div><div className="dx-tip-v">{fmt(data[hov].value)}</div>
        </div>
      )}
    </div>
  );
}

/* Line chart with crosshair tooltip. One axis, thin line, a 10% wash under the lead series. */
export function Lines({ labels, series, fmt, h = 190, target, targetLabel, min: minIn, max: maxIn, zero }: {
  labels: string[]; series: { name: string; data: number[]; tone?: Tone | string; wash?: boolean; muted?: boolean }[]; fmt: (n: number) => string; h?: number; target?: number; targetLabel?: string; min?: number; max?: number; zero?: boolean;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hov, setHov] = useState<number | null>(null);
  const axis = 22, top = 16, left = 44, right = 12;
  const all = series.flatMap(s => s.data).concat(target !== undefined ? [target] : []).concat(zero ? [0] : []);
  const lo = minIn ?? Math.min(...all), hi = maxIn ?? Math.max(...all);
  const pad = (hi - lo) * 0.08 || 1;
  const mn = minIn ?? lo - pad, mx = maxIn ?? hi + pad;
  const x = (i: number) => left + (i / (labels.length - 1)) * (w - left - right);
  const y = (v: number) => top + (h - axis - top) * (1 - (v - mn) / (mx - mn));
  const color = (t?: string, muted?: boolean) => muted ? "var(--chart-muted)" : t ? ((INK as any)[t] || t) : INK.accent;
  const ticks = [0, 1, 2, 3].map(k => mn + ((mx - mn) * k) / 3);
  return (
    <div ref={ref} style={{ position: "relative", height: h }}
      onMouseMove={e => { if (!w) return; const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); const i = Math.round(((e.clientX - r.left - left) / (w - left - right)) * (labels.length - 1)); setHov(Math.max(0, Math.min(labels.length - 1, i))); }}
      onMouseLeave={() => setHov(null)}>
      {w > 0 && (
        <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
          {ticks.map((t, k) => (
            <g key={k}>
              <line x1={left} x2={w - right} y1={y(t)} y2={y(t)} stroke="var(--grid-line)" strokeWidth={1} />
              <text x={left - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="var(--faint)" className="dx-num">{fmt(t)}</text>
            </g>
          ))}
          {zero && mn < 0 && <line x1={left} x2={w - right} y1={y(0)} y2={y(0)} stroke="var(--border-strong)" strokeWidth={1} />}
          {target !== undefined && (
            <g>
              <line x1={left} x2={w - right} y1={y(target)} y2={y(target)} stroke="var(--ink)" strokeOpacity={0.45} strokeWidth={1} />
              <text x={w - right} y={y(target) - 6} textAnchor="end" fontSize={10.5} fill="var(--dim)">{targetLabel || "Target"}</text>
            </g>
          )}
          {labels.map((l, i) => (i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1) &&
            <text key={i} x={x(i)} y={h - 6} textAnchor="middle" fontSize={10.5} fill="var(--faint)">{l.trim()}</text>)}
          {series.map((s, si) => {
            const pts = s.data.map((d, i) => [x(i), y(d)]);
            const line = pts.map((p, i) => (i ? "L" : "M") + p[0] + "," + p[1]).join(" ");
            return (
              <g key={si}>
                {s.wash && <path d={line + ` L${x(s.data.length - 1)},${y(Math.max(mn, zero ? 0 : mn))} L${x(0)},${y(Math.max(mn, zero ? 0 : mn))} Z`} fill={color(s.tone)} opacity={0.1} />}
                <path d={line} fill="none" stroke={color(s.tone, s.muted)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={4} fill={color(s.tone, s.muted)} stroke="var(--surface)" strokeWidth={2} />
              </g>
            );
          })}
          {hov !== null && (
            <g>
              <line x1={x(hov)} x2={x(hov)} y1={top} y2={h - axis} stroke="var(--border-strong)" strokeWidth={1} />
              {series.map((s, si) => <circle key={si} cx={x(hov)} cy={y(s.data[hov])} r={4} fill={color(s.tone, s.muted)} stroke="var(--surface)" strokeWidth={2} />)}
            </g>
          )}
        </svg>
      )}
      {hov !== null && w > 0 && (
        <div className="dx-tip" style={{ left: Math.min(w - 170, Math.max(0, x(hov) + 10)), top: 6 }}>
          <div className="dx-tip-k">{labels[hov].trim()}</div>
          {series.map((s, si) => (
            <div key={si} className="dx-tip-row"><i style={{ background: color(s.tone, s.muted) }} />{s.name}<b className="dx-num">{fmt(s.data[hov])}</b></div>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className="dx-legend" style={{ position: "absolute", left: left, top: -4 }}>
          {series.map((s, si) => <span key={si}><i style={{ background: color(s.tone, s.muted) }} />{s.name}</span>)}
        </div>
      )}
    </div>
  );
}

/* ---------- the operating chain: how one record connects to the next ---------- */
export type ChainStep = { k: string; v: ReactNode; sub?: ReactNode; tone?: Tone; onClick?: () => void; icon?: string };
export function Chain({ steps, dir = "down" }: { steps: ChainStep[]; dir?: "down" | "across" }) {
  return (
    <div className={dir === "across" ? "dx-chain dx-chain-x" : "dx-chain"}>
      {steps.map((s, i) => (
        <div key={i} className="dx-chain-step" style={{ animationDelay: i * 70 + "ms" }}>
          <div className="dx-chain-rail">
            <span className="dx-chain-node" style={{ borderColor: s.tone ? INK[s.tone] : "var(--border-strong)", background: s.tone ? SOFT[s.tone] : "var(--surface-2)", color: s.tone ? INK[s.tone] : "var(--dim)" }}>
              {s.icon ? <Icon d={s.icon} s={12} w={2} /> : i + 1}
            </span>
            {i < steps.length - 1 && <span className="dx-chain-line" />}
          </div>
          <div className={"dx-chain-body" + (s.onClick ? " dx-click" : "")} onClick={s.onClick}>
            <div className="dx-chain-k">{s.k}</div>
            <div className="dx-chain-v">{s.v}</div>
            {s.sub && <div className="dx-chain-sub" style={{ color: s.tone && s.tone !== "neutral" ? INK[s.tone] : undefined }}>{s.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* A connection map: one event, and every record it touches. */
export function Ripple({ source, targets }: { source: { k: string; v: string; tone?: Tone }; targets: { k: string; v: ReactNode; onClick?: () => void; tone?: Tone }[] }) {
  return (
    <div className="dx-ripple">
      <div className="dx-ripple-src" style={{ borderColor: source.tone ? INK[source.tone] : "var(--accent-line)" }}>
        <div className="dx-chain-k">{source.k}</div>
        <div className="dx-ripple-v">{source.v}</div>
      </div>
      <div className="dx-ripple-arms">
        {targets.map((t, i) => (
          <div key={i} className={"dx-ripple-t" + (t.onClick ? " dx-click" : "")} onClick={t.onClick} style={{ animationDelay: 120 + i * 60 + "ms" }}>
            <span className="dx-ripple-arrow"><Icon d={IC.arrow} s={12} w={2} /></span>
            <div style={{ minWidth: 0 }}>
              <div className="dx-chain-k">{t.k}</div>
              <div className="dx-ripple-tv" style={{ color: t.tone ? INK[t.tone] : undefined }}>{t.v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* An agent's recommendation. Always says who made it and what it would do. */
export function AiCard({ agent = "Pulse", title = "Recommended action", children, actions }: { agent?: string; title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="dx-ai">
      <div className="dx-ai-head">
        <span className="dx-ai-mark"><Icon d={IC.spark} s={13} w={2} /></span>
        <span className="dx-ai-title">{title}</span>
        <span className="dx-ai-agent">{agent}</span>
      </div>
      <div className="dx-ai-body">{children}</div>
      {actions && <div className="dx-ai-actions">{actions}</div>}
    </div>
  );
}

export function Facts({ items, cols = 3 }: { items: [string, ReactNode, Tone?][]; cols?: number }) {
  return (
    <div className="dx-facts" style={{ gridTemplateColumns: "repeat(" + cols + ",minmax(0,1fr))" }}>
      {items.map(([k, v, t], i) => (
        <div key={i} className="dx-fact"><div className="dx-fact-k">{k}</div><div className="dx-fact-v" style={{ color: t ? INK[t] : undefined }}>{v}</div></div>
      ))}
    </div>
  );
}

export function Section({ title, right, children, style }: { title: ReactNode; right?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="dx-section" style={style}>
      <div className="dx-section-head"><div className="dx-section-title">{title}</div>{right}</div>
      {children}
    </div>
  );
}

export function Note({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <div className="dx-note" style={{ borderColor: tone === "neutral" ? "var(--border)" : INK[tone], background: tone === "neutral" ? "var(--surface-faint)" : SOFT[tone] }}>{children}</div>;
}

export function Seg({ items, value, onChange }: { items: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="dx-seg">
      {items.map(([k, l]) => <button key={k} className={k === value ? "on" : ""} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

/* Remembers local UI choices (a filter, a selected row) across re-renders of the same page. */
const memo: Record<string, any> = {};
export function useLocal<T>(key: string, init: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(key in memo ? memo[key] : init);
  useEffect(() => { memo[key] = v; }, [key, v]);
  return [v, setV];
}
