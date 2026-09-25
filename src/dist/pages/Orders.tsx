import type { ComponentType } from "react";
import {
  AT_RISK_IDS, AT_RISK_TODAY, INVOICES, KPI, ORDERS, ORDER_STATUS_KPIS, PRODUCTS, RISK_PROB, SKU_DEMAND, SO10482_LINES, SO10482_PROFIT, SUBSTITUTE,
  TRANSFER_EL4408, customer, eur, num, order, orderProfit, pct, po, product, route, supplier, who, type SO, type SOLine,
} from "../db";
import {
  ActBtn, AiCard, Avatar, Badge, Btn, Card, Chain, Columns, Facts, Grid, HBars, IC, Icon, Kpi, KpiRow, Meter, Page, Person, RecLink, Risk, Seg, Strip, Table, useDx, useLocal, type Col, type Tone,
} from "../ui";

const WH = (w: string) => (w === "DUB" ? "Dublin" : "Naas");
const statusTone = (s: string): Tone =>
  /hold/i.test(s) ? "bad" : /part|awaiting|short/i.test(s) ? "warn" : /deliver|dispatch|packed/i.test(s) ? "ok" : /picking/i.test(s) ? "accent" : "neutral";

/* ---------------- Overview ---------------- */
const INTAKE_BY_HOUR = [["Before 06", 12], ["06", 9], ["07", 26], ["08", 32], ["09", 15]] as [string, number][];
const CHANNELS: [string, number, string][] = [["B2B ordering portal", 38, "€52,610"], ["EDI (national accounts)", 19, "€48,220"], ["Email to sales inbox", 17, "€39,840"], ["Rep orders", 12, "€24,960"], ["Phone", 8, "€10,790"]];

function Overview() {
  const dx = useDx();
  const flow = [
    { k: "New", n: 38, v: 92400, tone: "neutral" as Tone },
    { k: "Allocated", n: 112, v: 268300, tone: "neutral" as Tone },
    { k: "Picking", n: 58, v: 131600, tone: "accent" as Tone },
    { k: "Packed", n: 24, v: 61800, tone: "accent" as Tone },
    { k: "Dispatched", n: 28, v: 71240, tone: "ok" as Tone, today: true },
    { k: "Delivered", n: 34, v: 88910, tone: "ok" as Tone, today: true },
  ];
  const max = Math.max(...flow.map(f => f.n));
  return (
    <Page eyebrow="Orders" title="Where every order is right now" sub="286 open orders across Dublin and Naas, from the moment they land to proof of delivery.">
      <KpiRow n={7}>
        <Kpi label="Open orders" value={num(KPI.openOrders)} sub={eur(KPI.openOrderValue) + " value"} />
        <Kpi label="Ready" value={String(ORDER_STATUS_KPIS.ready)} sub="New, allocated or packed" subTone="ok" />
        <Kpi label="Picking" value={String(ORDER_STATUS_KPIS.picking)} sub="On the warehouse floor" onClick={() => dx.go("Warehouse", "picking")} />
        <Kpi label="Awaiting stock" value={String(ORDER_STATUS_KPIS.awaitingStock)} sub={eur(KPI.backorderValue) + " affected"} tone="warn" onClick={() => dx.go("Orders", "backorders")} />
        <Kpi label="Credit hold" value={String(ORDER_STATUS_KPIS.creditHold)} sub="€38,420 held" tone="bad" onClick={() => dx.go("Finance", "credit")} />
        <Kpi label="Delivery risk" value={String(ORDER_STATUS_KPIS.deliveryRisk)} sub="Likely to miss the date" tone="bad" onClick={() => dx.go("Orders", "risk")} />
        <Kpi label="Orders today" value={String(KPI.ordersToday)} sub={eur(KPI.ordersTodayValue)} onClick={() => dx.go("Orders", "live")} />
      </KpiRow>

      <Card title="Order pipeline" sub="Open orders by stage. Held orders sit outside the flow, and that is where today's bottleneck is." right={<Badge tone="warn" dot>Bottleneck: awaiting stock</Badge>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 10, marginTop: 4 }}>
          {flow.map((f, i) => (
            <div key={f.k} style={{ position: "relative" }}>
              <div style={{ fontSize: 12, color: "var(--faint)", display: "flex", justifyContent: "space-between" }}><span>{f.k}</span>{f.today && <span>today</span>}</div>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.8px", marginTop: 4 }}>{f.n}</div>
              <div className="dx-num" style={{ fontSize: 12, color: "var(--dim)" }}>{eur(f.v)}</div>
              <div style={{ height: 8, marginTop: 10, borderRadius: 4, background: "var(--track)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: (f.n / max) * 100 + "%", background: f.tone === "neutral" ? "var(--chart-muted)" : `var(--${f.tone})`, borderRadius: 4 }} />
              </div>
              {i < flow.length - 1 && <span style={{ position: "absolute", right: -9, top: 30, color: "var(--faint)" }}><Icon d={IC.chev} s={12} /></span>}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginTop: 18 }}>
          {[
            { k: "Awaiting stock", n: 31, v: 84760, why: "6 of them wait on one PO: Atlas PO-8821, 5 days late", tone: "warn" as Tone, go: () => dx.go("Orders", "backorders") },
            { k: "Credit hold", n: 9, v: 38420, why: "Doyle Construction SO-10503 is €16,240 of it", tone: "bad" as Tone, go: () => dx.go("Finance", "credit") },
            { k: "Delivery risk", n: 14, v: 84760, why: "Stock, supplier, weight, picking and credit, ranked", tone: "bad" as Tone, go: () => dx.go("Orders", "risk") },
          ].map(b => (
            <div key={b.k} className="dx-card dx-click" onClick={b.go} style={{ padding: "13px 15px", borderColor: `color-mix(in srgb,var(--${b.tone}) 35%,var(--border))`, background: `var(--${b.tone}-soft)` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{b.k}</span>
                <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 600 }}>{b.n}</span>
              </div>
              <div className="dx-num" style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 2 }}>{eur(b.v)}</div>
              <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 6 }}>{b.why}</div>
            </div>
          ))}
        </div>
      </Card>

      <Grid cols="minmax(0,6fr) minmax(0,3.4fr) minmax(0,2.8fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Biggest open orders at risk" sub="Value × likelihood of missing the date" pad={false}>
          <Table dense onRow={(r: SO) => dx.go("Orders", "detail", { order: r.id })} cols={[
            { k: "id", label: "Order", w: "92px", render: (r: SO) => <RecLink kind="order" id={r.id} /> },
            { k: "c", label: "Customer", w: "1.5fr", render: (r: SO) => customer(r.cust).name },
            { k: "v", label: "Value", w: "80px", align: "right", mono: true, render: (r: SO) => eur(r.value) },
            { k: "why", label: "Why", w: "1fr", render: (r: SO) => <span className="dx-muted">{(r.reason || "").split(" · ")[0]}</span> },
          ]} rows={AT_RISK_IDS.map(order).sort((a, b) => b.value * RISK_PROB[b.id] - a.value * RISK_PROB[a.id]).slice(0, 6)} />
        </Card>
        <Card title="Orders in today" sub="94 orders, €176,420, by hour landed (to 09:16)">
          <Columns h={150} fmt={n => String(Math.round(n))} data={INTAKE_BY_HOUR.map(([h, n]) => ({ label: h.length > 2 ? h : h + ":00", value: n }))} />
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 8 }}>Wave cutoff for same-day dispatch is 11:00 in Dublin, 10:30 in Naas. Harbour Point's 08:48 order missed W01's wave release.</div>
        </Card>
        <Card title="How orders arrive" sub="Today, by channel" pad={false}>
          <div className="dx-list">
            {CHANNELS.map(([c, n, v], i) => (
              <div key={c} className="dx-li" style={{ borderTop: i ? undefined : 0, padding: "10px 20px" }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{c}</div>
                <span className="dx-num" style={{ fontSize: 13, fontWeight: 600 }}>{n}</span>
                <span className="dx-num dx-faint" style={{ fontSize: 12, width: 64, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <AiCard agent="Ops Watchdog" title="What will slow the pipeline today" actions={<>
        <Btn small kind="primary" onClick={() => dx.go("Orders", "detail", { order: "SO-10482" })}>Open SO-10482</Btn>
        <Btn small onClick={() => dx.open("po", "PO-8821")}>PO-8821 impact</Btn>
        <Btn small onClick={() => dx.go("Orders", "allocation")}>Allocation conflicts</Btn>
      </>}>
        <div style={{ marginTop: 2 }}>Awaiting stock is the queue that isn't moving: 31 orders, and the single biggest cause is Atlas PO-8821. When it lands tomorrow at 10:30 it releases 6 orders worth €41,880. Before then, 40 units of EL-4408 in Naas can protect 3 more, and 12 free units in Dublin are being held back as counter safety stock.</div>
      </AiCard>
    </Page>
  );
}

/* ---------------- Live orders ---------------- */
const liveCols: Col<SO>[] = [
  { k: "id", label: "Order", w: "100px", render: r => <RecLink kind="order" id={r.id} /> },
  { k: "c", label: "Customer", w: "1.9fr", render: r => <RecLink kind="cust" id={r.cust} plain>{customer(r.cust).name}</RecLink> },
  { k: "am", label: "Account manager", w: "1.3fr", render: r => <span className="dx-muted">{who(r.am).name}</span> },
  { k: "v", label: "Value", w: "0.9fr", align: "right", mono: true, render: r => eur(r.value) },
  { k: "m", label: "Margin", w: "0.7fr", align: "right", mono: true, render: r => <span style={{ color: r.margin < 23 ? "var(--warn)" : undefined }}>{pct(r.margin)}</span> },
  { k: "l", label: "Lines", w: "0.55fr", align: "right", mono: true, render: r => r.lines },
  { k: "s", label: "Stock", w: "1fr", render: r => <Badge tone={r.stock === "Available" ? "ok" : "warn"}>{r.stock}</Badge> },
  { k: "wh", label: "Wh", w: "0.65fr", render: r => WH(r.wh) },
  { k: "req", label: "Required", w: "0.75fr", render: r => r.required },
  { k: "st", label: "Fulfilment", w: "1.1fr", render: r => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  { k: "rt", label: "Delivery", w: "0.8fr", render: r => r.route === "—" || r.route === "Naas trunk" ? <span className="dx-faint">{r.route}</span> : <RecLink kind="route" id={r.route}>{"Route " + r.route}</RecLink> },
  { k: "risk", label: "Risk", w: "0.9fr", render: r => <Risk r={r.risk} /> },
];

function Live() {
  const dx = useDx();
  const [f, setF] = useLocal("orders.live.f", "all");
  const rows = ORDERS.filter(o =>
    f === "all" ? true : f === "risk" ? o.risk === "HIGH" || o.risk === "MEDIUM" : f === "hold" ? /hold/i.test(o.status) : f === "short" ? o.short > 0 : f === "DUB" || f === "NAS" ? o.wh === f : true);
  return (
    <Page eyebrow="Orders" title="Live orders" sub="Every open order with its stock, warehouse, delivery and risk on one line. Click any order to see the whole chain behind it."
      right={<Seg value={f} onChange={setF} items={[["all", "All"], ["risk", "At risk"], ["short", "Short"], ["hold", "Credit hold"], ["DUB", "Dublin"], ["NAS", "Naas"]]} />}>
      <Card pad={false}>
        <Table cols={liveCols} rows={rows} onRow={r => dx.go("Orders", "detail", { order: r.id })} rowTone={r => (r.risk === "HIGH" ? "bad" : r.risk === "MEDIUM" ? "warn" : undefined)} />
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", fontSize: 12, color: "var(--faint)" }}>
          <span style={{ flex: 1 }}>Showing {rows.length} of {KPI.openOrders} open orders · synced from Sage 200 at 09:14</span>
          <span>Sorted by risk, then required date</span>
        </div>
      </Card>
    </Page>
  );
}

/* ---------------- At risk ---------------- */
const REASON_OF = (o: SO) => (o.reason || "").split(" · ")[0];
function AtRisk() {
  const dx = useDx();
  const rows = AT_RISK_IDS.map(order).sort((a, b) => b.value * RISK_PROB[b.id] - a.value * RISK_PROB[a.id]);
  const reasons = ["Late supplier", "Stock shortage", "Credit hold", "Vehicle capacity", "Picking delay", "Stock discrepancy", "Warehouse delay"].map(k => {
    const os = rows.filter(o => REASON_OF(o) === k);
    return { label: k + " (" + os.length + ")", value: os.reduce((a, o) => a + o.value, 0) };
  }).filter(r => r.value > 0);
  return (
    <Page eyebrow="Orders" title={<>Revenue at risk: <span style={{ color: "var(--bad)" }}>{eur(KPI.atRiskValue)}</span></>}
      sub="14 orders Pulse expects to miss their commitment. Ranked by revenue × probability of delay, so the top of the list is where an hour of someone's time is worth most.">
      <KpiRow n={4}>
        <Kpi label="Orders at risk" value="14" sub={eur(KPI.atRiskValue) + " revenue"} tone="bad" />
        <Kpi label="On today's dispatch" value={String(AT_RISK_TODAY.length)} sub={eur(KPI.atRiskTodayValue) + " · fulfilment risk"} tone="warn" />
        <Kpi label="Depend on one PO" value="6" sub="Atlas PO-8821 · €41,880" onClick={() => dx.open("po", "PO-8821")} />
        <Kpi label="Expected loss if nothing changes" value={eur(Math.round(rows.reduce((a, o) => a + o.value * RISK_PROB[o.id], 0)))} sub="Value × probability" />
      </KpiRow>
      <Grid cols="minmax(0,8fr) minmax(0,4fr)" gap={14}>
        <Card pad={false} title="Ranked by revenue × probability">
          <Table onRow={(r: SO) => dx.go("Orders", "detail", { order: r.id })} rowTone={r => (RISK_PROB[r.id] >= 0.8 ? "bad" : "warn")} cols={[
            { k: "id", label: "Order", w: "96px", render: r => <RecLink kind="order" id={r.id} /> },
            { k: "c", label: "Customer", w: "1.7fr", render: r => customer(r.cust).name },
            { k: "v", label: "Value", w: "0.8fr", align: "right", mono: true, render: r => eur(r.value) },
            { k: "p", label: "Likelihood", w: "1fr", render: r => <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}><Meter value={RISK_PROB[r.id] * 100} tone={RISK_PROB[r.id] >= 0.8 ? "bad" : "warn"} w={48} /><span className="dx-num">{Math.round(RISK_PROB[r.id] * 100)}%</span></span> },
            { k: "why", label: "Reason", w: "2.2fr", render: r => <span className="dx-muted" title={r.reason}>{r.reason}</span> },
            { k: "req", label: "Required", w: "0.7fr", render: r => r.required },
            { k: "who", label: "Owner", w: "0.9fr", render: r => <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}><Avatar id={r.am} size={20} />{who(r.am).name.split(" ")[0]}</span> },
          ]} rows={rows} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Why they're at risk" sub="Revenue by cause">
            <HBars items={reasons} fmt={n => eur(n)} tone="bad" />
          </Card>
          <AiCard agent="Ops Watchdog" title="Three moves clear most of it" actions={<>
            <ActBtn id="d-expedite" kind="primary" small label="Expedite PO-8821 · €420" done="Expedited" toast="PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow." />
            <ActBtn id="d11-move" small label="Move SO-10528 to D09" done="Moved to D09" toast="SO-10528 moved to D09. D11 cleared to depart." />
          </>}>
            <ol style={{ margin: "4px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Expedite Atlas PO-8821 for €420. Six orders, €41,880, stop depending on tomorrow's 10:30 groupage.</li>
              <li>Split Murphy SO-10482: 15 lines on D14 today, 3 tomorrow. Murphy has accepted split deliveries 6 times this year.</li>
              <li>Move SO-10528 off D11 to fix the weight. Two orders (€4,060) leave on time.</li>
            </ol>
          </AiCard>
        </div>
      </Grid>
    </Page>
  );
}

/* ---------------- Backorders ---------------- */
type BackRow = { sku: string; orders: string[]; qty: number; value: number; po: string; eta: string; plan: string };
const EXTRA_BACK: BackRow[] = [
  { sku: "FIX-1180", orders: ["8 orders"], qty: 112, value: 3629, po: "No PO open", eta: "Reorder today", plan: "96 free can't complete full lines. Purchasing Agent recommends 200 from EuroFix." },
  { sku: "SAF-3310", orders: ["5 orders"], qty: 150, value: 1110, po: "PO-8826", eta: "Arrived 08:40 · 40 short", plan: "Release 4 of 5 today, claim raised with SafePro" },
  { sku: "IC-5120", orders: ["3 orders"], qty: 36, value: 1890, po: "PO-8817", eta: "29 Sep", plan: "Hansen 3 days late, second time this quarter" },
  { sku: "TL-7710", orders: ["2 orders"], qty: 30, value: 1260, po: "PO-8809", eta: "27 Sep", plan: "Toolcraft confirmed dispatch" },
  { sku: "12 more SKUs", orders: ["7 orders"], qty: 164, value: 2340, po: "Various", eta: "27 Sep to 2 Oct", plan: "Single lines, all covered by confirmed POs" },
];
function Backorders() {
  const dx = useDx();
  const groups: BackRow[] = Object.entries(SKU_DEMAND).map(([sku, d]) => {
    const short = d.filter(x => x.status === "Short");
    const p = product(sku);
    return { sku, orders: short.map(x => x.so), qty: short.reduce((a, b) => a + b.qty, 0), value: Math.round(short.reduce((a, b) => a + b.qty * p.price, 0)), po: p.po || "—", eta: p.po ? po(p.po).eta || "" : "", plan: sku === "EL-4408" ? "Transfer 40 from Naas today, rest on PO-8821" : "Released when PO-8821 is put away" };
  });
  const all = groups.concat(EXTRA_BACK);
  return (
    <Page eyebrow="Orders" title="Backorders" sub={"31 orders are waiting on stock, " + eur(KPI.backorderValue) + " of order value affected. Grouped by what they're waiting for, so one receipt can release many orders."}>
      <KpiRow n={4}>
        <Kpi label="Orders on backorder" value="31" sub={eur(KPI.backorderValue) + " affected"} tone="warn" />
        <Kpi label="Released by PO-8821" value="6" sub="Tomorrow 10:30 · €41,880" onClick={() => dx.open("po", "PO-8821")} />
        <Kpi label="Could ship part today" value="19" sub="Customer accepts split delivery" subTone="ok" />
        <Kpi label="Oldest backorder" value="9 days" sub="SO-10431 · Swords Building Supplies" />
      </KpiRow>
      <Card pad={false} title="Backordered lines by SKU" sub="What each group is waiting for and when it clears">
        <Table rows={all} onRow={r => { if (!r.sku.includes(" ")) dx.open("sku", r.sku); }} cols={[
          { k: "sku", label: "SKU", w: "0.8fr", render: r => r.sku.includes(" ") ? <span className="dx-muted">{r.sku}</span> : <RecLink kind="sku" id={r.sku} /> },
          { k: "n", label: "Product", w: "1.9fr", render: r => r.sku.includes(" ") ? <span className="dx-muted">Other lines</span> : product(r.sku).name },
          { k: "o", label: "Orders waiting", w: "2fr", render: r => <span style={{ display: "flex", gap: 6, flexWrap: "wrap", whiteSpace: "normal" }}>{r.orders.map(o => o.startsWith("SO-") ? <RecLink key={o} kind="order" id={o} /> : <span key={o} className="dx-muted">{o}</span>)}</span> },
          { k: "q", label: "Units", w: "0.55fr", align: "right", mono: true, render: r => num(r.qty) },
          { k: "v", label: "Line value", w: "0.8fr", align: "right", mono: true, render: r => eur(r.value) },
          { k: "po", label: "Covered by", w: "0.9fr", render: r => r.po.startsWith("PO-") ? <RecLink kind="po" id={r.po} /> : <span className="dx-faint">{r.po}</span> },
          { k: "eta", label: "ETA", w: "1.2fr", render: r => <span className="dx-muted">{r.eta}</span> },
          { k: "plan", label: "Plan", w: "2.3fr", render: r => <span className="dx-muted" title={r.plan}>{r.plan}</span> },
        ]} />
      </Card>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Split or wait?" sub="The customer's delivery arrangement decides, not the warehouse">
          <Table dense rows={["SO-10482", "SO-10497", "SO-10515", "SO-10488"].map(order)} cols={[
            { k: "id", label: "Order", w: "96px", render: r => <RecLink kind="order" id={r.id} /> },
            { k: "c", label: "Customer", w: "1.4fr", render: r => customer(r.cust).name },
            { k: "d", label: "Customer prefers", w: "1.5fr", render: r => <span className="dx-muted">{r.id === "SO-10515" ? "Weekly consolidated drop" : r.id === "SO-10488" ? "Complete orders to site" : "Split is fine"}</span> },
            { k: "a", label: "Pulse says", w: "0.7fr", render: r => <Badge tone={r.id === "SO-10515" || r.id === "SO-10488" ? "neutral" : "accent"}>{r.id === "SO-10515" || r.id === "SO-10488" ? "Wait" : "Split"}</Badge> },
          ]} />
        </Card>
        <Card title="When PO-8821 is received" sub="What Pulse does automatically, in order">
          <Chain dir="down" steps={[
            { k: "Goods received · tomorrow 10:30", v: "14 SKUs checked in at Dublin dock 3", icon: IC.box },
            { k: "Inventory updated", v: "EL-4408 +120 · EL-4521 +300 · IC-2290 +600 · IC-4470 +800", icon: IC.check },
            { k: "Backorders released", v: "6 orders move from Awaiting stock to Allocated", tone: "ok", icon: IC.bolt },
            { k: "Pick tasks created", v: "8 lines into the 11:00 wave, D14 PM run", icon: IC.cart },
            { k: "Customers updated", v: "Six emails from the account managers' drafts, with new ETAs", icon: IC.mail },
          ]} />
        </Card>
      </Grid>
    </Page>
  );
}

/* ---------------- Allocation ---------------- */
function Allocation() {
  const dx = useDx();
  const d = SKU_DEMAND["EL-4408"];
  return (
    <Page eyebrow="Orders" title="Allocation" sub="Who gets the stock when there isn't enough for everyone. Pulse applies the rules, then shows you where the rules are costing you an order.">
      <KpiRow n={4}>
        <Kpi label="Lines allocated today" value="1,146" sub="of 1,284 lines in Dublin" />
        <Kpi label="Allocation conflicts" value="5" sub="Stock promised to a later order" tone="warn" />
        <Kpi label="Stock in the wrong warehouse" value="€9,840" sub="Naas holds it, Dublin needs it" tone="warn" onClick={() => dx.go("Inventory", "transfers")} />
        <Kpi label="Held as safety stock" value="€2,310" sub="Could complete 3 waiting lines" />
      </KpiRow>
      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14}>
        <Card title="EL-4408 Industrial Cable 100m · Dublin" sub="38 on hand · 26 allocated · 12 free, held as trade-counter safety stock" pad={false}>
          <Table rows={d} onRow={r => dx.go("Orders", "detail", { order: r.so })} cols={[
            { k: "so", label: "Order", w: "96px", render: r => <RecLink kind="order" id={r.so} /> },
            { k: "c", label: "Customer", w: "1.6fr", render: r => customer(order(r.so).cust).name },
            { k: "req", label: "Required", w: "0.75fr", render: r => order(r.so).required },
            { k: "q", label: "Qty", w: "0.5fr", align: "right", mono: true, render: r => r.qty },
            { k: "s", label: "Allocation", w: "1fr", render: r => <Badge tone={r.status === "Short" ? "bad" : "ok"}>{r.status === "Short" ? "Waiting" : "Allocated"}</Badge> },
            { k: "n", label: "Note", w: "1.4fr", render: r => <span className="dx-muted">{r.so === "SO-10529" ? "Not needed until 29 Sep" : r.so === "SO-10497" ? "Needed on today's D14" : ""}</span> },
          ]} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent="Inventory Agent" title="Reallocate 12 units, today" actions={<>
            <ActBtn id="alloc-el4408" kind="primary" small label="Reallocate stock" done="12 reallocated to SO-10497" toast="12 × EL-4408 moved from SO-10529 (29 Sep) to SO-10497 (26 Sep). SO-10529 re-covered by PO-8821." />
            <Btn small onClick={() => dx.go("Inventory", "transfers")}>See the Naas transfer</Btn>
          </>}>
            Murphy's SO-10529 isn't needed until 29 Sep but is holding 12 drums today. Horizon's SO-10497 needs exactly 12 on today's D14. Move them now; SO-10529 is re-covered by PO-8821 tomorrow, three days before it's needed.
          </AiCard>
          <Card title="Allocation rules in force" sub="Set in Sage 200, applied by Pulse">
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--body)" }}>
              {[
                ["1", "Required date first, then account tier (national, A, B, C), then order date."],
                ["2", "Complete lines only for cable and tray. Customers don't take part drums."],
                ["3", "12 drums of EL-4408 held for the Dublin trade counter (set by Liam Murphy in May)."],
                ["4", "Orders allocate from their home warehouse. Cross-warehouse needs a transfer."],
                ["5", "Credit-held orders keep their allocation for 24 hours, then release it."],
              ].map(([n, t]) => <div key={n} style={{ display: "flex", gap: 10 }}><span className="dx-chain-node" style={{ width: 22, height: 22, fontSize: 10.5, borderColor: "var(--border-strong)", color: "var(--dim)", background: "var(--surface-2)" }}>{n}</span><span style={{ paddingTop: 2 }}>{t}</span></div>)}
            </div>
          </Card>
        </div>
      </Grid>
      <Card title="Conflicts across the network" sub="Where stock is promised to an order that can wait, while another can't" pad={false} style={{ marginTop: 14 }}>
        <Table rows={[
          { sku: "EL-4408", held: "SO-10529 · Murphy (29 Sep)", need: "SO-10497 · Horizon (26 Sep)", qty: 12, fix: "Reallocate", wh: "Dublin" },
          { sku: "EL-4408", held: "Naas free stock", need: "SO-10509, SO-10526 (26 Sep)", qty: 28, fix: "Transfer TR-2291", wh: "Naas → Dublin" },
          { sku: "EL-4521", held: "SO-10499 · Leinster (26 Sep, weekly drop)", need: "SO-10482 · Murphy (26 Sep)", qty: 22, fix: "Leinster consolidates, can wait to 29 Sep", wh: "Dublin" },
          { sku: "IC-2290", held: "SO-10502 · Core Facilities (26 Sep)", need: "SO-10515 · Leinster (29 Sep)", qty: 40, fix: "No change, rules are right", wh: "Dublin" },
          { sku: "SAF-3310", held: "Credit-held SO-10503 · Doyle", need: "SO-10536 · Harbour Point (25 Sep)", qty: 20, fix: "Release after 24h hold", wh: "Dublin" },
        ]} cols={[
          { k: "sku", label: "SKU", w: "0.8fr", render: r => <RecLink kind="sku" id={r.sku} /> },
          { k: "wh", label: "Where", w: "1fr" },
          { k: "held", label: "Currently held by", w: "2fr", render: r => <span className="dx-muted">{r.held}</span> },
          { k: "need", label: "Needed by", w: "2fr" },
          { k: "q", label: "Units", w: "0.5fr", align: "right", mono: true, render: r => r.qty },
          { k: "fix", label: "Pulse suggests", w: "2fr", render: r => <span style={{ color: "var(--accent)" }}>{r.fix}</span> },
        ]} />
      </Card>
    </Page>
  );
}

/* ---------------- Order detail ---------------- */
/* Deterministic lines for orders we don't hold line detail for: they sum exactly to the order value. */
function linesFor(o: SO): SOLine[] {
  if (o.id === "SO-10482") return SO10482_LINES;
  let seed = 0;
  for (const ch of o.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = PRODUCTS.filter(p => p.health !== "Dead");
  const shortSkus = Object.entries(SKU_DEMAND).flatMap(([sku, d]) => d.filter(x => x.so === o.id && x.status === "Short").map(x => ({ sku, qty: x.qty })));
  const out: SOLine[] = shortSkus.map(s => ({ sku: s.sku, qty: s.qty, price: product(s.sku).price, alloc: 0, status: "Short" as const }));
  const used = new Set(out.map(l => l.sku));
  let i = 0;
  while (out.length < o.lines) {
    const p = pool[(seed + i * 7) % pool.length]; i++;
    if (used.has(p.sku)) continue;
    used.add(p.sku);
    out.push({ sku: p.sku, qty: 1, price: p.price, alloc: 1, status: "Allocated" });
  }
  const shortVal = out.filter(l => l.status === "Short").reduce((a, l) => a + l.qty * l.price, 0);
  const rest = out.filter(l => l.status !== "Short");
  let remaining = o.value - shortVal;
  rest.forEach((l, k) => {
    if (k === rest.length - 1) { l.qty = Math.max(1, Math.round(remaining / l.price)); l.price = Math.round((remaining / l.qty) * 100) / 100; }
    else { const share = remaining / (rest.length - k) * (0.6 + ((seed >> k) % 8) / 10); l.qty = Math.max(1, Math.round(share / l.price)); remaining -= l.qty * l.price; }
    l.alloc = l.qty;
  });
  return out;
}

const TIMELINE_10482: [string, string, string][] = [
  ["20 Sep 17:40", "Atlas Industrial Supplies", "PO-8821 moved from its promised 20 Sep to 24 Sep."],
  ["22 Sep 11:18", "Sarah Byrne", "Order taken on a visit to the Naas Road yard. 18 lines, customer PO MBS-77412."],
  ["22 Sep 11:19", "Sage 200", "Allocated 15 of 18 lines. EL-4408, EL-4521 and IC-2290 linked to Atlas PO-8821, due 24 Sep."],
  ["24 Sep 16:02", "Atlas Industrial Supplies", "PO-8821 moved from 24 Sep to 25 Sep."],
  ["25 Sep 07:30", "Purchasing Agent", "Flagged Atlas's second missed date. Emma Walsh notified."],
  ["25 Sep 08:48", "Outlook", "Gerry Murphy: “Any update on the cable and glands? Site starts Saturday.” Linked to this order."],
  ["25 Sep 09:04", "Atlas Industrial Supplies", "PO-8821 moved to 26 Sep 10:30."],
  ["25 Sep 09:11", "Sarah Byrne", "Marked the order at risk and asked for a split-shipment option."],
];

function Detail() {
  const dx = useDx();
  const id = dx.rec.order || "SO-10482";
  const o = order(id) || order("SO-10482");
  const c = customer(o.cust);
  const lines = linesFor(o);
  const allocated = lines.filter(l => l.status !== "Short").length;
  const shortLines = lines.filter(l => l.status === "Short");
  const prof = orderProfit(o);
  const depPO = o.depPO ? po(o.depPO) : null;
  const rt = o.route && o.route !== "—" && o.route !== "Naas trunk" ? route(o.route) : null;
  const custInv = INVOICES.filter(i => i.cust === c.id);
  const isMurphy = o.id === "SO-10482";
  const atRisk = o.risk === "HIGH" || o.risk === "MEDIUM";
  const quick = ["SO-10482", "SO-10503", "SO-10497", "SO-10474", "SO-10491", "SO-10478"];

  const chain = [
    { k: "Customer", v: <RecLink kind="cust" id={c.id}>{c.name}</RecLink>, sub: c.segment + " · " + who(c.am).name + " · " + c.priceList, icon: IC.user },
    { k: "Order", v: o.id + " · " + eur(o.value), sub: "Placed " + o.placed + " via " + o.channel.toLowerCase() + " · customer PO " + o.custPO, icon: IC.doc },
    { k: "Lines", v: o.lines + " product lines", sub: shortLines.length ? allocated + " allocated · " + shortLines.length + " awaiting inventory" : "All " + o.lines + " allocated", tone: shortLines.length ? "warn" as Tone : "ok" as Tone, icon: IC.box },
    ...(shortLines.length ? [{ k: "Stock problem", v: shortLines.length + " line" + (shortLines.length > 1 ? "s" : "") + " affected", sub: shortLines.map(l => l.sku).join(" · "), tone: "bad" as Tone, onClick: () => dx.open("sku", shortLines[0].sku), icon: IC.alert }] : []),
    ...(depPO ? [
      { k: "Purchase order", v: <RecLink kind="po" id={depPO.id}>{depPO.id}</RecLink>, sub: <>{supplier(depPO.supplier).name} · {eur(depPO.value)} · {depPO.items} SKUs</>, icon: IC.cart },
      { k: "Supplier", v: depPO.daysLate + " days late", sub: "Promised " + depPO.promised + " · moved three times · supplier OTIF " + pct(supplier(depPO.supplier).otif), tone: "bad" as Tone, onClick: () => dx.open("supplier", depPO.supplier), icon: IC.factory },
      { k: "Expected arrival", v: depPO.eta || depPO.expected, sub: "Dublin dock 3 · " + depPO.pallets + " pallets", tone: "warn" as Tone, icon: IC.clock },
    ] : []),
    ...(o.status === "Credit hold" ? [{ k: "Credit", v: "Order held", sub: o.reason, tone: "bad" as Tone, onClick: () => dx.go("Finance", "credit", { cust: c.id }), icon: IC.euro }] : []),
    { k: "Delivery", v: rt ? <RecLink kind="route" id={rt.id}>{"Route " + rt.id}</RecLink> : o.route, sub: rt ? who(rt.driver).name + " · " + rt.vehicle + " · departs " + rt.depart : "Not yet routed", icon: IC.truck },
    { k: "Customer impact", v: isMurphy ? "Partial shipment available" : atRisk ? (o.reason || "At risk") : "On track", sub: isMurphy ? "15 lines (€24,776.80) can go today · 3 lines (€2,863.20) tomorrow afternoon" : c.delivery, tone: atRisk ? "warn" as Tone : "ok" as Tone, icon: IC.check },
  ];

  const lineCols: Col<SOLine>[] = [
    { k: "sku", label: "SKU", w: "0.85fr", render: l => <RecLink kind="sku" id={l.sku} /> },
    { k: "n", label: "Product", w: "2.4fr", render: l => product(l.sku).name },
    { k: "q", label: "Qty", w: "0.55fr", align: "right", mono: true, render: l => num(l.qty) },
    { k: "p", label: "Price", w: "0.75fr", align: "right", mono: true, render: l => eur(l.price, 2) },
    { k: "t", label: "Total", w: "0.9fr", align: "right", mono: true, render: l => eur(l.qty * l.price, 2) },
    { k: "a", label: "Allocated", w: "0.75fr", align: "right", mono: true, render: l => <span style={{ color: l.alloc < l.qty ? "var(--bad)" : undefined }}>{l.alloc}</span> },
    { k: "s", label: "Status", w: "1.4fr", render: l => l.status === "Short" ? <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Badge tone="bad">Short</Badge><span className="dx-faint" style={{ fontSize: 12 }}>{product(l.sku).po ? "on " + product(l.sku).po : ""}</span></span> : <Badge tone="ok">Allocated</Badge> },
  ];

  return (
    <Page eyebrow={"Order detail · " + WH(o.wh)} title={<>{o.id} <span style={{ color: "var(--dim)", fontWeight: 400 }}>· {c.name}</span></>}
      sub={<span style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{quick.map(q => <button key={q} className={"dx-btn dx-btn-sm " + (q === o.id ? "dx-btn-ghost" : "dx-btn-quiet")} onClick={() => dx.go("Orders", "detail", { order: q })}>{q}</button>)}</span>}
      right={<>{atRisk ? <Badge tone="bad" dot>AT RISK</Badge> : <Badge tone="ok" dot>ON TRACK</Badge>}<Btn onClick={() => dx.go("Orders", "live")}>All orders</Btn></>}>
      <KpiRow n={6}>
        <Kpi label="Order value" value={eur(o.value)} sub={o.lines + " lines"} />
        <Kpi label="Gross profit" value={eur(prof.gp)} sub={"after " + eur(prof.deliveryCost) + " delivery"} />
        <Kpi label="Margin" value={pct(o.margin)} sub="Target 25.0%" subTone={o.margin < 25 ? "warn" : "ok"} />
        <Kpi label="Required" value={o.required} sub={c.delivery} />
        <Kpi label="Status" value={<span style={{ fontSize: 20 }}>{o.status}</span>} sub={o.stock} subTone={o.stock === "Available" ? "ok" : "warn"} />
        <Kpi label="Account manager" value={<span style={{ fontSize: 18 }}>{who(o.am).name}</span>} sub={who(o.am).role} />
      </KpiRow>

      <Grid cols="minmax(0,5fr) minmax(0,7fr)" gap={14}>
        <Card title="The full chain" sub="From customer to delivery. Every step opens the record behind it.">
          <Chain steps={chain} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {isMurphy && (
            <AiCard agent="Ops Watchdog · checked 09:14" title="Recommended action" actions={<>
              <ActBtn id="so10482-partial" kind="primary" label="Approve Partial Shipment" done="Partial shipment approved" toast="SO-10482 split: 15 lines on D14 today, 3 lines tomorrow PM. Gerry Murphy notified by Sarah Byrne." />
              <ActBtn id="so10482-contact" label="Contact Customer" done="Email sent to Gerry Murphy" toast="Sarah's update sent to gerry@murphybuilding.ie with the new ETA for the 3 lines." />
              <ActBtn id="d-expedite" label="Expedite Supplier" done="PO-8821 expedited" toast="PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow." />
              <ActBtn id="so10482-realloc" label="Reallocate Stock" done="Substitute EL-4412 offered" toast="Cable line re-pointed to EL-4412 (84 in Dublin) pending Murphy's yes. Glands and ties stay on PO-8821." />
            </>}>
              Dispatch the 15 available lines today and automatically notify Murphy Building Supplies that the remaining 3 lines will arrive tomorrow afternoon.
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--dim)" }}>
                Splitting adds one drop to tomorrow's D14 PM run: {eur(SO10482_PROFIT.splitExtra)} delivery cost, margin {pct(SO10482_PROFIT.margin)} → 24.0%. Murphy has accepted split deliveries 6 times this year, and their site starts Saturday.
              </div>
            </AiCard>
          )}
          {o.status === "Credit hold" && (
            <AiCard agent="Credit Agent" title="Held for credit" actions={<>
              <ActBtn id="d-credit" kind="primary" label="Release €7,320" done="€7,320 released" toast="SO-10503 part-released: €7,320 against available credit. Payment request for INV-28482 sent." />
              <Btn onClick={() => dx.go("Finance", "credit", { cust: c.id })}>Open credit case</Btn>
            </>}>
              {c.name} has {eur(c.balance)} on account against a {eur(c.limit)} limit, {eur(c.overdue)} of it overdue. Releasing this order in full takes exposure to {eur(c.balance + o.value)}.
            </AiCard>
          )}
          {!isMurphy && o.status !== "Credit hold" && atRisk && (
            <AiCard agent="Ops Watchdog" title="Why this order is at risk" actions={<>
              {o.depPO && <Btn small kind="primary" onClick={() => dx.open("po", o.depPO!)}>Open {o.depPO}</Btn>}
              {o.id === "SO-10526" || o.id === "SO-10497" || o.id === "SO-10509" ? <ActBtn id="d-transfer" small label="Approve Naas transfer" done="Transfer approved" toast="TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van." /> : null}
              {rt && <Btn small onClick={() => dx.open("route", rt.id)}>Route {rt.id}</Btn>}
            </>}>
              {o.reason}. {TRANSFER_EL4408.orders.includes(o.id) ? "The 40-unit Naas transfer (TR-2291) covers this order's cable line if it's approved by 10:30." : o.depPO ? "It will be released when " + o.depPO + " is put away." : "Owner: " + who(o.am).name + "."}
            </AiCard>
          )}
          <Card title="Order profitability" sub="Revenue isn't the same as profitable revenue">
            <Facts cols={3} items={[
              ["Revenue", eur(prof.revenue)], ["Product cost", eur(prof.productCost)], ["Delivery cost", eur(prof.deliveryCost)],
              ["Discount vs list", eur(prof.discount)], ["Estimated gross profit", eur(prof.gp), "ok"], ["Margin", pct(prof.margin), prof.margin < 24 ? "warn" : undefined],
            ]} />
            <div style={{ marginTop: 12 }}>
              <Strip fmt={n => eur(n)} parts={[{ label: "Product cost", value: prof.productCost, tone: "var(--chart-muted)" }, { label: "Delivery", value: prof.deliveryCost, tone: "warn" }, { label: "Gross profit", value: prof.gp, tone: "accent" }]} />
            </div>
          </Card>
          <Card title="Customer context" onClick={() => dx.go("Customers", "detail", { cust: c.id })}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, fontSize: 13 }}>
              <div><div className="dx-faint" style={{ fontSize: 11.5 }}>Credit used</div><div style={{ marginTop: 6 }}><Meter value={c.balance} max={c.limit} tone={c.balance / c.limit > 0.85 ? "bad" : "accent"} /></div><div className="dx-num" style={{ marginTop: 5 }}>{eur(c.balance)} of {eur(c.limit)}</div></div>
              <div><div className="dx-faint" style={{ fontSize: 11.5 }}>Terms</div><div style={{ marginTop: 6 }}>{c.terms}</div><div className="dx-muted" style={{ marginTop: 3 }}>{custInv.length} open invoices</div></div>
              <div><div className="dx-faint" style={{ fontSize: 11.5 }}>This account</div><div style={{ marginTop: 6 }}>{eur(c.revYTD)} YTD · {pct(c.margin)}</div><div className="dx-muted" style={{ marginTop: 3 }}>OTIF {pct(c.otif)}</div></div>
            </div>
          </Card>
        </div>
      </Grid>

      <Card title="Lines" sub={o.lines + " lines · " + eur(o.value) + (shortLines.length ? " · " + shortLines.length + " short worth " + eur(shortLines.reduce((a, l) => a + l.qty * l.price, 0), 2) : "")} pad={false} style={{ marginTop: 14 }}>
        <Table cols={lineCols} rows={lines} rowTone={l => (l.status === "Short" ? "bad" : undefined)} />
      </Card>

      {isMurphy && (
        <Grid cols="minmax(0,1fr) minmax(0,1fr)" gap={14} style={{ marginTop: 14 }}>
          <AiCard agent="Inventory Agent" title="A substitute for the cable line">
            {SUBSTITUTE.unavailable} × EL-4408 are unavailable. <RecLink kind="sku" id={SUBSTITUTE.sub}>Industrial Cable Pro 100m</RecLink> has {SUBSTITUTE.available} in Dublin: +{eur(SUBSTITUTE.priceDiff, 2)}/unit, {SUBSTITUTE.compat.toLowerCase()}, margin {pct(SUBSTITUTE.margin)}. {SUBSTITUTE.note}
            <div style={{ marginTop: 12 }}><ActBtn id="sub-el4412" small label="Offer Substitute" done="Substitute offered to Murphy" toast="Substitute offer sent to Gerry Murphy: 28 × EL-4412 at +€8.40/unit, held for 24 hours." /></div>
          </AiCard>
          <Card title="Draft to the customer" sub="Written by Pulse from the order, for Sarah to send" right={<ActBtn id="so10482-contact" small kind="primary" label="Send" done="Sent 09:17" toast="Sarah's update sent to gerry@murphybuilding.ie." />}>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--body)", whiteSpace: "pre-line" }}>
              {"Hi Gerry,\n\n15 of the 18 lines on MBS-77412 leave us this afternoon on our 13:45 run and will be at the Naas Road yard by 14:30.\n\nThe 3 remaining lines (the 100m industrial cable, the 20mm SWA glands and the 300mm cable ties) are due in from our supplier tomorrow at 10:30 and will be with you tomorrow afternoon. If you'd rather have the cable today, we can send Industrial Cable Pro instead at €8.40 a drum more.\n\nSarah"}
            </div>
          </Card>
        </Grid>
      )}

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Timeline" sub="Everything that touched this order, from every system" pad={false}>
          <div className="dx-list">
            {(isMurphy ? TIMELINE_10482 : [
              [o.placed, who(o.am).name, "Order entered, customer PO " + o.custPO + "."],
              [o.placed, "Sage 200", allocated + " of " + o.lines + " lines allocated from " + WH(o.wh) + "."],
              ...(o.reason ? [["25 Sep 08:4" + (o.id.charCodeAt(7) % 9), "Ops Watchdog", o.reason + "."]] : []),
              ...(o.status === "Delivered" ? [["25 Sep 08:47", "Route planner", "Proof of delivery captured."]] : []),
            ] as [string, string, string][]).map(([t, a, x], i) => (
              <div key={i} className="dx-li" style={{ borderTop: i ? undefined : 0 }}>
                <span className="dx-num dx-faint" style={{ fontSize: 12, width: 86, flex: "none" }}>{t}</span>
                <div style={{ fontSize: 13, lineHeight: 1.5, minWidth: 0 }}><b style={{ fontWeight: 600 }}>{a}</b> <span className="dx-muted">{x}</span></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Also on this account" pad={false}>
          <Table dense onRow={r => dx.go("Orders", "detail", { order: r.id })} rows={ORDERS.filter(x => x.cust === c.id && x.id !== o.id)} empty="No other open orders." cols={[
            { k: "id", label: "Order", w: "96px", render: r => <RecLink kind="order" id={r.id} /> },
            { k: "v", label: "Value", align: "right", mono: true, render: r => eur(r.value) },
            { k: "req", label: "Required", render: r => r.required },
            { k: "st", label: "Status", w: "1.2fr", render: r => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          ]} />
          {custInv.length > 0 && <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)" }}>{custInv.length} open invoices · {eur(custInv.reduce((a, i) => a + i.amount, 0))} outstanding{c.overdue ? " · " + eur(c.overdue) + " overdue" : ""}</div>}
        </Card>
      </Grid>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = { overview: Overview, live: Live, risk: AtRisk, backorders: Backorders, allocation: Allocation, detail: Detail };
