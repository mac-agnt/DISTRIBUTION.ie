import type { ComponentType, ReactNode } from "react";
import {
  DISPATCH, GOODS_IN_TODAY, ORDERS, PACKING, PICK_DELAYS, PICKS, PO8821_DEPS, POS, PRODUCTS, ROUTES, SKU_DEMAND, TODAY,
  WAREHOUSES, WAREHOUSE_TODAY, WH_EXCEPTIONS, customer, eur, num, order, po, route, supplier, who,
  type Dispatch, type Exception, type Pick as PickRow, type PO,
} from "../db";
import {
  ActBtn, AiCard, Badge, Btn, Card, Chain, Facts, Grid, HBars, IC, Kpi, KpiRow, Meter, Note, Page, Person, RecLink, Seg, Strip, Table,
  riskTone, useDx, useLocal, type Tone,
} from "../ui";

/* Warehouse: the Dublin control board, the pick and pack queues, goods in, dispatch and exceptions.
   Every figure reads from db.ts. The operational detail the db doesn't hold (docks, pick waves, staffing
   windows) is defined here and reconciles with WAREHOUSE_TODAY: 94 orders, 1,284 lines. Now is 25 Sep 09:16. */

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
/* Turns record ids inside operational text into links. */
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

/* ---------- shared helpers ---------- */
const first = (id: string) => who(id).name.split(" ")[0];
const prioTone = (p: string): Tone => (p === "URGENT" ? "bad" : p === "HIGH" ? "warn" : "neutral");
const routeTag = (so: string) => { const o = order(so); return o.route === "D07" && o.status !== "Delivered" ? "D07 PM" : o.route; };
/* PICKS has SO-10540 on Adam, PICK_DELAYS has it on Seán. Seán finishes SO-10502 at 10:20 and takes wave 3, so Seán it is. */
const pickerOf = (p: PickRow, moved: boolean) => (p.so === "SO-10540" ? "sean" : moved && p.so === "SO-10499" ? "grainne" : p.picker);
const isNaas = (p: PickRow) => p.loc.startsWith("Naas");
const wrap = { whiteSpace: "normal" as const, lineHeight: 1.45 };
const clip = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const };

/* ---------- local operational data (reconciles with WAREHOUSE_TODAY.DUB) ---------- */
const RATE = 19; // lines per picker-hour, 7-day average, mixed case and each picks
/* Five waves: 94 orders, 1,284 lines. Completed 48 · picking 26 · waiting 14 · not yet released 6. */
const WAVES = [
  { w: "Wave 1", rel: "05:45", routes: "D16 · D18 · D09 · D07 AM", orders: 30, lines: 402, picked: 402, done: 30, picking: 0, waiting: 0, status: "Complete" },
  { w: "Wave 2", rel: "07:15", routes: "D11 · D04 · W01", orders: 22, lines: 298, picked: 196, done: 18, picking: 4, waiting: 0, status: "4 orders to finish" },
  { w: "Wave 3", rel: "08:30", routes: "D07 PM · D04 top-up", orders: 20, lines: 262, picked: 30, done: 0, picking: 14, waiting: 6, status: "Forecast 40 min behind" },
  { w: "Wave 4", rel: "09:00", routes: "D14 · tomorrow's D16", orders: 16, lines: 226, picked: 12, done: 0, picking: 8, waiting: 8, status: "SO-10482 pulled forward" },
  { w: "Wave 5", rel: "13:30", routes: "Tomorrow's AM routes", orders: 6, lines: 96, picked: 0, done: 0, picking: 0, waiting: 0, status: "Not released" },
];
const PICKED = WAVES.reduce((a, w) => a + w.picked, 0); // 640
const TO_GO = WAREHOUSE_TODAY.DUB.lines - PICKED; // 644: 548 before the 13:30 cutoff, 96 after
function windows(held: boolean) {
  return [
    { w: "09:15 to 10:45", due: 226, pick: 8, hrs: 1.5, note: "Wave 2 tail and wave 3" },
    { w: "10:45 to 12:15", due: 196, pick: held ? 8 : 6, hrs: 1.5, note: held ? "PO-8830 unload moved to 12:15" : "2 pulled to goods-in (PO-8830)" },
    { w: "12:15 to 13:30", due: 126, pick: held ? 6 : 8, hrs: 1.25, note: held ? "2 on PO-8830 until 13:15" : "D14 and tomorrow's D16" },
  ].map(x => ({ ...x, cap: Math.round(x.pick * RATE * x.hrs) }));
}

/* Docks and receiving state for today's seven deliveries. */
const GI: Record<string, { dock: string; state: "Received" | "On the way" | "Booked"; note: string }> = {
  "PO-8826": { dock: "Naas dock 3", state: "Received", note: "760 of 800 nitrile gloves (SAF-3310). 40 boxes short, claim drafted." },
  "PO-8837": { dock: "Dock 7", state: "On the way", note: "Balance of the order. The first drop yesterday 16:10 had 2 cartons crushed." },
  "PO-8830": { dock: "Dock 8", state: "Booked", note: "500 × FIX-2201 and 300 × FIX-2240. No customer orders waiting on it." },
  "PO-8841": { dock: "Naas dock 3", state: "Booked", note: "Stretch wrap (PK-1130) and cartons for both sites." },
  "PO-8834": { dock: "Dock 7", state: "Booked", note: "Includes 150 × EL-2210 Twin & Earth." },
  "PO-8839": { dock: "Dock 8", state: "Booked", note: "Cutting discs and abrasives." },
  "PO-8843": { dock: "Dock 7", state: "Booked", note: "Irish Fastener weekly run: threaded rod and anchors." },
};
const giTone = (s: string): Tone => (s === "Received" ? "ok" : s === "On the way" ? "accent" : "neutral");
const etaOf = (p: PO) => (p.eta || p.expected).replace("Today ", "").replace(" · arrived", "");

/* Where each order waiting on PO-8821 goes once the stock lands. */
const RELEASE: Record<string, string> = {
  "SO-10482": "D14 · 26 Sep 13:45 (balance of 3 lines)",
  "SO-10497": "D14 · 26 Sep 13:45",
  "SO-10509": "D04 · 26 Sep 11:30",
  "SO-10515": "D16 · 29 Sep",
  "SO-10488": "Cross-dock to Naas · N02 29 Sep",
  "SO-10520": "Cross-dock to Naas · N04 29 Sep",
};
const shortLines = (so: string) =>
  Object.entries(SKU_DEMAND).flatMap(([sku, rows]) => rows.filter(r => r.so === so && r.status === "Short").map(r => ({ sku, qty: r.qty })));

/* Dispatch detail the db doesn't hold: pick cutoff, dock, what the load is waiting on. */
const DX: Record<string, { cutoff: string; dock: string; waiting: string }> = {
  D04: { cutoff: "11:00", dock: "Dock 2", waiting: "Nothing. Loaded and checked." },
  D07: { cutoff: "11:45", dock: "Dock 3", waiting: "4 of 11 orders still to stage, including SO-10491 (pick done 10:05)." },
  D11: { cutoff: "10:00", dock: "Dock 6", waiting: "Load plan 7,840kg on a 7.5t rigid. Move SO-10528 to D09." },
  D14: { cutoff: "13:30", dock: "Dock 4", waiting: "SO-10482 (15 of 18 lines), SO-10502 and SO-10529." },
  W01: { cutoff: "11:30", dock: "Dock 5", waiting: "SO-10536, pick finishing 10:55." },
  N04: { cutoff: "10:30", dock: "Naas dock 1", waiting: "SO-10520 goes part: 1 line waits on PO-8821." },
};
function dispatchView(d: Dispatch, acted: Record<string, string>) {
  if (d.route === "D11" && acted["d11-move"]) return { status: "Ready", note: "Cleared at 7,460kg. SO-10528 now on D09's second run.", waiting: "Nothing. Cleared to depart." };
  if (d.route === "D14" && acted["d14-plan"]) return { status: d.status, note: "Load plan confirmed: 11 stops. SO-10482 loads 15 lines by 13:30.", waiting: DX.D14.waiting };
  return { status: d.status as string, note: d.note, waiting: DX[d.route]?.waiting || "" };
}

/* Two exceptions the db table doesn't carry yet: the reach-truck delay and the stock sitting in the wrong warehouse. */
const EX_EXTRA: Exception[] = [
  { id: "EX-3311", kind: "Pick delay", ref: "SO-10536 · D-30-07", detail: "Reach truck on charge, pallet above level 2. Pick now finishing 10:55 against W01's 11:30 cutoff.", owner: "liam", raised: "09:05", sev: "MEDIUM" },
  { id: "EX-3306", kind: "Stock in the other warehouse", ref: "SO-10526 · EL-4408", detail: "Liffey's order is allocated to Dublin, where the 12 free are held as counter safety stock. Naas has 64 free. TR-2291 recommended.", owner: "liam", raised: "08:40", sev: "HIGH" },
];
const EX_STATE: Record<string, string> = {
  "EX-3312": "Recount 10:30", "EX-3311": "Reach truck back 09:40", "EX-3310": "Claim drafted", "EX-3309": "Resolved · squeezed into wave 2",
  "EX-3307": "With Orla, due 09:45", "EX-3306": "Awaiting Liam", "EX-3305": "Credit requested", "EX-3302": "Replacement on N04 today",
};
const EX_MONTH: [string, number][] = [
  ["Stock discrepancy", 14], ["Short delivery from supplier", 11], ["Route cutoff missed", 9], ["Damaged on receipt", 7], ["Wrong item picked", 6], ["Over weight", 3],
];

/* =====================================================================================
   CONTROL BOARD
   ===================================================================================== */
function Board() {
  const dx = useDx();
  const D = WAREHOUSE_TODAY.DUB;
  const held = !!dx.acted["wh-8830-slot"];
  const moved = !!dx.acted["pick-10499"];
  const win = windows(held);
  const crunch = win[1];
  const queue = PICKS.filter(p => !isNaas(p) && p.progress < 100)
    .sort((a, b) => (a.so === "SO-10482" ? -1 : b.so === "SO-10482" ? 1 : mins(a.cutoff) - mins(b.cutoff)));
  return (
    <Page
      eyebrow={"Warehouse · " + TODAY.long + " · " + TODAY.time}
      title="Dublin Distribution Centre"
      sub={<>Today's workload. {who(WAREHOUSES.DUB.manager).name} on shift, {WAREHOUSES.DUB.docks} docks, {WAREHOUSES.DUB.pickers} pickers rostered. Naas runs alongside at the bottom.</>}
      right={<>
        <Btn kind="ghost" icon={IC.chat} onClick={() => dx.ask("Which orders are at risk of going late today?")}>Ask Ops Watchdog</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Delivery", "today")}>Delivery today</Btn>
      </>}>
      <KpiRow n={6}>
        <Kpi label="Orders to pick" value={String(D.toPick)} sub={"Dublin today · " + WAREHOUSE_TODAY.NAS.toPick + " more in Naas"} onClick={() => dx.go("Warehouse", "picking")} />
        <Kpi label="Lines" value={num(D.lines)} sub={num(PICKED) + " picked · " + num(TO_GO) + " to go"} />
        <Kpi label="Completed" value={String(D.completed)} sub={Math.round((D.completed / D.toPick) * 100) + "% of today's orders"} subTone="ok" />
        <Kpi label="Picking" value={String(D.picking)} sub="8 pickers on the floor" onClick={() => dx.go("Warehouse", "picking")} />
        <Kpi label="Waiting" value={String(D.waiting)} sub="Released, not started" subTone="warn" />
        <Kpi label="Urgent" value={String(D.urgent)} tone="bad" sub="Pulled ahead of their wave" onClick={() => dx.go("Warehouse", "picking")} />
      </KpiRow>

      <Grid cols="minmax(0,6fr) minmax(0,6fr)" gap={14}>
        <AiCard agent="Ops Watchdog · 09:16" title={held ? "Fixed: eight stay on pick through the crunch" : "Fix first: keep two pickers on pick until 12:15"}
          actions={<>
            <ActBtn id="wh-8830-slot" kind="primary" small label="Move PO-8830 unload to 12:15" done="PO-8830 unloads at 12:15"
              toast="EuroFix's haulier told to drop PO-8830 at dock 8 and unload from 12:15. Seán stays on pick; wave 3 back to 11:10." />
            <Btn small onClick={() => dx.go("Warehouse", "goodsin")}>Goods in</Btn>
            <Btn small kind="quiet" onClick={() => dx.go("Warehouse", "picking")}>Pick queue</Btn>
          </>}>
          {held ? (
            <>PO-8830 now unloads from 12:15 at dock 8, after the <RecLink kind="route" id="D07" /> PM run has gone. Eight pickers stay on the floor from 10:45 to 12:15:
              {" "}{crunch.cap} lines of capacity against {crunch.due} due, and wave 3 (<RecLink kind="order" id="SO-10540" />) is back to 11:10.</>
          ) : (
            <>From 10:45 two pickers go to goods-in for <RecLink kind="po" id="PO-8830" /> (EuroFix, 48 pallets). That leaves 6 on pick against {crunch.due} lines due before 12:15:
              {" "}<b style={{ color: "var(--bad)" }}>{crunch.due - crunch.cap} lines short</b>. It pushes wave 3 (<RecLink kind="order" id="SO-10540" />) from 11:10 to 11:50, past its 11:45 cutoff,
              {" "}and leaves <RecLink kind="route" id="W01" /> and the <RecLink kind="route" id="D07" /> PM run loading late.
              {" "}PO-8830 has no customer orders waiting on it and <RecLink kind="sku" id="FIX-2201" /> has 520 free in Dublin. Unload it from 12:15, once D07 has gone.</>
          )}
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 10 }}>
            {dx.acted["d11-move"]
              ? <>Also done: <RecLink kind="route" id="D11" /> cleared at 7,460kg with <RecLink kind="order" id="SO-10528" /> on D09. </>
              : <>Already in hand: <RecLink kind="route" id="D11" /> weight with Orla Quinn (move <RecLink kind="order" id="SO-10528" /> to D09). </>}
            Bin N-07-04 recount with Aoife Brennan at 10:30.{moved ? " SO-10499 moved to Gráinne." : ""}
          </div>
        </AiCard>
        <StaffingCard held={held} />
      </Grid>

      <Grid cols="minmax(0,6fr) minmax(0,6fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Pick now" sub="Closest to their dispatch cutoff" right={<Badge tone="bad">{queue.length} open</Badge>} pad={false}>
          <div className="dx-list">
            {queue.map((p, i) => {
              const o = order(p.so);
              const picked = Math.round((p.lines * p.progress) / 100);
              const tight = mins(p.cutoff) - NOW < 150;
              return (
                <div key={p.so} className="dx-li dx-click" onClick={() => dx.go("Orders", "detail", { order: p.so })}
                  style={{ borderTop: i ? undefined : 0, flexDirection: "column", gap: 6, alignItems: "stretch" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <RecLink kind="order" id={p.so} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500, ...clip }}>{customer(o.cust).name}</span>
                    <Badge tone={riskTone(o.risk)}>{o.risk}</Badge>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", ...clip }}>
                    {o.lines} lines{o.short ? " · " + (o.lines - o.short) + " available" : ""} · <RouteLink id={o.route} label={routeTag(p.so)} /> · {first(pickerOf(p, moved))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 40 }}><Meter value={p.progress} tone={p.issue ? "warn" : "accent"} /></div>
                    <span className="dx-num" style={{ fontSize: 12, color: "var(--dim)", whiteSpace: "nowrap" }}>{picked}/{p.lines}</span>
                    <span className="dx-num" style={{ fontSize: 12, whiteSpace: "nowrap", color: tight ? "var(--warn)" : "var(--body)" }}>Cutoff {p.cutoff} · {until(p.cutoff)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Dispatch" sub="Vehicles due out today" right={<Btn small kind="quiet" onClick={() => dx.go("Warehouse", "dispatch")}>Board</Btn>} pad={false}>
          <div className="dx-list">
            {DISPATCH.map((d, i) => {
              const v = dispatchView(d, dx.acted);
              return (
                <div key={d.route} className="dx-li dx-click" onClick={() => dx.open("route", d.route)} style={{ borderTop: i ? undefined : 0, flexDirection: "column", gap: 6, alignItems: "stretch" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}><RouteLink id={d.route} label={d.route === "D07" ? "D07 PM" : d.route} /></span>
                    <Badge tone={riskTone(v.status)}>{v.status}</Badge>
                    <span style={{ flex: 1 }} />
                    <span className="dx-num" style={{ fontSize: 12.5, color: "var(--dim)" }}>{WAREHOUSES[d.wh].short} · {d.depart}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.45 }}><Linked text={v.note} /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}><Meter value={d.loaded} tone={v.status === "Held" ? "bad" : d.loaded === 100 ? "ok" : "accent"} /></div>
                    <span className="dx-num" style={{ fontSize: 12, color: "var(--dim)" }}>{d.loaded}% loaded</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </Grid>

      <Grid cols="minmax(0,5fr) minmax(0,7fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Goods in" sub={GOODS_IN_TODAY.length + " deliveries · " + GOODS_IN_TODAY.reduce((a, id) => a + (po(id).pallets || 0), 0) + " pallets · " + eur(GOODS_IN_TODAY.reduce((a, id) => a + po(id).value, 0)) + " of stock"}
          right={<Btn small kind="quiet" onClick={() => dx.go("Warehouse", "goodsin")}>Goods in</Btn>} pad={false}>
          <div className="dx-list">
            {GOODS_IN_TODAY.map((id, i) => {
              const p = po(id), g = GI[id];
              const late = id === "PO-8830" && held;
              return (
                <div key={id} className="dx-li dx-click" onClick={() => dx.open("po", id)} style={{ borderTop: i ? undefined : 0, padding: "10px 20px", alignItems: "center" }}>
                  <span className="dx-num" style={{ width: 40, flex: "none", fontSize: 12.5, color: "var(--dim)" }}>{late ? "12:15" : etaOf(p)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, ...clip }}><RecLink kind="po" id={id} /> <span style={{ color: "var(--body)" }}>{supplier(p.supplier).name}</span></div>
                    <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 2 }}>{p.pallets} pallets · {g.dock}{id === "PO-8826" ? " · 40 short" : ""}</div>
                  </div>
                  <Badge tone={giTone(g.state)}>{late ? "Unload 12:15" : g.state}</Badge>
                </div>
              );
            })}
            <div className="dx-li dx-click" onClick={() => dx.go("Warehouse", "goodsin")} style={{ background: "var(--bad-soft)", padding: "10px 20px", alignItems: "center" }}>
              <span className="dx-num" style={{ width: 40, flex: "none", fontSize: 12.5, color: "var(--bad)" }}>26 Sep</span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                <RecLink kind="po" id="PO-8821" /> <span style={{ color: "var(--ink)" }}>Atlas, {dx.acted["d-expedite"] ? "06:30 expedited" : "10:30"}</span>
                <div style={{ fontSize: 12, color: "var(--bad)", marginTop: 2 }}>Not on today's list. 6 customer orders waiting.</div>
              </div>
              <Badge tone="bad">CRITICAL</Badge>
            </div>
          </div>
        </Card>
        <Card title="Picking delayed" sub="Picks that will finish after their target" right={<Badge tone="warn">{PICK_DELAYS.length}</Badge>} pad={false}>
          <Table dense onRow={r => dx.go("Orders", "detail", { order: r.so })} cols={[
            { k: "picker", label: "Picker", w: "1.25fr", render: r => <Person id={r.picker} /> },
            { k: "so", label: "Order", w: "1.05fr", render: r => <SoLink id={r.so} /> },
            { k: "loc", label: "Location", w: "0.85fr", mono: true },
            { k: "exp", label: "Expected", w: "1.2fr", render: r => held && r.so === "SO-10540"
              ? <span style={{ color: "var(--ok)", ...wrap }} className="dx-num">11:10, back on plan</span>
              : <span className="dx-num" style={{ color: "var(--warn)" }}>{r.expected}</span> },
            { k: "issue", label: "Issue", w: "2.2fr", render: r => <span style={wrap}>{r.issue}</span> },
          ]} rows={PICK_DELAYS} />
        </Card>
      </Grid>
      <div style={{ marginTop: 14 }}><NaasPanel /></div>
    </Page>
  );
}

function StaffingCard({ held }: { held: boolean }) {
  const D = WAREHOUSE_TODAY.DUB;
  const win = windows(held);
  const notReleased = D.toPick - D.completed - D.picking - D.waiting;
  return (
    <Card title="Staffing pressure" sub={"12 of " + WAREHOUSES.DUB.pickers + " pickers in, 2 on annual leave. 8 picking, 2 loading, 1 on replenishment, 1 on the trade counter. " + RATE + " lines per picker-hour."} pad={false}>
      <div style={{ padding: "0 20px 14px" }}>
        <Strip fmt={n => String(n)} parts={[
          { label: "Completed", value: D.completed, tone: "ok" },
          { label: "Picking", value: D.picking, tone: "accent" },
          { label: "Waiting", value: D.waiting, tone: "warn" },
          { label: "Not released", value: notReleased, tone: "neutral" },
        ]} />
      </div>
      <Table dense rowTone={r => (r.cap < r.due ? "bad" : undefined)} cols={[
        { k: "w", label: "Window", w: "1.9fr", render: r => (
          <div style={{ minWidth: 0 }}>
            <div className="dx-num">{r.w}</div>
            <div style={{ fontSize: 11.5, color: r.cap < r.due ? "var(--bad)" : "var(--faint)", ...clip }}>{r.note}</div>
          </div>) },
        { k: "due", label: "Lines due", align: "right", mono: true, w: "0.85fr" },
        { k: "pick", label: "Pickers", align: "right", mono: true, w: "0.75fr" },
        { k: "cap", label: "Can do", align: "right", mono: true, w: "0.75fr" },
        { k: "gap", label: "Gap", align: "right", w: "0.65fr", render: r => (
          <b className="dx-num" style={{ color: r.cap - r.due < 0 ? "var(--bad)" : "var(--ok)", fontWeight: 600 }}>{(r.cap - r.due < 0 ? "−" : "+") + Math.abs(r.cap - r.due)}</b>) },
      ]} rows={win} />
      <div style={{ padding: "11px 20px 14px", fontSize: 12.5, color: "var(--dim)", borderTop: "1px solid var(--border)" }}>
        {num(TO_GO)} lines to go: {num(win.reduce((a, w) => a + w.due, 0))} before the 13:30 cutoff, {num(TO_GO - win.reduce((a, w) => a + w.due, 0))} after it for tomorrow's AM routes.
      </div>
    </Card>
  );
}

function NaasPanel() {
  const dx = useDx();
  const N = WAREHOUSE_TODAY.NAS;
  const approved = !!dx.acted["d-transfer"];
  return (
    <Card title="Naas Distribution Centre" sub={who(WAREHOUSES.NAS.manager).name + " · " + WAREHOUSES.NAS.pickers + " pickers · " + WAREHOUSES.NAS.docks + " docks"}
      right={<Btn small kind="quiet" onClick={() => dx.go("Warehouse", "exceptions")}>Exceptions</Btn>}>
      <Facts cols={8} items={[
        ["To pick", String(N.toPick)], ["Lines", num(N.lines)], ["Completed", String(N.completed), "ok"], ["Picking", String(N.picking)],
        ["Waiting", String(N.waiting), "warn"], ["Urgent", String(N.urgent), "bad"], ["Packing", String(N.packing)], ["Dispatched", String(N.dispatched)],
      ]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "10px 22px", marginTop: 14, fontSize: 13, lineHeight: 1.5 }}>
        <div><Badge tone="bad">EX-3312</Badge> <span style={{ color: "var(--body)" }}>Bin N-07-04 shows 60, 24 found. <RecLink kind="order" id="SO-10474" /> (McGrath) is 12 boxes of <RecLink kind="sku" id="FIX-2201" /> short. Recount 10:30.</span></div>
        <div><Badge tone="warn">N04</Badge> <span style={{ color: "var(--body)" }}>Loading at Naas dock 1, 58%. Departs 11:00 with <RecLink kind="order" id="SO-10478" />, <RecLink kind="order" id="SO-10511" /> and <RecLink kind="order" id="SO-10520" /> (part).</span></div>
        <div><Badge tone={approved ? "ok" : "accent"}>TR-2291</Badge> <span style={{ color: "var(--body)" }}>40 × <RecLink kind="sku" id="EL-4408" /> to Dublin on the 11:00 van. {approved ? "Approved, picking now." : "Waiting on Liam's approval by 10:30."}</span></div>
        <div><Badge tone="ok">PO-8826</Badge> <span style={{ color: "var(--body)" }}>SafePro received 08:40, 40 boxes of gloves short. <RecLink kind="po" id="PO-8841" /> Midland Packaging due 12:00, 39 pallets.</span></div>
      </div>
    </Card>
  );
}

/* =====================================================================================
   PICKING
   ===================================================================================== */
function Picking() {
  const dx = useDx();
  const [prio, setPrio] = useLocal("wh-pick-prio", "all");
  const [site, setSite] = useLocal("wh-pick-site", "all");
  const moved = !!dx.acted["pick-10499"];
  const held = !!dx.acted["wh-8830-slot"];
  const rank: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2 };
  const rows = PICKS.filter(p => (prio === "all" || p.prio === prio) && (site === "all" || (site === "NAS") === isNaas(p)))
    .sort((a, b) => rank[a.prio] - rank[b.prio] || mins(a.cutoff) - mins(b.cutoff));
  const open = PICKS.filter(p => p.progress < 100);
  const soon = open.filter(p => mins(p.cutoff) - NOW <= 180).length;
  const pickers = ["tomasz", "grainne", "sean", "adam", "piotr"];
  return (
    <Page eyebrow={"Warehouse · Picking · " + TODAY.time} title="Pick queue"
      sub="Every pick on the floor, who has it, and how long it has before its vehicle leaves. Priority is set by the dispatch cutoff, not the order date."
      right={<>
        <Seg value={site} onChange={setSite} items={[["all", "Both sites"], ["DUB", "Dublin"], ["NAS", "Naas"]]} />
        <Seg value={prio} onChange={setPrio} items={[["all", "All"], ["URGENT", "Urgent"], ["HIGH", "High"], ["NORMAL", "Normal"]]} />
      </>}>
      <KpiRow n={5}>
        <Kpi label="Picking now" value={String(WAREHOUSE_TODAY.DUB.picking)} sub={"Dublin · " + WAREHOUSE_TODAY.NAS.picking + " more in Naas"} />
        <Kpi label="Lines to go" value={num(TO_GO)} sub={"of " + num(WAREHOUSE_TODAY.DUB.lines) + " in Dublin today"} />
        <Kpi label="Pick rate" value={RATE + " / hr"} sub="Lines per picker-hour, 7-day average" />
        <Kpi label="Delayed picks" value={String(PICK_DELAYS.length)} tone="warn" sub={held ? "All back inside their cutoff" : "1 will miss its cutoff: SO-10540"} subTone={held ? "ok" : "bad"} />
        <Kpi label="Cutoffs inside 3 hours" value={String(soon)} sub={"Next: " + open.slice().sort((a, b) => mins(a.cutoff) - mins(b.cutoff))[0].cutoff + " (" + until(open.slice().sort((a, b) => mins(a.cutoff) - mins(b.cutoff))[0].cutoff) + ")"} subTone="warn" />
      </KpiRow>

      <Card title="On the floor" sub={rows.length + " picks · progress from the scanners, updated as each line is confirmed"} pad={false}>
        <Table onRow={r => dx.go("Orders", "detail", { order: r.so })}
          rowTone={r => (r.so === dx.rec.order ? "accent" : r.issue && r.progress < 100 ? "warn" : undefined)}
          cols={[
            { k: "prio", label: "Priority", w: "0.95fr", render: r => <Badge tone={prioTone(r.prio)}>{r.prio}</Badge> },
            { k: "so", label: "Order", w: "0.88fr", render: r => <RecLink kind="order" id={r.so} /> },
            { k: "c", label: "Customer", w: "1.7fr", render: r => (
              <div style={{ minWidth: 0 }}>
                <div style={clip}>{customer(order(r.so).cust).name}</div>
                {r.issue && <div style={{ fontSize: 11.5, marginTop: 2, color: held && r.so === "SO-10540" ? "var(--ok)" : "var(--warn)", ...clip }}>
                  {held && r.so === "SO-10540" ? "Back on plan: PO-8830 unload moved" : r.issue}</div>}
              </div>) },
            { k: "lines", label: "Lines", w: "0.72fr", align: "right", render: r => { const o = order(r.so); return <span className="dx-num">{r.lines}{o.short ? " of " + o.lines : ""}</span>; } },
            { k: "loc", label: "Pick location", w: "1.05fr", render: r => <span style={clip}>{r.loc}</span> },
            { k: "pk", label: "Assigned", w: "1.15fr", render: r => <Person id={pickerOf(r, moved)} /> },
            { k: "started", label: "Started", w: "0.62fr", mono: true },
            { k: "target", label: "Target", w: "0.62fr", mono: true },
            { k: "prog", label: "Progress", w: "1.1fr", render: r => (
              <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <Meter value={r.progress} w={46} tone={r.progress === 100 ? "ok" : r.issue ? "warn" : "accent"} />
                <span className="dx-num" style={{ fontSize: 12 }}>{r.progress}%</span>
              </span>) },
            { k: "cut", label: "Dispatch deadline", w: "1.2fr", render: r => (
              <div style={{ minWidth: 0 }}>
                <div className="dx-num" style={{ fontWeight: 600, color: r.progress === 100 ? "var(--dim)" : mins(r.cutoff) - NOW < 150 ? "var(--warn)" : "var(--ink)" }}>{r.cutoff}</div>
                <div className="dx-num" style={{ fontSize: 11.5, color: "var(--faint)", ...clip }}>{r.progress === 100 ? "picked" : until(r.cutoff)} · {routeTag(r.so)}</div>
              </div>) },
          ]} rows={rows} empty="No picks match this filter." />
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card title="Waves, Dublin" sub={"94 orders · " + num(WAREHOUSE_TODAY.DUB.lines) + " lines · " + num(PICKED) + " picked so far"} pad={false}>
          <Table dense cols={[
            { k: "w", label: "Wave", w: "0.7fr", render: r => <b style={{ fontWeight: 600 }}>{r.w}</b> },
            { k: "rel", label: "Released", w: "0.7fr", mono: true },
            { k: "routes", label: "Routes", w: "1.7fr", render: r => <span style={clip}><Linked text={r.routes} /></span> },
            { k: "orders", label: "Orders", w: "0.6fr", align: "right", mono: true },
            { k: "lines", label: "Lines", w: "0.6fr", align: "right", mono: true },
            { k: "p", label: "Picked", w: "1.3fr", render: r => (
              <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <Meter value={r.picked} max={r.lines} w={60} tone={r.picked === r.lines ? "ok" : r.w === "Wave 3" ? "warn" : "accent"} />
                <span className="dx-num" style={{ fontSize: 12 }}>{num(r.picked)}</span>
              </span>) },
            { k: "status", label: "Status", w: "1.6fr", render: r => (
              <span style={{ color: r.w === "Wave 3" && !held ? "var(--warn)" : r.status === "Complete" ? "var(--ok)" : "var(--dim)", ...clip }}>
                {r.w === "Wave 3" && held ? "Back on plan" : <Linked text={r.status} />}</span>) },
          ]} rows={WAVES} />
        </Card>
      </div>
      <Grid cols="minmax(0,6fr) minmax(0,6fr)" gap={14} style={{ marginTop: 14 }}>
          <AiCard agent="Ops Watchdog" title={moved ? "SO-10499 is now on Gráinne" : "SO-10499 can't make 11:50 on Tomasz"}
            actions={<ActBtn id="pick-10499" kind="primary" small label="Give SO-10499 to Gráinne" done="Reassigned to Gráinne"
              toast="SO-10499 reassigned to Gráinne Kavanagh after SO-10491. Scanner queue updated; Tomasz stays on SO-10482." />}>
            Tomasz is on <RecLink kind="order" id="SO-10482" /> until 12:40, and <RecLink kind="order" id="SO-10499" />'s 22 lines for Leinster sit behind it with an 11:50 target.
            {" "}Gráinne finishes <RecLink kind="order" id="SO-10491" /> at 10:05 and has nothing until <RecLink kind="order" id="SO-10529" /> needs starting around 12:10. Give SO-10499 to her and it's picked by about 11:15.
          </AiCard>
          <Card title="Picker queues" sub="What each picker has, in order" pad={false}>
            <div className="dx-list">
              {pickers.map((id, i) => {
                const mine = PICKS.filter(p => pickerOf(p, moved) === id && p.progress < 100)
                  .sort((a, b) => (b.started !== "—" ? 1 : 0) - (a.started !== "—" ? 1 : 0) || mins(a.target) - mins(b.target));
                const busyTo = Math.max(...mine.filter(p => p.started !== "—").map(p => mins(p.target)), 0);
                return (
                  <div key={id} className="dx-li" style={{ borderTop: i ? undefined : 0, alignItems: "center" }}>
                    <div style={{ width: 150, flex: "none" }}><Person id={id} /></div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {mine.map(p => {
                        const clash = p.started === "—" && mins(p.target) < busyTo;
                        return (
                          <span key={p.so} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "3px 8px", borderRadius: 8,
                            background: clash ? "var(--bad-soft)" : "var(--surface-2)", color: clash ? "var(--bad)" : "var(--body)" }}>
                            <SoLink id={p.so} />
                            <span className="dx-num">{p.started === "—" ? "queued · " + p.target : p.progress + "% · " + p.target}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
      </Grid>
    </Page>
  );
}

/* =====================================================================================
   PACKING
   ===================================================================================== */
type PackRow = { so: string; cust: string; cartons: number; pallets: number; weight: number; packer: string; status: string };
/* Picks due into packing that the db queue doesn't list yet. */
const PACK_EXTRA: PackRow[] = [
  { so: "SO-10514", cust: "greenfield", cartons: 0, pallets: 0, weight: 0, packer: "piotr", status: "Arriving from pick 09:45" },
  { so: "SO-10502", cust: "core", cartons: 0, pallets: 0, weight: 0, packer: "jade", status: "Arriving from pick 10:20" },
  { so: "SO-10536", cust: "harbourpoint", cartons: 0, pallets: 0, weight: 0, packer: "jade", status: "Arriving from pick 10:55" },
];
function Packing() {
  const dx = useDx();
  const D = WAREHOUSE_TODAY.DUB, N = WAREHOUSE_TODAY.NAS;
  const rows: PackRow[] = [...PACKING, ...PACK_EXTRA].sort((a, b) => {
    const ka = a.status.startsWith("Packed") ? -1 : mins(a.status), kb = b.status.startsWith("Packed") ? -1 : mins(b.status);
    return ka - kb;
  });
  const packed = rows.filter(r => r.status.startsWith("Packed"));
  const arriving = rows.filter(r => !r.status.startsWith("Packed"));
  const by11 = arriving.filter(r => mins(r.status) <= 11 * 60).length;
  const next = PICKS.filter(p => p.progress < 100).sort((a, b) => mins(a.target) - mins(b.target));
  const moved = !!dx.acted["d11-move"];
  return (
    <Page eyebrow={"Warehouse · Packing · " + TODAY.time} title="Pack queue"
      sub="What's packed and waiting for a vehicle, what's coming off the pick floor next, and the weights that feed the load plan.">
      <KpiRow n={5}>
        <Kpi label="In packing" value={String(D.packing)} sub={"Dublin · " + N.packing + " in Naas"} />
        <Kpi label="Packed, waiting to load" value={String(packed.length)} sub={num(packed.reduce((a, r) => a + r.weight, 0)) + "kg staged"} />
        <Kpi label="Arriving by 11:00" value={String(by11)} sub="From the pick floor" subTone="warn" />
        <Kpi label="Dispatched today" value={String(D.dispatched)} sub={"Dublin · " + N.dispatched + " from Naas"} subTone="ok" />
        <Kpi label="Packers on the bench" value="1" sub="Jade Moore, Dublin bench 1" subTone="warn" />
      </KpiRow>

      <Card title="Packing queue" sub={packed.length + " packed · " + arriving.length + " arriving from pick"} pad={false}>
        <Table onRow={r => dx.go("Orders", "detail", { order: r.so })} rowTone={r => (r.status.includes("held") || r.status.includes("move") ? "bad" : r.so === dx.rec.order ? "accent" : undefined)} cols={[
          { k: "so", label: "Order", w: "0.95fr", render: r => <SoLink id={r.so} /> },
          { k: "c", label: "Customer", w: "1.7fr", render: r => <span style={clip}>{customer(r.cust).name}</span> },
          { k: "route", label: "Route", w: "0.72fr", render: r => <RouteLink id={order(r.so).route} label={routeTag(r.so)} /> },
          { k: "site", label: "Site", w: "0.7fr", render: r => WAREHOUSES[order(r.so).wh].short },
          { k: "cartons", label: "Cartons", w: "0.75fr", align: "right", render: r => <span className="dx-num">{r.cartons || "—"}</span> },
          { k: "pallets", label: "Pallets", w: "0.7fr", align: "right", render: r => <span className="dx-num">{r.pallets || "—"}</span> },
          { k: "weight", label: "Weight", w: "0.8fr", align: "right", render: r => <span className="dx-num">{r.weight ? num(r.weight) + "kg" : "—"}</span> },
          { k: "packer", label: "Packer", w: "1.2fr", render: r => <Person id={r.packer} /> },
          { k: "status", label: "Status", w: "2.2fr", render: r => {
            const s = r.so === "SO-10528" && moved ? "Packed · moved to D09" : r.status;
            const tone = s.includes("held") || s.includes("move to") ? "var(--bad)" : s.startsWith("Packed") ? "var(--ok)" : "var(--dim)";
            return <span style={{ ...wrap, color: tone, fontWeight: 500 }}>{s}</span>;
          } },
        ]} rows={rows} />
      </Card>

      <Grid cols="minmax(0,6fr) minmax(0,6fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Next off the pick floor" sub="In target order, with the vehicle each one has to make" pad={false}>
          <div className="dx-list">
            {next.map((p, i) => {
              const o = order(p.so);
              const tight = mins(p.cutoff) - mins(p.target) < 60;
              return (
                <div key={p.so} className="dx-li dx-click" onClick={() => dx.go("Orders", "detail", { order: p.so })} style={{ borderTop: i ? undefined : 0, padding: "10px 20px", alignItems: "center" }}>
                  <span className="dx-num" style={{ width: 42, flex: "none", fontWeight: 600, fontSize: 13 }}>{p.target}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, ...clip }}><RecLink kind="order" id={p.so} /> <span style={{ color: "var(--body)" }}>{customer(o.cust).name}</span></div>
                    <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 2, ...clip }}>{p.lines} lines · {first(pickerOf(p, false))} · {p.loc}</div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div style={{ fontSize: 12.5 }}><RouteLink id={o.route} label={routeTag(p.so)} /></div>
                    <div className="dx-num" style={{ fontSize: 12, color: tight ? "var(--warn)" : "var(--faint)", marginTop: 2 }}>cutoff {p.cutoff}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent="Ops Watchdog" title="SO-10482 lands at packing with 50 minutes to spare"
            actions={<ActBtn id="pack-10482" kind="primary" small label="Put a second packer on at 12:30" done="Gráinne on bench 2 from 12:30"
              toast="Gráinne Kavanagh moves to packing bench 2 at 12:30 for SO-10482. Labels for 3 pallets printed; dock 4 staged." />}>
            <RecLink kind="order" id="SO-10482" /> comes off the pick floor at 12:40 with 15 lines, about 3 pallets. With one packer, packing and wrapping takes about 35 minutes,
            {" "}which leaves 15 minutes before <RecLink kind="route" id="D14" />'s 13:30 cutoff. Print the labels now, stage the pallets at dock 4 and put Gráinne on bench 2 once <RecLink kind="order" id="SO-10529" /> is done.
          </AiCard>
          <Card title="Weights feed the load plan" sub={"Route D11 · " + route("D11").vehicle + " · " + route("D11").type} tone={moved ? undefined : "bad"}>
            <Facts cols={3} items={[
              ["Planned load", moved ? "7,460kg" : "7,840kg", moved ? "ok" : "bad"],
              ["Plated weight", "7,500kg"],
              ["Over by", moved ? "Nothing" : "340kg", moved ? "ok" : "bad"],
            ]} />
            <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.55, marginTop: 12 }}>
              <RecLink kind="order" id="SO-10531" /> (Westbrook, 380kg) and <RecLink kind="order" id="SO-10528" /> (Clondalkin Plant Hire, 380kg) are both packed for D11.
              {" "}Moving SO-10528 to D09's second run brings D11 under its plated weight.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <ActBtn id="d11-move" kind="primary" small label="Move SO-10528 to D09" done="Moved to D09" toast="SO-10528 moved to D09. D11 now 7,460kg, cleared to depart." />
              <Btn small kind="quiet" onClick={() => dx.go("Warehouse", "dispatch")}>Dispatch board</Btn>
            </div>
          </Card>
          <Card title="Packers" pad={false}>
            <div className="dx-list">
              {[
                { id: "jade", where: "Dublin bench 1", text: "SO-10491 at 10:05, SO-10502 at 10:20, SO-10536 at 10:55, then SO-10482 at 12:40." },
                { id: "piotr", where: "Naas, picks and packs", text: "SO-10514 at 09:45. SO-10474 waits on the N-07-04 recount." },
              ].map((p, i) => (
                <div key={p.id} className="dx-li" style={{ borderTop: i ? undefined : 0 }}>
                  <div style={{ width: 150, flex: "none" }}><Person id={p.id} /></div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                    <div className="dx-faint" style={{ fontSize: 12 }}>{p.where}</div>
                    <div style={{ color: "var(--body)" }}><Linked text={p.text} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

/* =====================================================================================
   GOODS IN
   ===================================================================================== */
function GoodsIn() {
  const dx = useDx();
  const x = po("PO-8821");
  const expedited = !!dx.acted["d-expedite"];
  const transfer = !!dx.acted["d-transfer"];
  const booked = !!dx.acted["gi-dock-8821"];
  const held = !!dx.acted["wh-8830-slot"];
  const today = GOODS_IN_TODAY.map(po);
  const pallets = today.reduce((a, p) => a + (p.pallets || 0), 0);
  const value = today.reduce((a, p) => a + p.value, 0);
  const deps = PO8821_DEPS.map(order);
  const covered = transfer ? ["SO-10497", "SO-10509"] : [];
  const released = deps.filter(o => !covered.includes(o.id));
  const relLines = released.reduce((a, o) => a + shortLines(o.id).length, 0);
  const relDub = released.filter(o => o.wh === "DUB").reduce((a, o) => a + shortLines(o.id).length, 0);
  const relNas = relLines - relDub;
  const ams = Array.from(new Set(released.map(o => o.am)));
  const g26 = po("PO-8826");
  return (
    <Page eyebrow={"Warehouse · Goods In · " + TODAY.time} title="Goods in"
      sub="What's arriving, where it's going, and which customer orders it releases. A receipt isn't finished until the backorders it frees are on a vehicle."
      right={<Btn kind="ghost" onClick={() => dx.go("Purchasing", "incoming")}>Incoming POs</Btn>}>
      <KpiRow n={6}>
        <Kpi label="Deliveries today" value={String(today.length)} sub={today.filter(p => p.wh === "DUB").length + " Dublin · " + today.filter(p => p.wh === "NAS").length + " Naas"} />
        <Kpi label="Pallets" value={String(pallets)} sub="Across 5 Dublin and 2 Naas slots" />
        <Kpi label="Stock value" value={eur(value)} sub="Landing today" />
        <Kpi label="Received so far" value="1" sub="PO-8826 at 08:40" subTone="ok" />
        <Kpi label="Discrepancies" value="1" tone="warn" sub="40 boxes short on PO-8826" subTone="warn" />
        <Kpi label="Critical tomorrow" value="PO-8821" tone="bad" sub={(expedited ? "06:30" : "10:30") + " · 6 customer orders waiting"} subTone="bad" onClick={() => dx.open("po", "PO-8821")} />
      </KpiRow>

      <Card title="Today's deliveries" sub={today.length + " supplier deliveries · " + pallets + " pallets · " + eur(value)} pad={false}>
        <Table onRow={r => dx.open("po", r.id)} rowTone={r => (r.id === dx.rec.po ? "accent" : r.id === "PO-8826" ? "warn" : undefined)} cols={[
          { k: "eta", label: "ETA", w: "0.6fr", render: r => <span className="dx-num">{r.id === "PO-8830" && held ? "12:15" : etaOf(r)}</span> },
          { k: "id", label: "PO", w: "0.8fr", render: r => <RecLink kind="po" id={r.id} /> },
          { k: "s", label: "Supplier", w: "3fr", render: r => (
            <div style={{ minWidth: 0, ...wrap }}>
              <RecLink kind="supplier" id={r.supplier} plain>{supplier(r.supplier).name}</RecLink>
              <div style={{ fontSize: 12, color: r.id === "PO-8826" ? "var(--warn)" : "var(--dim)", marginTop: 2 }}><Linked text={GI[r.id].note} /></div>
            </div>) },
          { k: "dock", label: "Site · dock", w: "1fr", render: r => GI[r.id].dock },
          { k: "pal", label: "Pallets", w: "0.6fr", align: "right", render: r => <span className="dx-num">{r.pallets}</span> },
          { k: "items", label: "SKUs", w: "0.5fr", align: "right", mono: true },
          { k: "value", label: "Value", w: "0.8fr", align: "right", render: r => <span className="dx-num">{eur(r.value)}</span> },
          { k: "st", label: "Status", w: "1fr", render: r => <Badge tone={giTone(GI[r.id].state)}>{r.id === "PO-8830" && held ? "Unload 12:15" : GI[r.id].state}</Badge> },
        ]} rows={today} />
      </Card>

      <div className="dx-section">
        <div className="dx-section-head">
          <div className="dx-section-title">Received this morning: PO-8826, followed through</div>
          <ActBtn id="claim-8826" small label="Send SafePro claim · €184" done="Claim sent · €184" toast="Claim sent to SafePro for 40 boxes of SAF-3310 (€184). Credit expected on the October statement." />
        </div>
        <Card>
          <Chain dir="across" steps={[
            { k: "Goods received · 08:40", v: g26.pallets + " pallets at Naas dock 3", sub: "760 of 800 × SAF-3310. 40 boxes short (EX-3310).", tone: "warn", icon: IC.alert, onClick: () => dx.open("po", "PO-8826") },
            { k: "Inventory updated · 08:52", v: "SAF-3310 +760 in Naas", sub: "The short 40 stay open on the PO", tone: "ok", icon: IC.check, onClick: () => dx.open("sku", "SAF-3310") },
            { k: "Backorders released · 08:53", v: "1 order · " + eur(g26.depValue), sub: "Plus Core Facilities' replacement gloves (RT-1184)", tone: "ok", icon: IC.check },
            { k: "Pick tasks created · 08:53", v: "2 pick tasks in Naas", sub: "Both on N04, departing 11:00", tone: "ok", icon: IC.check, onClick: () => dx.open("route", "N04") },
            { k: "Customers updated · 08:55", v: "Core Facilities told", sub: "Anne-Marie Walsh: large gloves on N04 today", tone: "ok", icon: IC.check, onClick: () => dx.go("Customers", "detail", { cust: "core" }) },
          ]} />
        </Card>
      </div>

      <div className="dx-section">
        <div className="dx-section-head">
          <div className="dx-section-title">Tomorrow: Atlas PO-8821, and what it releases</div>
          <Badge tone="bad">CRITICAL</Badge>
        </div>
        <Card tone="bad" title={<>Atlas <RecLink kind="po" id="PO-8821" />, {expedited ? "26 Sep 06:30 on a dedicated van" : "26 Sep 10:30 groupage"}</>}
          sub={x.note} pad={false}>
          <div style={{ padding: "0 20px 16px" }}>
            <Facts cols={4} items={[
              ["Supplier", <RecLink kind="supplier" id="atlas">{supplier("atlas").name}</RecLink>],
              ["Value", eur(x.value)], ["SKUs · pallets", x.items + " · " + x.pallets], ["Days late", String(x.daysLate), "bad"],
              ["Orders waiting", x.deps + " · " + eur(x.depValue), "bad"], ["Lines short", String(deps.reduce((a, o) => a + shortLines(o.id).length, 0))],
              ["Dock", booked ? "Dock 7 · " + (expedited ? "06:15 to 07:15" : "10:15 to 11:15") : "Not booked yet", booked ? "ok" : "warn"], ["Buyer", who(x.buyer).name],
            ]} />
          </div>
          <Table dense onRow={r => dx.go("Orders", "detail", { order: r.id })} cols={[
            { k: "id", label: "Order", w: "0.95fr", render: r => <RecLink kind="order" id={r.id} /> },
            { k: "c", label: "Customer", w: "1.6fr", render: r => <RecLink kind="cust" id={r.cust} plain>{customer(r.cust).name}</RecLink> },
            { k: "v", label: "Value", w: "0.8fr", align: "right", render: r => <span className="dx-num">{eur(r.value)}</span> },
            { k: "short", label: "Waiting for", w: "2fr", render: r => (
              <span style={wrap}>{shortLines(r.id).map((l, i) => <span key={l.sku}>{i ? ", " : ""}<RecLink kind="sku" id={l.sku} /> ×{l.qty}</span>)}</span>) },
            { k: "req", label: "Required", w: "0.65fr", render: r => r.required },
            { k: "out", label: "Goes out", w: "2fr", render: r => covered.includes(r.id)
              ? <span style={{ color: "var(--ok)", ...wrap }}>Completes today from Naas (TR-2291)</span>
              : <span style={wrap}><Linked text={RELEASE[r.id]} /></span> },
            { k: "am", label: "Account manager", w: "1.3fr", render: r => <Person id={r.am} /> },
          ]} rows={deps} />
          <div style={{ display: "flex", gap: 8, padding: "14px 20px 16px", flexWrap: "wrap", borderTop: "1px solid var(--border)" }}>
            <ActBtn id="gi-dock-8821" kind="primary" small label={"Pre-book dock 7 · " + (expedited ? "06:15" : "10:15")} done={"Dock 7 booked · " + (expedited ? "06:15" : "10:15")}
              toast={"Dock 7 held for Atlas PO-8821 tomorrow " + (expedited ? "06:15 to 07:15" : "10:15 to 11:15") + ". Kevin Brady and 2 receivers rostered; the 8 short lines go to the pick face first."} />
            <Btn small onClick={() => dx.open("po", "PO-8821")}>Open PO-8821</Btn>
            <Btn small kind="quiet" onClick={() => dx.go("Orders", "backorders")}>Backorders</Btn>
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
          <Card title="What happens when it lands" sub="The receipt chain Pulse runs automatically, with tomorrow's actual orders and customers">
            <Chain dir="across" steps={[
              { k: "Goods received", v: expedited ? "06:30 · dock 7" : "10:30 · dock 7", sub: x.pallets + " pallets · " + x.items + " SKUs · " + eur(x.value), tone: "accent", onClick: () => dx.open("po", "PO-8821") },
              { k: "Inventory updated", v: "EL-4408 +120 · EL-4521 +300", sub: "Also EL-5530 +600, IC-2290 +600, IC-4470 +800 (200 cross-docked to Naas)", onClick: () => dx.open("sku", "EL-4408") },
              { k: "Backorders released", v: released.length + " orders · " + relLines + " lines · " + eur(released.reduce((a, o) => a + o.value, 0)), sub: transfer ? "SO-10497 and SO-10509 already complete from Naas" : "Every order in the table above", onClick: () => dx.go("Orders", "backorders") },
              { k: "Pick tasks created", v: relDub + " in Dublin · " + relNas + " in Naas", sub: expedited ? "Released 07:15 after putaway, in time for the AM routes" : "Released 11:15 after putaway, ahead of D14's 13:30 cutoff" },
              { k: "Customers updated", v: released.length + " customers · " + ams.length + " account managers", sub: released.map(o => customer(o.cust).name.split(" ")[0]).join(", "), onClick: () => dx.go("Customers", "detail", { cust: "murphy" }) },
            ]} />
          </Card>
          <AiCard agent="Purchasing Agent" title={expedited ? "Expedited: it lands before the first wave" : "Expedite it and it lands before the first wave"}
            actions={!expedited ? <Btn small onClick={() => dx.open("po", "PO-8821")}>Expedite · €420</Btn> : undefined}>
            {expedited
              ? <>Atlas's dedicated van lands at 06:30. Putaway is done by 07:15, so the released lines make the AM routes instead of waiting for D14 in the afternoon.</>
              : <>Atlas can put all 14 SKUs on a dedicated van tonight for €420. It lands at 06:30 instead of 10:30, the released lines make tomorrow's AM routes, and nobody waits on a groupage date that has already moved twice.</>}
            {transfer && <div style={{ marginTop: 8, color: "var(--ok)" }}>TR-2291 is approved, so Horizon and Quinlan complete today from Naas and PO-8821 only has to release four orders.</div>}
          </AiCard>
        </div>
      </div>
    </Page>
  );
}

/* =====================================================================================
   DISPATCH
   ===================================================================================== */
function Timeline() {
  const dx = useDx();
  const start = 9 * 60, end = 14 * 60;
  const x = (t: number) => ((t - start) / (end - start)) * 100;
  const items = DISPATCH.map(d => ({ id: d.route, label: d.route === "D07" ? "D07 PM" : d.route, t: d.depart, status: dispatchView(d, dx.acted).status }))
    .sort((a, b) => mins(a.t) - mins(b.t));
  return (
    <div style={{ position: "relative", height: 92, margin: "4px 14px 0" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 50, height: 2, borderRadius: 2, background: "var(--track)" }} />
      <div style={{ position: "absolute", left: 0, width: x(NOW) + "%", top: 50, height: 2, borderRadius: 2, background: "var(--accent)" }} />
      {[9, 10, 11, 12, 13, 14].map(h => (
        <div key={h} style={{ position: "absolute", left: x(h * 60) + "%", top: 46, transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ width: 1, height: 10, margin: "0 auto", background: "var(--border-strong)" }} />
          <div className="dx-num" style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 6 }}>{String(h).padStart(2, "0")}:00</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: x(NOW) + "%", top: 44, width: 2, height: 14, borderRadius: 1, background: "var(--accent)", transform: "translateX(-50%)" }} />
      <div style={{ position: "absolute", left: x(NOW) + "%", top: 26, transform: "translateX(-50%)", fontSize: 10.5, color: "var(--accent)", fontWeight: 600 }}>Now</div>
      {items.map((it, i) => {
        const tone = riskTone(it.status);
        const ink = tone === "neutral" ? "var(--dim)" : "var(--" + tone + ")";
        const lt = i % 2 ? 17 : 0;
        return (
          <div key={it.id} className="dx-click" onClick={() => dx.open("route", it.id)} style={{ position: "absolute", left: x(mins(it.t)) + "%", top: 0, width: 0, height: 60 }}>
            <div style={{ position: "absolute", top: lt, left: 0, transform: "translateX(-50%)", whiteSpace: "nowrap", lineHeight: "16px", fontSize: 11.5, fontWeight: 600, color: tone === "neutral" ? "var(--ink)" : ink }}>
              {it.label} <span className="dx-num" style={{ fontWeight: 400, color: "var(--dim)" }}>{it.t}</span>
            </div>
            <div style={{ position: "absolute", left: 0, top: lt + 18, height: 47 - (lt + 18), width: 1, background: ink, opacity: 0.6 }} />
            <div style={{ position: "absolute", left: -4.5, top: 46.5, width: 9, height: 9, borderRadius: 5, background: ink, boxShadow: "0 0 0 2px var(--surface)" }} />
          </div>
        );
      })}
    </div>
  );
}

function DispatchPage() {
  const dx = useDx();
  const moved = !!dx.acted["d11-move"];
  const planned = !!dx.acted["d14-plan"];
  const out = ROUTES.filter(r => r.status === "In transit" || r.status === "Delivered").sort((a, b) => mins(a.depart) - mins(b.depart));
  const avgLoad = Math.round(DISPATCH.reduce((a, d) => a + d.loaded, 0) / DISPATCH.length);
  const rows = DISPATCH.slice().sort((a, b) => mins(a.depart) - mins(b.depart));
  return (
    <Page eyebrow={"Warehouse · Dispatch · " + TODAY.time} title="Dispatch board"
      sub="Every vehicle still to leave today: when it goes, how full it is, and what it's waiting on. Same data the drivers and the Delivery module see."
      right={<Btn kind="ghost" onClick={() => dx.go("Delivery", "routes")}>Routes</Btn>}>
      <KpiRow n={6}>
        <Kpi label="Due out today" value={String(DISPATCH.length)} sub={DISPATCH.filter(d => d.wh === "DUB").length + " Dublin · " + DISPATCH.filter(d => d.wh === "NAS").length + " Naas"} />
        <Kpi label="Next out" value="D11 · 10:00" sub={(moved ? "Cleared" : "Held") + " · leaves in " + until("10:00")} subTone={moved ? "ok" : "bad"} onClick={() => dx.open("route", "D11")} />
        <Kpi label="Held" value={String(moved ? 0 : 1)} tone={moved ? undefined : "bad"} sub={moved ? "D11 cleared at 7,460kg" : "D11 · 340kg over"} />
        <Kpi label="Waiting on picks" value={String(DISPATCH.filter(d => d.status === "Waiting").length)} sub="D14 on SO-10482 · W01 on SO-10536" subTone="warn" />
        <Kpi label="Average load" value={avgLoad + "%"} sub="Across the six still to go" />
        <Kpi label="Departed" value={String(out.length)} sub={out.filter(r => r.status === "Delivered").length + " complete · " + out.filter(r => r.status === "In transit").length + " on the road"} subTone="ok" />
      </KpiRow>

      <Card title="Departures, 09:00 to 14:00" sub="Click a route to open it">
        <Timeline />
      </Card>

      <Card style={{ marginTop: 14 }} title="Still to leave" sub="Loaded is the share of the planned load staged or on the vehicle" pad={false}>
        <Table onRow={r => dx.open("route", r.route)} rowTone={r => (r.route === dx.rec.route ? "accent" : dispatchView(r, dx.acted).status === "Held" ? "bad" : undefined)} cols={[
          { k: "route", label: "Route", w: "0.8fr", render: r => <b style={{ fontWeight: 600 }}><RouteLink id={r.route} label={r.route === "D07" ? "D07 PM" : r.route} /></b> },
          { k: "st", label: "Status", w: "0.9fr", render: r => { const s = dispatchView(r, dx.acted).status; return <Badge tone={riskTone(s)}>{s}</Badge>; } },
          { k: "dep", label: "Departs", w: "0.8fr", render: r => (
            <div><div className="dx-num" style={{ fontWeight: 600 }}>{r.depart}</div><div className="dx-num" style={{ fontSize: 11.5, color: "var(--faint)" }}>in {until(r.depart)}</div></div>) },
          { k: "cut", label: "Cutoff", w: "0.65fr", render: r => <span className="dx-num">{DX[r.route].cutoff}</span> },
          { k: "load", label: "Loaded", w: "1fr", render: r => (
            <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <Meter value={r.loaded} w={44} tone={dispatchView(r, dx.acted).status === "Held" ? "bad" : r.loaded === 100 ? "ok" : "accent"} />
              <span className="dx-num" style={{ fontSize: 12 }}>{r.loaded}%</span>
            </span>) },
          { k: "wait", label: "Waiting on", w: "2.5fr", render: r => <span style={wrap}><Linked text={dispatchView(r, dx.acted).waiting} /></span> },
          { k: "veh", label: "Vehicle · dock", w: "1.2fr", render: r => (
            <div style={{ minWidth: 0 }}>
              <div className="dx-num">{route(r.route).vehicle}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{DX[r.route].dock} · {route(r.route).type.split(",")[0]}</div>
            </div>) },
          { k: "drv", label: "Driver", w: "1.25fr", render: r => <Person id={route(r.route).driver} /> },
        ]} rows={rows} />
      </Card>

      <Grid cols="repeat(2,minmax(0,1fr))" gap={14} style={{ marginTop: 14 }}>
        <AiCard agent="Dispatch Agent · 08:36" title={moved ? "D11 is under its plated weight" : "D11: fix the weight before 10:00"}
          actions={<>
            <ActBtn id="d11-move" kind="primary" small label="Move SO-10528 to D09" done="Moved to D09" toast="SO-10528 moved to D09. D11 now 7,460kg, cleared to depart." />
            <Btn small kind="quiet" onClick={() => dx.open("route", "D11")}>Open D11</Btn>
          </>}>
          D11 is 340kg over its plated weight: 7,840kg planned on a 7.5t rigid. Move <RecLink kind="order" id="SO-10528" /> (Clondalkin Plant Hire, 380kg) to <RecLink kind="route" id="D09" />'s second run.
          {" "}Both orders still arrive inside their slot, and <RecLink kind="order" id="SO-10531" /> keeps Westbrook Maynooth's before-11:00 drop. The spare 12t has no driver free before 14:00, so moving the order is quicker than swapping the vehicle.
        </AiCard>
        <AiCard agent="Dispatch Agent" title={planned ? "D14 load plan confirmed" : "D14: keep it on time"}
          actions={<>
            <ActBtn id="d14-plan" kind="primary" small label="Confirm load plan" done="Load plan confirmed" toast="D14 load plan confirmed: 11 stops, departs 13:45. James Nolan notified." />
            <Btn small kind="quiet" onClick={() => dx.go("Delivery", "routes", { route: "D14" })}>Open D14</Btn>
          </>}>
          Load the 15 available lines of <RecLink kind="order" id="SO-10482" /> by 13:30 and D14 leaves on schedule at 13:45 with James Nolan. The remaining 3 lines go on tomorrow's D14 after <RecLink kind="po" id="PO-8821" /> lands.
          {" "}Tallaght Trade Centre (<RecLink kind="order" id="SO-10533" />) drops off unless credit releases it by 13:00, which takes the run to 11 stops.
        </AiCard>
      </Grid>

      <Card style={{ marginTop: 14 }} title="Already out" sub={out.length + " routes left the yard this morning"} pad={false}>
        <Table dense onRow={r => dx.open("route", r.id)} cols={[
          { k: "id", label: "Route", w: "0.65fr", render: r => <b style={{ fontWeight: 600 }}><RecLink kind="route" id={r.id} /></b> },
          { k: "area", label: "Area", w: "1.7fr", render: r => <span style={clip}>{r.area}</span> },
          { k: "wh", label: "From", w: "0.65fr", render: r => WAREHOUSES[r.wh].short },
          { k: "dep", label: "Left", w: "0.6fr", mono: true, render: r => r.depart },
          { k: "prog", label: "Stops done", w: "1.2fr", render: r => (
            <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <Meter value={r.done} max={r.stops} w={52} tone={r.done === r.stops ? "ok" : "accent"} />
              <span className="dx-num" style={{ fontSize: 12 }}>{r.done} of {r.stops}</span>
            </span>) },
          { k: "comp", label: "Done by", w: "0.7fr", mono: true, render: r => r.complete },
          { k: "drv", label: "Driver", w: "1.3fr", render: r => <Person id={r.driver} /> },
          { k: "st", label: "Status", w: "1.6fr", render: r => r.risk
            ? <span style={{ color: "var(--warn)", ...clip }}><Linked text={r.risk} /></span>
            : <Badge tone={r.status === "Delivered" ? "ok" : "accent"}>{r.status}</Badge> },
        ]} rows={out} />
      </Card>
    </Page>
  );
}

/* =====================================================================================
   EXCEPTIONS
   ===================================================================================== */
function Exceptions() {
  const dx = useDx();
  const rows = [...WH_EXCEPTIONS, ...EX_EXTRA].sort((a, b) => b.id.localeCompare(a.id));
  const resolved = (id: string) =>
    (id === "EX-3307" && !!dx.acted["d11-move"]) || (id === "EX-3306" && !!dx.acted["d-transfer"]) || (id === "EX-3310" && !!dx.acted["claim-8826"])
    || (id === "EX-3312" && !!dx.acted["ex-3312"]) || id === "EX-3309";
  const open = rows.filter(r => !resolved(r.id));
  const action = (r: Exception): ReactNode => {
    if (r.id === "EX-3312") return <ActBtn id="ex-3312" small label="Cover from Dublin" done="12 boxes on the shuttle" toast="12 × FIX-2201 picked in Dublin for SO-10474 and put on the next shuttle to Naas. The 10:30 recount still goes ahead." />;
    if (r.id === "EX-3310") return <ActBtn id="claim-8826" small label="Send SafePro claim" done="Claim sent · €184" toast="Claim sent to SafePro for 40 boxes of SAF-3310 (€184). Credit expected on the October statement." />;
    if (r.id === "EX-3307") return <ActBtn id="d11-move" small kind="primary" label="Move to D09" done="Moved to D09" toast="SO-10528 moved to D09. D11 now 7,460kg, cleared to depart." />;
    if (r.id === "EX-3306") return <ActBtn id="d-transfer" small kind="primary" label="Approve TR-2291" done="Transfer TR-2291 approved" toast="TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van. Liam and Aoife notified." />;
    return <span style={{ color: r.id === "EX-3309" ? "var(--ok)" : "var(--dim)", ...wrap }}>{EX_STATE[r.id]}</span>;
  };
  const sevTone = (s: string): Tone => (s === "HIGH" ? "bad" : s === "MEDIUM" ? "warn" : "neutral");
  return (
    <Page eyebrow={"Warehouse · Exceptions · " + TODAY.time} title="Warehouse exceptions"
      sub="Stock that isn't where the system says, deliveries that arrive short or damaged, wrong picks and missed cutoffs. Each one has an owner and a next step, and each one is tied to the order it holds up.">
      <KpiRow n={5}>
        <Kpi label="Open now" value={String(open.length)} sub={rows.length + " raised since yesterday afternoon"} />
        <Kpi label="High severity" value={String(rows.filter(r => r.sev === "HIGH" && !resolved(r.id)).length)} tone="bad" sub="Count mismatch, over weight, wrong warehouse" />
        <Kpi label="Orders held up" value="3" sub="SO-10474 · SO-10528 · SO-10526" subTone="warn" />
        <Kpi label="Supplier claims open" value={String(dx.acted["claim-8826"] ? 1 : 2)} sub="SafePro €184 · Kingfield hand soap" />
        <Kpi label="This month" value={String(EX_MONTH.reduce((a, e) => a + e[1], 0))} sub="Exceptions logged since 1 Sep" />
      </KpiRow>

      <Card title="Exceptions" sub="Newest first · every reference opens the record behind it" pad={false}>
        <Table rowTone={r => (resolved(r.id) ? undefined : sevTone(r.sev) === "bad" ? "bad" : undefined)} cols={[
          { k: "id", label: "Exception", w: "0.9fr", render: r => (
            <div><div className="dx-num" style={{ fontWeight: 600 }}>{r.id}</div><div style={{ fontSize: 11.5, color: "var(--faint)" }}>{r.raised}</div></div>) },
          { k: "kind", label: "Type", w: "1.2fr", render: r => <span style={wrap}>{r.kind}</span> },
          { k: "sev", label: "Severity", w: "0.95fr", render: r => resolved(r.id) ? <Badge tone="ok">Resolved</Badge> : <Badge tone={sevTone(r.sev)}>{r.sev}</Badge> },
          { k: "ref", label: "Reference", w: "1.3fr", render: r => <span style={wrap}><Linked text={r.ref} /></span> },
          { k: "detail", label: "What happened", w: "2.8fr", render: r => <span style={{ ...wrap, color: "var(--body)" }}><Linked text={r.detail} /></span> },
          { k: "owner", label: "Owner", w: "1.2fr", render: r => <Person id={r.owner} /> },
          { k: "act", label: "Next step", w: "1.9fr", render: r => action(r) },
        ]} rows={rows} />
      </Card>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="This month, by type" sub="50 exceptions since 1 Sep, both sites">
          <HBars fmt={n => String(n)} items={EX_MONTH.map(([label, value]) => ({ label, value }))} />
          <div style={{ marginTop: 16 }}>
            <Note tone="warn">
              9 of the 14 stock discrepancies are in Naas aisles N-06 to N-08, the bays re-slotted in August. Bin N-07-04 is one of them.
              {" "}A cycle count of those three aisles finds the rest before they hold up another order.
            </Note>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <ActBtn id="cc-naas" small kind="primary" label="Book a count of N-06 to N-08" done="Count booked · 29 Sep 06:00" toast="Cycle count of Naas aisles N-06 to N-08 booked for 29 Sep 06:00, before wave 1. Aoife Brennan owns it." />
          </div>
        </Card>
        <AiCard agent="Ops Watchdog" title="Where each exception lands">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
            {[
              <>EX-3312 holds <RecLink kind="order" id="SO-10474" /> for McGrath Civil, who are already €8,940 overdue and disputing a late delivery. Cover it from Dublin rather than wait for the recount.</>,
              <>EX-3306 is the classic one: the stock is in Naas, the order is allocated to Dublin. <RecLink kind="order" id="SO-10526" /> (Liffey M&E) needs a site-gate drop by 08:00 tomorrow.</>,
              <>EX-3310 and EX-3305 are both supplier claims. SafePro's 40 boxes are on the PO; Kingfield's crushed soap is waiting on a credit note.</>,
              <>EX-3309 keeps happening: orders placed after W01's wave release at 07:15. The portal should tell customers the cutoff.</>,
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, lineHeight: 1.55 }}><span className="dx-faint dx-num" style={{ width: 14, flex: "none" }}>{i + 1}</span><span>{t}</span></div>
            ))}
          </div>
        </AiCard>
      </Grid>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = {
  board: Board, picking: Picking, packing: Packing, goodsin: GoodsIn, dispatch: DispatchPage, exceptions: Exceptions,
};
