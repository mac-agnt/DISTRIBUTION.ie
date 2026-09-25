import { Fragment, type ComponentType, type ReactNode } from "react";
import {
  ACTIVITY, BUYING_PATTERN, CREDIT_HOLDS, CUSTOMERS, CUSTOMER_SUMMARY_MURPHY, DELIVERY_ISSUES, DISCOUNTS, HEALTH_COUNTS, HEALTH_SIGNALS, INVOICES, KPI,
  MURPHY_HISTORY, MURPHY_TOP, OPPORTUNITIES, ORDERS, ORDER_PIPELINE, PODS, PRICE_ROWS, PRODUCTS, QUOTES, RETURNS, RETURN_PATTERN, ROUTES,
  customer, product, who, eur, eurK, num, pct, type Customer, type Opp,
} from "../db";
import {
  ActBtn, AiCard, Avatar, Badge, Btn, Card, Columns, Facts, Grid, HBars, Icon, IC, Kpi, KpiRow, Meter, Note, Page, Person, RecLink, Risk, Seg, Strip, Table,
  useDx, useLocal, type Tone,
} from "../ui";

/* ================= shared helpers ================= */

const healthTone = (h: string): Tone => (h === "Growing" ? "ok" : h === "Declining" ? "warn" : h === "At risk" ? "bad" : "neutral");
const statusTone = (s: string): Tone => (s === "Credit hold" ? "bad" : s === "Watch" ? "warn" : "neutral");
const creditTone = (c: Customer): Tone => (c.balance / c.limit >= 0.85 ? "bad" : c.balance / c.limit >= 0.7 ? "warn" : "accent");
const signed = (n: number, dp = 1) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(dp) + "%";
const custOrders = (id: string) => ORDERS.filter(o => o.cust === id);
const hasOrder = (id: string) => ORDERS.some(o => o.id === id);
const hasQuote = (id: string) => QUOTES.some(q => q.id === id);
const hasRoute = (id: string) => ROUTES.some(r => r.id === id);
const riskRank = (r: string) => (r === "HIGH" ? 0 : r === "MEDIUM" ? 1 : r === "LOW" ? 2 : 3);
const onHold = (c: Customer) => c.status === "Credit hold" || CREDIT_HOLDS.some(h => h.cust === c.id);
/* "€18,600 annualised" in a health signal, as a number. */
const annualised = (s: string) => { const m = s.match(/€([\d,]+) annualised/); return m ? +m[1].replace(/,/g, "") : 0; };

/* An order id only links when the order exists in the database. */
function SoLink({ id }: { id: string }) {
  return hasOrder(id) ? <RecLink kind="order" id={id} /> : <span className="dx-num">{id}</span>;
}

/* Turns record ids inside a sentence into links. */
function Linked({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(SO-\d{5}|PO-\d{4}|QT-\d{4}|(?:EL|FIX|SAF|IC|TL|JAN|PK)-\d{4})/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    parts.push(text.slice(last, m.index));
    const id = m[0];
    if (id.startsWith("SO")) parts.push(<SoLink key={m.index} id={id} />);
    else if (id.startsWith("PO")) parts.push(<RecLink key={m.index} kind="po" id={id} />);
    else if (id.startsWith("QT")) parts.push(hasQuote(id) ? <RecLink key={m.index} kind="quote" id={id} /> : id);
    else parts.push(PRODUCTS.some(p => p.sku === id) ? <RecLink key={m.index} kind="sku" id={id} /> : id);
    last = m.index + id.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

/* Lets text inside a table cell wrap instead of truncating. */
const Wrap = ({ children, size = 12.5, dim }: { children: ReactNode; size?: number; dim?: boolean }) =>
  <span style={{ whiteSpace: "normal", lineHeight: 1.4, fontSize: size, color: dim ? "var(--dim)" : undefined }}>{children}</span>;
const shortStatus = (s: string) => s.replace(/ · \d+ days$/, "");

function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "118px minmax(0,1fr)", gap: "8px 12px", fontSize: 13, lineHeight: 1.5 }}>
      {rows.map(([k, v], i) => <Fragment key={i}><span className="dx-faint">{k}</span><span style={{ color: "var(--body)", minWidth: 0 }}>{v}</span></Fragment>)}
    </div>
  );
}

/* ---------- dates: today is 25 Sep 2026, 09:16 ---------- */
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86400000;
const TODAY0 = new Date(2026, 8, 25).getTime();
function when(s: string): number | null {
  const tm = s.match(/(\d{1,2}):(\d{2})/);
  const mins = tm ? +tm[1] * 60 + +tm[2] : 0;
  let d: number | null = null;
  if (/^Today/i.test(s)) d = TODAY0;
  else if (/^Yesterday/i.test(s)) d = TODAY0 - DAY;
  else {
    const m = s.match(/(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
    if (m) { const mi = MON.indexOf(m[2]); d = new Date(mi > 8 ? 2025 : 2026, mi, +m[1]).getTime(); }
    else if (tm) d = TODAY0;
  }
  return d === null ? null : d + mins * 60000;
}
const fmtDay = (t: number) => { const d = new Date(t); return d.getDate() + " " + MON[d.getMonth()]; };
function rel(t: number) {
  const d = new Date(t), day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const hm = d.getHours() || d.getMinutes() ? " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") : "";
  if (day === TODAY0) return "Today" + hm;
  if (day === TODAY0 - DAY) return "Yesterday" + hm;
  return fmtDay(t);
}
const ageDays = (age: string) => (/today/i.test(age) ? 0 : +(age.match(/(\d+)/)?.[1] || 0));

/* The latest order we know of: the account's last-order stamp or a placed order, whichever is newer. */
function lastOrder(c: Customer): { t: number; so?: string } {
  let best: { t: number; so?: string } = { t: when(c.lastOrder) ?? 0 };
  custOrders(c.id).forEach(o => { const t = when(o.placed); if (t !== null && t >= best.t) best = { t, so: o.id }; });
  return best;
}
/* Next likely order from the account's own rhythm: 268 days so far this year. */
function nextOrder(c: Customer) {
  const every = Math.max(1, Math.round(268 / c.ordersYTD));
  const lo = lastOrder(c);
  const d = new Date(lo.t);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() + every * DAY;
  return { every, last: lo, next, overdue: next < TODAY0 };
}

/* ---------- deterministic synthesis for accounts without a stored history ---------- */
function seed(id: string) { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h; }
function rnd(h: number, i: number) { const x = Math.sin(h * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); }

/* Ryan: Jan–Sep sums to €96,240 and Jul–Sep is 28% below Apr–Jun. */
const RYAN_HISTORY: [string, number][] = [
  ["Oct", 12300], ["Nov", 12900], ["Dec", 8700], ["Jan", 11420], ["Feb", 11860], ["Mar", 12100],
  ["Apr", 11700], ["May", 11900], ["Jun", 11780], ["Jul", 11020], ["Aug", 9340], ["Sep", 5120],
];
/* Twelve months, Oct last year to Sep MTD. Jan–Sep always sums to revenue YTD and Sep is revenue MTD. */
function history(c: Customer): [string, number][] {
  if (c.id === "murphy") return MURPHY_HISTORY;
  if (c.id === "ryan") return RYAN_HISTORY;
  const h = seed(c.id), base = c.revYTD - c.revMTD;
  const slope = Math.max(-0.22, Math.min(0.22, (c.trend / 100) * 0.7));
  const w = [0, 1, 2, 3, 4, 5, 6, 7].map(i => (1 + (slope * (i - 3.5)) / 3.5) * (0.9 + 0.2 * rnd(h, i)));
  const sw = w.reduce((a, b) => a + b, 0);
  const m = w.map(x => Math.round((base * x) / sw / 10) * 10);
  m[7] += base - m.reduce((a, b) => a + b, 0);
  const prior = base / 8 / (1 + c.trend / 100);
  const ond = [1.02, 1.07, 0.72].map((f, i) => Math.round((prior * f * (0.94 + 0.12 * rnd(h, 10 + i))) / 10) * 10);
  return [["Oct", ond[0]], ["Nov", ond[1]], ["Dec", ond[2]], ...m.map((v, i) => [MON[i], v] as [string, number]), ["Sep", c.revMTD]];
}

const cadence = (d: number) => (d <= 24 ? "Every " + Math.max(2, Math.round(d)) + " days" : d <= 36 ? "Monthly" : "Every " + Math.round(d / 7) + " weeks");
type TopLine = { sku: string; value: number; cadence: string; flag?: string };
function topLines(c: Customer): TopLine[] {
  if (c.id === "murphy") return MURPHY_TOP.map(([sku, value, cad]) => ({ sku, value, cadence: cad }));
  const pool = PRODUCTS.filter(p => c.categories.includes(p.cat) && p.health !== "Dead").sort((a, b) => b.revenue12 - a.revenue12).slice(0, 6);
  const share = [0.16, 0.12, 0.09, 0.07, 0.055, 0.045], freq = [0.55, 0.42, 0.33, 0.26, 0.2, 0.15];
  const per = 268 / c.ordersYTD;
  return pool.map((p, i) => (c.id === BUYING_PATTERN.cust && p.sku === BUYING_PATTERN.sku
    ? { sku: p.sku, value: Math.round((BUYING_PATTERN.monthly * 7.3) / 10) * 10, cadence: "Every " + BUYING_PATTERN.every, flag: "Last bought " + BUYING_PATTERN.last }
    : { sku: p.sku, value: Math.round((c.revYTD * share[i]) / 10) * 10, cadence: cadence(per / freq[i]) }));
}

const NAMES = ["Siobhán Kelleher", "Ronan Daly", "Clodagh Reilly", "Brendan Foley", "Fiachra O'Neill", "Deirdre Costello", "Pádraig Lenihan",
  "Maeve Gallagher", "Orlaith Sheridan", "Conall Egan", "Aideen Mulvey", "Gavin Tighe", "Úna Fitzgerald", "Diarmuid Crowley"];
const ascii = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/'/g, "").toLowerCase();
function contacts(c: Customer) {
  const h = seed(c.id), dom = c.contact[2].split("@")[1];
  const a = NAMES[h % NAMES.length], b = NAMES[(h + 5) % NAMES.length];
  const role = /merchant|counter|plant/i.test(c.segment) ? "Yard Manager" : /contractor/i.test(c.segment) ? "Site Manager" : /retailer/i.test(c.segment) ? "Branch Manager" : "Facilities Coordinator";
  const site = c.sites.length > 1 ? ", " + c.sites[0].replace(/^(Site|Yard): /, "").split(",")[0] : "";
  const ph = (k: number) => ["083", "085", "086", "087"][(h + k) % 4] + " " + (100 + ((h * (k + 3)) % 900)) + " " + (1000 + ((h * (k + 7) * 13) % 9000));
  return [
    { name: c.contact[0], role: c.contact[1], email: c.contact[2], phone: ph(0), note: "Main contact · orders and pricing" },
    { name: a, role: "Accounts Payable", email: "accounts@" + dom, phone: ph(1), note: "Statements and remittances · " + c.terms },
    { name: b, role: role + site, email: ascii(b.split(" ")[0]) + "@" + dom, phone: ph(2), note: "Deliveries, booking slots and PODs" },
  ];
}

/* ---------- opportunities: the db list plus two win-backs raised from health signals ---------- */
const EXTRA_OPPS: Opp[] = [
  { id: "OP-312", cust: "swords", kind: "Lost category", detail: "PPE spend €0 since July after €1,400 a month. Still buys Fixings, Electrical and Tools.", value: "€16,800 / yr", owner: "david", confidence: 58 },
  { id: "OP-298", cust: "wicklow", kind: "Order frequency down", detail: "Ordering every 19 days instead of every 11. Tier C pricing has not been reviewed this year.", value: "€12,900 / yr", owner: "david", confidence: 52 },
];
const ALL_OPPS: Opp[] = [...OPPORTUNITIES, ...EXTRA_OPPS];
type OppKind = "New revenue" | "Win back" | "At risk" | "Stock release" | "Quote";
const OPP_NUM: Record<string, { lo: number; hi: number; type: OppKind }> = {
  "OP-311": { lo: 22000, hi: 34000, type: "New revenue" }, "OP-309": { lo: 4800, hi: 6200, type: "Win back" }, "OP-307": { lo: 34080, hi: 34080, type: "At risk" },
  "OP-305": { lo: 9600, hi: 9600, type: "New revenue" }, "OP-302": { lo: 11030, hi: 11030, type: "Stock release" }, "OP-299": { lo: 14000, hi: 14000, type: "New revenue" },
  "OP-296": { lo: 14620, hi: 14620, type: "Quote" }, "OP-312": { lo: 16800, hi: 16800, type: "Win back" }, "OP-298": { lo: 12900, hi: 12900, type: "Win back" },
};
const oppTone = (t: OppKind): Tone => (t === "At risk" ? "bad" : t === "Quote" ? "warn" : t === "Stock release" ? "neutral" : "accent");
const expected = (o: Opp) => { const v = OPP_NUM[o.id]; return v ? Math.round((((v.lo + v.hi) / 2) * o.confidence) / 100) : 0; };
const RANKED = [...ALL_OPPS].sort((a, b) => expected(b) - expected(a));

const OPP_ACT: Record<string, { id: string; label: string; done: string; toast: string }> = {
  "OP-311": { id: "opp-OP-311", label: "Create Opportunity", done: "Opportunity created · Sarah Byrne", toast: "OP-311 opened for Sarah Byrne: PPE range for Murphy Building Supplies, €22,000–€34,000 a year. Similar-merchant pricing attached." },
  "OP-309": { id: "opp-OP-309", label: "Create Opportunity", done: "Opportunity created · Sarah Byrne", toast: "OP-309 opened for Sarah Byrne: win back Murphy's monthly Safety & PPE order, €4,800–€6,200. Last prices and quantities attached." },
  "OP-307": { id: "ryan-followup", label: "Assign Follow-Up", done: "Assigned to Mark Ryan · call by 15:00", toast: "Follow-up assigned to Mark Ryan: call Declan Ryan about M10 bolts by 15:00. FIX-2201 order history and pricing attached." },
  "OP-305": { id: "opp-OP-305", label: "Price Citywest site", done: "Site pricing sent to Mark Ryan", toast: "Contract pricing for Core Facilities' Citywest site drafted and sent to Mark Ryan to agree with Anne-Marie Walsh." },
  "OP-302": { id: "opp-OP-302", label: "Offer cable tray", done: "Offer drafted for Barry Keogh", toast: "Offer drafted for Barry Keogh at Horizon Electrical: EL-6120 cable tray, 442 lengths in stock." },
  "OP-299": { id: "opp-OP-299", label: "Propose Tier A", done: "Tier A sent to Michael Doyle", toast: "Tier A move for Fitzwilliam Property Management sent to Michael Doyle for approval." },
  "OP-296": { id: "chase-QT-2839", label: "Chase quote", done: "David calling Rory Byrne today", toast: "Chase logged for David Kelly: call Rory Byrne at Liffey M&E about QT-2839 (€14,620) before it expires on 28 Sep." },
  "OP-312": { id: "opp-OP-312", label: "Book PPE visit", done: "Visit booked · David Kelly", toast: "PPE range visit for Swords Building Supplies booked for David Kelly with Alan Brophy. SafePro samples requested." },
  "OP-298": { id: "opp-OP-298", label: "Review Tier C", done: "Pricing review opened", toast: "Tier C pricing review opened for Wicklow Hardware & DIY and assigned to David Kelly." },
};
function OppBtn({ id, primary }: { id: string; primary?: boolean }) {
  const a = OPP_ACT[id];
  return a ? <ActBtn id={a.id} small kind={primary ? "primary" : "ghost"} label={a.label} done={a.done} toast={a.toast} /> : null;
}
const RyanFollowUp = ({ primary = true }: { primary?: boolean }) => <OppBtn id="OP-307" primary={primary} />;

/* ================= OVERVIEW ================= */
function Overview() {
  const dx = useDx();
  const top = [...CUSTOMERS].sort((a, b) => b.revYTD - a.revYTD).slice(0, 8);
  const declining = CUSTOMERS.filter(c => c.health === "Declining").sort((a, b) => a.trend - b.trend);
  const declineEur = HEALTH_SIGNALS.filter(s => customer(s.cust).health === "Declining").reduce((a, s) => a + annualised(s.impact), 0);
  const holdStage = ORDER_PIPELINE.find(s => s.stage === "Credit hold")!;
  const listedHolds = CREDIT_HOLDS.reduce((a, h) => a + h.order, 0);
  const belowTarget = QUOTES.filter(q => q.status === "Pending approval").length;
  const worstOtif = [...CUSTOMERS].sort((a, b) => a.otif - b.otif).slice(0, 4);
  const decliningLowOtif = worstOtif.filter(c => c.health === "Declining");
  return (
    <Page eyebrow="Customers" title="Customer overview"
      sub={<>437 active trade accounts. {KPI.declining} are losing ground, {KPI.creditHolds} orders are held for credit and {eurK(KPI.quotesOpen)} of quotes are waiting on a reply.</>}
      right={<>
        <Btn kind="ghost" icon={IC.chat} onClick={() => dx.ask("Which customers are reducing spend?")}>Ask Customer Agent</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Customers", "accounts")}>All accounts</Btn>
      </>}>
      <KpiRow n={6}>
        <Kpi label="Active accounts" value={num(KPI.activeAccounts)} sub={HEALTH_COUNTS[0][1] + " growing · " + HEALTH_COUNTS[2][1] + " declining"} onClick={() => dx.go("Customers", "accounts")} />
        <Kpi label="Revenue MTD" value={eurK(KPI.revenueMTD)} sub={KPI.revenueDelta + " vs same period last month"} subTone="ok" onClick={() => dx.go("Finance", "revenue")} />
        <Kpi label="Average order" value={eur(KPI.avgOrder)} sub="Month to date, all accounts" />
        <Kpi label="Quotes open" value={eurK(KPI.quotesOpen)} sub={belowTarget + " below target margin"} subTone="warn" onClick={() => dx.go("Customers", "quotes")} />
        <Kpi label="Accounts declining" value={String(KPI.declining)} sub={eur(declineEur) + " a year on the largest four"} subTone="warn" onClick={() => dx.go("Customers", "health")} />
        <Kpi label="Credit holds" value={String(KPI.creditHolds)} sub={eur(holdStage.value) + " of orders held"} subTone="bad" onClick={() => dx.go("Finance", "credit")} />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)">
        <Card title="Account health" sub="Customer Agent scores every account nightly on spend, frequency, service, debt and margin"
          right={<Btn small kind="quiet" onClick={() => dx.go("Customers", "health")}>Customer Health</Btn>}>
          <Strip fmt={n => num(n)} h={14} parts={HEALTH_COUNTS.map(([k, v]) => ({ label: k, value: v, tone: healthTone(k) === "neutral" ? "var(--chart-muted)" : healthTone(k) }))} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginTop: 16 }}>
            {([
              ["Growing", "Spend up on last year, rhythm steady"],
              ["Stable", "Within 5% of last year, no open signals"],
              ["Declining", "Spend or frequency down for 60+ days"],
              ["At risk", "Credit, service or margin problem open"],
            ] as [string, string][]).map(([k, d]) => (
              <div key={k} className="dx-fact dx-click" onClick={() => dx.go("Customers", "accounts")}>
                <div className="dx-fact-k">{k}</div>
                <div className="dx-fact-v" style={{ color: healthTone(k) === "neutral" ? undefined : "var(--" + healthTone(k) + ")" }}>{HEALTH_COUNTS.find(h => h[0] === k)![1]}</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4, lineHeight: 1.4 }}>{d}</div>
              </div>
            ))}
          </div>
        </Card>
        <AiCard agent="Customer Agent · 08:03" title="What changed in the customer base"
          actions={<><RyanFollowUp /><Btn small onClick={() => dx.go("Customers", "opportunities")}>All opportunities</Btn></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13.5 }}>
            <div><RecLink kind="cust" id="ryan" plain>Ryan Trade Supplies</RecLink> has not bought M10 bolts for {BUYING_PATTERN.last.replace(" ago", "")} (usually every {BUYING_PATTERN.every}). <b>{eur(BUYING_PATTERN.annual)}</b> a year at risk.</div>
            <div><RecLink kind="cust" id="swords" plain>Swords Building Supplies</RecLink> stopped buying PPE in July: €16,800 a year.</div>
            <div><RecLink kind="cust" id="murphy" plain>Murphy Building Supplies</RecLink> buys Electrical, Fixings and Tools but not PPE. 68% of similar merchants do: €22,000–€34,000.</div>
            <div><RecLink kind="cust" id="fitzwilliam" plain>Fitzwilliam Property Management</RecLink> is up 31% in 90 days and qualifies for Tier A.</div>
          </div>
        </AiCard>
      </Grid>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <Card title="Top accounts by revenue" sub="Revenue YTD · gross margin at the tip · click through to the account">
          <HBars fmt={n => eur(n)} items={top.map(c => ({ label: c.name, value: c.revYTD, note: pct(c.margin) }))} onClick={i => dx.go("Customers", "detail", { cust: top[i].id })} />
        </Card>
        <Card title="Declining accounts" sub={declining.length + " of " + KPI.declining + " · steepest decline first"} pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Customers", "health")}>Why</Btn>}>
          <div className="dx-list">
            {declining.map((c, i) => {
              const s = HEALTH_SIGNALS.find(x => x.cust === c.id);
              return (
                <div key={c.id} className="dx-li dx-click" style={{ borderTop: i ? undefined : 0 }} onClick={() => dx.go("Customers", "detail", { cust: c.id })}>
                  <Avatar id={c.am} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2 }}>{s ? s.signal + " · " + s.impact : "Spend down on last year"}</div>
                  </div>
                  <span className="dx-num" style={{ color: "var(--bad)", fontWeight: 600, fontSize: 13.5 }}>{signed(c.trend)}</span>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "0 20px 16px" }}>
            <Note tone="warn">{decliningLowOtif.length} of these are in the bottom four accounts for OTIF ({decliningLowOtif.map(c => c.name.split(" ")[0] + " " + pct(c.otif)).join(", ")}). Service is part of the decline.</Note>
          </div>
        </Card>
      </Grid>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <Card title="Open opportunities" sub="Ranked by expected value: size × confidence" pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Customers", "opportunities")}>All {ALL_OPPS.length}</Btn>}>
          <div className="dx-list">
            {RANKED.slice(0, 6).map((o, i) => (
              <div key={o.id} className="dx-li dx-click" style={{ borderTop: i ? undefined : 0, alignItems: "center" }} onClick={() => dx.go("Customers", "opportunities")}>
                <span className="dx-num dx-faint" style={{ width: 14, fontSize: 12 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <RecLink kind="cust" id={o.cust} plain>{customer(o.cust).name}</RecLink>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2 }}>{o.kind} · {o.confidence}% confidence</div>
                </div>
                <span className="dx-num" style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{o.value}</span>
                <Avatar id={o.owner} size={22} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Credit holds" sub={KPI.creditHolds + " orders held · " + eur(holdStage.value)} pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Finance", "credit")}>Credit control</Btn>}>
          <div className="dx-list">
            {CREDIT_HOLDS.map((h, i) => {
              const c = customer(h.cust);
              return (
                <div key={h.cust} className="dx-li dx-click" style={{ borderTop: i ? undefined : 0 }} onClick={() => dx.go("Finance", "credit", { cust: h.cust })}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
                      <span className="dx-num" style={{ fontSize: 12.5, color: "var(--bad)", whiteSpace: "nowrap" }}>{eur(h.overdue)} overdue</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2 }}><SoLink id={h.so} /> · {eur(h.order)} held · {h.days}</div>
                    <div style={{ marginTop: 7 }}><Meter value={h.projected} max={h.limit} tone={h.projected > h.limit ? "bad" : "warn"} /></div>
                    <div className="dx-num" style={{ fontSize: 12, marginTop: 4, color: h.projected > h.limit ? "var(--bad)" : "var(--dim)" }}>Releasing it takes the account to {eur(h.projected)} of {eur(h.limit)}</div>
                  </div>
                </div>
              );
            })}
            <div className="dx-li" style={{ fontSize: 12.5, color: "var(--dim)" }}>
              {KPI.creditHolds - CREDIT_HOLDS.length} smaller holds · {eur(holdStage.value - listedHolds)} between them
            </div>
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

/* ================= ACCOUNTS ================= */
function Accounts() {
  const dx = useDx();
  const [f, setF] = useLocal("cust-acc-f", "all");
  const [am, setAm] = useLocal("cust-acc-am", "all");
  const rows = CUSTOMERS
    .filter(c => (f === "all" || (f === "hold" ? onHold(c) : c.health === f)) && (am === "all" || c.am === am))
    .sort((a, b) => b.revYTD - a.revYTD);
  const rev = rows.reduce((a, c) => a + c.revYTD, 0);
  const gm = rev ? rows.reduce((a, c) => a + c.revYTD * c.margin, 0) / rev : 0;
  const tight = rows.filter(c => c.balance / c.limit >= 0.8).length;
  const lowOtif = rows.filter(c => c.otif < 93).length;
  const healthN = HEALTH_COUNTS.find(h => h[0] === f)?.[1];
  const amTxt = am === "all" ? "" : " for " + who(am).name;
  const foot = f === "all" && am === "all" ? "Showing " + CUSTOMERS.length + " of " + num(KPI.activeAccounts) + " accounts · the largest by revenue YTD"
    : f === "hold" ? "Showing " + rows.length + " accounts with orders on credit hold" + amTxt + " · " + KPI.creditHolds + " orders held across the book"
    : f === "all" ? "Showing " + rows.length + " accounts" + amTxt
    : "Showing " + rows.length + " of " + healthN + " " + f.toLowerCase() + " accounts" + amTxt;
  return (
    <Page eyebrow="Customers" title="Accounts"
      sub="Every trade account with its account manager, spend, margin, credit and service in one row. Click an account for the full picture."
      right={<Btn kind="quiet" onClick={() => dx.go("Customers", "health")}>Customer Health</Btn>}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "0 0 14px" }}>
        <Seg value={f} onChange={setF} items={[["all", "All"], ["Growing", "Growing"], ["Declining", "Declining"], ["At risk", "At risk"], ["hold", "Credit hold"]]} />
        <Seg value={am} onChange={setAm} items={[["all", "All account managers"], ["sarah", "Sarah Byrne"], ["david", "David Kelly"], ["mark", "Mark Ryan"], ["michael", "Michael Doyle"]]} />
      </div>
      <KpiRow n={4}>
        <Kpi label="Revenue YTD, shown accounts" value={eur(rev)} sub={rows.length + " accounts"} />
        <Kpi label="Gross margin, weighted" value={pct(gm)} sub="Company target 25.0%" subTone={gm < 25 ? "warn" : "ok"} />
        <Kpi label="Credit used 80% or more" value={String(tight)} sub="Orders at risk of a hold" subTone={tight ? "warn" : undefined} />
        <Kpi label="OTIF below 93%" value={String(lowOtif)} sub="Target 97.0%" subTone={lowOtif ? "warn" : undefined} />
      </KpiRow>
      <Card pad={false}>
        <Table rows={rows} onRow={c => dx.go("Customers", "detail", { cust: c.id })}
          rowTone={c => (c.status === "Credit hold" ? "bad" : c.health === "Declining" ? "warn" : undefined)} cols={[
            { k: "name", label: "Account", w: "2fr", render: c => (
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
                <RecLink kind="cust" id={c.id} plain>{c.name}</RecLink>
                <span className="dx-faint" style={{ fontSize: 11.5 }}>{c.acct} · {c.area}</span>
              </span>) },
            { k: "segment", label: "Segment", w: "1.2fr", render: c => <Wrap dim>{c.segment}</Wrap> },
            { k: "am", label: "Account manager", w: "1.25fr", render: c => <><Avatar id={c.am} size={22} /><Wrap size={13}>{who(c.am).name}</Wrap></> },
            { k: "rev", label: "Revenue YTD", w: "1fr", align: "right", mono: true, render: c => eur(c.revYTD) },
            { k: "gm", label: "Margin", w: "0.75fr", align: "right", mono: true, render: c => <span style={{ color: c.margin < 23 ? "var(--warn)" : undefined }}>{pct(c.margin)}</span> },
            { k: "credit", label: "Credit used", w: "1fr", render: c => <span title={eur(c.balance) + " of " + eur(c.limit)} style={{ display: "flex", alignItems: "center", gap: 7 }}><Meter value={c.balance} max={c.limit} tone={creditTone(c)} w={38} /><span className="dx-num" style={{ color: creditTone(c) === "bad" ? "var(--bad)" : "var(--dim)" }}>{Math.round((c.balance / c.limit) * 100)}%</span></span> },
            { k: "otif", label: "OTIF", w: "0.75fr", align: "right", mono: true, render: c => <span style={{ color: c.otif < 93 ? "var(--warn)" : undefined }}>{pct(c.otif)}</span> },
            { k: "trend", label: "Trend", w: "0.75fr", align: "right", mono: true, render: c => <span style={{ color: c.trend < 0 ? "var(--bad)" : "var(--ok)" }}>{signed(c.trend)}</span> },
            { k: "health", label: "Health · status", w: "1.2fr", render: c => (
              <span style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                <Badge tone={healthTone(c.health)}>{c.health}</Badge>
                <span style={{ fontSize: 11.5, color: c.status === "Active" ? "var(--faint)" : "var(--" + statusTone(c.status) + ")", fontWeight: c.status === "Active" ? 400 : 600 }}>{c.status}</span>
              </span>) },
          ]} empty="No accounts match these filters." />
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ flex: 1 }}>{foot}</span>
          <span className="dx-faint">Synced from Sage 200 · 08:10</span>
        </div>
      </Card>
    </Page>
  );
}

/* ================= OPPORTUNITIES ================= */
const RYAN_M10_GAPS: [string, number][] = [["4 Apr", 22], ["22 Apr", 18], ["16 May", 24], ["5 Jun", 20], ["27 Jun", 22], ["18 Jul", 21], ["9 Aug", 22], ["Today", 47]];
const NEXT_ACCOUNTS = ["murphy", "leinster", "core", "doyle", "mcgrath", "westbrook", "obrien", "horizon", "swords", "ryan"];

function Opportunities() {
  const dx = useDx();
  const sum = (t: OppKind[], k: "lo" | "hi") => ALL_OPPS.filter(o => t.includes(OPP_NUM[o.id]?.type)).reduce((a, o) => a + OPP_NUM[o.id][k], 0);
  const newLo = sum(["New revenue", "Win back"], "lo"), newHi = sum(["New revenue", "Win back"], "hi");
  const cold = QUOTES.filter(q => /No response/.test(q.status));
  const murphy = customer("murphy"), ryan = customer("ryan");
  return (
    <Page eyebrow="Customers" title="Opportunities"
      sub="Revenue the Customer Agent has found in buying patterns, category gaps and quotes. Each one has an owner and a next step."
      right={<Btn kind="ghost" icon={IC.chat} onClick={() => dx.ask("Which customers are reducing spend?")}>Ask Customer Agent</Btn>}>
      <KpiRow n={4}>
        <Kpi label="Open opportunities" value={String(ALL_OPPS.length)} sub={"Across " + new Set(ALL_OPPS.map(o => o.cust)).size + " accounts"} />
        <Kpi label="New and win-back revenue" value={eurK(newLo) + "–" + eurK(newHi)} sub="A year, if converted" subTone="ok" />
        <Kpi label="Revenue at risk" value={eur(BUYING_PATTERN.annual)} sub="Ryan Trade Supplies · M10 bolts" subTone="bad" onClick={() => dx.go("Customers", "detail", { cust: "ryan" })} />
        <Kpi label="Quotes going cold" value={eur(cold.reduce((a, q) => a + q.value, 0))} sub={cold.length + " quotes, no reply in 18+ days"} subTone="warn" onClick={() => dx.go("Customers", "quotes")} />
      </KpiRow>

      <Grid cols="repeat(2,minmax(0,1fr))">
        <AiCard agent="Customer Agent · OP-311" title="Murphy Building Supplies has no PPE spend"
          actions={<><OppBtn id="OP-311" primary /><Btn small onClick={() => dx.go("Customers", "detail", { cust: "murphy" })}>Open account</Btn></>}>
          <div>{murphy.name} buys Electrical, Fixings and Tools but not PPE. Similar customer penetration is <b>68%</b>. Expected opportunity <b>€22,000–€34,000</b> annual revenue.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {["Electrical", "Fixings", "Tools", "PPE"].map(k => {
              const buys = murphy.categories.includes(k);
              return <Badge key={k} tone={buys ? "ok" : "bad"}>{buys ? "Buys " : "Does not buy "}{k}</Badge>;
            })}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--dim)" }}><span>Similar builders' merchants buying PPE from us</span><b className="dx-num" style={{ color: "var(--ink)" }}>68%</b></div>
            <div style={{ marginTop: 6 }}><Meter value={68} tone="accent" h={8} /></div>
          </div>
          <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 12, lineHeight: 1.55 }}>
            Start with lines already on the shelf: <RecLink kind="sku" id="SAF-2204" /> hi-vis, <RecLink kind="sku" id="SAF-3310" /> gloves and <RecLink kind="sku" id="SAF-1892" /> glasses, which has 22 weeks' cover in Naas. Sarah Byrne is calling Gerry Murphy about <RecLink kind="order" id="SO-10482" /> at 11:30: raise PPE on the same call.
          </div>
        </AiCard>
        <AiCard agent="Customer Agent · OP-307" title="Ryan Trade Supplies has stopped buying M10 bolts"
          actions={<><RyanFollowUp /><Btn small onClick={() => dx.go("Customers", "health")}>Customer Health</Btn></>}>
          <div>{ryan.name} normally buys <RecLink kind="sku" id={BUYING_PATTERN.sku}>M10 Hex Bolts</RecLink> every <b>{BUYING_PATTERN.every}</b>. Last purchase <b>{BUYING_PATTERN.last}</b>. Historical monthly revenue {eur(BUYING_PATTERN.monthly)}; estimated revenue at risk <b>{eur(BUYING_PATTERN.annual)}</b> annualised.</div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11.5, color: "var(--faint)", marginBottom: 4 }}>Days between M10 bolt orders, by order date</div>
            <Columns h={150} fmt={n => n + " days"} target={24} targetLabel="Usual gap, up to 24 days"
              data={RYAN_M10_GAPS.map(([label, value], i) => ({ label, value, tone: i === RYAN_M10_GAPS.length - 1 ? "bad" : "accent" }))} />
          </div>
          <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 10, lineHeight: 1.55 }}>
            Ryan is still ordering (<SoLink id="SO-10535" /> this morning), so the account is live: the bolts are going somewhere else. A call to Declan Ryan is on Mark Ryan's list for 15:00, not started.
          </div>
        </AiCard>
      </Grid>

      <Card title="All opportunities, ranked" sub="Expected value is the midpoint of the range × confidence. Approving an action assigns it to the owner." pad={false} style={{ marginTop: 14 }}>
        <div className="dx-list">
          {RANKED.map((o, i) => {
            const v = OPP_NUM[o.id];
            return (
              <div key={o.id} className="dx-li" style={{ alignItems: "center", borderTop: i ? undefined : 0 }}>
                <span className="dx-num" style={{ width: 18, color: "var(--faint)", fontSize: 12.5 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <RecLink kind="cust" id={o.cust} plain>{customer(o.cust).name}</RecLink>
                    <Badge tone={oppTone(v.type)}>{o.kind}</Badge>
                    <span className="dx-faint" style={{ fontSize: 11.5 }}>{o.id}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--body)", marginTop: 4, lineHeight: 1.5 }}><Linked text={o.detail} /></div>
                </div>
                <div style={{ width: 170, textAlign: "right", flex: "none" }}>
                  <div className="dx-num" style={{ fontWeight: 600, fontSize: 13.5 }}>{o.value}</div>
                  <div className="dx-faint" style={{ fontSize: 11.5, marginTop: 2 }}>{v.type} · expected {eur(expected(o))}</div>
                </div>
                <div style={{ width: 104, flex: "none" }}>
                  <Meter value={o.confidence} tone={o.confidence >= 70 ? "ok" : o.confidence >= 55 ? "accent" : "warn"} />
                  <div className="dx-faint dx-num" style={{ fontSize: 11.5, marginTop: 4 }}>{o.confidence}% confidence</div>
                </div>
                <Avatar id={o.owner} />
                <div style={{ width: 190, display: "flex", justifyContent: "flex-end", flex: "none" }}><OppBtn id={o.id} /></div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Next likely order, key accounts" sub="From each account's own order rhythm this year. A missed date is the earliest sign of a lost account." pad={false} style={{ marginTop: 14 }}>
        <Table dense rows={NEXT_ACCOUNTS.map(id => customer(id))} onRow={c => dx.go("Customers", "detail", { cust: c.id })}
          rowTone={c => (c.id === "ryan" ? "bad" : c.status === "Credit hold" ? "warn" : undefined)} cols={[
            { k: "c", label: "Account", w: "2fr", render: c => (
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
                <RecLink kind="cust" id={c.id} plain>{c.name}</RecLink>
                <span className="dx-faint" style={{ fontSize: 11.5 }}>{who(c.am).name}</span>
              </span>) },
            { k: "every", label: "Usual rhythm", w: "1fr", render: c => "Every " + nextOrder(c).every + " day" + (nextOrder(c).every === 1 ? "" : "s") },
            { k: "last", label: "Last order", w: "1.1fr", render: c => { const lo = nextOrder(c).last; return <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>{rel(lo.t)}{lo.so && <span className="dx-faint" style={{ fontSize: 11.5 }}><SoLink id={lo.so} /></span>}</span>; } },
            { k: "next", label: "Next likely", w: "0.85fr", render: c => { const n = nextOrder(c); return <b style={{ fontWeight: 600, color: n.overdue ? "var(--bad)" : "var(--ink)" }}>{n.overdue ? "Overdue" : fmtDay(n.next)}</b>; } },
            { k: "val", label: "Expected", w: "0.8fr", align: "right", mono: true, render: c => eur(c.avgOrder) },
            { k: "note", label: "Watch for", w: "2.6fr", render: c => {
              const watch: Record<string, [string, Tone]> = {
                ryan: ["M10 bolts last bought " + BUYING_PATTERN.last + ", usually every " + BUYING_PATTERN.every, "bad"],
                doyle: ["Account on credit hold · SO-10503 held", "warn"],
                swords: ["No PPE on any order since July", "warn"],
                leinster: ["M10 bolts on contract at 15.4% margin", "warn"],
                obrien: ["Contract expires 31 Oct · QT-2841 pending", "warn"],
                mcgrath: ["€8,940 overdue at 91 days, disputed", "warn"],
              };
              const w = watch[c.id];
              if (w) return <span style={{ color: "var(--" + w[1] + ")", whiteSpace: "normal", lineHeight: 1.4 }}>{w[0]}</span>;
              return <Wrap dim>Usually {topLines(c).slice(0, 2).map(t => product(t.sku).name).join(", ")}</Wrap>;
            } },
          ]} />
      </Card>
    </Page>
  );
}

/* ================= CUSTOMER HEALTH ================= */
const DETECTORS: { k: string; watch: string; trip: string; n: number; eg: string; egTxt: string }[] = [
  { k: "Reduced order frequency", watch: "Days between orders against the account's own 12-month rhythm", trip: "Gap 50% longer than usual for two cycles", n: 11, eg: "wicklow", egTxt: "every 11 days → every 19" },
  { k: "Reduced average order", watch: "Average order value, last 90 days against the 90 before", trip: "Down 15% or more", n: 7, eg: "ryan", egTxt: "still ordering, smaller baskets, no M10 bolts" },
  { k: "Lost category spend", watch: "Spend by category against the last six months", trip: "A regular category at zero for 45 days", n: 9, eg: "swords", egTxt: "PPE €0 since July" },
  { k: "Unresolved delivery problems", watch: "Late, short and damaged deliveries still open", trip: "Two or more in 30 days", n: 6, eg: "midland", egTxt: "3 late M01 drops in September" },
  { k: "Overdue debt", watch: "Oldest overdue invoice and credit used", trip: "Over 30 days past terms or 85% of limit", n: 13, eg: "mcgrath", egTxt: "€8,940 at 91 days, disputed" },
  { k: "Reduced margin", watch: "Account margin this month against its own YTD", trip: "Down 2 points or more", n: 5, eg: "tallaght", egTxt: "27.1% → 24.0% on counter overrides" },
  { k: "Quote inactivity", watch: "Quotes sent with no reply or revision", trip: "14 days with no response", n: 8, eg: "liffey", egTxt: "2 quotes unanswered" },
];

function HealthPage() {
  const dx = useDx();
  const ryanSig = HEALTH_SIGNALS.find(s => s.cust === "ryan")!;
  const declineEur = HEALTH_SIGNALS.filter(s => customer(s.cust).health === "Declining").reduce((a, s) => a + annualised(s.impact), 0);
  const flagged = HEALTH_COUNTS[2][1] + HEALTH_COUNTS[3][1];
  return (
    <Page eyebrow="Customers" title="Customer health"
      sub={<>Pulse watches every account for the early signs of a lost customer. {flagged} accounts trip at least one detector today: {HEALTH_COUNTS[2][1]} declining and {HEALTH_COUNTS[3][1]} at risk.</>}
      right={<Btn kind="ghost" icon={IC.chat} onClick={() => dx.ask("Which customers are reducing spend?")}>Ask Customer Agent</Btn>}>
      <KpiRow n={4}>
        {HEALTH_COUNTS.map(([k, v]) => (
          <Kpi key={k} label={k} value={num(v)} tone={healthTone(k) === "neutral" ? undefined : healthTone(k)}
            sub={k === "Growing" ? "Spend up on last year" : k === "Stable" ? "No open signals" : k === "Declining" ? eur(declineEur) + " a year on the largest four" : "Credit, service or margin problem open"}
            onClick={() => dx.go("Customers", "accounts")} />
        ))}
      </KpiRow>

      <Grid cols="minmax(0,5fr) minmax(0,7fr)">
        <Card tone="warn" title={<RecLink kind="cust" id="ryan" plain>Ryan Trade Supplies</RecLink>} sub={"Independent merchant · Portlaoise · " + who("mark").name}
          right={<Badge tone="warn">Declining</Badge>}>
          <Facts cols={2} items={[
            ["Spend", "↓28% last 90 days", "bad"],
            ["Primary decline", ryanSig.metric.replace("Primary decline: ", "")],
            ["Estimated revenue decline", ryanSig.impact, "bad"],
            ["Suggested action", ryanSig.action],
          ]} />
          <div style={{ marginTop: 12 }}>
            <Note tone="warn">
              The <b>{ryanSig.impact.replace(" annualised", "")}</b> is the decline already visible in the last 90 days. Ryan normally buys M10 Hex Bolts (<RecLink kind="sku" id="FIX-2201" />) every {BUYING_PATTERN.every} and last bought {BUYING_PATTERN.last}.
              {" "}If that business has gone completely, <b>{eur(BUYING_PATTERN.annual)}</b> a year is at risk ({eur(BUYING_PATTERN.monthly)} a month).
            </Note>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <RyanFollowUp />
            <Btn small onClick={() => dx.go("Customers", "detail", { cust: "ryan" })}>Open account</Btn>
            <Btn small kind="quiet" onClick={() => dx.go("Customers", "opportunities")}>Buying pattern</Btn>
          </div>
        </Card>
        <Card title="What Pulse watches" sub="Seven detectors run nightly on Sage 200 orders, invoices, deliveries and quotes. One account can trip several." pad={false}>
          <div className="dx-list">
            {DETECTORS.map((d, i) => (
              <div key={d.k} className="dx-li" style={{ borderTop: i ? undefined : 0, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{d.k}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2, lineHeight: 1.45 }}>{d.watch}. Trips at: {d.trip.charAt(0).toLowerCase() + d.trip.slice(1)}.</div>
                </div>
                <div style={{ width: 168, flex: "none", fontSize: 12.5, lineHeight: 1.45 }}>
                  <RecLink kind="cust" id={d.eg} plain>{customer(d.eg).name}</RecLink>
                  <div className="dx-faint" style={{ fontSize: 12 }}>{d.egTxt}</div>
                </div>
                <div style={{ width: 64, textAlign: "right", flex: "none" }}>
                  <div className="dx-num" style={{ fontSize: 16, fontWeight: 600 }}>{d.n}</div>
                  <div className="dx-faint" style={{ fontSize: 11 }}>accounts</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <Card title="Health signals" sub="Every open signal with its evidence, the money involved and what to do next" pad={false} style={{ marginTop: 14 }}>
        <div className="dx-list">
          {HEALTH_SIGNALS.map((s, i) => {
            const c = customer(s.cust), t = healthTone(c.health);
            return (
              <div key={s.cust} className="dx-li dx-click" onClick={() => dx.go("Customers", "detail", { cust: s.cust })}
                style={{ borderTop: i ? undefined : 0, alignItems: "center", boxShadow: t === "neutral" ? undefined : "inset 3px 0 0 var(--" + t + ")" }}>
                <div style={{ flex: "1.1 1 0", minWidth: 0 }}>
                  <RecLink kind="cust" id={s.cust} plain>{c.name}</RecLink>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}><Avatar id={c.am} size={18} /><span className="dx-faint" style={{ fontSize: 12 }}>{who(c.am).name}</span></div>
                </div>
                <div style={{ flex: "1.7 1 0", minWidth: 0, fontSize: 13, lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 500 }}>{s.signal}</div>
                  <div className="dx-muted" style={{ fontSize: 12.5 }}><Linked text={s.metric} /></div>
                </div>
                <div style={{ flex: "1.1 1 0", minWidth: 0, fontSize: 13, lineHeight: 1.45 }}>
                  <div className="dx-num" style={{ fontWeight: 600 }}>{s.impact}</div>
                  <div className="dx-muted" style={{ fontSize: 12.5 }}><Linked text={s.action} /></div>
                </div>
                <div style={{ flex: "none" }}>
                  {s.cust === "ryan" ? <RyanFollowUp primary={false} />
                    : <ActBtn id={"hs-" + s.cust} small label="Assign" done={"Assigned · " + who(c.am).name.split(" ")[0]}
                      toast={s.action + " assigned to " + who(c.am).name + " for " + c.name + "."} />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </Page>
  );
}

/* ================= QUOTES ================= */
const WIN_RATE: Record<string, number> = { sarah: 46, david: 34, mark: 43 };
const quoteOpen = (s: string, exp: string) => s !== "Won" && exp !== "Expired";

function Quotes() {
  const dx = useDx();
  const order = (s: string) => (s === "Pending approval" ? 0 : /No response/.test(s) ? 1 : s === "Sent" ? 2 : s === "Draft" ? 3 : 4);
  const rows = [...QUOTES].sort((a, b) => order(a.status) - order(b.status) || b.value - a.value);
  const open = QUOTES.filter(q => quoteOpen(q.status, q.expires));
  const openVal = open.reduce((a, q) => a + q.value, 0);
  const pending = QUOTES.filter(q => q.status === "Pending approval");
  const cold = QUOTES.filter(q => /No response/.test(q.status));
  const won = QUOTES.filter(q => q.status === "Won");
  const byStatus: [string, number, number][] = [
    ["Sent, awaiting reply", ...tally(QUOTES.filter(q => q.status === "Sent"))],
    ["Pending margin approval", ...tally(pending)],
    ["No response", ...tally(cold)],
    ["Draft", ...tally(QUOTES.filter(q => q.status === "Draft"))],
    ["Won, last 7 days", ...tally(won)],
  ];
  const doyle = customer("doyle");
  return (
    <Page eyebrow="Customers" title="Quotes"
      sub={<>{eurK(KPI.quotesOpen)} of quotes are open. Four are waiting on margin approval and two have had no reply in over 18 days.</>}
      right={<Btn kind="quiet" onClick={() => dx.go("Pricing", "exceptions")}>Margin exceptions</Btn>}>
      <KpiRow n={5}>
        <Kpi label="Open pipeline" value={eurK(KPI.quotesOpen)} sub={eur(openVal) + " in the " + open.length + " largest"} />
        <Kpi label="Pending approval" value={eur(pending.reduce((a, q) => a + q.value, 0))} sub={pending.length + " quotes below target margin"} subTone="warn" onClick={() => dx.go("Pricing", "exceptions")} />
        <Kpi label="Going cold" value={eur(cold.reduce((a, q) => a + q.value, 0))} sub={cold.length + " quotes, no reply in 18+ days"} subTone="bad" />
        <Kpi label="Won, last 7 days" value={eur(won.reduce((a, q) => a + q.value, 0))} sub={won.map(q => customer(q.cust).name.split(" ")[0]).join(", ") + " · " + won.length + " quote"} subTone="ok" />
        <Kpi label="Win rate, 90 days" value="41%" sub="By value · 52% when chased within 7 days" />
      </KpiRow>

      <Card title="Quotes" sub="Margin against the 24.0% required margin. Click a quote for the line groups, the approval and the account." pad={false}>
        <Table rows={rows} onRow={q => dx.open("quote", q.id)}
          rowTone={q => (q.margin < q.target ? "bad" : /No response/.test(q.status) ? "warn" : undefined)} cols={[
            { k: "id", label: "Quote", w: "0.8fr", render: q => <RecLink kind="quote" id={q.id} /> },
            { k: "c", label: "Customer", w: "1.9fr", render: q => <RecLink kind="cust" id={q.cust} plain>{customer(q.cust).name}</RecLink> },
            { k: "v", label: "Value", w: "0.9fr", align: "right", mono: true, render: q => eur(q.value) },
            { k: "m", label: "Margin vs target", w: "1.3fr", align: "right", render: q => {
              const d = q.margin - q.target;
              return <><span className="dx-num" style={{ color: d < 0 ? "var(--bad)" : "var(--ink)", fontWeight: 500 }}>{pct(q.margin)}</span><span className="dx-num dx-faint">{(d < 0 ? "−" : "+") + Math.abs(d).toFixed(1)} pts</span></>;
            } },
            { k: "rep", label: "Rep", w: "1.25fr", render: q => <Person id={q.rep} /> },
            { k: "st", label: "Status", w: "1.4fr", render: q => <Badge tone={q.status === "Won" ? "ok" : q.status === "Pending approval" ? "warn" : /No response/.test(q.status) ? "bad" : "neutral"}>{shortStatus(q.status)}</Badge> },
            { k: "age", label: "Age", w: "0.7fr", render: q => <span className="dx-muted">{q.age}</span> },
            { k: "exp", label: "Expires", w: "0.75fr", render: q => <span style={{ color: q.expires === "Expired" ? "var(--bad)" : /28 Sep|30 Sep/.test(q.expires) ? "var(--warn)" : "var(--body)" }}>{q.expires}</span> },
          ]} />
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)" }}>
          The {QUOTES.length} largest quotes are shown. The rest of the {eurK(KPI.quotesOpen)} sits in quotes under €5,000.
        </div>
      </Card>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent="Customer Agent" title="Two quotes going cold, one to hold back">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cold.map(q => {
                const c = customer(q.cust);
                return (
                  <div key={q.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <RecLink kind="quote" id={q.id} /> · <RecLink kind="cust" id={c.id} plain>{c.name}</RecLink> · {eur(q.value)}
                      <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 2 }}>
                        {q.status.replace("No response · ", "No reply in ")}. {q.expires === "Expired" ? "Expired, costs have moved since it was priced." : "Expires " + q.expires + "."} {c.health === "Declining" ? c.name.split(" ")[0] + " is a declining account (" + signed(c.trend) + ")." : ""}
                      </div>
                    </div>
                    {q.expires === "Expired"
                      ? <ActBtn id={"reissue-" + q.id} small label="Reissue at current cost" done="Reissued · valid to 9 Oct" toast={q.id + " reissued for " + c.name + " at current supplier costs, valid to 9 Oct. David Kelly to call " + c.contact[0] + "."} />
                      : <OppBtn id="OP-296" />}
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <RecLink kind="quote" id="QT-2846" /> · <RecLink kind="cust" id="doyle" plain>{doyle.name}</RecLink> · {eur(22180)}
                  <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 2 }}>
                    Expires 30 Sep, but Doyle is {eur(doyle.balance)} into a {eur(doyle.limit)} limit with <SoLink id="SO-10503" /> ({eur(16240)}) on hold. Winning it adds {eur(22180)} of exposure. Agree payment on INV-28482 first.
                  </div>
                </div>
                <Btn small onClick={() => dx.go("Finance", "credit", { cust: "doyle" })}>Credit control</Btn>
              </div>
            </div>
          </AiCard>
          <Card title="Pipeline by stage" sub="Value of the quotes listed above">
            <HBars fmt={n => eur(n)} items={byStatus.map(([k, v, n]) => ({ label: k, value: v, note: n + (n === 1 ? " quote" : " quotes"), tone: /Pending|No response/.test(k) ? "warn" : k.startsWith("Won") ? "ok" : "accent" }))} />
          </Card>
        </div>
        <Card title="Win rate context, by rep" sub="Open quotes from the list above · win rate by value, last 90 days" pad={false}>
          <div className="dx-list">
            {["sarah", "david", "mark"].map((r, i) => {
              const mine = open.filter(q => q.rep === r);
              const below = QUOTES.filter(q => q.rep === r && q.status === "Pending approval").length;
              return (
                <div key={r} className="dx-li" style={{ borderTop: i ? undefined : 0, alignItems: "center" }}>
                  <Avatar id={r} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{who(r).name}</div>
                    <div className="dx-num" style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2 }}>
                      {mine.length} open · {eur(mine.reduce((a, q) => a + q.value, 0))} · <span style={{ color: below ? "var(--warn)" : undefined }}>{below} below target</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="dx-num" style={{ fontSize: 18, fontWeight: 600, color: WIN_RATE[r] < 40 ? "var(--warn)" : "var(--ink)" }}>{WIN_RATE[r]}%</div>
                    <div className="dx-faint" style={{ fontSize: 11 }}>win rate</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "4px 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <Note>Below-target quotes win more often (61%) but they are where the €15,408 of annualised margin shortfall sits. The approval decides whether the win is worth having.</Note>
            <Note tone="warn"><Linked text="David Kelly's win rate is the lowest and he has both quotes with no reply. A 7-day chase rule would have caught QT-2839 and QT-2833 before they went cold." /></Note>
          </div>
        </Card>
      </Grid>
    </Page>
  );
}
function tally(qs: { value: number }[]): [number, number] { return [qs.reduce((a, q) => a + q.value, 0), qs.length]; }

/* ================= CUSTOMER DETAIL ================= */
const KEY_ACCOUNTS: [string, string][] = [["murphy", "Murphy"], ["doyle", "Doyle"], ["obrien", "O'Brien"], ["ryan", "Ryan"], ["core", "Core"], ["leinster", "Leinster"]];

function summaryFor(c: Customer): ReactNode {
  switch (c.id) {
    case "murphy": return CUSTOMER_SUMMARY_MURPHY;
    case "ryan": return <>Ryan Trade Supplies' spend is down 28% in the last 90 days, mostly in Fixings. It normally buys M10 Hex Bolts every {BUYING_PATTERN.every} and last bought {BUYING_PATTERN.last}. The €18,600 is the decline already visible; if the M10 business has gone completely, {eur(BUYING_PATTERN.annual)} a year is at risk. Mark Ryan should call Declan Ryan today.</>;
    case "doyle": return <>Doyle Construction is {eur(c.balance)} into a {eur(c.limit)} limit with {eur(c.overdue)} overdue on INV-28482 (67 days). <SoLink id="SO-10503" /> ({eur(16240)}) is held: releasing it in full takes exposure to {eur(58920)}. Spend is up {c.trend}% on last year, so this is a cash problem, not a demand problem. <RecLink kind="quote" id="QT-2846" /> ({eur(22180)}) expires 30 Sep.</>;
    case "obrien": return <>O'Brien Facilities is priced on a 2025 contract that expires 31 Oct. EuroFix's 10.4% increase never went in, so M10 bolts sell at 13.4% margin. <RecLink kind="quote" id="QT-2841" /> ({eur(18420)}) would carry that price into a four-region rollout at 17.2% against a 24% target. Renew the contract at current cost before approving the rollout.</>;
    case "core": return <>Core Facilities is up {c.trend}% on last year with {pct(c.otif)} OTIF, the best service record of the large accounts. The Citywest site orders 40% more janitorial since July with no contract pricing on that site (€9,600 a year). <RecLink kind="quote" id="QT-2851" /> ({eur(31640)}) at 27.9% is waiting on a reply.</>;
    case "leinster": return <>Leinster Property Services is the lowest-margin national account at {pct(c.margin)}. The National 2026 contract has M10 bolts at 15.4% after the EuroFix increase, and <RecLink kind="quote" id="QT-2856" /> ({eur(11240)}) is waiting for approval at 20.4% as a competitor match against Brenmark.</>;
  }
  const sig = HEALTH_SIGNALS.find(s => s.cust === c.id);
  const opp = ALL_OPPS.find(o => o.cust === c.id);
  const hold = CREDIT_HOLDS.find(h => h.cust === c.id);
  const risky = custOrders(c.id).filter(o => o.risk === "HIGH" && o.status !== "Credit hold");
  const cats = c.categories.length > 1 ? c.categories.slice(0, -1).join(", ") + " and " + c.categories[c.categories.length - 1] : c.categories[0];
  const lc = (s: string) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
  const amt = (s: string) => s.match(/€[\d,]+/)?.[0];
  const dupOpp = !!(sig && opp && ((/quote/i.test(sig.signal) && /quote/i.test(opp.kind)) || amt(sig.impact) === amt(opp.value)));
  const lowPrice = PRICE_ROWS.filter(p => p.cust === c.id && p.margin < p.target);
  const lowQuote = QUOTES.filter(q => q.cust === c.id && q.status === "Pending approval");
  const out: ReactNode[] = [<Fragment key="t">{c.name}{c.name.endsWith("s") ? "'" : "'s"} spend is {c.trend >= 0 ? "up" : "down"} {Math.abs(c.trend).toFixed(1)}% on last year across {cats}.</Fragment>];
  risky.forEach(o => out.push(<Fragment key={o.id}> <RecLink kind="order" id={o.id} /> ({eur(o.value)}) is at risk today: <Linked text={lc((o.reason || "").replace(" · ", ", "))} />.</Fragment>));
  if (sig) out.push(<Fragment key="s"> Pulse flags {lc(sig.signal)}: {lc(sig.metric)} ({sig.impact}). Suggested: {lc(sig.action)}.</Fragment>);
  if (opp && !dupOpp) out.push(<Fragment key="o"> Opportunity ({opp.value}): <Linked text={lc(opp.detail)} /></Fragment>);
  lowPrice.forEach(p => out.push(<Fragment key={"p" + p.sku}> <RecLink kind="sku" id={p.sku} /> sells at {pct(p.margin)} on the {p.type.toLowerCase()} price{p.flag ? " (" + lc(p.flag) + ")" : ""}.</Fragment>));
  lowQuote.forEach(q => out.push(<Fragment key={q.id}> <RecLink kind="quote" id={q.id} /> ({eur(q.value)}) is waiting for approval at {pct(q.margin)} against a {pct(q.target)} target.</Fragment>));
  if (hold) out.push(<Fragment key="h"> <SoLink id={hold.so} /> ({eur(hold.order)}) is on credit hold with {eur(hold.overdue)} overdue.</Fragment>);
  else if (c.balance / c.limit >= 0.8) out.push(<Fragment key="c"> Credit is tight: {eur(c.balance)} of {eur(c.limit)} used{c.overdue ? ", " + eur(c.overdue) + " overdue" : ""}.</Fragment>);
  if (c.otif < 93) out.push(<Fragment key="d"> OTIF is {pct(c.otif)} against a 97% target.</Fragment>);
  if (!sig && !opp && !hold && !risky.length && !lowPrice.length && !lowQuote.length && c.balance / c.limit < 0.8 && c.otif >= 93) out.push(<Fragment key="n"> No open risks on the account.</Fragment>);
  return <>{out}</>;
}

type Ev = { t: number; kind: "agent" | "person" | "system"; actor: string; text: ReactNode };
function activityFor(c: Customer): Ev[] {
  const mine = custOrders(c.id), ids = new Set(mine.map(o => o.id));
  const out: Ev[] = [], placedSeen = new Set<string>();
  ACTIVITY.forEach(a => {
    if (!((a.ref && ids.has(a.ref)) || a.text.includes(c.name) || a.actor === c.name)) return;
    const t = when(a.t); if (t === null) return;
    out.push({ t, kind: a.kind, actor: a.actor, text: <Linked text={a.text.charAt(0).toLowerCase() + a.text.slice(1)} /> });
    if (a.ref && /placed|created/i.test(a.text)) placedSeen.add(a.ref);
  });
  const chan: Record<string, string> = { "B2B portal": "B2B ordering portal", EDI: "EDI", Email: "Outlook" };
  mine.forEach(o => {
    if (placedSeen.has(o.id)) return;
    const t = when(o.placed); if (t === null) return;
    const byRep = o.channel === "Rep order" || o.channel === "Phone";
    out.push({ t, kind: byRep ? "person" : "system", actor: byRep ? who(o.am).name : chan[o.channel] || o.channel,
      text: <>{o.channel === "Phone" ? "took a phone order" : byRep ? "entered order" : "received order"} <RecLink kind="order" id={o.id} />: {eur(o.value)}, {o.lines} lines</> });
  });
  QUOTES.filter(q => q.cust === c.id).forEach(q => out.push({ t: TODAY0 - ageDays(q.age) * DAY, kind: "person", actor: who(q.rep).name,
    text: <>{q.status === "Draft" ? "drafted" : "sent"} quote <RecLink kind="quote" id={q.id} />: {eur(q.value)} at {pct(q.margin)}</> }));
  RETURNS.filter(r => r.cust === c.id).forEach(r => { const t = when(r.when); if (t !== null) out.push({ t, kind: "person", actor: who(r.owner).name,
    text: <>logged return {r.id}: {r.qty} × <RecLink kind="sku" id={r.sku} plain>{product(r.sku).name}</RecLink>, {r.reason.toLowerCase()}</> }); });
  INVOICES.filter(i => i.cust === c.id).forEach(i => { const t = when(i.issued); if (t !== null) out.push({ t, kind: "system", actor: "Sage Accounts", text: <>issued {i.id} for {eur(i.amount)}, due {i.due}</> }); });
  DELIVERY_ISSUES.filter(d => d.cust === c.id).forEach(d => { const t = when(d.when); if (t !== null) out.push({ t, kind: "person", actor: who(d.owner).name, text: <>raised {d.id}: {d.kind.toLowerCase()} on <SoLink id={d.so} /></> }); });
  PODS.filter(p => p.cust === c.id).forEach(p => { const t = when(p.time); if (t !== null) out.push({ t, kind: "system", actor: "Route planner", text: <>POD for <SoLink id={p.so} /> on {p.route}, signed {p.signed}</> }); });
  return out.sort((a, b) => b.t - a.t).slice(0, 10);
}

function Detail() {
  const dx = useDx();
  const c = customer(dx.rec.cust) || customer("murphy");
  const orders = custOrders(c.id).sort((a, b) => riskRank(a.risk) - riskRank(b.risk) || b.value - a.value);
  const hist = history(c);
  const ytd = hist.slice(3).reduce((a, [, v]) => a + v, 0);
  const lines = topLines(c);
  const lineMax = Math.max(1, ...lines.map(l => l.value));
  const quotes = QUOTES.filter(q => q.cust === c.id && q.status !== "Won");
  const invoices = INVOICES.filter(i => i.cust === c.id);
  const listed = invoices.reduce((a, i) => a + i.amount, 0);
  const stops = ROUTES.flatMap(r => (r.list || []).filter(s => s.cust === c.id).map(s => ({ r, s })));
  const pods = PODS.filter(p => p.cust === c.id);
  const issues = DELIVERY_ISSUES.filter(d => d.cust === c.id);
  const returns = RETURNS.filter(r => r.cust === c.id);
  const opps = ALL_OPPS.filter(o => o.cust === c.id);
  const signal = HEALTH_SIGNALS.find(s => s.cust === c.id);
  const hold = CREDIT_HOLDS.find(h => h.cust === c.id);
  const prices = PRICE_ROWS.filter(p => p.cust === c.id);
  const discounts = DISCOUNTS.filter(d => d.cust === c.id);
  const lo = lastOrder(c);
  const nx = nextOrder(c);
  const people = contacts(c);
  const acts = activityFor(c);
  const used = c.balance / c.limit;
  const stopTone = (s: string): Tone => (s === "Delivered" ? "ok" : s === "Next" ? "accent" : s === "At risk" || s === "Failed" ? "bad" : "neutral");
  const sealant = returns.some(r => r.sku === "IC-5120");
  return (
    <Page eyebrow={"Customer · " + c.acct + " · " + c.segment} title={c.name}
      sub={<>Account manager {who(c.am).name} · {c.area}{c.sites.filter(s => s !== c.area).length ? " · " + c.sites.filter(s => s !== c.area).join(", ") : ""}</>}
      right={<>
        <Seg value={c.id} onChange={id => dx.go("Customers", "detail", { cust: id })} items={KEY_ACCOUNTS} />
        <Btn kind="quiet" onClick={() => dx.go("Customers", "accounts")}>All accounts</Btn>
      </>}>
      <KpiRow n={6}>
        <Kpi label="Revenue YTD" value={eur(c.revYTD)} sub={signed(c.trend) + (c.id === "ryan" ? " last 90 days" : " on last year")} subTone={c.trend >= 0 ? "ok" : "bad"} />
        <Kpi label="Gross margin" value={pct(c.margin)} sub="Company target 25.0%" subTone={c.margin < 25 ? "warn" : "ok"} />
        <Kpi label="Outstanding" value={eur(c.balance)} sub={"of " + eur(c.limit) + " limit · " + (c.overdue ? eur(c.overdue) + " overdue" : "none overdue")} subTone={c.overdue ? "bad" : undefined} />
        <Kpi label="Orders YTD" value={num(c.ordersYTD)} sub={"Last order " + rel(lo.t)} />
        <Kpi label="Average order" value={eur(c.avgOrder)} sub={"Next likely " + (nx.overdue ? "overdue" : fmtDay(nx.next))} />
        <Kpi label="OTIF" value={pct(c.otif)} sub="Target 97.0%" subTone={c.otif < 95 ? "warn" : "ok"} />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <AiCard agent="Customer Agent · 08:03" title="AI account summary"
            actions={c.id === "murphy" ? <><OppBtn id="OP-309" primary /><Btn small onClick={() => dx.go("Customers", "opportunities")}>PPE category gap</Btn></>
              : c.id === "ryan" ? <RyanFollowUp />
              : c.id === "doyle" ? <Btn small kind="primary" onClick={() => dx.go("Finance", "credit", { cust: "doyle" })}>Open credit control</Btn>
              : c.id === "obrien" ? <Btn small kind="primary" onClick={() => dx.go("Pricing", "exceptions", { quote: "QT-2841" })}>Review QT-2841</Btn>
              : opps[0] ? <OppBtn id={opps[0].id} primary /> : undefined}>
            <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink)" }}>{summaryFor(c)}</div>
          </AiCard>
          <Card title="Opportunities and signals" sub={opps.length + " open · " + (signal ? "1 health signal" : "no health signals")} pad={false}
            right={<Btn small kind="quiet" onClick={() => dx.go("Customers", "opportunities")}>All</Btn>}>
            <div className="dx-list">
              {signal && (
                <div className="dx-li" style={{ borderTop: 0 }}>
                  <Badge tone={healthTone(c.health)}>{c.health}</Badge>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                    <b style={{ fontWeight: 600 }}>{signal.signal}</b> · <span className="dx-muted">{signal.metric} · {signal.impact}</span>
                    <div className="dx-faint" style={{ fontSize: 12 }}>Suggested: {signal.action}</div>
                  </div>
                </div>
              )}
              {opps.map((o, i) => (
                <div key={o.id} className="dx-li" style={{ borderTop: i || signal ? undefined : 0, alignItems: "center" }}>
                  <Badge tone={oppTone(OPP_NUM[o.id].type)}>{o.kind}</Badge>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                    <Linked text={o.detail} />
                    <div className="dx-faint" style={{ fontSize: 12 }}>{o.id} · {o.value} · {o.confidence}% confidence · {who(o.owner).name}</div>
                  </div>
                  <OppBtn id={o.id} />
                </div>
              ))}
              {!opps.length && !signal && <div className="dx-empty">No open opportunities or health signals on this account.</div>}
            </div>
          </Card>
        </div>

        <Card title="Credit, terms and pricing" sub={c.priceList}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--dim)" }}>
            <span>Credit used</span>
            <span className="dx-num" style={{ color: used >= 0.85 ? "var(--bad)" : "var(--ink)", fontWeight: 500 }}>{eur(c.balance)} of {eur(c.limit)}</span>
          </div>
          <div style={{ marginTop: 7 }}><Meter value={c.balance} max={c.limit} tone={creditTone(c)} h={8} /></div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 6 }}>
            {eur(Math.max(0, c.limit - c.balance))} available · {c.overdue ? <span style={{ color: "var(--bad)" }}>{eur(c.overdue)} overdue</span> : "nothing overdue"} · status <Badge tone={statusTone(c.status)}>{c.status}</Badge>
          </div>
          {hold && (
            <div style={{ marginTop: 12 }}>
              <Note tone="bad"><SoLink id={hold.so} /> ({eur(hold.order)}) is held. Releasing it takes exposure to <b>{eur(hold.projected)}</b> against a {eur(hold.limit)} limit. Oldest debt {hold.days}.
                <div style={{ marginTop: 8 }}><Btn small onClick={() => dx.go("Finance", "credit", { cust: c.id })}>Open credit control</Btn></div>
              </Note>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <KV rows={[
              ["Payment terms", c.terms],
              ["Price list", c.priceList],
              ["Delivery", c.delivery],
              ["Sites", c.sites.join(" · ")],
              ["Categories", c.categories.join(", ")],
              ["Last order", <>{rel(lo.t)}{lo.so && <> · <SoLink id={lo.so} /></>}</>],
              ["Next likely", <>{nx.overdue ? "Overdue" : fmtDay(nx.next)} <span className="dx-faint">· usually every {nx.every} day{nx.every === 1 ? "" : "s"}</span></>],
            ]} />
          </div>
          {(prices.length > 0 || discounts.length > 0) && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="dx-faint" style={{ fontSize: 11.5 }}>Pricing on this account</div>
              {prices.map(p => (
                <div key={p.sku} className="dx-click" onClick={() => dx.go("Pricing", "lists")} style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "baseline" }}>
                  <RecLink kind="sku" id={p.sku} />
                  <span style={{ flex: 1, minWidth: 0, color: "var(--dim)" }}>{p.type} {eur(p.price, 2)}{p.flag ? " · " + p.flag : ""}</span>
                  <span className="dx-num" style={{ color: p.margin < p.target ? "var(--bad)" : "var(--ok)", fontWeight: 500 }}>{pct(p.margin)}</span>
                </div>
              ))}
              {discounts.map(d => (
                <div key={d.id} className="dx-click" onClick={() => dx.go("Pricing", "discounts")} style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span className="dx-num">{d.id}</span>
                  <span style={{ flex: 1, minWidth: 0, color: "var(--dim)" }}>{pct(d.discount)} discount on {d.ref} · {d.status}</span>
                  <span className="dx-num" style={{ color: d.discount > d.tierLimit ? "var(--bad)" : "var(--dim)" }}>limit {pct(d.tierLimit, 0)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Grid>

      <Card title="Current orders" sub={orders.length ? orders.length + " open · " + eur(orders.reduce((a, o) => a + o.value, 0)) + " · at-risk orders first" : "No open orders"} pad={false} style={{ marginTop: 14 }}>
        <Table rows={orders} onRow={o => dx.go("Orders", "detail", { order: o.id })} rowTone={o => (o.risk === "HIGH" ? "bad" : o.risk === "MEDIUM" ? "warn" : undefined)}
          empty={"No open orders. Last order " + rel(lo.t) + "."} cols={[
            { k: "id", label: "Order", w: "0.9fr", render: o => <RecLink kind="order" id={o.id} /> },
            { k: "po", label: "Customer PO", w: "1fr", render: o => <span className="dx-muted dx-num">{o.custPO}</span> },
            { k: "v", label: "Value", w: "0.85fr", align: "right", mono: true, render: o => eur(o.value) },
            { k: "l", label: "Lines", w: "0.85fr", render: o => <span>{o.lines}{o.short ? <span style={{ color: "var(--bad)" }}> · {o.short} short</span> : ""}</span> },
            { k: "req", label: "Required", w: "0.7fr" },
            { k: "route", label: "Route", w: "0.65fr", render: o => (hasRoute(o.route) ? <RecLink kind="route" id={o.route} /> : <span className="dx-muted">{o.route}</span>) },
            { k: "st", label: "Status", w: "1.35fr", render: o => <Badge tone={o.status === "Credit hold" ? "bad" : /Part/.test(o.status) ? "warn" : "neutral"}>{o.status}</Badge> },
            { k: "risk", label: "Risk", w: "2.4fr", render: o => <><Risk r={o.risk} />{o.reason && <Wrap dim><Linked text={o.reason} /></Wrap>}</> },
          ]} />
      </Card>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <Card title="Purchase history" sub={<>Monthly spend, Oct last year to Sep month to date. Jan–Sep: <b style={{ color: "var(--ink)" }}>{eur(ytd)}</b>, the year-to-date revenue.</>}>
          <Columns h={190} fmt={n => eur(n)} data={hist.map(([label, value], i) => ({ label, value, tone: i < 3 ? "var(--chart-muted)" : "accent" }))} />
          <div className="dx-legend">
            <span><i style={{ background: "var(--chart-muted)" }} />Oct–Dec, last year</span>
            <span><i style={{ background: "var(--accent)" }} />This year · Sep is month to date</span>
          </div>
        </Card>
        <Card title="Frequently purchased" sub="Revenue YTD and usual reorder rhythm" pad={false}>
          <div className="dx-list">
            {lines.map((l, i) => (
              <div key={l.sku} className="dx-li dx-click" style={{ borderTop: i ? undefined : 0, alignItems: "center" }} onClick={() => dx.open("sku", l.sku)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}>
                    <RecLink kind="sku" id={l.sku} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product(l.sku).name}</span>
                  </div>
                  <div style={{ marginTop: 6 }}><Meter value={l.value} max={lineMax} tone={l.flag ? "bad" : "accent"} h={5} /></div>
                  <div style={{ fontSize: 12, color: l.flag ? "var(--bad)" : "var(--dim)", marginTop: 4 }}>{l.cadence}{l.flag ? " · " + l.flag : ""}</div>
                </div>
                <span className="dx-num" style={{ fontWeight: 600, fontSize: 13 }}>{eur(l.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <Grid cols="repeat(2,minmax(0,1fr))" style={{ marginTop: 14 }}>
        <Card title="Open quotes" sub={quotes.length ? quotes.length + " open · " + eur(quotes.reduce((a, q) => a + q.value, 0)) : "None open"} pad={false}>
          <Table dense rows={quotes} onRow={q => dx.open("quote", q.id)} rowTone={q => (q.margin < q.target ? "bad" : undefined)} empty="No open quotes on this account." cols={[
            { k: "id", label: "Quote", w: "0.8fr", render: q => <RecLink kind="quote" id={q.id} /> },
            { k: "v", label: "Value", w: "0.9fr", align: "right", mono: true, render: q => eur(q.value) },
            { k: "m", label: "Margin", w: "0.7fr", align: "right", mono: true, render: q => <span style={{ color: q.margin < q.target ? "var(--bad)" : "var(--ok)" }}>{pct(q.margin)}</span> },
            { k: "st", label: "Status", w: "1.4fr", render: q => <Badge tone={q.status === "Pending approval" ? "warn" : /No response/.test(q.status) ? "bad" : "neutral"}>{shortStatus(q.status)}</Badge> },
            { k: "e", label: "Expires", w: "0.75fr" },
          ]} />
        </Card>
        <Card title="Outstanding invoices" sub={eur(c.balance) + " outstanding · " + c.terms} pad={false}
          right={<Btn small kind="quiet" onClick={() => dx.go("Finance", "debtors")}>Debtors</Btn>}>
          <div className="dx-list">
            {invoices.map((inv, i) => {
              const late = /Overdue|90\+/.test(inv.status);
              return (
                <div key={inv.id} className="dx-li" style={{ borderTop: i ? undefined : 0, alignItems: "center", boxShadow: late ? "inset 3px 0 0 var(--bad)" : undefined }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.45 }}>
                    <div><span className="dx-num" style={{ fontWeight: 500 }}>{inv.id}</span> <span className="dx-faint">· issued {inv.issued} · due {inv.due}</span></div>
                    {inv.promise && <div className="dx-muted" style={{ fontSize: 12 }}>{inv.promise}</div>}
                  </div>
                  <Badge tone={late ? "bad" : /Due today/.test(inv.status) ? "warn" : "ok"}>{inv.status}</Badge>
                  <span className="dx-num" style={{ fontWeight: 600, fontSize: 13, width: 70, textAlign: "right" }}>{eur(inv.amount)}</span>
                </div>
              );
            })}
            {c.balance - listed > 0 && (
              <div className="dx-li" style={{ borderTop: invoices.length ? undefined : 0, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{invoices.length ? "Other current invoices" : "Current invoices"} <span className="dx-faint">· within {c.terms}</span></div>
                <Badge tone="ok">Current</Badge>
                <span className="dx-num" style={{ fontWeight: 600, fontSize: 13, width: 70, textAlign: "right" }}>{eur(c.balance - listed)}</span>
              </div>
            )}
            {!c.balance && <div className="dx-empty">Nothing outstanding.</div>}
          </div>
          <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, display: "flex" }}>
            <span className="dx-faint" style={{ flex: 1 }}>Total outstanding</span><b className="dx-num" style={{ fontWeight: 600 }}>{eur(c.balance)}</b>
          </div>
        </Card>
      </Grid>

      <Grid cols="repeat(2,minmax(0,1fr))" style={{ marginTop: 14 }}>
        <Card title="Deliveries" sub={"Standing arrangement: " + c.delivery} pad={false}>
          <div className="dx-list">
            {stops.map(({ r, s }, i) => (
              <div key={r.id + s.n} className="dx-li dx-click" style={{ borderTop: i ? undefined : 0 }} onClick={() => dx.open("route", r.id)}>
                <span style={{ color: "var(--dim)", marginTop: 2 }}><Icon d={IC.truck} s={15} /></span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                  <div><RecLink kind="route" id={r.id}>Route {r.id}</RecLink> · stop {s.n} of {r.stops} · {s.site} · ETA {s.eta}</div>
                  <div className="dx-muted" style={{ fontSize: 12.5 }}><SoLink id={s.so} /> · {who(r.driver).name} · {r.vehicle}{s.note ? " · " : ""}{s.note && <Linked text={s.note} />}</div>
                </div>
                <Badge tone={stopTone(s.status)}>{s.status}</Badge>
              </div>
            ))}
            {pods.map((p, i) => (
              <div key={p.so} className="dx-li" style={{ borderTop: i || stops.length ? undefined : 0 }}>
                <span style={{ color: "var(--ok)", marginTop: 2 }}><Icon d={IC.check} s={15} w={2} /></span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                  <div>POD <SoLink id={p.so} /> · {p.route} · {p.time} · signed {p.signed}</div>
                  <div className="dx-muted" style={{ fontSize: 12.5 }}>{p.photo ? "Photo" : "No photo"} · {p.gps ? "GPS confirmed" : "No GPS"} · {p.exceptions}</div>
                </div>
              </div>
            ))}
            {issues.map((d, i) => (
              <div key={d.id} className="dx-li" style={{ borderTop: i || stops.length || pods.length ? undefined : 0 }}>
                <span style={{ color: "var(--warn)", marginTop: 2 }}><Icon d={IC.alert} s={15} /></span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                  <div>{d.id} · {d.kind} · <SoLink id={d.so} /></div>
                  <div className="dx-muted" style={{ fontSize: 12.5 }}><Linked text={d.detail} /></div>
                </div>
                <Badge tone={/Closed|raised|booked/i.test(d.status) ? "neutral" : "warn"}>{d.status}</Badge>
              </div>
            ))}
            {!stops.length && !pods.length && !issues.length && <div className="dx-empty">Nothing on the road for this account today.</div>}
          </div>
        </Card>
        <Card title="Returns and claims" sub={returns.length ? returns.length + " in the last 30 days · " + eur(returns.reduce((a, r) => a + r.value, 0), 2) : "None in the last 30 days"} pad={false}>
          <div className="dx-list">
            {returns.map((r, i) => (
              <div key={r.id} className="dx-li" style={{ borderTop: i ? undefined : 0 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                  <div><span className="dx-num" style={{ fontWeight: 500 }}>{r.id}</span> · {r.qty} × <RecLink kind="sku" id={r.sku} plain>{product(r.sku).name}</RecLink> · <SoLink id={r.so} /></div>
                  <div className="dx-muted" style={{ fontSize: 12.5 }}>Replacement: {r.replacement} · Credit: {r.credit} · Supplier claim: {r.claim} · {who(r.owner).name}</div>
                </div>
                <div style={{ textAlign: "right", flex: "none" }}>
                  <Badge tone={/Defective|Damaged|damage/i.test(r.reason) ? "warn" : "neutral"}>{r.reason}</Badge>
                  <div className="dx-num dx-faint" style={{ fontSize: 12, marginTop: 4 }}>{eur(r.value, 2)} · {r.when}</div>
                </div>
              </div>
            ))}
            {!returns.length && <div className="dx-empty">No returns or claims on this account.</div>}
          </div>
          {sealant && <div style={{ padding: "0 20px 16px" }}><Note tone="warn"><Linked text={RETURN_PATTERN} /></Note></div>}
        </Card>
      </Grid>

      <Grid cols="minmax(0,5fr) minmax(0,7fr)" style={{ marginTop: 14 }}>
        <Card title="Contacts" sub={people.length + " people at " + c.name} pad={false}>
          <div className="dx-list">
            {people.map((p, i) => (
              <div key={p.email} className="dx-li" style={{ borderTop: i ? undefined : 0 }}>
                <span className="dx-avatar" style={{ width: 30, height: 30, fontSize: 11, background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--border)" }}>
                  {p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 500 }}>{p.name} <span className="dx-faint" style={{ fontWeight: 400 }}>· {p.role}</span></div>
                  <div className="dx-muted dx-num" style={{ fontSize: 12.5 }}>{p.email} · {p.phone}</div>
                  <div className="dx-faint" style={{ fontSize: 12 }}>{p.note}</div>
                </div>
                {i === 0 && <Badge tone="accent">Primary</Badge>}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Activity" sub="Orders, quotes, invoices, deliveries and returns on this account, newest first" pad={false}>
          <div className="dx-list">
            {acts.map((a, i) => (
              <div key={i} className="dx-li" style={{ borderTop: i ? undefined : 0 }}>
                <span className="dx-num" style={{ fontSize: 12, color: "var(--faint)", width: 92, flex: "none", paddingTop: 1 }}>{rel(a.t)}</span>
                <span style={{ flex: "none", marginTop: 1 }}><Badge tone={a.kind === "agent" ? "accent" : a.kind === "person" ? "ok" : "neutral"}>{a.kind === "agent" ? "Agent" : a.kind === "person" ? "Person" : "System"}</Badge></span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}><b style={{ fontWeight: 600 }}>{a.actor}</b> <span style={{ color: "var(--body)" }}>{a.text}</span></div>
              </div>
            ))}
            {!acts.length && <div className="dx-empty">No recorded activity in the last 90 days.</div>}
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = {
  overview: Overview,
  accounts: Accounts,
  opportunities: Opportunities,
  health: HealthPage,
  quotes: Quotes,
  detail: Detail,
};
