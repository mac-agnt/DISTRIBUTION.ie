import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  AT_RISK_TODAY, DELIVERY_ISSUES, DISPATCH, KPI, OTIF, ORDERS, PODS, POS, PRODUCTS, RETURNS, RISK_PROB, ROUTES, STAFF, TODAY, VEHICLES,
  CUSTOMERS, customer, eur, num, order, pct, route, who,
  type POD, type Route, type Stop, type Vehicle,
} from "../db";
import {
  ActBtn, AiCard, Badge, Btn, Card, Chain, Columns, Facts, Grid, HBars, IC, Icon, Kpi, KpiRow, Lines, Meter, Note, Page, Person, RecLink, Seg, Table,
  useDx, useLocal, type Tone,
} from "../ui";

/* Delivery: today's routes and stops, the vehicles, OTIF, delivery issues and proof of delivery.
   Every figure reads from db.ts. Local additions (three vehicles, one POD, ETAs for stops without a
   stop list, the N02 damage history) are defined below and stay consistent with it. Now is 25 Sep 09:16. */

/* ---------- time ---------- */
const NOW = 9 * 60 + 16;
const mins = (t: string) => { const m = /(\d{1,2}):(\d{2})/.exec(t); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
const until = (t: string) => {
  const d = mins(t) - NOW;
  if (isNaN(d)) return "";
  if (d <= 0) return "passed";
  const h = Math.floor(d / 60), m = d % 60;
  return h ? h + "h " + String(m).padStart(2, "0") + "m" : m + "m";
};

/* ---------- links: only ids that exist in the db become doors ---------- */
const hasOrder = (id: string) => ORDERS.some(o => o.id === id);
function SoLink({ id }: { id: string }) {
  return hasOrder(id) ? <RecLink kind="order" id={id} /> : <span className="dx-num">{id}</span>;
}
function RouteLink({ id, label }: { id: string; label?: string }) {
  return ROUTES.some(r => r.id === id) ? <RecLink kind="route" id={id}>{label}</RecLink> : <span>{label || id}</span>;
}
function IdLink({ id }: { id: string }) {
  if (id.startsWith("SO-")) return <SoLink id={id} />;
  if (id.startsWith("PO-")) return POS.some(p => p.id === id) ? <RecLink kind="po" id={id} /> : <>{id}</>;
  if (/^[DWNKM]\d{2}$/.test(id)) return <RouteLink id={id} />;
  return PRODUCTS.some(p => p.sku === id) ? <RecLink kind="sku" id={id} /> : <>{id}</>;
}
function Linked({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /(SO-\d{5}|PO-\d{4}|(?:EL|FIX|SAF|IC|TL|JAN|PK)-\d{4}|\b[DWNKM]\d{2}\b)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push(text.slice(last, m.index));
    out.push(<IdLink key={m.index} id={m[0]} />);
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
function Driver({ id }: { id: string }) {
  return STAFF[id] ? <Person id={id} /> : <span className="dx-faint">No driver assigned</span>;
}
const first = (id: string) => who(id).name.split(" ")[0];
const wrap = { whiteSpace: "normal" as const, lineHeight: 1.45 };
const clip = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const };
const money = (v: number) => eur(v, v % 1 ? 2 : 0);
const custByName = (name: string) => CUSTOMERS.find(c => c.name.split(" ")[0] === name.split(" ")[0]);

/* ---------- route state, reacting to decisions taken anywhere in the demo ---------- */
const STATUS_TONE: Record<string, Tone> = { Delivered: "ok", "In transit": "accent", Loading: "warn", "Awaiting dispatch": "neutral", Held: "bad", Cleared: "ok" };
function routeState(r: Route, acted: Record<string, string>): { status: string; line: string; tone?: Tone } {
  const togo = r.stops - r.done;
  if (r.id === "D11") return acted["d11-move"]
    ? { status: "Cleared", line: "SO-10528 moved to D09. Now 7,460kg, cleared to leave at 10:00.", tone: "ok" }
    : { status: "Held", line: "Over weight by 340kg. Move SO-10528 to D09.", tone: "bad" };
  if (r.id === "D14") return acted["d14-plan"]
    ? { status: r.status, line: "Load plan confirmed: 11 stops, SO-10482 loads 15 of 18 lines.", tone: "ok" }
    : { status: r.status, line: "Waiting on SO-10482: 15 of 18 lines by the 13:30 cutoff.", tone: "bad" };
  if (r.id === "D09") return acted["d-transfer"]
    ? { status: r.status, line: "SO-10526 covered by TR-2291 from Naas.", tone: "ok" }
    : { status: r.status, line: "SO-10526 needs EL-4408 from Naas for tomorrow's first drop.", tone: "warn" };
  if (r.id === "W01") return { status: r.status, line: "Waiting on SO-10536, pick cutoff 11:30.", tone: "warn" };
  if (r.id === "K01") return { status: r.status, line: "SO-10474 held on the N-07-04 count mismatch.", tone: "warn" };
  if (r.status === "Delivered") return { status: r.status, line: "All " + r.stops + " stops delivered by " + r.complete + ".", tone: "ok" };
  if (r.status === "In transit") return { status: r.status, line: "On plan · " + togo + " stop" + (togo === 1 ? "" : "s") + " to go" + (r.id === "D07" ? " · PM run 12:15" : "") + "." };
  const d = DISPATCH.find(x => x.route === r.id);
  return d && d.loaded < 100
    ? { status: r.status, line: "Loading, " + d.loaded + "% on board. Departs " + r.depart + ".", tone: "warn" }
    : { status: r.status, line: "Loaded and checked. Departs " + r.depart + "." };
}
/* Pick cutoffs for the routes still to leave (the warehouse dispatch board uses the same times). */
const CUTOFF: Record<string, string> = { D04: "11:00", D11: "10:00", D14: "13:30", W01: "11:30", N04: "10:30" };

/* ETAs for the seven at-risk deliveries, including the ones on routes without a stop list yet. */
function riskEta(so: string, acted: Record<string, string>): [string, string] {
  const moved = !!acted["d11-move"];
  const map: Record<string, [string, string]> = {
    "SO-10482": ["14:30", "D14 · stop 2, 15 of 18 lines"],
    "SO-10497": ["15:05", "D14 · stop 3"],
    "SO-10509": ["12:05", "D04 · departs 11:30"],
    "SO-10526": ["07:40", "26 Sep · D09 first drop"],
    "SO-10531": ["10:45", moved ? "D11 · cleared, leaves 10:00" : "D11 · only if it leaves at 10:00"],
    "SO-10536": ["12:40", "W01 · departs 12:00"],
    "SO-10528": moved ? ["12:55", "D09 · second run"] : ["10:25", "D11 · held"],
  };
  return map[so] || ["—", ""];
}

/* =====================================================================================
   TODAY
   ===================================================================================== */
function Today() {
  const dx = useDx();
  const [filter, setFilter] = useLocal("dl-today-filter", "all");
  const atRisk = AT_RISK_TODAY.map(order).sort((a, b) => (RISK_PROB[b.id] || 0) - (RISK_PROB[a.id] || 0));
  const riskIds = ["D14", "D11", "D09", "W01", "K01"];
  const order_ = ["Held", "Awaiting dispatch", "Loading", "In transit", "Delivered"];
  const routes = ROUTES.filter(r =>
    filter === "all" ? true
    : filter === "risk" ? riskIds.includes(r.id)
    : filter === "out" ? r.status === "In transit"
    : filter === "due" ? ["Held", "Awaiting dispatch", "Loading"].includes(r.status)
    : r.status === "Delivered")
    .sort((a, b) => order_.indexOf(a.status) - order_.indexOf(b.status) || mins(a.depart) - mins(b.depart));
  return (
    <Page eyebrow={"Delivery · " + TODAY.long + " · " + TODAY.time} title="Today's deliveries"
      sub="Every route and every stop, live from the route planner and the drivers' handsets. Problems show up here before the customer rings."
      right={<>
        <Btn kind="ghost" icon={IC.chat} onClick={() => dx.ask("Which deliveries are at risk today?")}>Ask Dispatch Agent</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Delivery", "otif")}>OTIF report</Btn>
      </>}>
      <KpiRow n={6}>
        <Kpi label="Deliveries" value={String(KPI.deliveriesToday)} sub={ROUTES.length + " routes · 2 warehouses"} />
        <Kpi label="Delivered" value={String(KPI.delivered)} sub={Math.round((KPI.delivered / KPI.deliveriesToday) * 100) + "% of today · every one with a POD"} subTone="ok" onClick={() => dx.go("Delivery", "pod")} />
        <Kpi label="In transit" value={String(KPI.inTransit)} sub="On vehicles now" />
        <Kpi label="Awaiting dispatch" value={String(KPI.awaitingDispatch)} sub="Loading or waiting on picks" onClick={() => dx.go("Warehouse", "dispatch")} />
        <Kpi label="OTIF" value={pct(KPI.otif)} sub={"Target " + pct(KPI.otifTarget)} subTone="warn" onClick={() => dx.go("Delivery", "otif")} />
        <Kpi label="At risk" value={String(KPI.deliveriesAtRisk)} tone="bad" sub={eur(KPI.atRiskTodayValue) + " on today's routes"} subTone="bad" />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14}>
        <Card title="At risk on today's routes" sub={atRisk.length + " deliveries · " + eur(atRisk.reduce((a, o) => a + o.value, 0)) + " · most likely to fail first"} pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Orders", "risk")}>All at-risk orders</Btn>}>
          <Table onRow={o => dx.go("Orders", "detail", { order: o.id })} rowTone={o => (o.id === dx.rec.order ? "accent" : undefined)} cols={[
            { k: "id", label: "Order", w: "1.15fr", render: o => <RecLink kind="order" id={o.id} /> },
            { k: "c", label: "Customer · value", w: "1.55fr", render: o => (
              <div style={{ minWidth: 0 }}><div style={clip}>{customer(o.cust).name}</div><div className="dx-num" style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{eur(o.value)}</div></div>) },
            { k: "why", label: "Reason", w: "1.85fr", render: o => {
              const fixed = (o.id === "SO-10528" || o.id === "SO-10531") && dx.acted["d11-move"];
              return <span style={{ ...wrap, color: fixed ? "var(--ok)" : "var(--body)" }}>{fixed ? "Fixed: D11 cleared" : <Linked text={o.reason || ""} />}</span>;
            } },
            { k: "eta", label: "ETA", w: "1.1fr", render: o => { const [t, s] = riskEta(o.id, dx.acted); return (
              <div style={{ minWidth: 0 }}><div className="dx-num" style={{ fontWeight: 600 }}>{t}</div><div style={{ fontSize: 11.5, color: "var(--faint)", ...clip }}><Linked text={s} /></div></div>); } },
            { k: "p", label: "Risk", w: "0.75fr", align: "right", render: o => { const p = RISK_PROB[o.id] || 0; return <b className="dx-num" style={{ fontWeight: 600, color: p >= 0.8 ? "var(--bad)" : "var(--warn)" }}>{Math.round(p * 100)}%</b>; } },
          ]} rows={atRisk} />
        </Card>
        <EtaDesk />
      </Grid>

      <div className="dx-section">
        <div className="dx-section-head">
          <div className="dx-section-title">Routes</div>
          <Seg value={filter} onChange={setFilter} items={[["all", "All " + ROUTES.length], ["risk", "Need attention"], ["due", "Not departed"], ["out", "On the road"], ["done", "Complete"]]} />
        </div>
        <Grid cols="repeat(3,minmax(0,1fr))" gap={12}>
          {routes.map(r => <RouteCard key={r.id} r={r} />)}
        </Grid>
      </div>
    </Page>
  );
}

function RouteCard({ r }: { r: Route }) {
  const dx = useDx();
  const st = routeState(r, dx.acted);
  return (
    <Card onClick={() => dx.open("route", r.id)} tone={st.tone === "bad" ? "bad" : undefined} pad={false}>
      <div style={{ padding: "14px 16px 15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.2px" }}>{r.id}</span>
          <span className="dx-faint" style={{ flex: 1, minWidth: 0, fontSize: 12, ...clip }}>{r.area}</span>
          <Badge tone={STATUS_TONE[st.status] || "neutral"}>{st.status}</Badge>
        </div>
        <div style={{ marginTop: 11, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12.5 }}>
          <Person id={r.driver} />
          <span className="dx-num dx-muted" style={{ flex: "none" }}>{r.vehicle}</span>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}><Meter value={r.done} max={r.stops} tone={r.done === r.stops ? "ok" : "accent"} /></div>
          <span className="dx-num" style={{ fontSize: 12, color: "var(--dim)" }}>{r.done} of {r.stops} stops</span>
        </div>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--dim)" }}>
          <span className="dx-num" style={{ color: "var(--ink)", fontWeight: 500 }}>{eur(r.value)}</span>
          <span className="dx-num">{r.depart} → {r.complete}</span>
        </div>
        <div style={{ marginTop: 9, fontSize: 12.5, lineHeight: 1.45, color: st.tone ? `var(--${st.tone})` : "var(--faint)" }}><Linked text={st.line} /></div>
      </div>
    </Card>
  );
}

/* A customer rings for an ETA. Fiona answers from the live route, not by ringing the driver. */
const CALLS = [
  { key: "maynooth", route: "D07", n: 5, cust: "westbrook", place: "Westbrook, Maynooth", gps: "Last GPS 09:15, leaving Liffey Valley on the N4" },
  { key: "leixlip", route: "D07", n: 6, cust: "kildare", place: "Kildare Build, Leixlip drop", gps: "Last GPS 09:15, leaving Liffey Valley on the N4" },
  { key: "murphy", route: "D14", n: 2, cust: "murphy", place: "Murphy, Naas Road yard", gps: "At dock 4 in Ballymount, departs 13:45" },
  { key: "horizon", route: "D14", n: 3, cust: "horizon", place: "Horizon, Clondalkin yard", gps: "At dock 4 in Ballymount, departs 13:45" },
];
function EtaDesk() {
  const dx = useDx();
  const [sel, setSel] = useLocal("dl-eta-call", "maynooth");
  const call = CALLS.find(c => c.key === sel) || CALLS[0];
  const r = route(call.route);
  const stop = (r.list || []).find(s => s.n === call.n) as Stop;
  const ahead = (r.list || []).filter(s => s.n < call.n && s.status !== "Delivered").length;
  const c = customer(call.cust);
  const caller = c.contact[0];
  const transfer = !!dx.acted["d-transfer"];
  const says: Record<string, string> = {
    maynooth: `${first(r.driver)} is on his way to you now and you're his next stop. ETA ${stop.eta}. He's delivered ${r.done} of ${r.stops} this morning and is running to plan.`,
    leixlip: `You're stop ${stop.n} on ${r.id}. One drop ahead of you, in Maynooth. ETA ${stop.eta}.`,
    murphy: `${r.id} leaves Ballymount at ${r.depart} and you're the second drop, about ${stop.eta} at the Naas Road yard. 15 of the 18 lines come today. The cable, glands and cable ties follow tomorrow once Atlas delivers.`,
    horizon: transfer
      ? `${r.id}, third drop, about ${stop.eta}. It comes complete: the cable is on the 11:00 van from Naas.`
      : `${r.id}, third drop, about ${stop.eta}. One line is short, 12 drums of cable. We're moving stock from Naas and I'll confirm by 10:30.`,
  };
  return (
    <Card title="Customer rings for ETA" sub="Fiona can answer this without calling the driver" pad={false}>
      <div className="dx-list">
        {CALLS.map((k, i) => (
          <div key={k.key} className="dx-li dx-click" onClick={() => setSel(k.key)}
            style={{ borderTop: i ? undefined : 0, padding: "9px 20px", alignItems: "center", background: k.key === call.key ? "var(--surface-2)" : undefined, boxShadow: k.key === call.key ? "inset 3px 0 0 var(--accent)" : undefined }}>
            <Icon d={IC.chat} s={14} style={{ color: k.key === call.key ? "var(--accent)" : "var(--faint)" }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, ...clip }}><b style={{ fontWeight: 600 }}>{customer(k.cust).contact[0]}</b> <span className="dx-faint">· {k.place}</span></span>
            <span className="dx-num dx-faint" style={{ fontSize: 12 }}>{k.route}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "14px 20px 18px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div>
            <div className="dx-faint" style={{ fontSize: 11.5 }}>ETA · {c.name}</div>
            <div className="dx-num" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-1px", lineHeight: 1.1, marginTop: 4 }}>{stop.eta}</div>
          </div>
          <span style={{ marginBottom: 5 }}><Badge tone={stop.status === "Next" ? "accent" : stop.status === "At risk" ? "bad" : "neutral"}>{stop.status}</Badge></span>
          <span style={{ flex: 1 }} />
          <span style={{ marginBottom: 5, fontSize: 12, color: "var(--dim)" }}><SoLink id={stop.so} /></span>
        </div>
        <div style={{ marginTop: 12 }}>
          <Facts cols={3} items={[
            ["Route · stop", <><RecLink kind="route" id={r.id} /> · {stop.n} of {r.stops}</>],
            ["Driver", who(r.driver).name],
            ["Stops before it", ahead ? String(ahead) : "None, it's next"],
          ]} />
        </div>
        <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}><Icon d={IC.truck} s={13} /><span className="dx-num">{r.vehicle}</span> · {call.gps}</div>
        <div style={{ marginTop: 10 }}>
          <Note><span className="dx-faint">Fiona says to {caller}: </span>{says[call.key]}</Note>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <ActBtn id={"eta-" + call.key} small kind="primary" label={"Text the ETA to " + caller.split(" ")[0]} done={"ETA sent to " + caller.split(" ")[0]}
            toast={`SMS to ${caller}: ${r.id} ETA ${stop.eta}, live tracking link attached. Logged against ${stop.so}.`} />
          <Btn small kind="quiet" onClick={() => dx.go("Delivery", "routes", { route: r.id })}>Open route</Btn>
        </div>
      </div>
    </Card>
  );
}

/* =====================================================================================
   ROUTES
   ===================================================================================== */
/* The stops beyond the planner's detailed list, so the full run reads end to end. */
const MORE_STOPS: Record<string, string> = {
  D14: "Stops 7 to 12: six drops in Ballymount, Walkinstown and Greenhills, ETAs 16:25 to 17:05. Back at the depot 17:20.",
  D07: "Stops 7 and 8: two drops in Lucan, ETAs 11:05 and 11:35. Back at Ballymount 12:05 for the PM run.",
};
const stopTone = (s: string): Tone => (s === "Delivered" ? "ok" : s === "Next" ? "accent" : s === "At risk" || s === "Failed" ? "bad" : "neutral");
function StopsChain({ r }: { r: Route }) {
  const dx = useDx();
  const transfer = !!dx.acted["d-transfer"];
  return (
    <Chain steps={(r.list || []).map(s => {
      const note = s.so === "SO-10497" && transfer ? "Covered by TR-2291: the cable is on the 11:00 van from Naas." : s.note;
      const status = s.so === "SO-10497" && transfer ? "Scheduled" : s.status;
      return {
        k: "Stop " + s.n + " · ETA " + s.eta,
        v: <>{customer(s.cust).name} <span className="dx-faint" style={{ fontWeight: 400 }}>· {s.site}</span></>,
        sub: <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><Badge tone={stopTone(status)}>{status}</Badge><SoLink id={s.so} />{note && <span style={{ color: "var(--dim)" }}>{note}</span>}</span>,
        tone: stopTone(status) === "neutral" ? undefined : stopTone(status),
        icon: status === "Delivered" ? IC.check : undefined,
        onClick: hasOrder(s.so) ? () => dx.go("Orders", "detail", { order: s.so }) : undefined,
      };
    })} />
  );
}

/* Extra POD kept locally: D07 stop 4 at 09:15 isn't in PODS yet. */
const POD_EXTRA: POD[] = [{ so: "SO-10494", cust: "leinster", route: "D07", time: "09:15", signed: "Site 11 · P. Doran", photo: true, gps: true, exceptions: "1 carton refused, damaged" }];
const ALL_PODS = [...POD_EXTRA, ...PODS].sort((a, b) => mins(b.time) - mins(a.time));

function RouteDetail({ r }: { r: Route }) {
  const dx = useDx();
  const st = routeState(r, dx.acted);
  const orders = ORDERS.filter(o => o.route === r.id);
  const pods = ALL_PODS.filter(p => p.route === r.id);
  return (
    <Card title={<>Route {r.id} <span className="dx-faint" style={{ fontWeight: 400 }}>· {r.area}</span></>}
      sub={WAREHOUSES_SHORT[r.wh] + " · " + r.type}
      right={<><Badge tone={STATUS_TONE[st.status] || "neutral"}>{st.status}</Badge><Btn small kind="quiet" onClick={() => dx.open("route", r.id)}>Record</Btn></>}>
      <Facts cols={5} items={[
        ["Driver", who(r.driver).name], ["Vehicle", r.vehicle], ["Stops", String(r.stops)], ["Order value", eur(r.value)], ["Distance", r.km + " km"],
        ["Departure", r.depart], ["Expected completion", r.complete], ["Delivered", r.done + " of " + r.stops, r.done === r.stops ? "ok" : undefined],
        ["Route OTIF (30 days)", pct(r.otif), r.otif < 94 ? "warn" : undefined], ["Pick cutoff", CUTOFF[r.id] || (r.status === "In transit" || r.status === "Delivered" ? "Departed " + r.depart : "—")],
      ]} />
      <div style={{ marginTop: 12 }}><Note tone={st.tone === "bad" ? "bad" : st.tone === "warn" ? "warn" : st.tone === "ok" ? "ok" : "neutral"}><Linked text={st.line} /></Note></div>
      <div className="dx-section" style={{ marginTop: 18 }}>
        <div className="dx-section-head" style={{ margin: "0 0 12px" }}>
          <div className="dx-section-title" style={{ fontSize: 14.5 }}>Stops</div>
          <span className="dx-faint" style={{ fontSize: 12.5 }}>{r.done} of {r.stops} delivered{r.list ? " · " + r.list.length + " in the planner's detailed list" : ""}</span>
        </div>
        {r.list ? (
          <>
            <StopsChain r={r} />
            {MORE_STOPS[r.id] && <div style={{ fontSize: 12.5, color: "var(--dim)", marginLeft: 42 }}>{MORE_STOPS[r.id]}</div>}
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.55, marginBottom: 12 }}>
              {r.status === "Delivered" ? "All " + r.stops + " stops delivered. The signed PODs are below; each invoice went to Sage as its POD came in."
                : r.status === "In transit" ? r.done + " of " + r.stops + " delivered, " + (r.stops - r.done) + " to go. The stop-by-stop list syncs from the route planner at the end of the run."
                : r.stops + " stops planned. The stop-by-stop list syncs from the route planner at departure."}
            </div>
            <Table dense onRow={o => dx.go("Orders", "detail", { order: o.id })} empty="No open orders routed here." cols={[
              { k: "id", label: "Order", w: "1fr", render: o => <RecLink kind="order" id={o.id} /> },
              { k: "c", label: "Customer", w: "1.8fr", render: o => <span style={clip}>{customer(o.cust).name}</span> },
              { k: "v", label: "Value", w: "0.8fr", align: "right", render: o => <span className="dx-num">{eur(o.value)}</span> },
              { k: "req", label: "Required", w: "0.7fr", render: o => o.required },
              { k: "st", label: "Status", w: "1.2fr", render: o => <Badge tone={o.risk === "HIGH" ? "bad" : o.risk === "MEDIUM" ? "warn" : "ok"}>{o.status}</Badge> },
            ]} rows={orders} />
          </>
        )}
      </div>
      {pods.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 6 }}>Proof of delivery on this route</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {pods.map(p => (
              <span key={p.so} style={{ fontSize: 12, padding: "5px 9px", borderRadius: 8, background: p.exceptions === "None" ? "var(--surface-2)" : "var(--warn-soft)", color: p.exceptions === "None" ? "var(--body)" : "var(--warn)" }}>
                <span className="dx-num">{p.time}</span> · <SoLink id={p.so} /> · {p.signed}{p.exceptions !== "None" ? " · " + p.exceptions : ""}
              </span>
            ))}
          </div>
        </div>
      )}
      {r.id === "D14" && (
        <div style={{ marginTop: 16 }}>
          <AiCard agent="Dispatch Agent" title="Keep D14 on time" actions={<ActBtn id="d14-plan" kind="primary" small label="Confirm load plan" done="Load plan confirmed" toast="D14 load plan confirmed: 11 stops, departs 13:45. James Nolan notified." />}>
            Load the 15 available lines of <RecLink kind="order" id="SO-10482" /> by 13:30 and D14 leaves on schedule. The remaining 3 lines go on tomorrow's D14 after <RecLink kind="po" id="PO-8821" /> lands, still inside Murphy's required date.
            {" "}Tallaght Trade Centre (<RecLink kind="order" id="SO-10533" />) drops off unless credit releases it by 13:00.
          </AiCard>
        </div>
      )}
      {r.id === "D11" && (
        <div style={{ marginTop: 16 }}>
          <AiCard agent="Dispatch Agent · 08:36" title="Fix the weight" actions={<ActBtn id="d11-move" kind="primary" small label="Move SO-10528 to D09" done="Moved to D09" toast="SO-10528 moved to D09. D11 now 7,460kg, cleared to depart." />}>
            D11 is 340kg over its plated weight. Move <RecLink kind="order" id="SO-10528" /> (Clondalkin Plant Hire, 380kg) to D09's second run. Both orders still arrive before their slot.
          </AiCard>
        </div>
      )}
      {r.id === "D09" && (
        <div style={{ marginTop: 16 }}>
          <AiCard agent="Inventory Agent" title="The stock is in Naas" actions={<ActBtn id="d-transfer" kind="primary" small label="Approve TR-2291" done="Transfer TR-2291 approved" toast="TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van. Liam and Aoife notified." />}>
            <RecLink kind="order" id="SO-10526" /> for Liffey M&E needs 18 drums of <RecLink kind="sku" id="EL-4408" />. Dublin's 12 free are counter safety stock; Naas has 64. The 40-drum transfer on the 11:00 van covers Liffey, Horizon and Quinlan.
          </AiCard>
        </div>
      )}
    </Card>
  );
}
const WAREHOUSES_SHORT: Record<string, string> = { DUB: "From Dublin", NAS: "From Naas" };

function Routes() {
  const dx = useDx();
  const valid = (id?: string) => !!id && ROUTES.some(r => r.id === id);
  const [sel, setSel] = useState(valid(dx.rec.route) ? dx.rec.route : "D14");
  useEffect(() => { if (valid(dx.rec.route)) setSel(dx.rec.route); }, [dx.rec.route]);
  const r = route(sel);
  const contrast = sel === "D07" ? route("D14") : route("D07");
  const rank = ["Held", "Awaiting dispatch", "Loading", "In transit", "Delivered"];
  const list = ROUTES.slice().sort((a, b) => rank.indexOf(a.status) - rank.indexOf(b.status) || mins(a.depart) - mins(b.depart));
  return (
    <Page eyebrow={"Delivery · Routes · " + TODAY.time} title="Routes"
      sub="Pick a route to see the whole run: driver, vehicle, every stop and its status, and what's holding it up."
      right={<Btn kind="ghost" onClick={() => dx.go("Warehouse", "dispatch")}>Dispatch board</Btn>}>
      <Grid cols="minmax(0,4fr) minmax(0,8fr)" gap={14}>
        <Card title="Today's routes" sub={ROUTES.length + " routes · " + eur(ROUTES.reduce((a, x) => a + x.value, 0)) + " on the road today"} pad={false}>
          <div className="dx-list">
            {list.map((x, i) => {
              const st = routeState(x, dx.acted);
              const on = x.id === sel;
              return (
                <div key={x.id} className="dx-li dx-click" onClick={() => setSel(x.id)}
                  style={{ borderTop: i ? undefined : 0, flexDirection: "column", gap: 6, alignItems: "stretch", background: on ? "var(--surface-2)" : undefined, boxShadow: on ? "inset 3px 0 0 var(--accent)" : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontWeight: 600, fontSize: 13.5 }}><RecLink kind="route" id={x.id} /></b>
                    <span className="dx-faint" style={{ flex: 1, minWidth: 0, fontSize: 12, ...clip }}>{x.area}</span>
                    <Badge tone={STATUS_TONE[st.status] || "neutral"}>{st.status}</Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--dim)", width: 120, flex: "none", ...clip }}>{first(x.driver)} · <span className="dx-num">{x.depart} → {x.complete}</span></span>
                    <div style={{ flex: 1 }}><Meter value={x.done} max={x.stops} h={5} tone={x.done === x.stops ? "ok" : "accent"} /></div>
                    <span className="dx-num" style={{ fontSize: 11.5, color: "var(--faint)" }}>{x.done}/{x.stops}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <RouteDetail r={r} />
          <Card title={<>For contrast: <RecLink kind="route" id={contrast.id} /> {contrast.status === "In transit" ? "in progress" : "not yet departed"}</>}
            sub={who(contrast.driver).name + " · " + contrast.vehicle + " · " + contrast.done + " of " + contrast.stops + " delivered · " + contrast.depart + " → " + contrast.complete}
            right={<Btn small kind="quiet" onClick={() => setSel(contrast.id)}>Show in full</Btn>}>
            <StopsChain r={contrast} />
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

/* =====================================================================================
   VEHICLES
   ===================================================================================== */
/* VEHICLES holds 15 of the 18. The other three: a spare 12t and two vans. */
const EXTRA_VEHICLES: Vehicle[] = [
  { reg: "241-D-31207", type: "12t rigid, tail-lift", route: "Spare", driver: "—", status: "Spare · Dublin yard · no driver free before 14:00", util: 0, service: "12 Jan", km: 52870 },
  { reg: "242-D-40318", type: "3.5t van", route: "Spare", driver: "—", status: "Spare · Dublin yard · kept for urgent runs", util: 0, service: "17 Oct", km: 18940 },
  { reg: "231-KE-2296", type: "3.5t van", route: "Naas shuttle", driver: "—", status: "Naas yard · 11:00 shuttle to Dublin", util: 38, service: "6 Nov", km: 97310 },
];
/* The driver comes from the route, so the fleet list always agrees with the route cards and the route drawer. */
const FLEET: Vehicle[] = [...VEHICLES, ...EXTRA_VEHICLES].map(v => ({ ...v, driver: ROUTES.find(r => r.id === v.route)?.driver ?? v.driver }));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const daysTo = (s: string) => {
  const m = /(\d{1,2}) ([A-Z][a-z]{2})/.exec(s);
  if (!m) return NaN;
  const mo = MONTHS.indexOf(m[2]);
  const y = mo < 8 ? 2027 : 2026;
  return Math.round((Date.UTC(y, mo, Number(m[1])) - Date.UTC(2026, 8, 25)) / 86400000);
};
const where = (v: Vehicle) =>
  v.status.startsWith("In workshop") ? "workshop" : v.status.startsWith("Spare") ? "spare" : /shuttle/i.test(v.status) ? "shuttle"
  : v.status.startsWith("On route") || v.status.startsWith("Returning") ? "road" : v.status.startsWith("Back at") ? "back" : "dock";

function Vehicles() {
  const dx = useDx();
  const moved = !!dx.acted["d11-move"];
  const count = (k: string) => FLEET.filter(v => where(v) === k).length;
  const working = FLEET.filter(v => v.util > 0);
  const avg = working.reduce((a, v) => a + v.util, 0) / working.length;
  const overdue = FLEET.filter(v => daysTo(v.service) < 0);
  const upcoming = FLEET.filter(v => { const d = daysTo(v.service); return d >= 0 && d <= 21; }).sort((a, b) => daysTo(a.service) - daysTo(b.service));
  const util = working.slice().sort((a, b) => b.util - a.util).map(v => ({
    label: v.route === "Naas trunk" ? "Trunk" : v.route === "Naas shuttle" ? "Van" : v.route,
    value: v.route === "D11" && moved ? 99 : v.util,
    tone: v.route === "D11" && !moved ? "bad" : undefined,
  }));
  return (
    <Page eyebrow={"Delivery · Vehicles · " + TODAY.time} title="Fleet"
      sub={FLEET.length + " vehicles across Dublin and Naas: where each one is, how full it's running, and what's due at the workshop."}>
      <KpiRow n={6}>
        <Kpi label="Fleet" value={String(FLEET.length)} sub={FLEET.filter(v => v.type.startsWith("12t")).length + " × 12t · " + FLEET.filter(v => v.type.startsWith("7.5t")).length + " × 7.5t · " + FLEET.filter(v => v.type.startsWith("3.5t")).length + " vans"} />
        <Kpi label="On the road" value={String(count("road"))} sub={count("shuttle") + " more on shuttle duty"} />
        <Kpi label="At the docks" value={String(count("dock"))} sub={moved ? "Loading for today's runs" : "1 held: D11 over weight"} subTone={moved ? undefined : "bad"} />
        <Kpi label="Spare" value={String(count("spare"))} sub="No driver free before 14:00" subTone="warn" />
        <Kpi label="Average utilisation" value={pct(avg, 0)} sub="Of plated payload, vehicles working today" />
        <Kpi label="Service overdue" value={String(overdue.length)} tone={overdue.length ? "bad" : undefined} sub={overdue.map(v => v.reg).join(", ") || "None"} subTone="bad" />
      </KpiRow>

      <Card title="Vehicles" sub="Status from the handsets and the route planner · utilisation is load against plated payload" pad={false}>
        <Table onRow={v => (ROUTES.some(r => r.id === v.route) ? dx.open("route", v.route) : undefined)}
          rowTone={v => (daysTo(v.service) < 0 ? "bad" : v.issue && !(v.route === "D11" && moved) ? "warn" : v.route === dx.rec.route ? "accent" : undefined)} cols={[
          { k: "reg", label: "Vehicle", w: "1.3fr", render: v => (
            <div style={{ minWidth: 0 }}><div className="dx-num" style={{ fontWeight: 600 }}>{v.reg}</div><div style={{ fontSize: 11.5, color: "var(--faint)", ...clip }}>{v.type}</div></div>) },
          { k: "route", label: "Route", w: "0.9fr", render: v => <span style={wrap}><RouteLink id={v.route} /></span> },
          { k: "driver", label: "Driver", w: "1.3fr", render: v => <Driver id={v.driver} /> },
          { k: "status", label: "Where it is", w: "2.1fr", render: v => <span style={{ ...wrap, color: "var(--body)" }}>{v.route === "D11" && moved ? "Cleared at dock 6 · departs 10:00" : v.status}</span> },
          { k: "util", label: "Utilisation", w: "1.1fr", render: v => {
            const u = v.route === "D11" && moved ? 99 : v.util;
            return (
              <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <Meter value={u} max={100} w={42} tone={u > 100 ? "bad" : u >= 88 ? "warn" : "accent"} />
                <span className="dx-num" style={{ fontSize: 12, color: u > 100 ? "var(--bad)" : undefined }}>{u ? u + "%" : "—"}</span>
              </span>);
          } },
          { k: "service", label: "Service due", w: "1.1fr", render: v => { const d = daysTo(v.service); return (
            <span className="dx-num" style={{ ...wrap, color: d < 0 ? "var(--bad)" : d <= 14 ? "var(--warn)" : v.service === "In progress" ? "var(--warn)" : "var(--body)" }}>{v.service}</span>); } },
          { k: "km", label: "Mileage", w: "1fr", align: "right", render: v => <span className="dx-num">{num(v.km)} km</span> },
          { k: "issue", label: "Issue", w: "1.3fr", render: v => v.route === "D11" && moved ? <span style={{ color: "var(--ok)" }}>Fixed</span>
            : v.issue ? <span style={{ color: daysTo(v.service) < 0 || v.util > 100 ? "var(--bad)" : "var(--warn)", ...wrap }}>{v.issue}</span> : <span className="dx-faint">—</span> },
        ]} rows={FLEET} />
      </Card>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Utilisation by vehicle today" sub="Load as a share of plated payload, by route. Trunk is the Naas trunk, Van the Naas shuttle.">
          <Columns data={util} fmt={n => n + "%"} h={200} target={100} targetLabel="Plated limit" highlight={moved ? undefined : 0} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent="Dispatch Agent" title="Drivers are the constraint today, not vehicles"
            actions={<ActBtn id="veh-7741" kind="primary" small label="Book 212-D-7741 in" done="Booked · 29 Sep 07:00"
              toast="212-D-7741 booked into Ballymount Commercials for 29 Sep 07:00. D18 runs on the spare van 242-D-40318 that morning." />}>
            Three vehicles are spare and none has a driver free before 14:00. That's why D11's fix is moving an order, not swapping in the spare 12t.
            {" "}Separately, the D18 van <b>212-D-7741</b> ran this morning 6 days past its service date at 188,340 km. Book it in for the 29th and run D18 on the spare van.
          </AiCard>
          <Card title="Workshop and services" sub="Due in the next three weeks" pad={false}>
            <div className="dx-list">
              {[...overdue, ...FLEET.filter(v => v.service === "In progress"), ...upcoming].map((v, i) => {
                const d = daysTo(v.service);
                return (
                  <div key={v.reg} className="dx-li" style={{ borderTop: i ? undefined : 0, padding: "10px 20px", alignItems: "center" }}>
                    <span className="dx-num" style={{ width: 96, flex: "none", fontWeight: 600, fontSize: 13 }}>{v.reg}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--dim)", ...clip }}>{v.type} · {v.route}{v.issue ? " · " + v.issue : ""}</span>
                    <Badge tone={d < 0 ? "bad" : isNaN(d) ? "warn" : d <= 10 ? "warn" : "neutral"}>{d < 0 ? "Overdue " + -d + " days" : isNaN(d) ? "In workshop" : v.service}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

/* =====================================================================================
   OTIF
   ===================================================================================== */
/* Horizontal OTIF bars on a scale from 84% so the differences are visible; the tick is the 97% target. */
function OtifBars({ items, lo = 84 }: { items: { label: ReactNode; value: number; onClick?: () => void }[]; lo?: number }) {
  const x = (v: number) => Math.max(1.5, ((v - lo) / (100 - lo)) * 100);
  return (
    <div className="dx-hbars">
      {items.map((it, i) => (
        <div key={i} className={"dx-hbar" + (it.onClick ? " dx-click" : "")} onClick={it.onClick}>
          <div className="dx-hbar-label">{it.label}</div>
          <div className="dx-hbar-track">
            <span style={{ width: x(it.value) + "%", background: "var(--accent)" }} />
            <i style={{ position: "absolute", left: x(OTIF.target) + "%", top: -3, bottom: -3, width: 1, background: "var(--ink)", opacity: 0.5 }} />
          </div>
          <div className="dx-hbar-val dx-num" style={{ color: it.value < 93 ? "var(--bad)" : it.value >= OTIF.target ? "var(--ok)" : undefined }}>{pct(it.value)}</div>
        </div>
      ))}
    </div>
  );
}

function Otif() {
  const dx = useDx();
  const gap = +(OTIF.target - OTIF.current).toFixed(1);
  const failures = OTIF.lateThisMonth + OTIF.incompleteThisMonth; // 105
  const perPt = failures / (100 - OTIF.current);
  const counts = OTIF.reasons.map(([k, p]) => [k, Math.round((failures * p) / 100)] as [string, number]);
  const fixes: { fix: ReactNode; n: number; owner: string; go: () => void; where: string }[] = [
    { fix: <>Atlas supplier delays: dual-source cable with EuroCable, service credit on late POs</>, n: 29, owner: "emma", where: "Suppliers", go: () => dx.go("Purchasing", "performance", { supplier: "atlas" }) },
    { fix: <>Stock in the wrong warehouse: balance Naas and Dublin before allocation (TR-2291 today)</>, n: 9, owner: "liam", where: "Transfers", go: () => dx.go("Inventory", "transfers", { sku: "EL-4408" }) },
    { fix: <>Picking waves: stop pulling pickers to goods-in during the 10:45 crunch</>, n: 7, owner: "liam", where: "Control board", go: () => dx.go("Warehouse", "board") },
    { fix: <>Vehicle overloads: check D11-style load plans at wave release, not at 08:36</>, n: 5, owner: "orla", where: "Dispatch", go: () => dx.go("Warehouse", "dispatch") },
  ];
  const pts = (n: number) => n / perPt;
  const total = fixes.reduce((a, f) => a + pts(f.n), 0);
  return (
    <Page eyebrow={"Delivery · OTIF · 13 weeks to " + TODAY.date} title="On time in full"
      sub="Where deliveries fail, why, and which fixes are worth the most. Each failure is traced to the supplier, stock, warehouse or transport cause behind it."
      right={<Btn kind="ghost" icon={IC.chat} onClick={() => dx.ask("Why is OTIF below target?")}>Ask Dispatch Agent</Btn>}>
      <KpiRow n={6}>
        <Kpi hero label="OTIF, 4 weeks" value={pct(OTIF.current)} tone="warn" sub={"Target " + pct(OTIF.target)} spark={OTIF.trend.map(t => t[1])} />
        <Kpi label="Gap to target" value={gap.toFixed(1) + " pts"} tone="bad" sub={failures + " failed deliveries this month"} />
        <Kpi label="Late this month" value={String(OTIF.lateThisMonth)} sub="Arrived after the promised slot" subTone="warn" />
        <Kpi label="Incomplete this month" value={String(OTIF.incompleteThisMonth)} sub="Arrived with lines missing" subTone="warn" />
        <Kpi label="Dublin" value={pct(OTIF.byWarehouse[0][1])} tone="warn" sub="Most Atlas-dependent lines ship from here" />
        <Kpi label="Naas" value={pct(OTIF.byWarehouse[1][1])} sub={"Within " + (OTIF.target - OTIF.byWarehouse[1][1]).toFixed(1) + " pts of target"} />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14}>
        <Card title="13-week trend" sub={"Weekly OTIF against the " + pct(OTIF.target) + " target. It has been below target every week since July."}>
          <Lines labels={OTIF.trend.map(t => t[0])} series={[{ name: "OTIF", data: OTIF.trend.map(t => t[1]), wash: true }]} fmt={n => pct(n)} h={220} target={OTIF.target} targetLabel={"Target " + pct(OTIF.target)} />
        </Card>
        <Card title="Why deliveries fail" sub={"Share of this month's " + failures + " failures, by root cause"}>
          <HBars fmt={n => n + "%"} items={OTIF.reasons.map(([label, value], i) => ({ label, value, note: counts[i][1] + " deliveries" }))} />
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 14, lineHeight: 1.55 }}>
            Supplier delay and stock shortage are 55% of failures. Both start in purchasing, not in the warehouse or on the road.
          </div>
        </Card>
      </Grid>

      <div style={{ marginTop: 14 }}>
        <AiCard agent="Dispatch Agent" title={"Four fixes close the " + gap.toFixed(1) + "-point gap"}>
          Each failed delivery this month costs about {(1 / perPt).toFixed(3)} points of OTIF. These four causes account for {fixes.reduce((a, f) => a + f.n, 0)} of the {failures},
          {" "}and fixing them takes OTIF from {pct(OTIF.current)} to about <b>{pct(OTIF.current + total)}</b>. Atlas alone is behind most of the supplier-delay failures and is worth about {pts(29).toFixed(1)} points.
          <div style={{ marginTop: 12 }}>
            <Table dense cols={[
              { k: "fix", label: "Fix", w: "3.4fr", render: f => <span style={wrap}>{f.fix}</span> },
              { k: "n", label: "Failures", w: "0.8fr", align: "right", render: f => <span className="dx-num">{f.n}</span> },
              { k: "p", label: "OTIF recovered", w: "0.9fr", align: "right", render: f => <b className="dx-num" style={{ color: "var(--ok)", fontWeight: 600 }}>+{pts(f.n).toFixed(1)} pts</b> },
              { k: "o", label: "Owner", w: "1.2fr", render: f => <Person id={f.owner} /> },
              { k: "w", label: "", w: "1.3fr", align: "right", render: f => <Btn small onClick={f.go}>{f.where}</Btn> },
            ]} rows={fixes} />
          </div>
        </AiCard>
      </div>

      <Grid cols="repeat(2,minmax(0,1fr))" gap={14} style={{ marginTop: 14 }}>
        <Card title="By supplier dependency" sub="OTIF of orders that depended on each supplier's stock · scale from 84%">
          <OtifBars items={OTIF.bySupplierDep.map(([name, v]) => {
            const id = name.split(" ")[0].toLowerCase();
            const known = ["atlas", "hansen", "lumos", "toolcraft", "eurofix"].includes(id);
            return { label: known ? <RecLink kind="supplier" id={id} plain>{name}</RecLink> : name, value: v };
          })} />
        </Card>
        <Card title="By product category" sub="Electrical is weakest: it carries most of Atlas's lines · scale from 84%">
          <OtifBars items={OTIF.byCategory.map(([name, v]) => ({ label: name, value: v, onClick: () => dx.go("Inventory", "stock") }))} />
        </Card>
        <Card title="By route" sub="30-day OTIF per route · the long rural runs and D14 trail · scale from 84%">
          <OtifBars items={OTIF.byRoute.map(([id, v]) => ({ label: <RecLink kind="route" id={id} plain>{id + " · " + route(id).area.split(" · ")[0]}</RecLink>, value: v }))} />
        </Card>
        <Card title="By customer" sub="Accounts with the most failures this quarter · scale from 84%">
          <OtifBars items={OTIF.byCustomer.map(([name, v]) => {
            const c = custByName(name);
            return { label: name, value: v, onClick: c ? () => dx.go("Customers", "detail", { cust: c.id }) : undefined };
          })} />
        </Card>
      </Grid>
    </Page>
  );
}

/* =====================================================================================
   DELIVERY ISSUES
   ===================================================================================== */
/* The N02 damage history behind DI-768's "third this month". */
const N02_DAMAGE = [
  { ref: "DI-768", date: "24 Sep", sku: "IC-1044", what: "1 box of cutting discs crushed", value: 34.5, credit: "CN-4471" },
  { ref: "DI-753", date: "16 Sep", sku: "FIX-3105", what: "4 cartridges of chemical anchor resin split", value: 47.2, credit: "CN-4438" },
  { ref: "DI-744", date: "8 Sep", sku: "JAN-4150", what: "2 containers of hand soap split", value: 29.2, credit: "CN-4402" },
];
const ISSUES_MONTH: [string, number][] = [
  ["Late delivery", OTIF.lateThisMonth], ["Incomplete delivery", OTIF.incompleteThisMonth], ["Transport damage", 9], ["Wrong item", 7], ["Customer unavailable", 6], ["Vehicle capacity", 3],
];
const ISSUE_LINK: Record<string, string> = { "RT-1186": "DI-768 · transport damage", "RT-1179": "DI-765 · wrong item", "RT-1188": "POD exception · refused carton", "RT-1184": "EX-3302 · wrong item picked", "RT-1165": "Short on delivery" };

function Issues() {
  const dx = useDx();
  const moved = !!dx.acted["d11-move"];
  const partial = !!dx.acted["so10482-partial"];
  const isOpen = (s: string, id: string) => !(s === "Closed" || (id === "DI-770" && moved) || (id === "DI-771" && partial));
  const open = DELIVERY_ISSUES.filter(i => isOpen(i.status, i.id));
  const related = RETURNS.filter(r => ISSUE_LINK[r.id]);
  const statusCell = (i: (typeof DELIVERY_ISSUES)[number]): ReactNode => {
    if (i.id === "DI-771") return <ActBtn id="so10482-partial" small kind="primary" label="Approve partial" done="Partial approved"
      toast="SO-10482: 15 lines on D14 today, 3 lines tomorrow after PO-8821. Gerry Murphy emailed by Sarah Byrne." />;
    if (i.id === "DI-770") return <ActBtn id="d11-move" small kind="primary" label="Move to D09" done="Moved to D09" toast="SO-10528 moved to D09. D11 now 7,460kg, cleared to depart." />;
    return <Badge tone={i.status === "Closed" ? "neutral" : /Credit|Replacement/.test(i.status) ? "ok" : "warn"}>{i.status}</Badge>;
  };
  return (
    <Page eyebrow={"Delivery · Issues · " + TODAY.time} title="Delivery issues"
      sub="Incomplete, late, damaged, wrong or refused: every delivery problem with its order, its cost, its owner, and the credit or replacement it created."
      right={<Btn kind="ghost" onClick={() => dx.go("Delivery", "pod")}>Proof of delivery</Btn>}>
      <KpiRow n={5}>
        <Kpi label="Open issues" value={String(open.length)} sub={eur(open.reduce((a, i) => a + i.value, 0)) + " of orders affected"} subTone="warn" />
        <Kpi label="Late this month" value={String(OTIF.lateThisMonth)} sub="Feeds OTIF" onClick={() => dx.go("Delivery", "otif")} />
        <Kpi label="Incomplete this month" value={String(OTIF.incompleteThisMonth)} sub="Feeds OTIF" onClick={() => dx.go("Delivery", "otif")} />
        <Kpi label="Credits and replacements" value={String(related.length)} sub="Created by delivery problems, last 2 weeks" />
        <Kpi label="Recurring patterns" value="1" tone="bad" sub="N02 transport damage, 3 times this month" subTone="bad" />
      </KpiRow>

      <Card title="Issues" sub="Newest first · each one tied to its order and route" pad={false}>
        <Table rowTone={i => (isOpen(i.status, i.id) && /Decision|Open/.test(i.status) ? "bad" : undefined)} cols={[
          { k: "id", label: "Issue", w: "0.8fr", render: i => <div><div className="dx-num" style={{ fontWeight: 600 }}>{i.id}</div><div style={{ fontSize: 11.5, color: "var(--faint)" }}>{i.when}</div></div> },
          { k: "kind", label: "Type", w: "1.2fr", render: i => <span style={wrap}>{i.kind}</span> },
          { k: "c", label: "Customer · order", w: "1.5fr", render: i => (
            <div style={{ minWidth: 0 }}><div style={clip}>{customer(i.cust).name}</div><div style={{ fontSize: 12, marginTop: 2 }}><SoLink id={i.so} /> · <RouteLink id={i.route} /></div></div>) },
          { k: "detail", label: "What happened", w: "2.6fr", render: i => <span style={{ ...wrap, color: "var(--body)" }}><Linked text={i.detail} /></span> },
          { k: "v", label: "Value", w: "0.7fr", align: "right", render: i => <span className="dx-num">{money(i.value)}</span> },
          { k: "o", label: "Owner", w: "1.2fr", render: i => <Person id={i.owner} /> },
          { k: "s", label: "Status", w: "1.5fr", render: i => statusCell(i) },
        ]} rows={DELIVERY_ISSUES} />
      </Card>

      <div className="dx-section">
        <div className="dx-section-head"><div className="dx-section-title">Patterns this month</div><Badge tone="bad">1 recurring</Badge></div>
        <Grid cols="minmax(0,5fr) minmax(0,7fr)" gap={14}>
          <Card title="Delivery issues by type" sub="Since 1 Sep · late and incomplete are the OTIF failures">
            <HBars fmt={n => String(n)} items={ISSUES_MONTH.map(([label, value]) => ({ label, value }))} />
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card tone="bad" title={<>Recurring: transport damage on <RecLink kind="route" id="N02" /> three times this month</>} sub={"All to Grange Contracts, all on " + route("N02").vehicle + ", all loaded at Naas before 06:30"} pad={false}>
              <div className="dx-list">
                {N02_DAMAGE.map((d, i) => (
                  <div key={d.ref} className="dx-li" style={{ borderTop: i ? undefined : 0, padding: "10px 20px", alignItems: "center" }}>
                    <span className="dx-num" style={{ width: 48, flex: "none", fontSize: 12.5, color: "var(--dim)" }}>{d.date}</span>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                      <div><span className="dx-num" style={{ fontWeight: 600 }}>{d.ref}</span> · <RecLink kind="sku" id={d.sku} /></div>
                      <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2 }}>{d.what}</div>
                    </div>
                    <div style={{ textAlign: "right", flex: "none" }}>
                      <div className="dx-num" style={{ fontSize: 13 }}>{money(d.value)}</div>
                      <div className="dx-num" style={{ fontSize: 11.5, color: "var(--faint)" }}>{d.credit}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "11px 20px 14px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}>
                {money(N02_DAMAGE.reduce((a, d) => a + d.value, 0))} in credits so far, plus a redelivery each time. Small money, but Grange has <RecLink kind="quote" id="QT-2862" /> ({eur(9650)}) waiting on a price.
              </div>
            </Card>
            <AiCard agent="Dispatch Agent" title="Same vehicle, same bay, same customer"
              actions={<>
                <ActBtn id="n02-strap" kind="primary" small label="Add the strap check to N02" done="Strap check added"
                  toast="Load-restraint check added to the N02 pre-departure list. Mixed pallets for Grange stretch-wrapped at Naas dock 2. Aoife notified." />
                <Btn small kind="quiet" onClick={() => dx.go("Customers", "detail", { cust: "grange" })}>Grange Contracts</Btn>
              </>}>
              All three were top-tier cartons on mixed pallets in the rear bay of {route("N02").vehicle}, where the load-restraint bar is missing a strap.
              {" "}Add a strap check to N02's pre-departure list and stretch-wrap mixed pallets for Grange before they're loaded. Sarah should mention it when she calls about <RecLink kind="quote" id="QT-2862" />.
            </AiCard>
          </div>
        </Grid>
      </div>

      <Card style={{ marginTop: 26 }} title="Credits and replacements created by delivery problems" sub="Returns linked to a delivery issue, a POD exception or a picking error" pad={false}
        right={<Btn small kind="quiet" onClick={() => dx.go("Customers", "overview")}>Customers</Btn>}>
        <Table dense onRow={r => (hasOrder(r.so) ? dx.go("Orders", "detail", { order: r.so }) : dx.go("Customers", "detail", { cust: r.cust }))} cols={[
          { k: "id", label: "Return", w: "0.9fr", render: r => <div><div className="dx-num" style={{ fontWeight: 600 }}>{r.id}</div><div style={{ fontSize: 11.5, color: "var(--faint)" }}>{r.when}</div></div> },
          { k: "c", label: "Customer", w: "1.5fr", render: r => <span style={wrap}><RecLink kind="cust" id={r.cust} plain>{customer(r.cust).name}</RecLink></span> },
          { k: "so", label: "Order", w: "0.9fr", render: r => <SoLink id={r.so} /> },
          { k: "sku", label: "Product", w: "1.1fr", render: r => <span><RecLink kind="sku" id={r.sku} /> <span className="dx-num dx-muted">×{r.qty}</span></span> },
          { k: "reason", label: "Reason", w: "1fr", render: r => <span style={wrap}>{r.reason}</span> },
          { k: "value", label: "Value", w: "0.8fr", align: "right", render: r => <span className="dx-num">{money(r.value)}</span> },
          { k: "rep", label: "Replacement", w: "1.1fr", render: r => <span style={wrap}><Linked text={r.replacement} /></span> },
          { k: "credit", label: "Credit", w: "1.2fr", render: r => <span style={wrap}>{r.credit}</span> },
          { k: "link", label: "Came from", w: "1.5fr", render: r => <span className="dx-muted" style={wrap}>{ISSUE_LINK[r.id]}</span> },
        ]} rows={related} />
      </Card>
    </Page>
  );
}

/* =====================================================================================
   PROOF OF DELIVERY
   ===================================================================================== */
const INVOICE_ON_POD: Record<string, { text: string; tone?: Tone }> = {
  "SO-10494": { text: "Held · refused carton, photo under review", tone: "warn" },
  "SO-10486": { text: "Invoiced on POD" },
  "SO-10505": { text: "Invoiced on POD" },
  "SO-10489": { text: "Invoiced on POD" },
  "SO-10518": { text: "Invoiced on POD" },
  "SO-10484": { text: "Invoiced less 4 × IC-5120 (RT-1188)", tone: "warn" },
  "SO-10470": { text: "Invoiced · signature only, no photo", tone: "warn" },
  "SO-10471": { text: "Invoiced · credit CN-4471 €34.50", tone: "warn" },
  "SO-10476": { text: "Invoiced on POD" },
};
function Pod() {
  const dx = useDx();
  const exceptions = ALL_PODS.filter(p => p.exceptions !== "None");
  const noPhoto = ALL_PODS.filter(p => !p.photo).length;
  const clean = KPI.delivered - exceptions.length;
  return (
    <Page eyebrow={"Delivery · Proof of Delivery · " + TODAY.time} title="Proof of delivery"
      sub="Signature, photo and GPS for every drop, straight from the drivers' handsets. A clean POD releases the invoice; an exception holds that line for a credit or a replacement."
      right={<Btn kind="ghost" onClick={() => dx.go("Finance", "debtors")}>Debtors</Btn>}>
      <KpiRow n={5}>
        <Kpi label="PODs today" value={String(KPI.delivered)} sub={"Every one of today's " + KPI.delivered + " deliveries"} subTone="ok" />
        <Kpi label="With photo" value={String(KPI.delivered - noPhoto)} sub={noPhoto + " signature only"} subTone={noPhoto ? "warn" : undefined} />
        <Kpi label="GPS on site" value={String(KPI.delivered)} sub="Inside the customer's geofence" />
        <Kpi label="Exceptions" value={String(exceptions.length)} tone="warn" sub="Refused, damaged or no photo" />
        <Kpi label="Invoices released on POD" value={String(clean)} sub={exceptions.length + " held or adjusted for review"} onClick={() => dx.go("Finance", "overview")} />
      </KpiRow>

      <Card title="Latest PODs" sub={ALL_PODS.length + " of " + KPI.delivered + " today, newest first · exceptions highlighted"} pad={false}>
        <Table onRow={p => (hasOrder(p.so) ? dx.go("Orders", "detail", { order: p.so }) : dx.go("Customers", "detail", { cust: p.cust }))}
          rowTone={p => (p.exceptions !== "None" ? "warn" : undefined)} cols={[
          { k: "time", label: "Time", w: "0.7fr", mono: true },
          { k: "so", label: "Order", w: "0.9fr", render: p => <SoLink id={p.so} /> },
          { k: "c", label: "Customer", w: "1.5fr", render: p => <RecLink kind="cust" id={p.cust} plain>{customer(p.cust).name}</RecLink> },
          { k: "route", label: "Route", w: "0.55fr", render: p => <RouteLink id={p.route} /> },
          { k: "signed", label: "Signed by", w: "1.2fr", render: p => <span style={wrap}>{p.signed}</span> },
          { k: "photo", label: "Photo", w: "0.55fr", align: "center", render: p => <span style={{ color: p.photo ? "var(--ok)" : "var(--bad)" }}><Icon d={p.photo ? IC.check : IC.x} s={14} w={2.2} /></span> },
          { k: "gps", label: "GPS", w: "0.5fr", align: "center", render: p => <span style={{ color: p.gps ? "var(--ok)" : "var(--bad)" }}><Icon d={p.gps ? IC.check : IC.x} s={14} w={2.2} /></span> },
          { k: "ex", label: "Exception", w: "1.5fr", render: p => p.exceptions === "None" ? <span className="dx-faint">None</span>
            : <span style={{ ...wrap, fontWeight: 500, color: p.photo ? "var(--warn)" : "var(--bad)" }}>{p.exceptions}</span> },
          { k: "inv", label: "Invoice", w: "1.9fr", render: p => { const v = INVOICE_ON_POD[p.so] || { text: "Invoiced on POD" }; return <span style={{ color: v.tone ? `var(--${v.tone})` : "var(--ok)", ...wrap }}><Linked text={v.text} /></span>; } },
        ]} rows={ALL_PODS} />
      </Card>

      <Card style={{ marginTop: 14 }} title={<>From POD to credit: <SoLink id="SO-10471" />, Grange Contracts on N02</>} sub="What happened after the driver photographed a crushed box at 07:31">
        <Chain dir="across" steps={[
          { k: "POD · 07:31", v: "Signed T. Grange", sub: "Photo shows 1 box of IC-1044 crushed. GPS on site.", tone: "ok", icon: IC.check },
          { k: "Delivery issue", v: "DI-768 · transport damage", sub: "Aoife Brennan. Third on N02 this month.", tone: "warn", icon: IC.alert },
          { k: "Return", v: "RT-1186 · 1 × IC-1044", sub: "Written off, not returned to stock", tone: "ok", icon: IC.check, onClick: () => dx.open("sku", "IC-1044") },
          { k: "Credit note", v: "CN-4471 · €34.50", sub: "Raised against the invoice line, not the whole invoice", tone: "ok", icon: IC.check },
          { k: "Replacement", v: "On N02 tomorrow", sub: "The rest of the invoice released to Sage on the POD", tone: "accent", icon: IC.truck, onClick: () => dx.open("route", "N02") },
        ]} />
      </Card>

      <Grid cols="repeat(2,minmax(0,1fr))" gap={14} style={{ marginTop: 14 }}>
        <AiCard agent="Credit Agent" title="The POD settles the McGrath dispute"
          actions={<>
            <ActBtn id="pod-mcgrath" kind="primary" small label="Send the POD pack to Rachel" done="POD pack sent to Rachel"
              toast="POD pack for SO-10452 (signature, 3 photos, GPS 10:52) sent to Rachel Hayes for the McGrath call on INV-28410." />
            <Btn small kind="quiet" onClick={() => dx.go("Finance", "debtors")}>Debtors</Btn>
          </>}>
          McGrath Civil is holding <b>INV-28410</b> ({eur(8940)}, 91 days) over the 22 Sep delivery on K01 (DI-762). The POD shows it was delivered: signed at the site gate, 3 photos, GPS inside the site at 10:52.
          {" "}What they're disputing is the missed 08:00 crane slot, not receipt. Agree a credit for the stand-down on DI-762 and ask for INV-28410 in the same call.
        </AiCard>
        <AiCard agent="Dispatch Agent" title="One POD this morning has no photo"
          actions={<ActBtn id="pod-photo" small label="Make photos mandatory on N02 and N04" done="Photo now mandatory"
            toast="Driver app updated: a photo is required before a POD can be closed on the Naas routes. Aoife notified." />}>
          <SoLink id="SO-10470" /> to Kildare Build Centre on <RecLink kind="route" id="N02" /> at 07:48 was signed by M. Dempsey but has no photo. If Kildare queries a shortage, a signature alone is weak evidence.
          {" "}Compare the carton refused at Leinster's Site 03 (<SoLink id="SO-10484" />): the photo shows sealant from batch 2231, which is what backs RT-1188 and Hansen claim HC-212.
        </AiCard>
      </Grid>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = {
  today: Today, routes: Routes, vehicles: Vehicles, otif: Otif, issues: Issues, pod: Pod,
};
