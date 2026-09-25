/* Finance: revenue, debtors, credit control, cash and working capital.
   Every figure reads from db.ts. The five extra credit holds (db lists four of the nine), their overdue
   invoices and the collection notes below are local, and reconcile with KPI: 9 holds, €38,420 held. */
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  KPI, COMPANY, TODAY, CUSTOMERS, ORDERS, POS, QUOTES, PRODUCTS, ROUTES, INVOICES, CREDIT_HOLDS, DEBTOR_AGEING, REVENUE_MONTHS, CATEGORY_MARGIN,
  CASH, WC_OPPS, SLOW_LINES, SLOW_ACTIONS, INVENTORY_AGEING, customer, who, eur, eurK, pct, num,
} from "../db";
import {
  ActBtn, AiCard, Badge, Btn, Card, Chain, Columns, Facts, Grid, HBars, IC, Kpi, KpiRow, Lines, Meter, Note, Page, Person,
  RecLink, Risk, Seg, Strip, Table, useDx, useLocal, type Dx, type Tone,
} from "../ui";

const HEAD = "Finance · " + TODAY.long + " · " + TODAY.time;
const kFloor = (n: number) => "€" + Math.floor(n / 1000).toLocaleString("en-IE") + "k";
const m2 = (n: number) => "€" + (n / 1e6).toFixed(2) + "m";
const T = (t: Tone) => t;
const SAME_PERIOD_LAST = Math.round(KPI.revenueMTD / (1 + parseFloat(KPI.revenueDelta) / 100));

/* ---------- record ids inside sentences become links ---------- */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LINK_SRC = "(" + CUSTOMERS.map(c => c.name).sort((a, b) => b.length - a.length).map(esc).join("|")
  + "|\\bSO-\\d{5}\\b|\\bPO-\\d{4}\\b|\\bQT-\\d{4}\\b|\\b(?:EL|FIX|SAF|IC|TL|JAN|PK)-\\d{4}\\b|\\b(?:D\\d{2}|W01|N0\\d|K01|M01)\\b)";
function Ref({ s }: { s: string }) {
  const c = CUSTOMERS.find(x => x.name === s);
  if (c) return <RecLink kind="cust" id={c.id} plain>{s}</RecLink>;
  if (s.startsWith("SO-")) return ORDERS.some(o => o.id === s) ? <RecLink kind="order" id={s} /> : <>{s}</>;
  if (s.startsWith("PO-")) return POS.some(p => p.id === s) ? <RecLink kind="po" id={s} /> : <>{s}</>;
  if (s.startsWith("QT-")) return QUOTES.some(q => q.id === s) ? <RecLink kind="quote" id={s} /> : <>{s}</>;
  if (/^[A-Z]{2,3}-\d{4}$/.test(s)) return PRODUCTS.some(p => p.sku === s) ? <RecLink kind="sku" id={s} /> : <>{s}</>;
  return ROUTES.some(r => r.id === s) ? <RecLink kind="route" id={s} /> : <>{s}</>;
}
function Linked({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = new RegExp(LINK_SRC, "g");
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push(text.slice(last, m.index), <Ref key={m.index} s={m[0]} />);
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
const SoRef = ({ id }: { id: string }) => ORDERS.some(o => o.id === id)
  ? <RecLink kind="order" id={id} />
  : <span className="dx-num" style={{ color: "var(--ink)", fontWeight: 500 }}>{id}</span>;
const CustName = ({ h }: { h: { cust?: string; name: string } }) => h.cust
  ? <RecLink kind="cust" id={h.cust} plain>{h.name}</RecLink>
  : <span style={{ color: "var(--ink)" }}>{h.name}</span>;

/* ---------- invoices and overdue ---------- */
const isOver = (status: string) => /overdue|90\+/i.test(status);
const invOf = (cust: string) => INVOICES.filter(i => i.cust === cust);
/* Overdue comes from the open invoices where Sage Accounts lists them, otherwise the account figure. */
const overdueOf = (cust: string) => {
  const inv = invOf(cust);
  return inv.length ? inv.filter(i => isOver(i.status)).reduce((a, i) => a + i.amount, 0) : customer(cust).overdue;
};
const oldestOf = (cust: string) => { const inv = invOf(cust); return inv.length ? Math.max(...inv.map(i => i.days)) : null; };

/* ---------- credit holds: four from db, five local, nine in all (€38,420) ---------- */
type Inv = { id: string; amount: number; issued: string; due: string; days: number; status: string; promise?: string };
type Hold = {
  key: string; cust?: string; name: string; area: string; seg: string; am: string; contact: string; so: string; lines: number; order: number;
  balance: number; limit: number; overdue: number; oldest: number; wh: string; route: string; routeId?: string; releaseBy: string; heldAt: string;
  why: string; rec: string; primary: { id: string; label: string; done: string; toast: string }; invoices: Inv[]; risk: "HIGH" | "MEDIUM" | "LOW";
};
type Extra = Pick<Hold, "lines" | "wh" | "route" | "routeId" | "releaseBy" | "heldAt" | "why" | "rec" | "primary" | "risk">;

const DOYLE_REC = "Release €7,320 of the order against available credit and request payment against overdue invoice INV-28482 before releasing the balance.";
const DB_EXTRA: Record<string, Extra> = {
  doyle: {
    lines: 9, wh: "Dublin", route: "D07, tomorrow's AM run to the Hansfield SHD site", routeId: "D07", releaseBy: "14:00 to pick today for tomorrow", heldAt: "Today 08:42",
    why: "Would take the account €8,920 over its €50,000 limit. The payment promised on 18 Sep for INV-28482 has not arrived.",
    rec: DOYLE_REC, risk: "HIGH",
    primary: { id: "d-credit", label: "Release €7,320", done: "€7,320 released", toast: "SO-10503 part-released: €7,320 against available credit. Payment request for INV-28482 sent to Kieran Doyle." },
  },
  tallaght: {
    lines: 7, wh: "Dublin", route: "D14, stop 5, ETA 15:50", routeId: "D14", releaseBy: "13:00 to keep its D14 slot", heldAt: "Today 08:24",
    why: "€6,420 overdue 62 days on INV-28502, and the order takes the account €2,090 over its €25,000 limit.",
    rec: "Hold until INV-28502 is paid. Payment of €6,420 brings exposure to €20,670, inside the €25,000 limit, and SO-10533 can still make D14 if it lands by 13:00.",
    risk: "HIGH",
    primary: { id: "cr-tallaght-onpay", label: "Release on payment", done: "Set to release on payment", toast: "SO-10533 will release to the Dublin pick queue when INV-28502 (€6,420) is paid. Rachel Hayes and David Kelly notified." },
  },
  mcgrath: {
    lines: 6, wh: "Naas", route: "K01, 28 Sep, site gate", routeId: "K01", releaseBy: "27 Sep for the 28 Sep K01 run", heldAt: "24 Sep",
    why: "Inside the limit, but INV-28410 (€8,940) is 91 days old and withheld over the 22 Sep late delivery (DI-762).",
    rec: "The order fits inside the limit (€32,020 of €40,000). The hold is the dispute: agree the credit for DI-762 with Fergal McGrath, take payment for the rest of INV-28410, then release SO-10538.",
    risk: "HIGH",
    primary: { id: "cr-mcgrath-credit", label: "Propose DI-762 credit", done: "Credit proposal sent", toast: "Credit proposal for DI-762 sent to Fergal McGrath with the INV-28410 statement. SO-10538 releases when it's agreed." },
  },
  midland: {
    lines: 5, wh: "Naas", route: "M01, 29 Sep", routeId: "M01", releaseBy: "28 Sep for the M01 run", heldAt: "24 Sep",
    why: "€4,380 overdue 57 days on INV-28519. A cheque was posted on 23 Sep and hasn't been banked yet.",
    rec: "Release. Exposure after the order is €14,020 of a €30,000 limit, and Seamus Kenny posted a cheque for INV-28519 on 23 Sep. Hold new orders again if it hasn't cleared by 29 Sep.",
    risk: "MEDIUM",
    primary: { id: "cr-midland-release", label: "Release SO-10539", done: "Released to picking", toast: "SO-10539 released to the Naas pick queue for M01 on 29 Sep. Cheque check set for 29 Sep." },
  },
};
const DB_HOLDS: Hold[] = CREDIT_HOLDS.map(h => {
  const c = customer(h.cust);
  const inv = invOf(h.cust);
  return {
    key: h.cust, cust: h.cust, name: c.name, area: c.area, seg: c.segment, am: c.am, contact: c.contact[0], so: h.so, order: h.order,
    balance: h.balance, limit: h.limit, overdue: overdueOf(h.cust), oldest: Math.max(...inv.map(i => i.days)), invoices: inv, ...DB_EXTRA[h.cust],
  };
});
const LOCAL_HOLDS: Hold[] = [
  { key: "keane", name: "Keane Electrical Ltd", area: "Navan", seg: "Electrical contractor", am: "david", contact: "Aidan Keane", so: "SO-10512", lines: 8, order: 3140,
    balance: 18960, limit: 20000, overdue: 5210, oldest: 48, wh: "Dublin", route: "Meath run, 28 Sep", releaseBy: "27 Sep for the Meath run", heldAt: "24 Sep",
    why: "Would take the account €2,100 over its €20,000 limit. €5,210 overdue 48 days.",
    rec: "Release €1,040 against available credit and ask for INV-28548 (€5,210) before releasing the rest. Aidan Keane has promised it in the 30 Sep payment run.",
    risk: "MEDIUM", invoices: [{ id: "INV-28548", amount: 5210, issued: "8 Aug", due: "7 Sep", days: 48, status: "Overdue 18 days", promise: "30 Sep payment run" }],
    primary: { id: "cr-keane-part", label: "Release €1,040", done: "€1,040 released", toast: "SO-10512 part-released: €1,040 against available credit. Payment request for INV-28548 sent to Aidan Keane." } },
  { key: "tully", name: "Tully Plant Hire", area: "Tullamore", seg: "Plant hire", am: "sarah", contact: "Frank Tully", so: "SO-10527", lines: 4, order: 2150,
    balance: 7860, limit: 15000, overdue: 4120, oldest: 71, wh: "Naas", route: "M01, 29 Sep", routeId: "M01", releaseBy: "28 Sep for the M01 run", heldAt: "22 Sep",
    why: "€4,120 overdue 71 days on INV-28470. Two reminders, no reply.",
    rec: "Keep the hold and stop the account. Sarah Byrne to call Frank Tully before any further orders are taken.",
    risk: "HIGH", invoices: [{ id: "INV-28470", amount: 4120, issued: "16 Jul", due: "15 Aug", days: 71, status: "Overdue 41 days" }],
    primary: { id: "cr-tully-escalate", label: "Escalate to Sarah Byrne", done: "Escalated", toast: "Tully Plant Hire escalated to Sarah Byrne. Account on stop until INV-28470 is resolved." } },
  { key: "duggan", name: "Duggan Building Supplies", area: "Portarlington", seg: "Independent merchant", am: "mark", contact: "Tom Duggan", so: "SO-10517", lines: 6, order: 2460,
    balance: 14380, limit: 25000, overdue: 3880, oldest: 64, wh: "Naas", route: "M01, 29 Sep", routeId: "M01", releaseBy: "28 Sep for the M01 run", heldAt: "23 Sep",
    why: "Inside the limit, but INV-28494 (€3,880) is 64 days old. Credit policy holds orders at 60 days.",
    rec: "Ask for INV-28494 today. The account is well inside its limit (€16,840 of €25,000), so release as soon as payment is confirmed.",
    risk: "MEDIUM", invoices: [{ id: "INV-28494", amount: 3880, issued: "23 Jul", due: "22 Aug", days: 64, status: "Overdue 34 days" }],
    primary: { id: "cr-duggan-onpay", label: "Release on payment", done: "Set to release on payment", toast: "SO-10517 will release when INV-28494 (€3,880) is paid. Mark Ryan copied." } },
  { key: "balbriggan", name: "Balbriggan Trade Supplies", area: "Balbriggan", seg: "Trade counter", am: "david", contact: "Gavin Reilly", so: "SO-10534", lines: 6, order: 2100,
    balance: 11640, limit: 12500, overdue: 1460, oldest: 41, wh: "Dublin", route: "D04, 28 Sep", routeId: "D04", releaseBy: "27 Sep for the D04 run", heldAt: "24 Sep",
    why: "Would take the account €1,240 over its €12,500 limit.",
    rec: "Release on payment of INV-28580 (€1,460). Exposure then falls to €12,280, inside the limit.",
    risk: "LOW", invoices: [{ id: "INV-28580", amount: 1460, issued: "15 Aug", due: "14 Sep", days: 41, status: "Overdue 11 days" }],
    primary: { id: "cr-balbriggan-onpay", label: "Release on payment", done: "Set to release on payment", toast: "SO-10534 will release when INV-28580 (€1,460) is paid. David Kelly copied." } },
  { key: "arklow", name: "Arklow Bay Maintenance", area: "Arklow", seg: "Facilities", am: "mark", contact: "Lisa Doran", so: "SO-10523", lines: 5, order: 1980,
    balance: 9120, limit: 10000, overdue: 2640, oldest: 52, wh: "Dublin", route: "W01, 28 Sep", routeId: "W01", releaseBy: "27 Sep for the W01 run", heldAt: "24 Sep",
    why: "Would take the account €1,100 over its €10,000 limit. €2,640 overdue 52 days.",
    rec: "Hold until INV-28530 (€2,640) is paid. Payment brings exposure to €8,460, inside the limit. Lisa Doran has promised it by 29 Sep.",
    risk: "MEDIUM", invoices: [{ id: "INV-28530", amount: 2640, issued: "4 Aug", due: "3 Sep", days: 52, status: "Overdue 22 days", promise: "By 29 Sep" }],
    primary: { id: "cr-arklow-onpay", label: "Release on payment", done: "Set to release on payment", toast: "SO-10523 will release when INV-28530 (€2,640) is paid. Mark Ryan copied." } },
];
const HOLDS: Hold[] = [...DB_HOLDS, ...LOCAL_HOLDS].sort((a, b) => b.order - a.order);
const HELD_VALUE = HOLDS.reduce((a, h) => a + h.order, 0);
const exposure = (h: Hold) => h.balance + h.order;
const overBy = (h: Hold) => Math.max(0, exposure(h) - h.limit);
const avail = (h: Hold) => Math.max(0, h.limit - h.balance);
const holdKind = (h: Hold): [string, Tone] =>
  h.key === "mcgrath" ? ["Disputed invoice", "bad"] : overBy(h) > 0 ? ["Over limit", "bad"] : ["Overdue " + h.oldest + " days", "warn"];
const oldestOverdue = (h: Hold) => [...h.invoices].filter(i => isOver(i.status)).sort((a, b) => b.days - a.days)[0];

/* Selecting a held account from another Finance page (local accounts can't go in dx.rec). */
let pendingHold: string | null = null;
const openHold = (dx: Dx, key: string) => { pendingHold = key; dx.go("Finance", "credit"); };

/* ---------- debtors ledger: named accounts plus the local held accounts ---------- */
type DebtorRow = {
  key: string; cust?: string; name: string; acct: string; balance: number; limit: number; overdue: number; oldest: number | null; terms: string;
  promise: string; promiseTone?: Tone; status: string; tone: Tone; hold: boolean;
};
const PROMISE: Record<string, [string, Tone?]> = {
  doyle: ["'This week' (18 Sep), broken", "bad"],
  mcgrath: ["Disputed delivery 22 Sep", "bad"],
  midland: ["Cheque posted 23 Sep", "warn"],
  horizon: ["Remittance 26 Sep"],
  tallaght: ["None · 2 reminders", "warn"],
  swords: ["None · reminder 1 sent"],
  wicklow: ["None · reminder 1 sent"],
  keane: ["30 Sep payment run"],
  arklow: ["By 29 Sep"],
  tully: ["No reply to 2 reminders", "bad"],
  duggan: ["None · reminder 2 sent", "warn"],
  balbriggan: ["None · reminder 1 sent"],
};
const STATUS: Record<string, [string, Tone]> = {
  doyle: ["Credit hold", "bad"], tallaght: ["Credit hold", "bad"], mcgrath: ["Disputed · held", "bad"], midland: ["Watch · held", "warn"],
  horizon: ["Promise open", "warn"], swords: ["Chasing", "warn"], wicklow: ["Chasing", "warn"],
};
const DEBTORS: DebtorRow[] = [
  ...CUSTOMERS.map(c => {
    const od = overdueOf(c.id);
    const st = STATUS[c.id] || (od ? ["Chasing", "warn"] as [string, Tone] : ["In terms", "ok"] as [string, Tone]);
    return {
      key: c.id, cust: c.id, name: c.name, acct: c.acct, balance: c.balance, limit: c.limit, overdue: od, oldest: oldestOf(c.id), terms: c.terms,
      promise: PROMISE[c.id]?.[0] || "", promiseTone: PROMISE[c.id]?.[1], status: st[0], tone: st[1], hold: HOLDS.some(h => h.cust === c.id),
    };
  }),
  ...LOCAL_HOLDS.map(h => ({
    key: h.key, name: h.name, acct: h.area, balance: h.balance, limit: h.limit, overdue: h.overdue, oldest: h.oldest, terms: "30 days",
    promise: PROMISE[h.key]?.[0] || "", promiseTone: PROMISE[h.key]?.[1], status: "Credit hold", tone: T("bad"), hold: true,
  })),
].sort((a, b) => b.overdue - a.overdue || b.balance - a.balance);

const OVERDUE_INV = [
  ...INVOICES.filter(i => isOver(i.status)).map(i => ({ ...i, key: i.cust, cust: i.cust as string | undefined, name: customer(i.cust).name })),
  ...LOCAL_HOLDS.flatMap(h => h.invoices.map(i => ({ ...i, key: h.key, cust: undefined as string | undefined, name: h.name }))),
].sort((a, b) => b.days - a.days);

/* ---------- shared pieces ---------- */
function ExposureBar({ balance, order, limit }: { balance: number; order: number; limit: number }) {
  const total = balance + order, scale = Math.max(total, limit) * 1.04;
  const inside = Math.max(0, Math.min(order, limit - balance)), over = Math.max(0, total - limit);
  const w = (n: number) => (n / scale) * 100;
  const seg = (n: number, bg: string, last: boolean) =>
    <span style={{ width: w(n) + "%", background: bg, boxShadow: last ? undefined : "inset -2px 0 0 var(--surface)" }} />;
  return (
    <div>
      <div style={{ position: "relative", height: 14 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", borderRadius: 5, overflow: "hidden", background: "var(--track)" }}>
          {seg(balance, "var(--accent)", !inside && !over)}
          {inside > 0 && seg(inside, "var(--ok)", !over)}
          {over > 0 && seg(over, "var(--bad)", true)}
        </div>
        <span title={"Credit limit " + eur(limit)} style={{ position: "absolute", left: "calc(" + w(limit) + "% - 1px)", top: -5, bottom: -5, width: 2, borderRadius: 1, background: "var(--ink)" }} />
      </div>
      <div className="dx-legend">
        <span><i style={{ background: "var(--accent)" }} />On account<b className="dx-num">{eur(balance)}</b></span>
        {inside > 0 && <span><i style={{ background: "var(--ok)" }} />Order inside limit<b className="dx-num">{eur(inside)}</b></span>}
        {over > 0 && <span><i style={{ background: "var(--bad)" }} />Over limit<b className="dx-num">{eur(over)}</b></span>}
        <span><i style={{ background: "var(--ink)", width: 2 }} />Limit<b className="dx-num">{eur(limit)}</b></span>
      </div>
    </div>
  );
}

function ExpCell({ h }: { h: Hold }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <Meter value={exposure(h)} max={h.limit} tone={overBy(h) ? "bad" : "accent"} w={46} />
      <span className="dx-num" style={{ color: overBy(h) ? "var(--bad)" : "var(--body)" }}>{eurK(exposure(h))} / {eurK(h.limit)}</span>
    </span>
  );
}

const MONTH_COLS = REVENUE_MONTHS.map((m, i) => ({ label: i === REVENUE_MONTHS.length - 1 ? m[0] + " MTD" : m[0], value: m[1] }));
const PEAK = REVENUE_MONTHS.reduce((a, m) => (m[2] > a[2] ? m : a), REVENUE_MONTHS[0]);

/* ---------- Overview ---------- */
function Overview() {
  const dx = useDx();
  const topOver = [...DEBTORS].sort((a, b) => b.overdue - a.overdue).slice(0, 3);
  return (
    <Page eyebrow={HEAD} title="Finance"
      sub="Revenue, margin, debtors, credit and cash in one view, each number tied back to the orders, stock and customers behind it."
      right={<>
        <Btn icon={IC.chat} onClick={() => dx.ask("Where is our working capital trapped?")}>Ask Credit Agent</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Finance", "wc")}>Working capital</Btn>
      </>}>
      <KpiRow n={7}>
        <Kpi label="Revenue MTD" value={eurK(KPI.revenueMTD)} sub={KPI.revenueDelta + " vs same period last month"} subTone="ok" onClick={() => dx.go("Finance", "revenue")} />
        <Kpi label="Gross profit MTD" value={eurK(KPI.grossProfitMTD)} sub={pct(KPI.grossMargin) + " margin · target " + pct(KPI.marginTarget)} subTone="warn" onClick={() => dx.go("Pricing", "margin")} />
        <Kpi label="Receivables" value={eurK(KPI.receivables)} sub={"DSO " + CASH.dso + " days"} onClick={() => dx.go("Finance", "debtors")} />
        <Kpi label="Overdue" value={eurK(KPI.overdue)} tone="bad" sub={pct((KPI.overdue / KPI.receivables) * 100, 0) + " of the ledger"} onClick={() => dx.go("Finance", "debtors")} />
        <Kpi label="Inventory" value={eurK(KPI.inventory)} sub={eurK(KPI.slowStock) + " slow-moving"} subTone="warn" onClick={() => dx.go("Inventory", "overview")} />
        <Kpi label="Inventory >120 days" value={kFloor(KPI.inventory120)} tone="warn" sub={eur(KPI.deadStock) + " over 180 days"} onClick={() => dx.go("Inventory", "slow")} />
        <Kpi label="Cash tied up" value={eurK(KPI.cashTiedUp)} sub={eurK(KPI.wcRelease) + " can be released"} subTone="ok" onClick={() => dx.go("Finance", "wc")} />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)">
        <Card title="Revenue, last 12 months" sub={"September is month to date: " + eur(KPI.revenueMTD) + " at " + TODAY.date}
          right={<Btn small kind="quiet" onClick={() => dx.go("Finance", "revenue")}>Revenue</Btn>}>
          <Columns data={MONTH_COLS} fmt={eurK} h={210} />
        </Card>
        <Card title="Gross margin" sub={"Peaked at " + pct(PEAK[2]) + " in " + PEAK[0] + ". Now " + pct(KPI.grossMargin) + " against a " + pct(KPI.marginTarget) + " target."}
          right={<Btn small kind="quiet" onClick={() => dx.go("Pricing", "margin")}>Margin control</Btn>}>
          <Lines labels={REVENUE_MONTHS.map(m => m[0])} series={[{ name: "Gross margin", data: REVENUE_MONTHS.map(m => m[2]), wash: true }]}
            fmt={v => v.toFixed(1) + "%"} h={210} target={KPI.marginTarget} targetLabel={"Target " + pct(KPI.marginTarget)} />
        </Card>
      </Grid>

      <Grid cols="minmax(0,1fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card title="Receivables ageing" sub={eur(KPI.receivables) + " owed · " + eur(KPI.overdue) + " overdue"}
          right={<Btn small kind="quiet" onClick={() => dx.go("Finance", "debtors")}>Debtors</Btn>}>
          <HBars items={DEBTOR_AGEING.map(([k, v], i) => ({ label: k, value: v, note: pct((v / KPI.receivables) * 100, 0), tone: T(i ? "warn" : "accent") }))} fmt={eurK} />
          <div style={{ marginTop: 16, fontSize: 12.5, color: "var(--dim)", lineHeight: 1.6 }}>
            Largest overdue: {topOver.map((d, i) => (
              <span key={d.key}>{i ? ", " : ""}<CustName h={d} /> {eur(d.overdue)}</span>
            ))}.
          </div>
        </Card>
        <Card title="Where the cash is tied up" sub={eurK(KPI.cashTiedUp) + " in stock and receivables"}
          right={<Btn small kind="quiet" onClick={() => dx.go("Finance", "wc")}>Working capital</Btn>}>
          <Strip h={14} fmt={eurK} parts={[{ label: "Inventory", value: KPI.inventory, tone: "accent" }, { label: "Receivables", value: KPI.receivables, tone: "warn" }]} />
          <div style={{ marginTop: 14 }}>
            <Facts cols={2} items={[
              ["Stock over 120 days", eur(KPI.inventory120), "warn"],
              ["No movement in 180+ days", eur(KPI.deadStock), "bad"],
              ["Receivables overdue", eur(KPI.overdue), "bad"],
              ["Can be released", eur(KPI.wcRelease), "ok"],
            ]} />
          </div>
        </Card>
      </Grid>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <Card title={"Credit holds · " + HOLDS.length + " orders · " + eur(HELD_VALUE)} sub="Stopped before picking because the account is over its limit or overdue. Owner: Rachel Hayes."
          right={<Btn small kind="quiet" onClick={() => dx.go("Finance", "credit")}>Credit control</Btn>} pad={false}>
          <Table dense onRow={h => openHold(dx, h.key)} rows={HOLDS} cols={[
            { k: "c", label: "Customer", w: "1.8fr", render: h => <CustName h={h} /> },
            { k: "so", label: "Order", w: "0.8fr", render: h => <SoRef id={h.so} /> },
            { k: "v", label: "Value", w: "0.7fr", align: "right", mono: true, render: h => eur(h.order) },
            { k: "e", label: "Exposure / limit", w: "1.3fr", render: h => <ExpCell h={h} /> },
            { k: "k", label: "Why held", w: "1.1fr", render: h => { const [t, tone] = holdKind(h); return <Badge tone={tone}>{t}</Badge>; } },
          ]} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent="Credit Agent · 08:42" title="Doyle Construction: release part of SO-10503" actions={<>
            <ActBtn id="d-credit" kind="primary" small label="Release €7,320" done="€7,320 released"
              toast="SO-10503 part-released: €7,320 against available credit. Payment request for INV-28482 sent to Kieran Doyle." />
            <Btn small onClick={() => openHold(dx, "doyle")}>Open the case</Btn>
          </>}>
            <Linked text="Doyle Construction has €42,680 on account against a €50,000 limit. Its new order SO-10503 (€16,240) would take exposure to €58,920." />
            <div style={{ marginTop: 8, color: "var(--ink)" }}>{DOYLE_REC}</div>
          </AiCard>
          <Card title="Cash position" sub="Sage Accounts · 08:16" right={<Btn small kind="quiet" onClick={() => dx.go("Finance", "cash")}>Cash</Btn>}>
            <Facts cols={2} items={[
              ["Bank", eur(CASH.bank)],
              ["Facility undrawn", eur(CASH.facility - CASH.facilityUsed)],
              ["Payables", eur(CASH.payables)],
              ["Payables overdue", eur(CASH.payablesOverdue), "warn"],
            ]} />
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

/* ---------- Revenue ---------- */
const SEG_OF = (s: string) =>
  /merchant|trade counter/i.test(s) ? "Merchants" : /contractor|plant hire/i.test(s) ? "Contractors"
  : /national account/i.test(s) ? "National accounts" : /facilities/i.test(s) ? "Facilities" : /retail/i.test(s) ? "Retail" : "Other";

function Revenue() {
  const dx = useDx();
  const top = [...CUSTOMERS].sort((a, b) => b.revMTD - a.revMTD).slice(0, 10);
  const named = CUSTOMERS.reduce((a, c) => a + c.revMTD, 0);
  const topShare = (top.reduce((a, c) => a + c.revMTD, 0) / KPI.revenueMTD) * 100;
  const segs = Object.values(CUSTOMERS.reduce((acc, c) => {
    const k = SEG_OF(c.segment);
    const s = acc[k] || (acc[k] = { label: k, value: 0, gp: 0, n: 0 });
    s.value += c.revMTD; s.gp += c.revMTD * c.margin / 100; s.n += 1;
    return acc;
  }, {} as Record<string, { label: string; value: number; gp: number; n: number }>)).sort((a, b) => b.value - a.value);
  const aug = REVENUE_MONTHS[REVENUE_MONTHS.length - 2];
  const cats = CATEGORY_MARGIN.map(([cat, rev, m]) => ({ cat, rev, m, gp: Math.round(rev * m / 100) }));
  const mTone = (m: number) => (m < 22 ? "var(--bad)" : m < KPI.marginTarget ? "var(--warn)" : "var(--ok)");
  return (
    <Page eyebrow={HEAD} title="Revenue"
      sub="September month to date against the last 12 months, and where it comes from: category, customer segment and account."
      right={<Btn icon={IC.chat} onClick={() => dx.ask("Where are we losing margin?")}>Ask Margin Agent</Btn>}>
      <KpiRow n={6}>
        <Kpi label="Revenue MTD" value={eur(KPI.revenueMTD)} sub={KPI.revenueDelta + " vs same period last month"} subTone="ok" />
        <Kpi label="Same period last month" value={eur(SAME_PERIOD_LAST)} sub="August, same trading days" />
        <Kpi label="Gross profit MTD" value={eur(KPI.grossProfitMTD)} sub={pct(KPI.grossMargin) + " margin"} subTone="warn" onClick={() => dx.go("Pricing", "margin")} />
        <Kpi label="Run-rate" value={eurK(COMPANY.monthlyRevenue)} sub="per month" />
        <Kpi label="Annualised" value={eurK(COMPANY.annualRevenue)} sub={num(COMPANY.accounts) + " active accounts"} />
        <Kpi label="Top 10 accounts" value={pct(topShare)} sub="of revenue this month" />
      </KpiRow>

      <Grid cols="minmax(0,8fr) minmax(0,4fr)">
        <Card title="Monthly revenue" sub={"October to September. September is month to date at " + TODAY.date + "."}>
          <Columns data={MONTH_COLS} fmt={eurK} h={220} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Against last month">
            <Facts cols={2} items={[
              ["September MTD", eur(KPI.revenueMTD)],
              ["August, same period", eur(SAME_PERIOD_LAST)],
              ["Difference", "+" + eur(KPI.revenueMTD - SAME_PERIOD_LAST), "ok"],
              ["August full month", eur(aug[1])],
              ["Still to match August", eur(aug[1] - KPI.revenueMTD)],
              ["Margin, Sep vs Aug", pct(KPI.grossMargin) + " vs " + pct(aug[2]), "warn"],
            ]} />
          </Card>
          <AiCard agent="Margin Agent" title="Growing, at a lower margin" actions={<>
            <Btn small onClick={() => dx.go("Pricing", "margin")}>Margin control</Btn>
            <Btn small kind="quiet" onClick={() => dx.go("Pricing", "costs")}>Cost changes</Btn>
          </>}>
            <Linked text={"Revenue is up " + KPI.revenueDelta + " on the same period last month, but margin has slipped from " + pct(PEAK[2]) + " in " + PEAK[0] + " to " + pct(KPI.grossMargin) + ". Electrical is the biggest category and runs at 22.8%. The 37 agreements still on old EuroFix pricing cost €819 a month on FIX-2201 alone."} />
          </AiCard>
        </div>
      </Grid>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <Card title="By category" sub={"Month to date · " + eur(cats.reduce((a, c) => a + c.rev, 0)) + " · click a row for product profitability"} pad={false}>
          <Table rows={cats} onRow={() => dx.go("Pricing", "profit")} cols={[
            { k: "cat", label: "Category", w: "1.6fr", render: r => <span style={{ color: "var(--ink)", fontWeight: 500 }}>{r.cat}</span> },
            { k: "rev", label: "Revenue MTD", w: "1fr", align: "right", mono: true, render: r => eur(r.rev) },
            { k: "sh", label: "Share", w: "1.1fr", render: r => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "100%" }}>
                <Meter value={r.rev} max={cats[0].rev} w={60} /><span className="dx-num dx-muted">{pct((r.rev / KPI.revenueMTD) * 100)}</span>
              </span>) },
            { k: "m", label: "Margin", w: "0.8fr", align: "right", render: r => <span className="dx-num" style={{ color: mTone(r.m), fontWeight: 500 }}>{pct(r.m)}</span> },
            { k: "gp", label: "Gross profit", w: "1fr", align: "right", mono: true, render: r => eur(r.gp) },
          ]} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="By customer segment" sub={"The " + CUSTOMERS.length + " largest accounts · margin shown beside each"}>
            <HBars fmt={eurK} items={segs.map(s => ({ label: s.label + " (" + s.n + ")", value: s.value, note: pct((s.gp / s.value) * 100) }))} />
            <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--dim)", lineHeight: 1.55 }}>
              These {CUSTOMERS.length} accounts bought {eur(named)} this month. The other {num(COMPANY.accounts - CUSTOMERS.length)} accounts add {eur(KPI.revenueMTD - named)}.
            </div>
          </Card>
          <AiCard agent="Customer Agent" title="Three large accounts are buying less" actions={<Btn small onClick={() => dx.go("Customers", "health")}>Customer health</Btn>}>
            <Linked text="Ryan Trade Supplies is down 28% in 90 days, Wicklow Hardware & DIY 14.6% and Swords Building Supplies 11.8%, with no PPE since July. Together they are €48,300 a year at risk." />
          </AiCard>
        </div>
      </Grid>

      <Card title="Top 10 customers this month" sub={eur(top.reduce((a, c) => a + c.revMTD, 0)) + " between them · " + pct(topShare) + " of month-to-date revenue"} pad={false} style={{ marginTop: 14 }}>
        <Table rows={top} onRow={c => dx.go("Customers", "detail", { cust: c.id })} cols={[
          { k: "n", label: "#", w: "0.3fr", render: (_c, i) => <span className="dx-num dx-faint">{i + 1}</span> },
          { k: "name", label: "Customer", w: "1.9fr", render: c => <RecLink kind="cust" id={c.id} plain>{c.name}</RecLink> },
          { k: "seg", label: "Segment", w: "1.3fr", render: c => <span className="dx-muted">{c.segment}</span> },
          { k: "am", label: "Account manager", w: "1.3fr", render: c => <Person id={c.am} /> },
          { k: "mtd", label: "MTD", w: "0.9fr", align: "right", mono: true, render: c => eur(c.revMTD) },
          { k: "ytd", label: "YTD", w: "0.9fr", align: "right", mono: true, render: c => eur(c.revYTD) },
          { k: "m", label: "Margin", w: "0.7fr", align: "right", render: c => <span className="dx-num" style={{ color: mTone(c.margin) }}>{pct(c.margin)}</span> },
          { k: "t", label: "Trend", w: "0.7fr", align: "right", render: c => <span className="dx-num" style={{ color: c.trend < 0 ? "var(--bad)" : "var(--ok)" }}>{(c.trend > 0 ? "+" : "") + pct(c.trend)}</span> },
          { k: "h", label: "Health", w: "0.9fr", render: c => <Risk r={c.health} /> },
        ]} />
      </Card>
    </Page>
  );
}

/* ---------- Debtors ---------- */
const PROMISES: { key: string; inv: string; amount: number; made: string; what: string; state: string; tone: Tone; note: string }[] = [
  { key: "doyle", inv: "INV-28482", amount: 14860, made: "18 Sep", what: "'This week'", state: "Broken", tone: "bad", note: "Nothing received in 7 days. SO-10503 is held until it lands." },
  { key: "mcgrath", inv: "INV-28410", amount: 8940, made: "22 Sep", what: "Withheld pending credit", state: "Disputed", tone: "bad", note: "DI-762: K01 arrived 10:40 against an 08:00 site slot." },
  { key: "keane", inv: "INV-28548", amount: 5210, made: "21 Sep", what: "30 Sep payment run", state: "Open", tone: "neutral", note: "SO-10512 held meanwhile, €1,040 can release now." },
  { key: "midland", inv: "INV-28519", amount: 4380, made: "23 Sep", what: "Cheque posted", state: "Not banked", tone: "warn", note: "Check it clears by 29 Sep before releasing more." },
  { key: "arklow", inv: "INV-28530", amount: 2640, made: "22 Sep", what: "By 29 Sep", state: "Open", tone: "neutral", note: "Payment brings SO-10523 inside the limit." },
  { key: "horizon", inv: "INV-28590", amount: 2140, made: "23 Sep", what: "Remittance 26 Sep", state: "Due tomorrow", tone: "warn", note: "Barry Keogh confirmed by phone." },
];
const nameOf = (key: string) => DEBTORS.find(d => d.key === key)!;

function Debtors() {
  const dx = useDx();
  const [f, setF] = useLocal("fin-debtors-filter", "overdue");
  const overdueRows = DEBTORS.filter(d => d.overdue > 0);
  const heldRows = DEBTORS.filter(d => d.hold);
  const rows = f === "overdue" ? overdueRows : f === "held" ? heldRows : DEBTORS;
  const listed = OVERDUE_INV.reduce((a, i) => a + i.amount, 0);
  const broken = PROMISES.filter(p => p.state === "Broken");
  return (
    <Page eyebrow={HEAD} title="Debtors"
      sub={eur(KPI.receivables) + " owed to us, " + eur(KPI.overdue) + " of it overdue. Who owes it, how old it is, and what they've promised."}
      right={<Btn kind="quiet" onClick={() => dx.go("Finance", "credit")}>Credit control</Btn>}>
      <KpiRow n={6}>
        <Kpi label="Receivables" value={eur(KPI.receivables)} sub={num(COMPANY.accounts) + " accounts"} />
        <Kpi label="Current" value={eur(DEBTOR_AGEING[0][1])} sub={pct((DEBTOR_AGEING[0][1] / KPI.receivables) * 100, 0) + " of the ledger"} subTone="ok" />
        <Kpi label="Overdue" value={eur(KPI.overdue)} tone="bad" sub={pct((KPI.overdue / KPI.receivables) * 100, 0) + " of the ledger"} />
        <Kpi label="90+ days" value={eur(DEBTOR_AGEING[3][1])} tone="bad" sub="McGrath is the largest" />
        <Kpi label="DSO" value={CASH.dso + " days"} sub="Standard terms 30 days" />
        <Kpi label="Broken promises" value={String(broken.length)} tone={broken.length ? "bad" : undefined} sub={broken.map(p => nameOf(p.key).name.split(" ")[0] + " · " + eur(p.amount)).join(", ")} />
      </KpiRow>

      <Grid cols="minmax(0,5fr) minmax(0,7fr)">
        <Card title="Ageing" sub="By days past invoice terms">
          <HBars items={DEBTOR_AGEING.map(([k, v], i) => ({ label: k, value: v, note: pct((v / KPI.receivables) * 100, 0), tone: T(i ? "warn" : "accent") }))} fmt={eur} />
          <div style={{ marginTop: 16 }}>
            <Strip h={10} fmt={eur} parts={[{ label: "Current", value: DEBTOR_AGEING[0][1], tone: "accent" }, { label: "Overdue", value: KPI.overdue, tone: "warn" }]} />
          </div>
        </Card>
        <AiCard agent="Credit Agent · 08:16" title="Collection priorities for Rachel today" actions={<>
          <ActBtn id="debtors-callplan" kind="primary" small label="Send to Rachel's call list" done="Call list sent"
            toast="Five collection calls added to Rachel Hayes's list in this order, statements attached." />
          <ActBtn id="debtors-requests" small label="Draft payment requests" done="5 requests drafted"
            toast="Five payment requests drafted in Outlook for Rachel Hayes to review and send." />
        </>}>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              "Doyle Construction: INV-28482, €14,860, 67 days. The promise made on 18 Sep is broken and SO-10503 is waiting on it.",
              "Tallaght Trade Centre: INV-28502, €6,420, 62 days. Paid by 13:00, SO-10533 keeps its place on D14.",
              "McGrath Civil Engineering: INV-28410, €8,940, 91 days. Agree the DI-762 credit and the rest can be paid.",
              "Tully Plant Hire: INV-28470, €4,120, 71 days. No reply to two reminders, so Sarah Byrne calls.",
              "Midland Timber & Hardware: INV-28519, €4,380. Cheque posted 23 Sep; confirm it clears by 29 Sep.",
            ].map((t, i) => <li key={i} style={{ paddingLeft: 4 }}><Linked text={t} /></li>)}
          </ol>
        </AiCard>
      </Grid>

      <Card title="Accounts" sub="Balance, overdue and the promise behind each one · credit controller Rachel Hayes" pad={false} style={{ marginTop: 14 }}
        right={<Seg value={f} onChange={setF} items={[["overdue", "Overdue (" + overdueRows.length + ")"], ["held", "Orders held (" + heldRows.length + ")"], ["all", "All listed (" + DEBTORS.length + ")"]]} />}>
        <Table rows={rows} rowTone={r => (r.cust && r.cust === dx.rec.cust && r.overdue ? "accent" : undefined)}
          onRow={r => (r.hold ? openHold(dx, r.key) : r.cust ? dx.go("Customers", "detail", { cust: r.cust }) : undefined)} cols={[
            { k: "name", label: "Customer", w: "1.9fr", render: r => (
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}><CustName h={r} /> <span className="dx-faint" style={{ fontSize: 12 }}>{r.acct}</span></span>) },
            { k: "bal", label: "Balance", w: "0.85fr", align: "right", mono: true, render: r => eur(r.balance) },
            { k: "od", label: "Overdue", w: "0.85fr", align: "right", mono: true, render: r => r.overdue ? <span style={{ color: "var(--bad)", fontWeight: 500 }}>{eur(r.overdue)}</span> : <span className="dx-faint">—</span> },
            { k: "old", label: "Oldest", w: "0.7fr", align: "right", render: r => r.oldest === null ? <span className="dx-faint">In terms</span>
              : <span className="dx-num" style={{ color: r.oldest > 60 ? "var(--bad)" : r.oldest > 30 ? "var(--warn)" : "var(--body)" }}>{r.oldest} days</span> },
            { k: "terms", label: "Terms", w: "0.85fr", render: r => <span className="dx-muted">{r.terms}</span> },
            { k: "pr", label: "Promise to pay", w: "1.7fr", render: r => r.promise ? <span style={{ color: r.promiseTone ? "var(--" + r.promiseTone + ")" : "var(--body)" }}>{r.promise}</span> : <span className="dx-faint">—</span> },
            { k: "st", label: "Status", w: "1.25fr", render: r => <Badge tone={r.tone}>{r.status}</Badge> },
            { k: "own", label: "Owner", w: "1.2fr", render: () => <Person id="rachel" /> },
          ]} />
      </Card>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <Card title="Overdue invoices" sub={OVERDUE_INV.length + " invoices, " + eur(listed) + ". The other " + eur(KPI.overdue - listed) + " is spread across smaller accounts."} pad={false}>
          <Table dense rows={OVERDUE_INV} onRow={r => (HOLDS.some(h => h.key === r.key) ? openHold(dx, r.key) : r.cust ? dx.go("Customers", "detail", { cust: r.cust }) : undefined)} cols={[
            { k: "id", label: "Invoice", w: "0.95fr", render: r => <span className="dx-num" style={{ color: "var(--ink)", fontWeight: 500 }}>{r.id}</span> },
            { k: "c", label: "Customer", w: "1.9fr", render: r => <CustName h={r} /> },
            { k: "a", label: "Amount", w: "0.8fr", align: "right", mono: true, render: r => eur(r.amount) },
            { k: "iss", label: "Issued", w: "0.6fr", render: r => <span className="dx-muted">{r.issued}</span> },
            { k: "d", label: "Age", w: "0.7fr", align: "right", render: r => <span className="dx-num" style={{ color: r.days > 60 ? "var(--bad)" : "var(--warn)" }}>{r.days} days</span> },
            { k: "st", label: "Status", w: "1.3fr", render: r => <Risk r={r.status} /> },
          ]} />
        </Card>
        <Card title="Payment promises" sub={PROMISES.length + " open · " + broken.length + " broken (" + eur(broken.reduce((a, p) => a + p.amount, 0)) + ")"} pad={false}>
          <div className="dx-list">
            {PROMISES.map((p, i) => (
              <div key={p.inv} className="dx-li" style={{ borderTop: i ? undefined : 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><CustName h={nameOf(p.key)} /></span>
                    <Badge tone={p.tone}>{p.state}</Badge>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 4 }}>
                    <span className="dx-num">{p.inv} · {eur(p.amount)}</span> · {p.what}, made {p.made}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 3 }}><Linked text={p.note} /></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

/* ---------- Credit control ---------- */
function CreditCase({ h }: { h: Hold }) {
  const dx = useDx();
  const exp = exposure(h), over = overBy(h), av = avail(h);
  const [kt, ktone] = holdKind(h);
  const inv = oldestOverdue(h);
  const decided = dx.acted[h.primary.id];
  const am = who(h.am);
  const amFirst = am.name.split(" ")[0];
  const invTotal = h.invoices.reduce((a, i) => a + i.amount, 0);
  const ownerFirst = "Rachel Hayes";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card tone={over ? "bad" : "warn"}
        title={<span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 17 }}><CustName h={h} />{over ? <Risk r="CREDIT LIMIT EXCEEDED" /> : <Badge tone={ktone}>{kt.toUpperCase()}</Badge>}</span>}
        sub={h.area + " · " + h.seg + " · account manager " + am.name + " · held " + h.heldAt + " by the Credit Agent"}>
        <Facts cols={4} items={[
          ["Credit limit", eur(h.limit)],
          ["Balance", eur(h.balance)],
          ["New order", <span key="o"><SoRef id={h.so} /> · {eur(h.order)}</span>],
          ["Projected exposure", eur(exp), over ? "bad" : undefined],
          ["Available credit", eur(av), av < h.order ? "warn" : "ok"],
          [over ? "Over limit if released" : "Headroom after order", eur(over || h.limit - exp), over ? "bad" : "ok"],
          ["Overdue", eur(h.overdue), h.overdue ? "warn" : undefined],
          ["Oldest invoice", h.oldest + " days", h.oldest > 60 ? "bad" : "warn"],
        ]} />
        <div style={{ marginTop: 16 }}><ExposureBar balance={h.balance} order={h.order} limit={h.limit} /></div>
        <div style={{ marginTop: 14 }}><Note tone="warn"><Linked text={"Why it's held: " + h.why} /></Note></div>
      </Card>

      <AiCard agent={"Credit Agent · " + h.heldAt} title="Recommended action" actions={<>
        <ActBtn id={h.primary.id} kind="primary" label={h.primary.label} done={h.primary.done} toast={h.primary.toast} />
        <ActBtn id={"cr-" + h.key + "-hold"} label="Hold Order" done="Hold confirmed"
          toast={h.so + " stays on hold. " + h.contact + " and " + am.name + " told it won't be picked until payment."} />
        <ActBtn id={"cr-" + h.key + "-override"} kind="danger" label="Override" done="Overridden · released in full"
          toast={h.so + " released in full (" + eur(h.order) + "). Override logged against your name; exposure now " + eur(exp) + "."} />
        <ActBtn id={"cr-" + h.key + "-pay"} label="Request Payment" done="Payment requested"
          toast={"Payment request for " + (inv ? inv.id + " (" + eur(inv.amount) + ")" : "the overdue balance") + " sent to " + h.contact + "."} />
        <ActBtn id={"cr-" + h.key + "-am"} label="Contact Account Manager" done={amFirst + " notified"}
          toast={am.name + " asked to call " + h.contact + " about " + h.so + " today."} />
      </>}>
        <div style={{ color: "var(--ink)" }}><Linked text={h.rec} /></div>
        {decided && <div style={{ marginTop: 10 }}><Note tone="ok">{decided}. {h.key === "doyle" ? "€8,920 stays held until INV-28482 is paid." : "Logged against " + h.so + " for " + ownerFirst + "."}</Note></div>}
      </AiCard>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)">
        <Card title={invTotal === h.balance ? "Open invoices" : "Overdue invoices"}
          sub={invTotal === h.balance
            ? h.invoices.length + " invoice" + (h.invoices.length === 1 ? "" : "s") + ", " + eur(invTotal) + ", the full balance"
            : eur(invTotal) + " overdue · the rest of the " + eur(h.balance) + " balance is current"} pad={false}>
          <Table dense rows={h.invoices} cols={[
            { k: "id", label: "Invoice", w: "1fr", render: i => <span className="dx-num" style={{ color: "var(--ink)", fontWeight: 500 }}>{i.id}</span> },
            { k: "iss", label: "Issued", w: "0.7fr", render: i => <span className="dx-muted">{i.issued}</span> },
            { k: "due", label: "Due", w: "0.7fr", render: i => <span className="dx-muted">{i.due}</span> },
            { k: "a", label: "Amount", w: "0.9fr", align: "right", mono: true, render: i => eur(i.amount) },
            { k: "st", label: "Status", w: "1.2fr", render: i => <Risk r={i.status} /> },
          ]} />
          {h.invoices.some(i => i.promise) && (
            <div style={{ padding: "11px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)" }}>
              {h.invoices.filter(i => i.promise).map(i => i.id + ": " + i.promise).join(" · ")}
            </div>
          )}
        </Card>
        <Card title="What the hold touches" sub="Credit, order, warehouse, route and cash">
          <Chain steps={[
            { k: "Credit hold", v: "Held " + h.heldAt, sub: kt, tone: "bad", icon: IC.alert },
            { k: "Sales order", v: <span><SoRef id={h.so} /> · {eur(h.order)} · {h.lines} lines</span>, sub: "Stock available, nothing allocated while it's held",
              icon: IC.doc, onClick: ORDERS.some(o => o.id === h.so) ? () => dx.go("Orders", "detail", { order: h.so }) : undefined },
            { k: "Pick queue · " + h.wh, v: decided ? decided : "Not released to picking", sub: "Release by " + h.releaseBy, tone: decided ? "ok" : "warn", icon: IC.box,
              onClick: () => dx.go("Warehouse", "picking") },
            { k: "Delivery", v: h.routeId ? <span><RecLink kind="route" id={h.routeId} /> · {h.route.slice(h.routeId.length + 2)}</span> : h.route, icon: IC.truck,
              onClick: h.routeId ? () => dx.open("route", h.routeId!) : undefined },
            { k: "Cash", v: inv ? inv.id + " · " + eur(inv.amount) : eur(h.overdue), sub: "Payment unlocks the rest of the order", icon: IC.euro },
          ]} />
        </Card>
      </Grid>
    </div>
  );
}

const HIGH_RISK: { key: string; badge: string; tone: Tone; text: string }[] = [
  { key: "mcgrath", badge: "90+ days · disputed", tone: "bad", text: "€8,940 at 91 days on INV-28410, withheld over the 22 Sep late delivery (DI-762). The next order, SO-10538, is held." },
  { key: "tallaght", badge: "Credit hold", tone: "bad", text: "€24,310 of a €25,000 limit with €6,420 overdue 62 days. Counter overrides took margin from 27.1% to 24.0% this month." },
  { key: "midland", badge: "Watch", tone: "warn", text: "Spend down 8.1%, three late M01 drops in September and €4,380 overdue with a cheque in the post." },
];

function CreditControl() {
  const dx = useDx();
  const [sel, setSel] = useState(() => pendingHold || (HOLDS.some(h => h.key === dx.rec.cust) ? dx.rec.cust : "doyle"));
  useEffect(() => { pendingHold = null; }, []);
  const h = HOLDS.find(x => x.key === sel) || HOLDS[0];
  const overCount = HOLDS.filter(x => overBy(x) > 0).length;
  const heldOverdue = HOLDS.reduce((a, x) => a + x.overdue, 0);
  const decided = HOLDS.filter(x => ["-hold", "-override", "-pay", "-am"].some(s => dx.acted["cr-" + x.key + s]) || dx.acted[x.primary.id]).length;
  const top = [...HOLDS].sort((a, b) => exposure(b) - b.limit - (exposure(a) - a.limit))[0];
  const pick = (key: string) => {
    setSel(key);
    document.querySelector("[data-scroll-main]")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <Page eyebrow={HEAD} title="Credit control"
      sub="Every held order, the exposure behind it, and what releasing it does to the pick queue, the routes and the cash."
      right={<Btn kind="quiet" onClick={() => dx.go("Finance", "debtors")}>Debtors</Btn>}>
      <KpiRow n={6}>
        <Kpi label="Orders on credit hold" value={String(HOLDS.length)} sub={eur(HELD_VALUE) + " waiting to pick"} subTone="warn" />
        <Kpi label="Over limit if released" value={String(overCount)} tone="bad" sub={HOLDS.length - overCount + " more held for overdue debt"} />
        <Kpi label="Overdue on held accounts" value={eur(heldOverdue)} sub={"across " + HOLDS.length + " accounts"} />
        <Kpi label="Largest exposure" value={eur(exposure(top))} tone="bad" sub={top.name + " · limit " + eur(top.limit)} />
        <Kpi label="Broken promises" value="1" tone="bad" sub="Doyle · €14,860 since 18 Sep" />
        <Kpi label="Decided today" value={decided + " of " + HOLDS.length} tone={decided ? "ok" : undefined} sub="releases, holds and overrides" />
      </KpiRow>

      <Grid cols="minmax(0,4fr) minmax(0,8fr)">
        <Card title="Held orders" sub="By order value · owner Rachel Hayes" pad={false}>
          <div className="dx-list">
            {HOLDS.map((x, i) => {
              const on = x.key === h.key;
              const [kt, ktone] = holdKind(x);
              const done = dx.acted[x.primary.id];
              return (
                <div key={x.key} className="dx-li dx-click" onClick={() => setSel(x.key)}
                  style={{ borderTop: i ? undefined : 0, background: on ? "var(--surface-2)" : undefined, boxShadow: on ? "inset 3px 0 0 var(--accent)" : undefined }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: on ? "var(--ink)" : "var(--body)" }}>{x.name}</span>
                      <span className="dx-num" style={{ fontSize: 13, fontWeight: 500, flex: "none" }}>{eur(x.order)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <span className="dx-num" style={{ fontSize: 12, color: "var(--dim)" }}>{x.so}</span>
                      <Badge tone={done ? "ok" : ktone}>{done ? "Decided" : kt}</Badge>
                    </div>
                    <div style={{ marginTop: 9 }}><Meter value={exposure(x)} max={x.limit} tone={overBy(x) ? "bad" : "accent"} h={4} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <CreditCase key={h.key} h={h} />
      </Grid>

      <div className="dx-section">
        <div className="dx-section-head"><div className="dx-section-title">High-risk accounts</div><span className="dx-faint" style={{ fontSize: 12.5 }}>Accounts the Credit Agent checks every morning</span></div>
        <Grid cols="repeat(3,minmax(0,1fr))" gap={12}>
          {HIGH_RISK.map(r => {
            const c = customer(r.key);
            const od = overdueOf(r.key);
            return (
              <Card key={r.key} tone={r.tone === "bad" ? "bad" : "warn"}
                title={<RecLink kind="cust" id={c.id} plain>{c.name}</RecLink>} sub={c.area + " · " + c.segment} right={<Badge tone={r.tone}>{r.badge}</Badge>}>
                <Facts cols={2} items={[
                  ["Balance / limit", eur(c.balance) + " / " + eurK(c.limit), c.balance / c.limit > 0.9 ? "bad" : undefined],
                  ["Overdue", eur(od), "bad"],
                  ["Oldest", (oldestOf(r.key) ?? 0) + " days", (oldestOf(r.key) ?? 0) > 60 ? "bad" : "warn"],
                  ["OTIF", pct(c.otif), c.otif < 93 ? "warn" : undefined],
                ]} />
                <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", marginTop: 12 }}><Linked text={r.text} /></div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Btn small kind="primary" onClick={() => pick(r.key)}>Open case</Btn>
                  <Btn small kind="quiet" onClick={() => dx.go("Customers", "detail", { cust: c.id })}>Account</Btn>
                </div>
              </Card>
            );
          })}
        </Grid>
      </div>
    </Page>
  );
}

/* ---------- Cash ---------- */
let running = CASH.bank / 1000;
const WEEKS = CASH.weeks.map(([w, i, o]) => { running += i - o; return { w, i, o, net: i - o, close: running }; });
const LOW = WEEKS.reduce((a, w) => (w.close < a.close ? w : a), WEEKS[0]);
const kk = (n: number) => "€" + Math.round(n) + "k";
const k1 = (n: number) => "€" + n.toFixed(1) + "k";

function Cash() {
  const dx = useDx();
  const headroom = CASH.facility - CASH.facilityUsed;
  const ccc = CASH.dso + CASH.dio - CASH.dpo;
  const moves: { v: number; text: string; owner: string; go: () => void; act?: ReactNode }[] = [
    { v: 14860, text: "Doyle Construction pays INV-28482. Requested as the condition for releasing the rest of SO-10503.", owner: "rachel", go: () => openHold(dx, "doyle") },
    { v: 12090, text: "Lower Toolcraft payment once 180 superseded TL-3321 impact drivers go back at 15% restocking.", owner: "ciaran", go: () => dx.go("Inventory", "slow") },
    { v: 6420, text: "Tallaght Trade Centre pays INV-28502. Needed by 13:00 for SO-10533 to keep its D14 slot.", owner: "rachel", go: () => openHold(dx, "tallaght") },
    { v: 4380, text: "Midland Timber & Hardware cheque for INV-28519, posted 23 Sep. Should clear by 29 Sep.", owner: "rachel", go: () => dx.go("Finance", "debtors") },
    { v: 0, text: "PO-8821 (€38,640) lands tomorrow on Atlas's 60-day terms, so nothing is payable until late November.", owner: "emma", go: () => dx.open("po", "PO-8821") },
    { v: -420, text: "Dedicated Atlas van to expedite PO-8821, if approved by 09:30.", owner: "emma", go: () => dx.open("po", "PO-8821"),
      act: <ActBtn id="d-expedite" small label="Approve · €420" done="Approved" toast="PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow." /> },
    { v: -CASH.payablesOverdue, text: "Overdue supplier payables cleared in the 28 Sep run. Asking Atlas and Hansen for 60-day terms depends on paying on time.", owner: "niamh", go: () => dx.go("Purchasing", "suppliers") },
  ];
  const net = moves.reduce((a, m) => a + m.v, 0);
  return (
    <Page eyebrow={HEAD} title="Cash"
      sub="Bank, facility and payables today, the next eight weeks of receipts and payments, and the specific items that move the position."
      right={<Btn kind="quiet" onClick={() => dx.go("Finance", "wc")}>Working capital</Btn>}>
      <KpiRow n={6}>
        <Kpi label="Bank balance" value={eur(CASH.bank)} sub="Sage Accounts · 08:16" />
        <Kpi label="Facility headroom" value={eur(headroom)} sub={eur(CASH.facilityUsed) + " drawn of " + eur(CASH.facility)} />
        <Kpi label="Payables" value={eurK(CASH.payables)} sub={eur(CASH.payablesOverdue) + " overdue"} subTone="warn" />
        <Kpi label="DSO" value={CASH.dso + " days"} sub="Days to collect from customers" />
        <Kpi label="DPO" value={CASH.dpo + " days"} sub="Days we take to pay suppliers" />
        <Kpi label="DIO" value={CASH.dio + " days"} sub="Days stock sits before it sells" />
      </KpiRow>

      <Grid cols="minmax(0,8fr) minmax(0,4fr)">
        <Card title="Next 8 weeks: receipts and payments" sub={"€ thousands, weekly · lowest point " + k1(LOW.close) + " in the week of " + LOW.w}>
          <div style={{ paddingTop: 18 }}>
            <Lines labels={WEEKS.map(w => w.w)} fmt={kk} h={210} series={[
              { name: "Receipts", data: WEEKS.map(w => w.i), tone: "accent", wash: true },
              { name: "Payments", data: WEEKS.map(w => w.o), tone: "warn" },
            ]} />
          </div>
          <div style={{ margin: "16px -20px -18px" }}>
            <Table dense rows={WEEKS} cols={[
              { k: "w", label: "Week of", w: "1fr", render: w => <span style={{ color: "var(--ink)" }}>{w.w}</span> },
              { k: "i", label: "Receipts", w: "1fr", align: "right", mono: true, render: w => kk(w.i) },
              { k: "o", label: "Payments", w: "1fr", align: "right", mono: true, render: w => kk(w.o) },
              { k: "n", label: "Net", w: "0.9fr", align: "right", mono: true, render: w => <span style={{ color: w.net < 0 ? "var(--bad)" : "var(--ok)" }}>{(w.net > 0 ? "+" : w.net < 0 ? "−" : "") + kk(Math.abs(w.net))}</span> },
              { k: "c", label: "Closing bank", w: "1fr", align: "right", mono: true, render: w => <span style={{ fontWeight: w === LOW ? 600 : 400, color: w === LOW ? "var(--warn)" : undefined }}>{k1(w.close)}</span> },
            ]} />
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Cash conversion cycle" sub={ccc + " days from paying a supplier to being paid by the customer"}>
            <Chain steps={[
              { k: "Stock sits (DIO)", v: CASH.dio + " days", sub: eur(KPI.inventory120) + " of it over 120 days", icon: IC.box, onClick: () => dx.go("Inventory", "slow") },
              { k: "Customers pay (DSO)", v: "+ " + CASH.dso + " days", sub: eur(KPI.overdue) + " overdue", icon: IC.user, onClick: () => dx.go("Finance", "debtors") },
              { k: "Suppliers wait (DPO)", v: "− " + CASH.dpo + " days", sub: eur(CASH.payablesOverdue) + " already overdue", icon: IC.factory, onClick: () => dx.go("Purchasing", "suppliers") },
              { k: "Cash conversion cycle", v: ccc + " days", tone: "accent", icon: IC.clock },
            ]} />
          </Card>
          <AiCard agent="Credit Agent" title="No cash squeeze. The pressure is working capital." actions={<Btn small onClick={() => dx.go("Finance", "wc")}>Working capital</Btn>}>
            Liquidity is {eur(CASH.bank + headroom)}: {eur(CASH.bank)} in the bank and {eur(headroom)} undrawn on the facility. The forecast bottoms out at {k1(LOW.close)} in the week of {LOW.w}.
            {" "}The bigger number is the {eurK(KPI.cashTiedUp)} sitting in stock and receivables on a {ccc}-day cycle.
          </AiCard>
        </div>
      </Grid>

      <Card title="What moves the cash position this month" sub="Specific items the agents are tracking, each linked to where it's actioned" pad={false} style={{ marginTop: 14 }}>
        <div className="dx-list">
          {moves.map((m, i) => (
            <div key={i} className="dx-li dx-click" onClick={m.go} style={{ borderTop: i ? undefined : 0, alignItems: "center" }}>
              <span className="dx-num" style={{ width: 96, flex: "none", fontSize: 14, fontWeight: 600, color: m.v > 0 ? "var(--ok)" : m.v < 0 ? "var(--bad)" : "var(--dim)" }}>
                {m.v > 0 ? "+" + eur(m.v) : m.v < 0 ? eur(m.v) : "€0 now"}
              </span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5, color: "var(--body)" }}><Linked text={m.text} /></div>
              {m.act}
              <span style={{ flex: "none", width: 170 }}><Person id={m.owner} /></span>
            </div>
          ))}
          <div className="dx-li" style={{ alignItems: "center", background: "var(--surface-faint)" }}>
            <span className="dx-num" style={{ width: 96, flex: "none", fontSize: 14, fontWeight: 600, color: net < 0 ? "var(--bad)" : "var(--ok)" }}>{net < 0 ? eur(net) : "+" + eur(net)}</span>
            <div style={{ flex: 1, fontSize: 13, color: "var(--dim)" }}>Net of these items, on top of the weekly forecast. Clearing overdue payables is the one that costs cash; the rest brings it in.</div>
          </div>
        </div>
      </Card>
    </Page>
  );
}

/* ---------- Working capital ---------- */
const NET_WC = KPI.inventory + KPI.receivables - CASH.payables;
const WC_WHERE: { owner: string; go: [string, string]; cta: string }[] = [
  { owner: "emma", go: ["Inventory", "slow"], cta: "Slow & Dead Stock" },
  { owner: "rachel", go: ["Finance", "debtors"], cta: "Debtors" },
  { owner: "emma", go: ["Purchasing", "suppliers"], cta: "Suppliers" },
  { owner: "ciaran", go: ["Inventory", "replenishment"], cta: "Replenishment" },
];
const COLLECT_ACCTS = ["doyle", "mcgrath", "tallaght", "midland"];

function WorkingCapital() {
  const dx = useDx();
  const total = WC_OPPS.reduce((a, o) => a + o[1], 0);
  return (
    <Page eyebrow={HEAD} title="Working capital"
      sub={eur(KPI.cashTiedUp) + " is tied up in stock and receivables. " + eur(total) + " of it can come back without cutting service, and each action below says where it's done."}
      right={<Btn icon={IC.chat} onClick={() => dx.ask("Where is our working capital trapped?")}>Ask where it's trapped</Btn>}>
      <KpiRow n={6}>
        <Kpi label="Inventory" value={eurK(KPI.inventory)} sub={eur(KPI.inventory120) + " over 120 days"} subTone="warn" onClick={() => dx.go("Inventory", "overview")} />
        <Kpi label="Receivables" value={eurK(KPI.receivables)} sub={eur(KPI.overdue) + " overdue"} subTone="bad" onClick={() => dx.go("Finance", "debtors")} />
        <Kpi label="Payables" value={eurK(CASH.payables)} sub={eur(CASH.payablesOverdue) + " overdue"} subTone="warn" onClick={() => dx.go("Finance", "cash")} />
        <Kpi label="Net working capital" value={m2(NET_WC)} sub={CASH.dso + CASH.dio - CASH.dpo + "-day cash cycle"} />
        <Kpi label="Cash tied up" value={eurK(KPI.cashTiedUp)} sub="Stock plus receivables" />
        <Kpi label="Potential release" value={eurK(total)} tone="ok" sub={pct((total / KPI.cashTiedUp) * 100) + " of cash tied up"} />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)">
        <Card title="How the working capital is made up" sub="What we hold and are owed, less what we owe">
          <div style={{ paddingTop: 6 }}>
            <Chain dir="across" steps={[
              { k: "Inventory", v: eur(KPI.inventory), sub: eur(KPI.slowStock) + " slow-moving", tone: "accent", icon: IC.box, onClick: () => dx.go("Inventory", "overview") },
              { k: "Plus receivables", v: eur(KPI.receivables), sub: eur(KPI.overdue) + " overdue", tone: "warn", icon: IC.user, onClick: () => dx.go("Finance", "debtors") },
              { k: "Less payables", v: "−" + eur(CASH.payables), sub: eur(CASH.payablesOverdue) + " overdue", icon: IC.factory, onClick: () => dx.go("Finance", "cash") },
              { k: "Net working capital", v: eur(NET_WC), sub: "Cash tied up " + eurK(KPI.cashTiedUp), tone: "ok", icon: IC.euro },
            ]} />
          </div>
          <div style={{ marginTop: 22 }}>
            <Strip h={12} fmt={eurK} parts={[
              { label: "Stock under 90 days", value: KPI.inventory - KPI.slowStock, tone: "accent" },
              { label: "Slow stock 90+ days", value: KPI.slowStock, tone: "warn" },
              { label: "Receivables in terms", value: KPI.receivables - KPI.overdue, tone: "var(--chart-muted)" },
              { label: "Receivables overdue", value: KPI.overdue, tone: "bad" },
            ]} />
          </div>
        </Card>
        <AiCard agent="Inventory Agent · Credit Agent" title={eur(total) + " can come back"} actions={<>
          <ActBtn id="wc-assign" kind="primary" small label="Assign the four actions" done="Assigned to owners"
            toast="Working capital actions assigned: Emma Walsh (slow stock, supplier terms), Rachel Hayes (collections), Ciarán Doherty (safety stock)." />
          <Btn small onClick={() => dx.go("Inventory", "slow")}>Slow & dead stock</Btn>
        </>}>
          <Linked text={"Three quarters of it is stock: supplier returns, transfers, bundles and stopped replenishment across 482 slow lines. The quickest single wins are sending 180 superseded TL-3321 drivers back to Toolcraft (€12,090) and offering the EL-6120 cable tray sitting in Naas to Horizon Electrical and Liffey Mechanical & Electrical (€11,030)."} />
        </AiCard>
      </Grid>

      <Card title={"Where " + eur(total) + " can come back"} sub="Four levers, each with an owner and the page where it's actioned" pad={false} style={{ marginTop: 14 }}>
        <div className="dx-list">
          {WC_OPPS.map(([k, v, why], i) => {
            const w = WC_WHERE[i];
            return (
              <div key={k} className="dx-li" style={{ borderTop: i ? undefined : 0, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}><Linked text={why} /></div>
                </div>
                <div style={{ width: 170, flex: "none" }}>
                  <div className="dx-num" style={{ fontSize: 16, fontWeight: 600, color: "var(--ok)" }}>{eur(v)}</div>
                  <div style={{ marginTop: 6 }}><Meter value={v} max={WC_OPPS[0][1]} tone="ok" h={4} /></div>
                </div>
                <span style={{ width: 160, flex: "none" }}><Person id={w.owner} /></span>
                <Btn small onClick={() => dx.go(w.go[0], w.go[1])}>{w.cta}</Btn>
              </div>
            );
          })}
        </div>
      </Card>

      <Grid cols="minmax(0,1fr) minmax(0,1fr)" style={{ marginTop: 14 }}>
        <Card title="Slow and dead stock: €168,000 by action" sub={"From " + eur(KPI.slowStock) + " of slow-moving stock · lines per action shown"}
          right={<Btn small kind="quiet" onClick={() => dx.go("Inventory", "slow")}>Open</Btn>}>
          <HBars fmt={eurK} items={[...SLOW_ACTIONS].sort((a, b) => b[2] - a[2]).map(([a, lines, rel]) => ({ label: a, value: rel, note: lines + " lines" }))} onClick={() => dx.go("Inventory", "slow")} />
        </Card>
        <Card title="Inventory by age" sub={eur(KPI.inventory) + " · slow stock is everything over 90 days"}
          right={<Btn small kind="quiet" onClick={() => dx.go("Inventory", "overview")}>Inventory</Btn>}>
          <HBars fmt={eurK} items={INVENTORY_AGEING.map(([k, v], i) => ({ label: k, value: v, note: pct((v / KPI.inventory) * 100), tone: T(i >= 3 ? "warn" : "accent") }))} />
          <div style={{ marginTop: 16, fontSize: 12.5, color: "var(--dim)", lineHeight: 1.6 }}>
            Collections to bring back inside terms:{" "}
            {COLLECT_ACCTS.map((k, i) => (
              <span key={k}>{i ? ", " : ""}<RecLink kind="cust" id={k} plain>{customer(k).name}</RecLink> {eur(overdueOf(k))}</span>
            ))}.
          </div>
        </Card>
      </Grid>

      <Card title="Largest slow lines" sub="The biggest line in each action, with what the Inventory Agent recommends" pad={false} style={{ marginTop: 14 }}>
        <Table rows={SLOW_LINES} onRow={r => dx.open("sku", r.sku)} cols={[
          { k: "sku", label: "SKU", w: "0.8fr", render: r => <RecLink kind="sku" id={r.sku} /> },
          { k: "name", label: "Product", w: "2fr", render: r => <span style={{ color: "var(--ink)" }}>{r.name}</span> },
          { k: "wh", label: "Warehouse", w: "1fr", render: r => <span className="dx-muted">{r.wh}</span> },
          { k: "qty", label: "Qty", w: "0.6fr", align: "right", mono: true, render: r => num(r.qty) },
          { k: "val", label: "Value", w: "0.8fr", align: "right", mono: true, render: r => eur(r.value) },
          { k: "days", label: "Days", w: "0.6fr", align: "right", render: r => <span className="dx-num" style={{ color: r.days > 180 ? "var(--bad)" : "var(--warn)" }}>{r.days}</span> },
          { k: "act", label: "Action", w: "1.5fr", render: r => <Badge tone="accent">{r.action}</Badge> },
          { k: "rel", label: "Release", w: "0.8fr", align: "right", mono: true, render: r => <span style={{ color: "var(--ok)", fontWeight: 500 }}>{eur(r.release)}</span> },
        ]} />
      </Card>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = {
  overview: Overview, revenue: Revenue, debtors: Debtors, credit: CreditControl, cash: Cash, wc: WorkingCapital,
};
