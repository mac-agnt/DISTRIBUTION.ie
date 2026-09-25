import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  COST_CHANGES, GOODS_IN_TODAY, KPI, ORDERS, OTIF, POS, SKU_DEMAND, SUPPLIERS, TODAY, COMPANY, WAREHOUSES, SUPPLIER_COMPARE_EL4408,
  customer, eur, eurK, num, pct, po, product, supplier, who, type PO, type Supplier,
} from "../db";
import {
  ActBtn, AiCard, Avatar, Badge, Btn, Card, Chain, Columns, Facts, Grid, HBars, IC, Icon, Kpi, KpiRow, Meter, Note, Page, Person, RecLink, Ripple, Risk,
  Seg, Strip, Table, useDx, useLocal, type ChainStep, type Col, type Tone,
} from "../ui";
import { Linked, ProcurementDecision, SUP_SHORT, TwoLine, Wrap } from "./Inventory";

/* Purchasing: what to buy, what's on order, what lands today, and which suppliers keep letting customers down. */

const sName = (id: string) => SUP_SHORT[id] || supplier(id).name;
const statusTone = (p: PO): Tone =>
  p.status === "Late" ? "bad" : p.status === "Due today" ? "accent" : p.status === "Confirmed" || p.status === "Received" ? "ok" : p.status === "Awaiting confirmation" || p.status === "Part received" ? "warn" : "neutral";
const statusText = (p: PO) => (p.status === "Late" ? "Late · " + p.daysLate + (p.daysLate === 1 ? " day" : " days") : p.id === "PO-8826" ? "Arrived 08:40" : p.status === "Awaiting confirmation" ? "Unconfirmed" : p.status);
const etaTime = (p: PO) => (p.eta || "").replace("Today ", "").replace(" · arrived", "");
const etaClock = (p: PO) => ((p.eta || "").match(/\d\d:\d\d/) || [""])[0];
const riskOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const PO_SORT = POS.slice().sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || b.depValue - a.depValue || (a.status === "Late" ? -1 : 0) - (b.status === "Late" ? -1 : 0));
const preset: { f?: string } = {};

/* Draft POs, consolidated by supplier. MOQs respected; values reconcile with the replenishment lines. */
type DraftLine = { sku: string; qty: number; cost: number; moq: number; why: string };
type Draft = { id: string; act: string; supplier: string; lines: DraftLine[]; lead: number; orderBy: string; lands: string; buyer: string; note: string; toast: string; send: string };
const DRAFTS: Draft[] = [
  { id: "PO-8852", act: "po-el4408", supplier: "eurocable", lead: 9, orderBy: "Today", lands: "4 Oct", buyer: "emma",
    lines: [{ sku: "EL-4408", qty: 160, cost: 22.20, moq: 50, why: "Dublin stocks out 28 Sep at today's 12 available. 68 of PO-8821's 120 are already owed to waiting orders." }],
    note: "EuroCable over Atlas: €0.45 more landed per drum (€72 on this order), 19 days quicker, 97.8% OTIF.",
    toast: "PO-8852 drafted: 160 × EL-4408 from EuroCable BV, €3,552. Waiting on Emma's approval.", send: "PO-8852 approved and sent to EuroCable BV. Due 4 Oct." },
  { id: "PO-8853", act: "po-8853", supplier: "atlas", lead: 28, orderBy: "Today", lands: "23 Oct", buyer: "emma",
    lines: [{ sku: "EL-4521", qty: 200, cost: 17.10, moq: 100, why: "Demand up 34% on last quarter. PO-8821 covers 6 weeks, lead time is 4." }],
    note: "Atlas keeps this one. 28 days lands 23 Oct, well before the 4 Nov stockout, so the lowest landed cost wins.",
    toast: "PO-8853 drafted: 200 × EL-4521 from Atlas, €3,420.", send: "PO-8853 approved and sent to Atlas Industrial Supplies. Due 23 Oct." },
  { id: "PO-8854", act: "po-8854", supplier: "eurofix", lead: 14, orderBy: "Today", lands: "9 Oct", buyer: "ciaran",
    lines: [
      { sku: "FIX-1180", qty: 200, cost: 23.10, moq: 100, why: "No PO open. Three open quotes (€9,420) include it. Stockout 5 Oct." },
      { sku: "FIX-2201", qty: 250, cost: 18.10, moq: 250, why: "Stockout 6 Nov. Added now to clear EuroFix's €8,000 free-carriage threshold." },
    ],
    note: "€9,145 clears the €8,000 carriage threshold and saves €185 freight. Priced at EuroFix's new cost: M10 bolts are up 10.4% since 1 Sep.",
    toast: "PO-8854 drafted: 200 × FIX-1180 and 250 × FIX-2201 from EuroFix GmbH, €9,145.", send: "PO-8854 approved and sent to EuroFix GmbH. Due 9 Oct." },
  { id: "PO-8855", act: "po-8855", supplier: "safepro", lead: 10, orderBy: "30 Sep", lands: "10 Oct", buyer: "ciaran",
    lines: [{ sku: "SAF-3310", qty: 400, cost: 4.60, moq: 400, why: "Winter uplift starts in October. Last year demand rose 22% in the first three weeks." }],
    note: "Order by 30 Sep to land before the 14 Oct Dublin stockout. SafePro short-shipped PO-8826 by 40 boxes this morning.",
    toast: "PO-8855 drafted: 400 × SAF-3310 from SafePro, €1,840.", send: "PO-8855 approved and sent to SafePro. Due 10 Oct." },
];
const draftValue = (d: Draft) => d.lines.reduce((a, l) => a + l.qty * l.cost, 0);
const DRAFT_TOTAL = DRAFTS.reduce((a, d) => a + draftValue(d), 0);

function DraftBtn({ d, small = true }: { d: Draft; small?: boolean }) {
  const dx = useDx();
  if (!dx.acted[d.act]) return <ActBtn id={d.act} small={small} kind="primary" label={d.act === "po-el4408" ? "Create Purchase Order" : "Create " + d.id} done={d.id + " drafted"} toast={d.toast} />;
  return <ActBtn id={d.act + "-send"} small={small} kind="primary" label={"Approve and send " + d.id} done={"Sent to " + sName(d.supplier)} toast={d.send} />;
}

/* ---------- Overview ---------- */
type QItem = { id: string; title: string; sup: string; why: string; owner: string; due: string; draft?: Draft; label?: string; done?: string; toast?: string };
const QUEUE: QItem[] = [
  { id: "d-expedite", title: "Expedite PO-8821 for €420 freight", sup: "atlas", owner: "emma", due: "Today 09:30",
    why: "A dedicated van tonight lands at 06:30 instead of tomorrow's 10:30 groupage, before the first wave. Protects €41,880 across 6 orders.",
    label: "Approve €420", done: "Expedited · lands 06:30", toast: "PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow. Six account managers notified." },
  { id: "po-el4408", title: "PO-8852 · 160 × EL-4408 · " + eur(3552), sup: "eurocable", owner: "emma", due: "Today", draft: DRAFTS[0],
    why: "Cable for October. Buying from EuroCable, not Atlas: 9 days instead of 28, for €72 more on the order." },
  { id: "po-8853", title: "PO-8853 · 200 × EL-4521 · " + eur(3420), sup: "atlas", owner: "emma", due: "Today", draft: DRAFTS[1],
    why: "Glands stocked out in Dublin. Atlas's 28 days still lands before the 4 Nov stockout, so the cheaper supplier wins here." },
  { id: "po-8854", title: "PO-8854 · FIX-1180 and FIX-2201 · " + eur(9145), sup: "eurofix", owner: "ciaran", due: "Today", draft: DRAFTS[2],
    why: "Concrete screws run out 5 Oct with no PO open. Adding 250 M10 bolts clears free carriage." },
  { id: "po-saf-cancel", title: "Cancel planned SafePro PO · −" + eur(1050), sup: "safepro", owner: "ciaran", due: "Before 3 Oct",
    why: "500 × SAF-1892 planned for 3 Oct. Naas holds 22 weeks' cover: move 600 to Dublin on TR-2292 instead.",
    label: "Cancel planned PO", done: "Planned PO cancelled", toast: "SafePro's 3 Oct PO for 500 × SAF-1892 cancelled. TR-2292 raised for 600 from Naas." },
];
const RISKS: { s: string; tone: Tone; head: string; detail: string }[] = [
  { s: "atlas", tone: "bad", head: "2 late POs · 8 customer orders waiting", detail: "PO-8821 is 5 days late with €41,880 exposed, and PO-8815 for Naas is 1 day late. OTIF 86.2%, on its quoted lead time 71% of the time." },
  { s: "hansen", tone: "warn", head: "PO-8817 3 days late · quality claim open", detail: "Short-shipped the resin line in August as well. Sealant batch 2231 is splitting at the nozzle: 9 returns and claim HC-212." },
  { s: "toolcraft", tone: "warn", head: "PO-8850 not confirmed · PO-8809 2 days late", detail: "€16,280 raised 24 Sep with no confirmation yet. 2 customer orders waiting on PO-8809." },
  { s: "lumos", tone: "warn", head: "PO-8812 3 days late · invoiced in sterling", detail: "€440k a year in GBP. 1 Naas order waiting on the LED line." },
];

function Overview() {
  const dx = useDx();
  const late = POS.filter(p => p.status === "Late").sort((a, b) => b.depValue - a.depValue);
  const today = GOODS_IN_TODAY.map(po).sort((a, b) => etaTime(a).localeCompare(etaTime(b)));
  const pallets = today.reduce((a, p) => a + (p.pallets || 0), 0);
  const value = today.reduce((a, p) => a + p.value, 0);
  const lateCols: Col<PO>[] = [
    { k: "id", label: "PO", w: "1.6fr", render: r => <TwoLine top={<RecLink kind="po" id={r.id} />} bottom={sName(r.supplier) + " · " + WAREHOUSES[r.wh].short} /> },
    { k: "late", label: "Late by", w: "0.9fr", render: r => <TwoLine top={<span style={{ color: "var(--bad)" }}>{r.daysLate} day{r.daysLate > 1 ? "s" : ""}</span>} bottom={"now " + r.expected} /> },
    { k: "d", label: "Waiting", w: "1fr", align: "right", render: r => (
      <div style={{ textAlign: "right" }}><div>{r.deps} order{r.deps > 1 ? "s" : ""}</div><div className="dx-num" style={{ fontSize: 12, marginTop: 2, color: "var(--bad)" }}>{eur(r.depValue)}</div></div>
    ) },
    { k: "r", label: "Risk", w: "1fr", render: r => <Risk r={r.risk} /> },
  ];
  const costCols: Col<(typeof COST_CHANGES)[number]>[] = [
    { k: "sku", label: "SKU", w: "1.25fr", render: r => <TwoLine top={<RecLink kind="sku" id={r.sku} />} bottom={<RecLink kind="supplier" id={r.supplier} plain>{sName(r.supplier)}</RecLink>} /> },
    { k: "c", label: "Cost", w: "1.25fr", align: "right", render: r => (
      <div style={{ textAlign: "right" }}><div className="dx-num">{eur(r.prev, 2)} → {eur(r.now, 2)}</div><div style={{ fontSize: 12, marginTop: 2, color: "var(--warn)" }}>+{pct(((r.now - r.prev) / r.prev) * 100)}</div></div>
    ) },
    { k: "cu", label: "On old price", w: "1fr", align: "right", render: r => r.customers + " cust." },
    { k: "i", label: "Margin / mo", w: "0.95fr", align: "right", mono: true, render: r => <span style={{ color: "var(--bad)" }}>{eur(r.impact)}</span> },
    { k: "st", label: "Status", w: "1.3fr", render: r => <Wrap><span style={{ color: /^Passed/.test(r.status) ? "var(--ok)" : /Partly/.test(r.status) ? "var(--warn)" : "var(--bad)" }}>{r.status}</span></Wrap> },
  ];
  const goOrders = (f: string) => { preset.f = f; dx.go("Purchasing", "orders"); };
  return (
    <Page eyebrow={"Purchasing · " + TODAY.long + " · " + TODAY.time} title="What we've bought, what's late, what to buy next"
      sub="82 open purchase orders worth €742k across 64 suppliers. Every PO is tied to the customer orders waiting on it."
      right={<>
        <Btn icon={IC.chat} onClick={() => dx.ask("Which supplier is causing us the most disruption?")}>Ask Purchasing Agent</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Purchasing", "orders")}>Purchase orders</Btn>
      </>}>
      <KpiRow n={6}>
        <Kpi label="Open POs" value={String(KPI.openPOs)} sub="Across 64 suppliers" onClick={() => goOrders("all")} />
        <Kpi label="Open PO value" value={eurK(KPI.openPOValue)} sub="Committed spend" onClick={() => goOrders("all")} />
        <Kpi label="Due this week" value={String(KPI.posDueWeek)} sub="7 landing today" onClick={() => dx.go("Purchasing", "incoming")} />
        <Kpi label="Late POs" value={String(KPI.latePOs)} tone="bad" sub="5 with customer orders waiting" subTone="bad" onClick={() => goOrders("late")} />
        <Kpi label="Supplier fill rate" value={pct(KPI.fillRate)} sub="Last 90 days" subTone="warn" onClick={() => dx.go("Purchasing", "performance")} />
        <Kpi label="Recommended purchases" value={eurK(KPI.recommendedBuy)} sub={KPI.reorderRecs + " lines"} onClick={() => dx.go("Purchasing", "recommendations")} />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14}>
        <Card title="Approval queue" sub={QUEUE.filter(q => !dx.acted[q.draft ? q.draft.act + "-send" : q.id]).length + " waiting · the expedite decision closes at 09:30"} pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Work", "approvals")}>All approvals</Btn>}>
          <div className="dx-list">
            {QUEUE.map((q, i) => (
              <div key={q.id} className="dx-li" style={{ borderTop: i ? undefined : 0 }}>
                <Avatar id={q.owner} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}><Linked text={q.title} /></span>
                    <span style={{ fontSize: 12, color: q.due.includes("09:30") ? "var(--warn)" : "var(--dim)", display: "inline-flex", gap: 5, alignItems: "center" }}><Icon d={IC.clock} s={12} />{q.due}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2 }}><RecLink kind="supplier" id={q.sup} plain>{supplier(q.sup).name}</RecLink> · {who(q.owner).name}</div>
                  <div style={{ fontSize: 13, color: "var(--body)", marginTop: 5, lineHeight: 1.5 }}><Linked text={q.why} /></div>
                  <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
                    {q.draft ? <DraftBtn d={q.draft} /> : <ActBtn id={q.id} small kind="primary" label={q.label!} done={q.done!} toast={q.toast} />}
                    {q.id === "d-expedite" && <Btn small kind="quiet" onClick={() => dx.go("Purchasing", "orders", { po: "PO-8821" })}>See the 6 orders</Btn>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent="Purchasing Agent · 07:30" title="One supplier is most of today's problem"
            actions={<>
              <Btn small kind="primary" onClick={() => dx.go("Purchasing", "orders", { po: "PO-8821" })}>Open PO-8821</Btn>
              <Btn small onClick={() => dx.go("Purchasing", "performance", { supplier: "atlas" })}>Atlas scorecard</Btn>
            </>}>
            Atlas has 2 of the 5 late POs that customers are waiting on, and {eur(41880 + 5360)} of the {eur(late.reduce((a, p) => a + p.depValue, 0))} exposed.
            {" "}Approve the €420 expedite on <RecLink kind="po" id="PO-8821" /> before 09:30 and Murphy's three short lines land before tomorrow's first wave.
            {" "}Buy this month's cable from EuroCable, not Atlas.
          </AiCard>
          <Card title="Supplier risks" sub="Suppliers with late, short or disputed deliveries right now" pad={false}>
            <div className="dx-list">
              {RISKS.map((r, i) => (
                <div key={r.s} className="dx-li dx-click" onClick={() => dx.open("supplier", r.s)} style={{ borderTop: i ? undefined : 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, marginTop: 7, flex: "none", background: r.tone === "bad" ? "var(--bad)" : "var(--warn)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{supplier(r.s).name} <Risk r={supplier(r.s).status} /></div>
                    <div style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 3 }}>{r.head}</div>
                    <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2, lineHeight: 1.5 }}><Linked text={r.detail} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Grid>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Late supplier orders" sub={late.length + " of " + KPI.latePOs + " late POs have customer orders waiting. The other " + (KPI.latePOs - late.length) + " are stock replenishment only."} pad={false}
          right={<Btn small kind="quiet" onClick={() => goOrders("late")}>All late</Btn>}>
          <Table cols={lateCols} rows={late} onRow={r => dx.go("Purchasing", "orders", { po: r.id })} rowTone={r => (r.risk === "CRITICAL" ? "bad" : undefined)} />
        </Card>
        <Card title="Incoming stock today" sub={today.length + " deliveries · " + pallets + " pallets · " + eur(value)} pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Purchasing", "incoming")}>Schedule</Btn>}>
          <div className="dx-list">
            {today.map((p, i) => (
              <div key={p.id} className="dx-li dx-click" onClick={() => dx.open("po", p.id)} style={{ borderTop: i ? undefined : 0, padding: "9px 20px", alignItems: "center" }}>
                <span className="dx-num" style={{ width: 42, flex: "none", fontSize: 12.5, color: p.id === "PO-8826" ? "var(--ok)" : "var(--dim)" }}>{etaTime(p)}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                  <RecLink kind="po" id={p.id} /> <span style={{ marginLeft: 4 }}>{sName(p.supplier)}</span>
                  <span className="dx-faint"> · {WAREHOUSES[p.wh].short} · {p.pallets} pallets</span>
                </div>
                <span className="dx-num" style={{ fontSize: 13 }}>{eur(p.value)}</span>
              </div>
            ))}
            <div className="dx-li" style={{ padding: "10px 20px", fontSize: 12.5, color: "var(--dim)" }}>
              <span style={{ color: "var(--bad)", marginTop: 1 }}><Icon d={IC.alert} s={14} /></span>
              <span><RecLink kind="po" id="PO-8821" /> is not among them. It lands tomorrow at {dx.acted["d-expedite"] ? "06:30" : "10:30"} with 6 customer orders waiting.</span>
            </div>
          </div>
        </Card>
      </Grid>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Cost increases" sub="Supplier price-file changes imported at 08:22. €2,940 a month still isn't passed through to customers." pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Pricing", "costs")}>Cost changes</Btn>}>
          <Table cols={costCols} rows={COST_CHANGES} onRow={r => dx.open("sku", r.sku)} rowTone={r => (r.impact > 500 ? "bad" : undefined)} />
        </Card>
        <Card title="Purchasing recommendations" sub={"4 draft POs ready today, " + eur(DRAFT_TOTAL) + ", from " + KPI.reorderRecs + " lines"} pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Purchasing", "recommendations")}>Recommendations</Btn>}>
          <div className="dx-list">
            {DRAFTS.map((d, i) => (
              <div key={d.id} className="dx-li" style={{ borderTop: i ? undefined : 0, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{sName(d.supplier)} <span className="dx-faint" style={{ fontWeight: 400 }}>· {d.id}</span></div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2 }}>
                    {d.lines.map((l, j) => <span key={l.sku}>{j ? ", " : ""}{num(l.qty)} × <RecLink kind="sku" id={l.sku} /></span>)} · order {d.orderBy.toLowerCase() === "today" ? "today" : "by " + d.orderBy} · lands {d.lands}
                  </div>
                </div>
                <span className="dx-num" style={{ fontSize: 13, fontWeight: 500 }}>{eur(draftValue(d))}</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

/* ---------- Recommendations ---------- */
function Recommendations() {
  const dx = useDx();
  const lineCols: Col<DraftLine>[] = [
    { k: "sku", label: "Product", w: "2.2fr", render: r => <TwoLine top={<RecLink kind="sku" id={r.sku} />} bottom={product(r.sku).name} /> },
    { k: "q", label: "Qty", w: "0.7fr", align: "right", mono: true, render: r => num(r.qty) },
    { k: "m", label: "MOQ", w: "0.7fr", align: "right", mono: true, render: r => <span style={{ color: r.qty % r.moq === 0 ? undefined : "var(--warn)" }}>{num(r.moq)}</span> },
    { k: "c", label: "Unit", w: "0.85fr", align: "right", mono: true, render: r => eur(r.cost, 2) },
    { k: "v", label: "Value", w: "0.95fr", align: "right", mono: true, render: r => eur(r.qty * r.cost) },
  ];
  const e = SUPPLIER_COMPARE_EL4408.find(s => s.rec)!, a = SUPPLIER_COMPARE_EL4408.find(s => !s.rec)!;
  return (
    <Page eyebrow="Purchasing · Recommendations" title="What to buy, consolidated by supplier"
      sub="The Inventory Agent's line-level recommendations, grouped into one draft PO per supplier, rounded up to MOQ and checked against carriage thresholds. A buyer approves every one."
      right={<Btn onClick={() => dx.go("Inventory", "replenishment")}>Line-level view</Btn>}>
      <KpiRow n={4}>
        <Kpi label="Recommended purchases" value={eurK(KPI.recommendedBuy)} sub={KPI.reorderRecs + " lines across the range"} onClick={() => dx.go("Inventory", "replenishment")} />
        <Kpi label="Draft POs ready today" value={String(DRAFTS.length)} sub={eur(DRAFT_TOTAL) + " · " + DRAFTS.reduce((s, d) => s + d.lines.length, 0) + " lines"} tone="accent" />
        <Kpi label="Lines below MOQ" value="0" sub="Every line rounded up to the supplier's MOQ" subTone="ok" />
        <Kpi label="Cheapest supplier overruled" value="1" sub={"EL-4408 to EuroCable, +" + eur(Math.round((e.landed - a.landed) * 160))} subTone="warn" />
      </KpiRow>

      <Grid cols="repeat(2,minmax(0,1fr))" gap={14}>
        {DRAFTS.map(d => {
          const s = supplier(d.supplier);
          const drafted = !!dx.acted[d.act], sent = !!dx.acted[d.act + "-send"];
          return (
            <Card key={d.id} tone={d.orderBy === "Today" && !drafted ? "accent" : undefined} pad={false}
              title={<>{d.id} · <RecLink kind="supplier" id={d.supplier} plain>{s.name}</RecLink></>}
              sub={d.lines.length + " line" + (d.lines.length > 1 ? "s" : "") + " · " + d.lead + "-day lead time, lands " + d.lands + " · OTIF " + pct(s.otif) + " · " + s.currency + " · " + s.terms}
              right={<Badge tone={sent ? "ok" : drafted ? "warn" : "accent"}>{sent ? "Sent" : drafted ? "Awaiting approval" : "Order " + (d.orderBy === "Today" ? "today" : "by " + d.orderBy)}</Badge>}>
              <Table dense cols={lineCols} rows={d.lines} onRow={r => dx.open("sku", r.sku)} />
              <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                {d.lines.map(l => (
                  <div key={l.sku} style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}><RecLink kind="sku" id={l.sku} /> <span className="dx-muted"><Linked text={l.why} /></span></div>
                ))}
                <div style={{ fontSize: 12.5, color: "var(--accent)", lineHeight: 1.5 }}><Linked text={d.note} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }} className="dx-num">{eur(draftValue(d))}</span>
                  <span style={{ fontSize: 12.5, color: "var(--dim)", flex: 1 }}>Buyer <Person id={d.buyer} /></span>
                  <DraftBtn d={d} />
                </div>
              </div>
            </Card>
          );
        })}
      </Grid>

      <Card title="Buy less" sub="Recommendations that reduce spend: cancel, transfer or wait" style={{ marginTop: 14 }} pad={false}>
        <div className="dx-list">
          <div className="dx-li" style={{ borderTop: 0, alignItems: "center" }}>
            <span style={{ color: "var(--ok)" }}><Icon d={IC.swap} s={15} /></span>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.55 }}>
              <b style={{ fontWeight: 600 }}>Cancel SafePro's planned 3 Oct PO for 500 × <RecLink kind="sku" id="SAF-1892" /> (−{eur(1050)}).</b>
              <span className="dx-muted"> <Linked text="Naas holds 22 weeks of safety glasses. TR-2292 moves 600 to Dublin instead." /></span>
            </div>
            <ActBtn id="po-saf-cancel" small label="Cancel planned PO" done="Planned PO cancelled" toast="SafePro's 3 Oct PO for 500 × SAF-1892 cancelled. TR-2292 raised for 600 from Naas." />
          </div>
          <div className="dx-li" style={{ alignItems: "center" }}>
            <span style={{ color: "var(--accent)" }}><Icon d={IC.truck} s={15} /></span>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.55 }}>
              <b style={{ fontWeight: 600 }}>Transfer before buying on four lines.</b>
              <span className="dx-muted"> <Linked text="TR-2291 (EL-4408), TR-2292 (SAF-1892), TR-2293 (EL-3102) and TR-2294 (EL-4521) move Naas stock to where it sells." /></span>
            </div>
            <Btn small kind="quiet" onClick={() => dx.go("Inventory", "transfers")}>Transfers</Btn>
          </div>
          <div className="dx-li" style={{ alignItems: "center" }}>
            <span style={{ color: "var(--dim)" }}><Icon d={IC.check} s={15} /></span>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.55 }}>
              <b style={{ fontWeight: 600 }}>Wait on three lines.</b>
              <span className="dx-muted"> <Linked text="EL-5530 and IC-4470 are covered once PO-8821 lands. JAN-2210 goes on Kingfield's weekly run; they deliver in 5 days." /></span>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 14 }}><ProcurementDecision /></div>
    </Page>
  );
}

/* ---------- Purchase orders ---------- */
const PO_HISTORY: Record<string, ChainStep[]> = {
  "PO-8821": [
    { k: "15 Sep", v: "Raised by Emma Walsh", sub: "€38,640 · 14 SKUs · promised 20 Sep", tone: "neutral" },
    { k: "16 Sep", v: "Atlas confirmed 20 Sep", sub: "Dublin, 18 pallets", tone: "ok" },
    { k: "19 Sep 16:40", v: "Atlas moved it to 24 Sep", sub: "Cable drums not ready in Manchester", tone: "warn" },
    { k: "Today 07:30", v: "Second date missed", sub: "Purchasing Agent flagged it and told Emma", tone: "bad" },
    { k: "Today 09:04", v: "Atlas moved it again", sub: "Now 26 Sep 10:30 on groupage", tone: "bad" },
    { k: "Offer", v: "Dedicated van tonight, €420", sub: "Lands 06:30, before the first wave", tone: "accent" },
  ],
};
const PO_NOTES: Record<string, string> = {
  "PO-8826": "760 of 800 nitrile gloves received at 08:40. Supplier claim for the 40 drafted.",
  "PO-8830": "48 pallets at 11:00. Two pickers are moving to goods-in to unload it, so wave 3 is running 40 minutes behind.",
  "PO-8850": "Toolcraft hasn't confirmed after a day. It slips into the 15 Oct window unless it's chased.",
  "PO-8815": "Atlas again: 11 SKUs for Naas, 1 day late, 2 customer orders waiting.",
  "PO-8839": "Bristol hasn't sent an ASN. Dock 5 is booked for 14:30.",
};

function PoDetail({ id }: { id: string }) {
  const dx = useDx();
  const x = po(id);
  const s = supplier(x.supplier);
  const deps = ORDERS.filter(o => o.depPO === id);
  const expedited = id === "PO-8821" && !!dx.acted["d-expedite"];
  const note = x.note || PO_NOTES[id];
  const steps: ChainStep[] = PO_HISTORY[id] ? PO_HISTORY[id].map(st => (expedited && st.k === "Offer" ? { ...st, k: "Approved", v: "Dedicated van booked, €420", tone: "ok" } : st)) : [
    { k: x.ordered, v: "Raised by " + who(x.buyer).name, sub: eur(x.value) + " · " + x.items + " SKUs" },
    { k: x.promised, v: "Promised by " + sName(x.supplier), tone: x.status === "Late" ? "bad" : "ok", sub: x.status === "Late" ? "Missed by " + x.daysLate + (x.daysLate === 1 ? " day" : " days") : undefined },
    { k: x.expected === "—" ? "Not confirmed" : x.expected, v: x.status === "Awaiting confirmation" ? "Waiting for confirmation" : "Expected " + (x.eta || x.expected), tone: statusTone(x) },
    { k: "Goods in", v: WAREHOUSES[x.wh].name, sub: (x.pallets || 0) + " pallets" },
  ];
  const lineCols: Col<{ sku: string; qty: number; cost: number }>[] = [
    { k: "sku", label: "SKU", w: "0.85fr", render: r => <RecLink kind="sku" id={r.sku} /> },
    { k: "n", label: "Product", w: "1.9fr", render: r => product(r.sku).name },
    { k: "q", label: "Qty", w: "0.55fr", align: "right", mono: true, render: r => num(r.qty) },
    { k: "o", label: "Owed to orders", w: "0.9fr", align: "right", mono: true, render: r => { const n = (SKU_DEMAND[r.sku] || []).filter(d => d.status === "Short").reduce((a, d) => a + d.qty, 0); return n ? <span style={{ color: "var(--bad)" }}>{num(n)}</span> : <span className="dx-faint">—</span>; } },
    { k: "v", label: "Value", w: "0.75fr", align: "right", mono: true, render: r => eur(r.qty * r.cost) },
  ];
  return (
    <Card tone={x.risk === "CRITICAL" && !expedited ? "bad" : undefined}
      title={<>{x.id} · <RecLink kind="supplier" id={s.id} plain>{s.name}</RecLink></>}
      sub={"Selected purchase order · " + statusText(x) + " · click any row below to switch"}
      right={<><Risk r={x.risk} /><Btn small kind="quiet" onClick={() => dx.open("po", id)}>Open record</Btn></>}>
      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={16}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Facts cols={3} items={[
            ["Value", eur(x.value)], ["Items", x.items + " SKUs · " + (x.pallets || 0) + " pallets"], ["Warehouse", WAREHOUSES[x.wh].short],
            ["Ordered", x.ordered], ["Promised", x.promised, x.status === "Late" ? "bad" : undefined], ["Expected", expedited ? "26 Sep 06:30" : x.eta || x.expected, x.status === "Late" ? "warn" : undefined],
            ["Buyer", who(x.buyer).name], ["Supplier OTIF", pct(s.otif), s.otif < 90 ? "bad" : s.otif < 95 ? "warn" : "ok"], ["Customer orders waiting", x.deps ? x.deps + " · " + eur(x.depValue) : "None", x.deps ? "bad" : "ok"],
          ]} />
          {note && <Note tone={x.status === "Late" ? "warn" : "neutral"}><Linked text={note} /></Note>}
        </div>
        <div>
          <div className="dx-faint" style={{ fontSize: 11.5, marginBottom: 10 }}>{PO_HISTORY[id] ? "Date changes" : "Lifecycle"}</div>
          <Chain steps={steps} />
        </div>
      </Grid>

      {deps.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="dx-faint" style={{ fontSize: 11.5, marginBottom: 10 }}>Downstream impact · {deps.length} customer orders · {eur(deps.reduce((a, o) => a + o.value, 0))} of revenue waiting on this PO</div>
          <Ripple source={{ k: sName(x.supplier) + " · 09:04", v: x.id + " · " + x.daysLate + " days late", tone: "bad" }}
            targets={deps.map(o => ({
              k: customer(o.cust).name, tone: o.risk === "HIGH" ? "bad" as Tone : undefined,
              v: <>{o.id} · {eur(o.value)} · {o.short} short · required {o.required}{o.route !== "—" ? " · " + o.route : ""}</>,
              onClick: () => dx.go("Orders", "detail", { order: o.id }),
            }))} />
        </div>
      )}
      {deps.length === 0 && x.deps > 0 && (
        <div style={{ marginTop: 16 }}>
          <Note tone="warn">
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 240 }}>{x.deps} customer order{x.deps > 1 ? "s" : ""} ({eur(x.depValue)}) {x.deps > 1 ? "are" : "is"} waiting on lines from this PO. They're on the backorder list, released automatically when it's booked in.</span>
              <Btn small onClick={() => dx.go("Orders", "backorders")}>Backorders</Btn>
            </div>
          </Note>
        </div>
      )}

      {id === "PO-8821" ? (
        <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={16} style={{ marginTop: 16 }}>
          <Card title="What's on it" sub={x.lines!.length + " of " + x.items + " SKUs shown: the constrained ones"} pad={false}>
            <Table dense cols={lineCols} rows={x.lines || []} onRow={r => dx.open("sku", r.sku)} />
          </Card>
          <AiCard agent="Purchasing Agent" title={expedited ? "Expedited" : "Recommended action"}>
            Atlas can put all 14 SKUs on a dedicated van tonight for <b>€420</b>. It lands at 06:30, before tomorrow's first wave, and protects {eur(x.depValue)} across {deps.length} orders, including Murphy's <RecLink kind="order" id="SO-10482" />.
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <ActBtn id="d-expedite" kind="primary" small label="Expedite · €420" done="Expedited · lands 06:30" toast="PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow. Six account managers notified." />
              <ActBtn id="po8821-notify" small label="Notify account managers" done="Sarah, David, Mark and Michael notified" toast="Four account managers notified with the six affected orders." />
              <ActBtn id="po8821-drafts" small label="Draft customer updates" done="6 updates drafted" toast="Six customer updates drafted in Outlook, one per order, waiting to send." />
            </div>
          </AiCard>
        </Grid>
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
          {x.status === "Late" && <ActBtn id={"chase-" + id} small kind="primary" label={"Chase " + sName(x.supplier)} done="Chase sent" toast={"Chase sent to " + s.name + " for " + id + (x.deps ? ", with the " + x.deps + " customer order" + (x.deps > 1 ? "s" : "") + " waiting on it." : ".")} />}
          {x.status === "Awaiting confirmation" && <ActBtn id={"chase-" + id} small kind="primary" label="Chase confirmation" done="Confirmation requested" toast={"Confirmation request sent to " + s.name + " for " + id + "."} />}
          {x.status === "Due today" && <Btn small onClick={() => dx.go("Purchasing", "incoming")}>Today's dock plan</Btn>}
          {x.status === "Confirmed" && <span className="dx-muted" style={{ fontSize: 13 }}>Confirmed and on time. Pulse watches the supplier feed and flags it if the date moves.</span>}
          <Btn small kind="quiet" onClick={() => dx.go("Purchasing", "performance", { supplier: s.id })}>{sName(s.id)} performance</Btn>
        </div>
      )}
    </Card>
  );
}

function PurchaseOrders() {
  const dx = useDx();
  const valid = (id?: string) => !!id && POS.some(p => p.id === id);
  const [sel, setSel] = useState(valid(dx.rec.po) ? dx.rec.po : "PO-8821");
  const [f, setF] = useLocal("pur.po.f", "all");
  useEffect(() => { if (valid(dx.rec.po)) setSel(dx.rec.po); }, [dx.rec.po]);
  useEffect(() => { if (preset.f) { setF(preset.f); preset.f = undefined; } }, []);
  const rows = PO_SORT.filter(p => f === "all" || (f === "late" ? p.status === "Late" : f === "today" ? p.status === "Due today" : p.status === "Confirmed" || p.status === "Awaiting confirmation"));
  const pick = (id: string) => { setSel(id); document.getElementById("dx-po-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  /* All eleven §19 fields in nine columns: items sit under value, order date under promised date. */
  const cols: Col<PO>[] = [
    { k: "id", label: "PO", w: "0.8fr", render: r => <RecLink kind="po" id={r.id} /> },
    { k: "s", label: "Supplier", w: "1.35fr", render: r => <RecLink kind="supplier" id={r.supplier} plain>{sName(r.supplier)}</RecLink> },
    { k: "v", label: "Value", w: "0.85fr", align: "right", render: r => (
      <div style={{ textAlign: "right" }}><div className="dx-num">{eur(r.value)}</div><div className="dx-faint" style={{ fontSize: 12, marginTop: 2 }}>{r.items} SKUs</div></div>
    ) },
    { k: "p", label: "Promised", w: "0.85fr", render: r => <TwoLine top={<span style={{ color: r.status === "Late" ? "var(--bad)" : undefined }}>{r.promised}</span>} bottom={"ordered " + r.ordered} /> },
    { k: "e", label: "Expected", w: "0.8fr", render: r => <TwoLine top={r.expected === "—" ? <span className="dx-faint">Not set</span> : r.expected} bottom={r.id === "PO-8821" && dx.acted["d-expedite"] ? "06:30, expedited" : etaClock(r)} /> },
    { k: "wh", label: "Warehouse", w: "0.8fr", render: r => WAREHOUSES[r.wh].short },
    { k: "st", label: "Status", w: "1.3fr", render: r => <Badge tone={statusTone(r)}>{statusText(r)}</Badge> },
    { k: "d", label: "Customer orders", w: "1.1fr", align: "right", render: r => (r.deps ? <span style={{ color: "var(--bad)" }}>{r.deps} · {eur(r.depValue)}</span> : <span className="dx-faint">—</span>) },
    { k: "r", label: "Risk", w: "1.05fr", render: r => <Risk r={r.risk} /> },
  ];
  return (
    <Page eyebrow="Purchasing · Purchase orders" title="Purchase orders, and who's waiting on them"
      sub="82 open POs worth €742k. Each row shows the customer orders depending on it, so a supplier's date change reads as the customer problem it is."
      right={<Seg items={[["all", "All"], ["late", "Late"], ["today", "Arriving today"], ["conf", "Confirmed"]]} value={f} onChange={setF} />}>
      <div id="dx-po-detail" style={{ scrollMarginTop: 20 }}><PoDetail id={sel} /></div>
      <Card title="Open purchase orders" sub={"Showing " + rows.length + " of " + KPI.openPOs + ", most urgent first: every PO that is late, landing today or confirmed for the next fortnight"} style={{ marginTop: 14 }} pad={false}>
        <Table cols={cols} rows={rows} onRow={r => pick(r.id)} rowTone={r => (r.id === sel ? "accent" : r.risk === "CRITICAL" ? "bad" : undefined)} empty="No purchase orders match this filter." />
      </Card>
    </Page>
  );
}

/* ---------- Incoming ---------- */
const DOCK: Record<string, { dock: string; asn: string; asnTone: Tone; status: string }> = {
  "PO-8826": { dock: "Naas 2", asn: "Matched", asnTone: "ok", status: "Received · 760 of 800, claim drafted" },
  "PO-8837": { dock: "Dock 3", asn: "Sent 07:12", asnTone: "ok", status: "Booked" },
  "PO-8830": { dock: "Dock 1", asn: "Sent 06:48", asnTone: "ok", status: "Booked · 2 pickers moving to unload" },
  "PO-8841": { dock: "Naas 1", asn: "Sent 08:05", asnTone: "ok", status: "Booked" },
  "PO-8834": { dock: "Dock 2", asn: "Sent 08:30", asnTone: "ok", status: "Booked" },
  "PO-8839": { dock: "Dock 5", asn: "Missing", asnTone: "warn", status: "No ASN yet, chase Bristol" },
  "PO-8843": { dock: "Dock 1", asn: "Sent 08:55", asnTone: "ok", status: "Booked after PO-8830 clears" },
};
const LATER = ["PO-8809", "PO-8817", "PO-8812", "PO-8846", "PO-8815", "PO-8848", "PO-8850"];

function Incoming() {
  const dx = useDx();
  const today = GOODS_IN_TODAY.map(po).sort((a, b) => etaTime(a).localeCompare(etaTime(b)));
  const byWh = (w: "DUB" | "NAS") => today.filter(p => p.wh === w);
  const tot = (ps: PO[]) => ({ pallets: ps.reduce((a, p) => a + (p.pallets || 0), 0), value: ps.reduce((a, p) => a + p.value, 0) });
  const all = tot(today), dub = tot(byWh("DUB")), nas = tot(byWh("NAS"));
  const late = POS.filter(p => p.status === "Late" && p.deps > 0);
  const lateVal = late.reduce((a, p) => a + p.depValue, 0);
  const x = po("PO-8821");
  const expedited = !!dx.acted["d-expedite"];
  const peak = today.reduce((m, p, i) => ((p.pallets || 0) > (today[m].pallets || 0) ? i : m), 0);
  const cols: Col<PO>[] = [
    { k: "t", label: "ETA", w: "0.62fr", mono: true, render: r => <span style={{ color: r.id === "PO-8826" ? "var(--ok)" : undefined }}>{etaTime(r)}</span> },
    { k: "id", label: "PO", w: "0.75fr", render: r => <RecLink kind="po" id={r.id} /> },
    { k: "s", label: "Supplier", w: "1.35fr", render: r => <RecLink kind="supplier" id={r.supplier} plain>{sName(r.supplier)}</RecLink> },
    { k: "pl", label: "Pallets", w: "0.58fr", align: "right", mono: true, render: r => r.pallets },
    { k: "v", label: "Value", w: "0.78fr", align: "right", mono: true, render: r => eur(r.value) },
    { k: "d", label: "Dock", w: "0.62fr", render: r => DOCK[r.id]?.dock || "—" },
    { k: "a", label: "ASN", w: "0.85fr", render: r => (DOCK[r.id] ? <Badge tone={DOCK[r.id].asnTone}>{DOCK[r.id].asn}</Badge> : "—") },
    { k: "st", label: "Status", w: "1.75fr", render: r => <Wrap dim><Linked text={DOCK[r.id]?.status || r.status} /></Wrap> },
    { k: "w", label: "Waiting", w: "0.7fr", align: "right", render: r => (r.deps ? <span style={{ color: "var(--warn)" }}>{r.deps} order{r.deps > 1 ? "s" : ""}</span> : <span className="dx-faint">—</span>) },
  ];
  const laterCols: Col<PO>[] = [
    { k: "e", label: "Expected", w: "0.75fr", render: r => (r.expected === "—" ? <span style={{ color: "var(--warn)" }}>Not set</span> : r.expected) },
    { k: "id", label: "PO", w: "0.75fr", render: r => <RecLink kind="po" id={r.id} /> },
    { k: "s", label: "Supplier", w: "1.35fr", render: r => <RecLink kind="supplier" id={r.supplier} plain>{sName(r.supplier)}</RecLink> },
    { k: "wh", label: "Warehouse", w: "0.7fr", render: r => WAREHOUSES[r.wh].short },
    { k: "pl", label: "Pallets", w: "0.55fr", align: "right", mono: true, render: r => r.pallets },
    { k: "v", label: "Value", w: "0.75fr", align: "right", mono: true, render: r => eur(r.value) },
    { k: "st", label: "Status", w: "1.05fr", render: r => <Badge tone={statusTone(r)}>{statusText(r)}</Badge> },
    { k: "w", label: "Orders waiting", w: "0.95fr", align: "right", render: r => (r.deps ? <span style={{ color: "var(--bad)" }}>{r.deps} · {eur(r.depValue)}</span> : <span className="dx-faint">—</span>) },
    { k: "r", label: "Risk", w: "0.8fr", render: r => <Risk r={r.risk} /> },
  ];
  const whCard = (w: "DUB" | "NAS", t: { pallets: number; value: number }) => (
    <Card title={WAREHOUSES[w].name} sub={byWh(w).length + " deliveries · " + t.pallets + " pallets · " + eur(t.value) + " · " + WAREHOUSES[w].docks + " docks"} pad={false}
      right={<Person id={w === "DUB" ? "kevin" : "aoife"} />}>
      <Table cols={cols} rows={byWh(w)} onRow={r => dx.open("po", r.id)} rowTone={r => (DOCK[r.id]?.asnTone === "warn" ? "warn" : undefined)} />
    </Card>
  );
  return (
    <Page eyebrow="Purchasing · Incoming" title="What lands, where, and when"
      sub="Today's supplier deliveries by warehouse and dock, tomorrow's critical arrival, and everything else due in the next fortnight."
      right={<Btn onClick={() => dx.go("Warehouse", "goodsin")}>Warehouse goods-in</Btn>}>
      <KpiRow n={5}>
        <Kpi label="Deliveries today" value={String(today.length)} sub={byWh("DUB").length + " Dublin · " + byWh("NAS").length + " Naas"} />
        <Kpi label="Pallets" value={String(all.pallets)} sub={dub.pallets + " Dublin · " + nas.pallets + " Naas"} />
        <Kpi label="Stock arriving" value={eur(all.value)} sub="At cost" />
        <Kpi label="Tomorrow" value={expedited ? "06:30" : "10:30"} tone="bad" sub="PO-8821 · 6 orders waiting" subTone="bad" onClick={() => dx.go("Purchasing", "orders", { po: "PO-8821" })} />
        <Kpi label="Late inbound" value={KPI.latePOs + " POs"} sub={late.length + " with orders waiting · " + eur(lateVal)} subTone="warn" onClick={() => dx.go("Purchasing", "orders")} />
      </KpiRow>

      {whCard("DUB", dub)}
      <div style={{ marginTop: 14 }}>{whCard("NAS", nas)}</div>
      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Pallets by arrival slot" sub="Both warehouses today. Dublin in colour, Naas in grey.">
          <Columns h={170} fmt={v => v + " pallets"} highlight={peak}
            data={today.map(p => ({ label: etaTime(p), value: p.pallets || 0, tone: p.wh === "DUB" ? "accent" : "var(--chart-muted)" }))} />
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 10, lineHeight: 1.5 }}>
            The 11:00 EuroFix delivery is the biggest: 48 pallets. Two pickers move to goods-in for it, which is why wave 3 is running 40 minutes behind.
          </div>
        </Card>
        <Card title="Missing ASN" sub={<>Bristol Abrasives · <RecLink kind="po" id="PO-8839" /> · 28 pallets at 14:30</>}>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
            Without an advance shipping notice, goods-in can't pre-check the 6 lines, and the pallets sit on Dock 5 until someone counts them by hand.
          </div>
          <div style={{ marginTop: 12 }}>
            <ActBtn id="asn-8839" small kind="primary" label="Chase ASN" done="ASN requested from Bristol" toast="ASN request sent to Bristol Abrasives for PO-8839, due before 14:30." />
          </div>
        </Card>
      </Grid>

      <Card tone={expedited ? undefined : "bad"} style={{ marginTop: 14 }}
        title={<>Tomorrow {expedited ? "06:30" : "10:30"} · <RecLink kind="po" id="PO-8821" /> · Atlas Industrial Supplies</>}
        sub={x.pallets + " pallets · " + x.items + " SKUs · Dock 1, Dublin · 6 customer orders waiting on 8 lines · " + eur(x.depValue)}
        right={<ActBtn id="d-expedite" small kind="primary" label="Expedite · €420" done="Expedited · lands 06:30" toast="PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow. Six account managers notified." />}>
        <Chain dir="across" steps={[
          { k: "Goods received", v: expedited ? "06:30 · Dock 1" : "10:30 · Dock 1", sub: "Kevin Brady's team, " + x.pallets + " pallets", icon: IC.truck, tone: expedited ? "ok" : "warn" },
          { k: "Inventory updated", v: "5 constrained lines", sub: <Linked text="EL-4408 +120 · EL-4521 +300 · IC-2290 +600" />, onClick: () => dx.open("sku", "EL-4408") },
          { k: "Backorders released", v: "6 orders · 8 lines", sub: <Linked text="Murphy's SO-10482 first" />, onClick: () => dx.go("Orders", "backorders") },
          { k: "Pick tasks created", v: "First wave", sub: expedited ? "Into the 08:00 wave" : "Into the 11:00 wave", onClick: () => dx.go("Warehouse", "board") },
          { k: "Customers updated", v: dx.acted["po8821-drafts"] ? "6 updates drafted" : "6 updates to draft", sub: "One per order, in Outlook", tone: dx.acted["po8821-drafts"] ? "ok" : undefined },
        ]} />
      </Card>

      <Card title="Later this week and next" sub="Everything else due in, soonest first" style={{ marginTop: 14 }} pad={false}>
        <Table cols={laterCols} rows={LATER.map(po)} onRow={r => dx.go("Purchasing", "orders", { po: r.id })} rowTone={r => (r.status === "Late" ? "bad" : r.status === "Awaiting confirmation" ? "warn" : undefined)} />
      </Card>
    </Page>
  );
}

/* ---------- Suppliers ---------- */
function Suppliers() {
  const dx = useDx();
  const [f, setF] = useLocal("pur.sup.f", "all");
  const list = SUPPLIERS.slice().sort((a, b) => b.spend - a.spend);
  const rows = list.filter(s => f === "all" || (f === "attention" ? s.status === "Needs review" || s.status === "On watch" : s.status.toLowerCase() === f));
  const spend = list.reduce((a, s) => a + s.spend, 0);
  const byCur = (c: string) => list.filter(s => s.currency === c).reduce((a, s) => a + s.spend, 0);
  const gbp = byCur("GBP"), dkk = byCur("DKK"), eurS = byCur("EUR");
  const openPOs = list.reduce((a, s) => a + s.openPOs, 0);
  const buyers = ["emma", "ciaran"].map(b => {
    const mine = list.filter(s => s.buyer === b);
    return { b, n: mine.length, pos: mine.reduce((a, s) => a + s.openPOs, 0), spend: mine.reduce((a, s) => a + s.spend, 0) };
  });
  const cols: Col<Supplier>[] = [
    { k: "n", label: "Supplier", w: "1.8fr", render: s => <TwoLine top={<RecLink kind="supplier" id={s.id} plain>{s.name}</RecLink>} bottom={s.country} /> },
    { k: "c", label: "Categories", w: "1.35fr", render: s => <Wrap dim>{s.cats.join(", ")}</Wrap> },
    { k: "sp", label: "Spend · currency", w: "0.95fr", align: "right", render: s => (
      <div style={{ textAlign: "right" }}><div className="dx-num">{eurK(s.spend)}</div><div style={{ fontSize: 12, marginTop: 2, color: s.currency === "EUR" ? "var(--faint)" : "var(--warn)", fontWeight: s.currency === "EUR" ? 400 : 600 }}>{s.currency}</div></div>
    ) },
    { k: "t", label: "Terms", w: "0.75fr", render: s => s.terms },
    { k: "l", label: "Lead", w: "0.6fr", align: "right", render: s => s.lead + " days" },
    { k: "b", label: "Buyer", w: "1.45fr", render: s => <Person id={s.buyer} /> },
    { k: "o", label: "Open POs", w: "0.75fr", align: "right", mono: true, render: s => s.openPOs },
    { k: "st", label: "Status", w: "1.2fr", render: s => <Risk r={s.status} /> },
  ];
  return (
    <Page eyebrow="Purchasing · Suppliers" title="Suppliers"
      sub="The twelve suppliers that carry most of the range: what we buy from them, on what terms, in what currency, and who looks after them."
      right={<Seg items={[["all", "All"], ["preferred", "Preferred"], ["approved", "Approved"], ["attention", "Needs attention"]]} value={f} onChange={setF} />}>
      <KpiRow n={5}>
        <Kpi label="Active suppliers" value={String(COMPANY.suppliers)} sub={list.length + " largest shown here"} />
        <Kpi label="Spend with these 12" value={eurK(spend)} sub="Last 12 months" />
        <Kpi label="Non-euro spend" value={eurK(gbp + dkk)} sub={"GBP " + eurK(gbp) + " · DKK " + eurK(dkk)} subTone="warn" />
        <Kpi label="Open POs" value={String(KPI.openPOs)} sub={openPOs + " with these 12"} onClick={() => dx.go("Purchasing", "orders")} />
        <Kpi label="Need attention" value={String(list.filter(s => s.status === "Needs review" || s.status === "On watch").length)} tone="warn" sub="Atlas needs review, Hansen on watch" onClick={() => setF("attention")} />
      </KpiRow>

      <Card title="Supplier directory" sub="Click a supplier for its POs, products and scorecard" pad={false}>
        <Table cols={cols} rows={rows} onRow={s => dx.open("supplier", s.id)} rowTone={s => (s.id === dx.rec.supplier ? "accent" : s.status === "Needs review" ? "bad" : undefined)} />
      </Card>

      <Grid cols="repeat(2,minmax(0,1fr))" gap={14} style={{ marginTop: 14 }}>
        <Card title="Currency exposure" sub="Where cost moves with the exchange rate">
          <Strip fmt={eurK} parts={[{ label: "EUR", value: eurS, tone: "accent" }, { label: "GBP", value: gbp, tone: "warn" }, { label: "DKK", value: dkk, tone: "var(--chart-muted)" }]} />
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", marginTop: 12 }}>
            {eurK(gbp)} a year is invoiced in sterling across <RecLink kind="supplier" id="lumos" plain>Lumos</RecLink>, <RecLink kind="supplier" id="bristol" plain>Bristol Abrasives</RecLink> and <RecLink kind="supplier" id="midpack" plain>Midland Packaging</RecLink>.
            {" "}A 5% move in sterling is about {eur(Math.round(gbp * 0.05))} on cost. Hansen invoices in kroner, which is pegged to the euro, so that exposure is small.
          </div>
        </Card>
        <Card title="Buyer workload" sub="Open POs managed by each buyer, across these 12 suppliers">
          <HBars fmt={v => v + " POs"} items={buyers.map(b => ({ label: <Person id={b.b} />, value: b.pos, note: b.n + " suppliers · " + eurK(b.spend) }))} />
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 12, lineHeight: 1.5 }}>
            Emma carries Atlas, Hansen and Lumos: three of the four suppliers with late POs today.
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

/* ---------- Supplier performance ---------- */
const clamp = (x: number) => Math.max(0, Math.min(100, x));
const scoreParts = (s: Supplier) => ({
  otif: clamp(((s.otif - 80) / 20) * 100),
  fill: clamp(((s.fill - 85) / 15) * 100),
  lead: clamp(((s.leadAcc - 60) / 40) * 100),
  quality: clamp(100 - (s.quality * 6 + s.returns * 2 + s.claims * 5)),
  price: clamp(100 - s.priceChanges * 15),
});
const WEIGHTS: [keyof ReturnType<typeof scoreParts>, string, number][] = [
  ["otif", "OTIF", 0.35], ["fill", "Fill rate", 0.2], ["lead", "Lead-time accuracy", 0.2], ["quality", "Quality", 0.15], ["price", "Price stability", 0.1],
];
const score = (s: Supplier) => { const p = scoreParts(s); return Math.round(WEIGHTS.reduce((a, [k, , w]) => a + p[k] * w, 0) * 10) / 10; };
const RANKED = SUPPLIERS.slice().sort((a, b) => score(b) - score(a));
const SPEND_RANK = Object.fromEntries(SUPPLIERS.slice().sort((a, b) => b.spend - a.spend).map((s, i) => [s.id, i + 1])) as Record<string, number>;

function Performance() {
  const dx = useDx();
  const valid = (id?: string) => !!id && SUPPLIERS.some(s => s.id === id);
  const [sel, setSel] = useState(valid(dx.rec.supplier) ? dx.rec.supplier : "atlas");
  useEffect(() => { if (valid(dx.rec.supplier)) setSel(dx.rec.supplier); }, [dx.rec.supplier]);
  const s = supplier(sel);
  const parts = scoreParts(s);
  const affected = SUPPLIERS.reduce((a, x) => a + x.affected, 0);
  const claims = SUPPLIERS.reduce((a, x) => a + x.claims, 0);
  const atlas = supplier("atlas"), ec = supplier("eurocable");
  const supplierDelay = OTIF.reasons.find(r => r[0] === "Supplier delay")![1];
  const tone = (v: number): Tone => (v < 50 ? "bad" : v < 75 ? "warn" : "ok");
  const two = (top: ReactNode, bottom: ReactNode, color?: string) => (
    <div style={{ textAlign: "right" }}><div className="dx-num" style={{ color }}>{top}</div><div className="dx-faint" style={{ fontSize: 12, marginTop: 2 }}>{bottom}</div></div>
  );
  /* All ten §20 metrics in nine columns: fill rate sits under OTIF, lead-time accuracy under average delay. */
  const cols: Col<Supplier>[] = [
    { k: "n", label: "Supplier", w: "1.55fr", render: r => (
      <span style={{ display: "inline-flex", gap: 10, alignItems: "center", minWidth: 0 }}>
        <span className="dx-num dx-faint" style={{ width: 18, flex: "none", textAlign: "right" }}>{RANKED.indexOf(r) + 1}</span>
        <span title={r.name} style={{ overflow: "hidden", textOverflow: "ellipsis" }}><RecLink kind="supplier" id={r.id} plain>{SUP_SHORT[r.id] || r.name}</RecLink></span>
      </span>
    ) },
    { k: "sc", label: "Service score", w: "1.1fr", render: r => <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Meter value={score(r)} w={42} tone={tone(score(r))} /><b className="dx-num" style={{ fontWeight: 600 }}>{score(r).toFixed(1)}</b></span> },
    { k: "sp", label: "Spend", w: "0.9fr", align: "right", render: r => two(eurK(r.spend), "#" + SPEND_RANK[r.id] + " by spend") },
    { k: "ot", label: "OTIF · fill", w: "0.8fr", align: "right", render: r => two(pct(r.otif), "fill " + pct(r.fill), r.otif < 90 ? "var(--bad)" : r.otif < 95 ? "var(--warn)" : undefined) },
    { k: "d", label: "Avg delay", w: "0.9fr", align: "right", render: r => two(r.delay + " days", "lead acc. " + r.leadAcc + "%", r.delay > 2 ? "var(--bad)" : undefined) },
    { k: "q", label: "Quality", w: "0.85fr", align: "right", mono: true, render: r => r.quality + " · " + r.returns + " · " + r.claims },
    { k: "pc", label: "Price chg", w: "0.72fr", align: "right", mono: true, render: r => r.priceChanges },
    { k: "a", label: "Orders hit", w: "0.75fr", align: "right", mono: true, render: r => <span style={{ color: r.affected > 50 ? "var(--bad)" : undefined }}>{r.affected}</span> },
    { k: "st", label: "Status", w: "1.25fr", render: r => <Risk r={r.status} /> },
  ];
  return (
    <Page eyebrow="Purchasing · Supplier performance" title="Ranked on service, not on spend"
      sub="The biggest supplier by spend is the worst by service. Every supplier scored on whether it delivers what it promised, when it promised."
      right={<Btn icon={IC.chat} onClick={() => dx.ask("Which supplier is causing us the most disruption?")}>Ask Purchasing Agent</Btn>}>
      <KpiRow n={4}>
        <Kpi label="Supplier fill rate" value={pct(KPI.fillRate)} sub="All 64 suppliers, last 90 days" subTone="warn" />
        <Kpi label="OTIF failures caused by suppliers" value={supplierDelay + "%"} sub="The single biggest reason, ahead of stock shortage" subTone="bad" onClick={() => dx.go("Delivery", "otif")} />
        <Kpi label="Customer orders hit, YTD" value={String(affected)} sub={"Atlas alone: " + atlas.affected} tone="bad" />
        <Kpi label="Open claims" value={String(claims)} sub="3 Atlas · 2 Hansen · 1 Toolcraft · 1 Lumos" />
      </KpiRow>

      <Card title="Supplier ranking" sub="Service score out of 100. Quality shows quality issues · returns · open claims. Click a row to see how its score is built." pad={false}>
        <Table cols={cols} rows={RANKED} onRow={r => setSel(r.id)} rowTone={r => (r.id === sel ? "accent" : r.status === "Needs review" ? "bad" : undefined)} />
      </Card>

      <Grid cols="repeat(2,minmax(0,1fr))" gap={14} style={{ marginTop: 14 }}>
        <Card title={<>Score breakdown · <RecLink kind="supplier" id={s.id} plain>{s.name}</RecLink></>} sub={"Service score " + score(s).toFixed(1) + " · ranked " + (RANKED.indexOf(s) + 1) + " of " + RANKED.length + " · #" + SPEND_RANK[s.id] + " by spend"}
          right={<Risk r={s.status} />}>
          <HBars max={100} fmt={v => Math.round(v) + " / 100"} items={WEIGHTS.map(([k, l, w]) => ({ label: l + " · " + Math.round(w * 100) + "%", value: parts[k], tone: tone(parts[k]) }))} />
          <div style={{ marginTop: 14 }}>
            <Facts cols={3} items={[
              ["Total spend", eur(s.spend)], ["OTIF", pct(s.otif), s.otif < 90 ? "bad" : undefined], ["Fill rate", pct(s.fill)],
              ["Average delay", s.delay + " days", s.delay > 2 ? "bad" : undefined], ["Lead-time accuracy", s.leadAcc + "%"], ["Quality issues", String(s.quality), s.quality > 4 ? "warn" : undefined],
              ["Returns", String(s.returns)], ["Price changes", String(s.priceChanges)], ["Open claims", String(s.claims)],
            ]} />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 12, lineHeight: 1.55 }}>
            How it's scored: OTIF counts from 80% (0) to 100% (100), fill rate from 85%, lead-time accuracy from 60%. Quality starts at 100 and loses 6 per quality issue, 2 per return and 5 per open claim. Price stability loses 15 per price change this year.
            {" "}Spend isn't in the score. Average delay and orders hit are shown but not scored, because OTIF already counts them.
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent="Purchasing Agent" title="Atlas vs EuroCable"
            actions={<>
              <ActBtn id="atlas-review" kind="primary" small label="Schedule supplier review" done="Review booked · 2 Oct" toast="Supplier review with Atlas booked for 2 Oct. Scorecard attached." />
              <ActBtn id="atlas-dual" small label="Dual-source cable" done="EuroCable set as second source" toast="EuroCable BV added as approved second source for EL-4408 and EL-4521." />
            </>}>
            Atlas is our biggest supplier at {eurK(atlas.spend)} and our worst performer: {pct(atlas.otif)} OTIF, {atlas.delay} days average delay, {atlas.affected} customer orders hit this year and {atlas.quality} quality claims.
            {" "}EuroCable supplies the same cable at {pct(ec.otif)} OTIF, {ec.delay} days average delay and {ec.affected} orders hit, for €0.45 a drum more landed.
            {" "}Dual-source <RecLink kind="sku" id="EL-4408" /> and <RecLink kind="sku" id="EL-4521" />, and take the scorecard into a review with a service-credit clause.
          </AiCard>
          <Card title="OTIF by supplier" sub="Deliveries on time and in full, last 12 months. Note is customer orders hit.">
            <HBars max={100} fmt={v => pct(v)} onClick={i => setSel(RANKED_OTIF[i].id)}
              items={RANKED_OTIF.map(x => ({ label: SUP_SHORT[x.id] || x.name, value: x.otif, note: String(x.affected), tone: (x.otif < 90 ? "bad" : x.otif < 95 ? "warn" : "accent") as Tone }))} />
          </Card>
        </div>
      </Grid>
    </Page>
  );
}
const RANKED_OTIF = SUPPLIERS.slice().sort((a, b) => b.otif - a.otif);

export const PAGES: Record<string, ComponentType> = {
  overview: Overview, recommendations: Recommendations, orders: PurchaseOrders, incoming: Incoming, suppliers: Suppliers, performance: Performance,
};
