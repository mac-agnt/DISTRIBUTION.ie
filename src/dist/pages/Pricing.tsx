import type { ComponentType } from "react";
import {
  CATEGORY_MARGIN, COST_CHANGES, DISCOUNTS, KPI, LEAKAGE, MARGIN_EXCEPTION_TOTAL, ORDERS, PRICE_ROWS, PRICE_TYPES, PRODUCT_PROFIT, QUOTES,
  REVENUE_MONTHS, SLOW_LINES, SO10482_LINES, SO10482_PROFIT, customer, order, orderProfit, product, supplier, who, eur, eurK, num, pct,
  type Discount, type PriceRow,
} from "../db";
import {
  ActBtn, AiCard, Badge, Btn, Card, Chain, Grid, HBars, IC, Kpi, KpiRow, Lines, Meter, Note, Page, Person, RecLink, Seg, Strip, Table,
  useDx, useLocal, type Tone,
} from "../ui";

/* ================= shared helpers ================= */

const FLOOR = 24.0; // required margin on customer pricing and quotes; the company blended target is KPI.marginTarget (25.0%)
const pts = (n: number) => (n < 0 ? "−" : "+") + Math.abs(n).toFixed(1) + " pts";
const hasOrder = (id: string) => ORDERS.some(o => o.id === id);
const hasQuote = (id: string) => QUOTES.some(q => q.id === id);
const first = (id: string) => who(id).name.split(" ")[0];
const marginTone = (m: number, target = FLOOR): Tone => (m < target - 5 ? "bad" : m < target ? "warn" : "ok");

/* A reference on a discount or exception: a quote, an order, or plain text when it isn't a record we hold. */
function RefLink({ id }: { id: string }) {
  if (id.startsWith("QT") && hasQuote(id)) return <RecLink kind="quote" id={id} />;
  if (id.startsWith("SO") && hasOrder(id)) return <RecLink kind="order" id={id} />;
  return <span className="dx-num dx-muted">{id}</span>;
}

/* Discount decisions. DA-418 is the O'Brien quote and shares its decision with the Command Centre. */
type Opt = [label: string, done: string, toast: string];
const DA_PLAN: Record<string, { say: string; a: Opt; b: Opt }> = {
  "DA-421": {
    say: "Approve. The Brenmark quote is on file and Leinster is a €392k account. Hold fixings at contract price so the discount stays on janitorial.",
    a: ["Approve", "Approved · Michael Doyle", "DA-421 approved: Leinster QT-2856 at 20.4%, competitor match with the Brenmark quote on file. Mark Ryan notified."],
    b: ["Reject", "Rejected · back to Mark", "DA-421 rejected. QT-2856 returned to Mark Ryan to reprice inside the 8% tier."],
  },
  "DA-422": {
    say: "Approve with a volume clause: the price falls back to Tier B if the 12-month volume is missed.",
    a: ["Approve with clause", "Approved with volume clause", "DA-422 approved for Harbour Point Facilities at 21.1% with a 12-month volume clause. Mark Ryan notified."],
    b: ["Reject", "Rejected · back to Mark", "DA-422 rejected. QT-2849 returned to Mark Ryan to reprice inside the 8% tier."],
  },
  "DA-424": {
    say: "Return to Sarah. 2.4 pts under target with no reason beyond 'site deal', and Grange's customer-specific list already has sealant at 14.0%.",
    a: ["Return to Sarah", "Returned to Sarah Byrne", "DA-424 returned to Sarah Byrne: QT-2862 needs a priced reason before it goes to Michael Doyle."],
    b: ["Approve", "Approved · Michael Doyle", "DA-424 approved: Grange QT-2862 at 21.6%. Exception logged."],
  },
};
const daDone = (acted: Record<string, string>, id: string) => (id === "DA-418" ? acted["d-quote"] || acted["quote-approve"] : acted["da-" + id]);

function DaActions({ d }: { d: Discount }) {
  const dx = useDx();
  const done = daDone(dx.acted, d.id);
  if (done) return <Btn small done={done}>{""}</Btn>;
  if (d.id === "DA-418") return (
    <>
      <ActBtn id="d-quote" kind="primary" small label="Counter at 21.5%" done="Countered at 21.5%" toast="QT-2841 revised to 21.5% and sent to David Kelly to present. Michael Doyle's approval recorded." />
      <ActBtn id="quote-approve" small label="Approve at 17.2%" done="Approved at 17.2%" toast="QT-2841 approved at 17.2% by Michael Doyle. Exception logged." />
    </>
  );
  const p = DA_PLAN[d.id];
  if (!p) return null;
  return (
    <>
      <ActBtn id={"da-" + d.id} kind="primary" small label={p.a[0]} done={p.a[1]} toast={p.a[2]} />
      <ActBtn id={"da-" + d.id} kind="quiet" small label={p.b[0]} done={p.b[1]} toast={p.b[2]} />
    </>
  );
}

/* ================= MARGIN CONTROL ================= */
const LEAK_GO: Record<string, [string, string]> = {
  "Outdated customer pricing": ["lists", "Price lists"],
  "Excessive discounting": ["discounts", "Discount approvals"],
  "Supplier cost increases not passed through": ["costs", "Cost changes"],
  "Low margin quotes": ["exceptions", "Exceptions"],
  "Manual price overrides": ["lists", "Price lists"],
};
/* The three customer-specific agreements behind the Briefing's €18,600 (KPI.marginRecovery). */
const RECOVERY = [
  { cust: "grange", reviewed: "Nov 2025", driver: "Hansen sealant +9.7%, Bristol discs +6.0% since the review", lines: 38, value: 7240 },
  { cust: "mcgrath", reviewed: "Dec 2025", driver: "EuroFix nuts +8.4% and bolts +10.4% on 1 Sep", lines: 44, value: 6380 },
  { cust: "doyle", reviewed: "Mar 2026", driver: "EuroFix increases landed after the March review", lines: 29, value: 4980 },
];

function MarginControl() {
  const dx = useDx();
  const rev = KPI.revenueMTD;
  const leak = LEAKAGE.reduce((a, l) => a + l[1], 0);
  const cats = CATEGORY_MARGIN.map(([cat, r, m]) => ({ cat, r, m, gp: Math.round((r * m) / 100), gap: Math.round((r * (m - KPI.marginTarget)) / 100) }));
  const weakest = [...cats].sort((a, b) => a.m - b.m)[0];
  const recovery = RECOVERY.reduce((a, r) => a + r.value, 0);
  const firstM = REVENUE_MONTHS[1];
  return (
    <Page eyebrow="Pricing & Margin" title="Margin control"
      sub={<>Month to date across 437 accounts. Every point of margin is worth {eur(rev / 100)} of gross profit this month, and {(KPI.marginTarget - KPI.grossMargin).toFixed(1)} points are missing.</>}
      right={<>
        <Btn kind="ghost" icon={IC.chat} onClick={() => dx.ask("What is killing our margin?")}>Ask Margin Agent</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Pricing", "exceptions")}>Exceptions</Btn>
      </>}>
      <KpiRow n={6}>
        <Kpi label="Revenue MTD" value={eurK(rev)} sub={KPI.revenueDelta + " vs same period last month"} subTone="ok" onClick={() => dx.go("Finance", "revenue")} />
        <Kpi label="Gross profit" value={eurK(KPI.grossProfitMTD)} sub="Month to date" />
        <Kpi label="Gross margin" value={pct(KPI.grossMargin)} tone="warn" sub={pts(KPI.grossMargin - KPI.marginTarget) + " vs target"} subTone="warn" />
        <Kpi label="Target" value={pct(KPI.marginTarget)} sub="Company blended target" />
        <Kpi label="Margin gap" value={eur(KPI.marginGapEur)} tone="bad" sub="This month" />
        <Kpi label="Annualised" value={eur(KPI.marginGapEur * 12)} tone="bad" sub="If nothing changes" />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)">
        <Card title="Margin leakage by cause" sub={eur(leak) + " a month · " + eur(leak * 12) + " annualised · " + ((leak / rev) * 100).toFixed(1) + " pts of margin"} pad={false}>
          <div className="dx-list">
            {LEAKAGE.map(([k, v, why], i) => (
              <div key={k} className="dx-li dx-click" onClick={() => dx.go("Pricing", LEAK_GO[k][0])} style={{ borderTop: i ? undefined : 0, flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, width: "100%" }}>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{k}</span>
                  <span className="dx-num dx-faint" style={{ fontSize: 12 }}>{((v / rev) * 100).toFixed(2)} pts</span>
                  <span className="dx-num" style={{ fontSize: 14, fontWeight: 600, minWidth: 70, textAlign: "right" }}>{eur(v)}</span>
                </div>
                <div style={{ width: "100%" }}><Meter value={v} max={LEAKAGE[0][1]} tone="bad" h={7} /></div>
                <div style={{ fontSize: 12.5, color: "var(--dim)", width: "100%", display: "flex", gap: 10 }}>
                  <span style={{ flex: 1 }}>{why}</span>
                  <span style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>{LEAK_GO[k][1]}</span>
                </div>
              </div>
            ))}
            <div className="dx-li" style={{ fontSize: 13 }}>
              <span style={{ flex: 1, color: "var(--dim)" }}>Estimated monthly opportunity</span>
              <b className="dx-num" style={{ fontWeight: 600 }}>{eur(leak)}</b>
              <span className="dx-faint">·</span>
              <b className="dx-num" style={{ fontWeight: 600, color: "var(--bad)" }}>{eur(leak * 12)} a year</b>
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <AiCard agent="Margin Agent · 08:58" title={eur(recovery) + " a year back from three agreements"}
            actions={<>
              <ActBtn id="recovery-3" kind="primary" small label="Draft three price reviews" done="3 price reviews drafted"
                toast="Price reviews drafted for Grange Contracts, McGrath Civil and Doyle Construction: €18,600 a year. Sent to Sarah Byrne for the customer conversations." />
              <Btn small onClick={() => dx.go("Pricing", "exceptions")}>Exceptions</Btn>
              <Btn small onClick={() => dx.go("Pricing", "costs")}>Cost changes</Btn>
            </>}>
            Margin is {(KPI.marginTarget - KPI.grossMargin).toFixed(1)} points below target. Most of the gap comes from {weakest.cat} ({pct(weakest.m)}) and three customer-specific price agreements that were never updated after supplier cost increases.
            All three are Sarah Byrne's accounts.
            <div style={{ marginTop: 12, marginLeft: -18, marginRight: -18 }}>
              <Table dense rows={RECOVERY} onRow={r => dx.go("Customers", "detail", { cust: r.cust })} cols={[
                { k: "c", label: "Agreement", w: "1.5fr", render: r => <RecLink kind="cust" id={r.cust} plain>{customer(r.cust).name}</RecLink> },
                { k: "rv", label: "Reviewed", w: "0.8fr", render: r => <span className="dx-muted">{r.reviewed}</span> },
                { k: "v", label: "A year", w: "0.8fr", align: "right", mono: true, render: r => <b style={{ fontWeight: 600 }}>{eur(r.value)}</b> },
              ]} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 10 }}>{RECOVERY.map(r => customer(r.cust).name.split(" ")[0] + ": " + r.driver).join(". ")}.</div>
          </AiCard>
        </div>
      </Grid>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <Card title="Margin by category" sub={"Month to date against the " + pct(KPI.marginTarget) + " target"} pad={false}>
          <Table rows={cats} rowTone={c => (c.m < 21 ? "bad" : c.m < KPI.marginTarget ? "warn" : undefined)} cols={[
            { k: "cat", label: "Category", w: "1.8fr", render: c => <span style={{ fontWeight: c.cat === weakest.cat ? 600 : 500, whiteSpace: "normal", lineHeight: 1.35 }}>{c.cat}</span> },
            { k: "r", label: "Revenue MTD", w: "1.05fr", align: "right", mono: true, render: c => eur(c.r) },
            { k: "gp", label: "Gross profit", w: "1fr", align: "right", mono: true, render: c => eur(c.gp) },
            { k: "m", label: "Margin", w: "1.15fr", render: c => <><Meter value={c.m} max={32} tone={c.m < 21 ? "bad" : c.m < KPI.marginTarget ? "warn" : "ok"} w={36} /><span className="dx-num" style={{ fontWeight: 500 }}>{pct(c.m)}</span></> },
            { k: "gap", label: "Vs target", w: "1fr", align: "right", mono: true, render: c => <span style={{ color: c.gap < 0 ? "var(--bad)" : "var(--ok)" }}>{(c.gap > 0 ? "+" : "") + eur(c.gap)}</span> },
          ]} />
          <div style={{ padding: "12px 20px 16px" }}>
            <Note tone="bad">
              {weakest.cat} is the weakest category at {pct(weakest.m)}: {eur(-weakest.gap)} below target this month. Hansen sealant (+9.7%) and Bristol discs (+6.0%) cost increases are not in customer prices, and <RecLink kind="sku" id="IC-5120" /> has 9 returns this month on one bad batch.
            </Note>
          </div>
        </Card>
        <Card title="Margin trend" sub={"Gross margin by month. Down " + (firstM[2] - KPI.grossMargin).toFixed(1) + " pts since " + firstM[0] + "."}>
          <Lines h={220} labels={REVENUE_MONTHS.map(m => m[0])} fmt={n => n.toFixed(1) + "%"} target={KPI.marginTarget} targetLabel={"Target " + pct(KPI.marginTarget)}
            series={[{ name: "Gross margin", data: REVENUE_MONTHS.map(m => m[2]), tone: "accent", wash: true }]} />
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 10, lineHeight: 1.55 }}>
            Margin has slipped every month since March while revenue held up. August and September also carry the supplier increases of 1 Aug, 15 Aug and 1 Sep, most of which never reached customer price lists.
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

/* ================= PRICE LISTS ================= */
const TYPE_NOTE: Record<string, string> = {
  "Standard list": "List price, no negotiation",
  Tier: "Tier A, B or C off list, set by account size",
  Contract: "Fixed prices for a term, reviewed at renewal",
  "Customer-specific": "Negotiated line prices for one account",
  Promotional: "Time-limited price that should end on its date",
  "Manual override": "Price typed at order entry or the counter",
};
type Cause = "cost" | "promo" | "override" | "floor" | "ok";
const causeOf = (r: PriceRow): Cause => (r.flag?.includes("Promo") ? "promo" : r.flag?.includes("Override") ? "override" : r.flag && /Cost up|Was/.test(r.flag) ? "cost" : r.margin < r.target ? "floor" : "ok");
const CAUSE_TXT: Record<Cause, string> = {
  cost: "Not reviewed after cost increase", promo: "Expired promotion still applied", override: "Manual override, no reason code",
  floor: "Negotiated below required margin", ok: "Within required margin",
};
const CONTRACTS = [
  { cust: "obrien", name: "O'Brien 2025", expires: "31 Oct", days: 36, reviewed: "Oct 2025", worst: "FIX-2201 at 13.4%", tone: "bad" as Tone },
  { cust: "leinster", name: "National 2026", expires: "31 Dec", days: 97, reviewed: "Jan 2026", worst: "FIX-2201 at 15.4%", tone: "warn" as Tone },
  { cust: "core", name: "Facilities 2026", expires: "31 Dec", days: 97, reviewed: "Jan 2026", worst: "No line under 24%", tone: "ok" as Tone },
  { cust: "murphy", name: "Merchant Tier A", expires: "Rolling · 90 days' notice", days: 0, reviewed: "Feb 2026", worst: "FIX-2201 down to 24.3% (was 31.4%)", tone: "warn" as Tone },
  { cust: "swords", name: "Merchant Tier A", expires: "Rolling · 90 days' notice", days: 0, reviewed: "Feb 2026", worst: "FIX-2201 24.3%, same contract price", tone: "warn" as Tone },
];
const toFloor = (cost: number, target: number) => Math.ceil((cost / (1 - target / 100)) * 100) / 100;

function PriceAction({ r }: { r: PriceRow }) {
  const c = customer(r.cust), cause = causeOf(r), key = "pr-" + r.cust + "-" + r.sku;
  if (cause === "promo") return <ActBtn id={key} small label="End promo price" done="Back on Tier B" toast={c.name + " " + r.sku + " returned to Tier B pricing. The August promotion is closed."} />;
  if (cause === "override") return <ActBtn id={key} small label="Remove override" done="Override removed" toast={c.name + " " + r.sku + " override removed. Counter overrides now need a reason code."} />;
  if (r.margin >= r.target) return <span className="dx-faint">—</span>;
  const np = toFloor(r.cost, r.target);
  if (r.cust === "obrien") return <ActBtn id={key} small label="Add to renewal" done="In 31 Oct renewal" toast={"FIX-2201 at " + eur(np, 2) + " added to O'Brien Facilities' 31 Oct contract renewal. David Kelly notified."} />;
  return <ActBtn id={key} small label={"Reprice to " + eur(np, 2)} done={"Proposed to " + first(c.am)} toast={c.name + " " + r.sku + ": " + eur(r.price, 2) + " → " + eur(np, 2) + " (" + pct(r.target) + ") proposed to " + who(c.am).name + ". Customer notice drafted."} />;
}

function PriceLists() {
  const dx = useDx();
  const [f, setF] = useLocal("price-rows-f", "all");
  const below = PRICE_TYPES.reduce((a, t) => a + t[3], 0);
  const custs = PRICE_TYPES.reduce((a, t) => a + t[1], 0);
  const rows = PRICE_ROWS.filter(r => f === "all" || (f === "below" ? r.margin < r.target : causeOf(r) === f));
  const causeCount = (k: Cause) => PRICE_ROWS.filter(r => causeOf(r) === k).length;
  return (
    <Page eyebrow="Pricing & Margin" title="Price lists"
      sub={<>Six ways a customer gets a price. {below} of {custs} customers are buying below the {pct(FLOOR)} required margin, and the reason is usually a price nobody went back to.</>}
      right={<Btn kind="quiet" onClick={() => dx.go("Pricing", "costs")}>Cost changes</Btn>}>
      <KpiRow n={4}>
        <Kpi label="Customers below required margin" value={String(below)} sub={"of " + custs + " · " + pct((below / custs) * 100) + " of accounts"} subTone="warn" />
        <Kpi label="Agreements not reviewed" value="112" sub="Since the last supplier increase" subTone="warn" />
        <Kpi label="Manual overrides this month" value="19" sub="11 without a reason code" subTone="bad" />
        <Kpi label="O'Brien contract expires" value="31 Oct" sub="36 days · FIX-2201 at 13.4% on it" subTone="bad" onClick={() => dx.go("Customers", "detail", { cust: "obrien" })} />
      </KpiRow>

      <Card title="Customers by price type" sub={"Average margin and how many sit below the " + pct(FLOOR) + " required margin"} pad={false}>
        <Table rows={PRICE_TYPES} rowTone={t => (t[3] === t[1] ? "bad" : t[3] / t[1] > 0.15 ? "warn" : undefined)} cols={[
          { k: "t", label: "Price type", w: "1.4fr", render: t => <span style={{ fontWeight: 500 }}>{t[0]}</span> },
          { k: "n", label: "What it is", w: "2.4fr", render: t => <span className="dx-muted">{TYPE_NOTE[t[0]]}</span> },
          { k: "c", label: "Customers", w: "0.8fr", align: "right", mono: true, render: t => String(t[1]) },
          { k: "m", label: "Avg margin", w: "1.5fr", render: t => <><Meter value={t[2]} max={32} tone={marginTone(t[2])} w={70} /><span className="dx-num" style={{ fontWeight: 500, color: t[2] < FLOOR ? "var(--bad)" : undefined }}>{pct(t[2])}</span></> },
          { k: "b", label: "Below required", w: "1fr", align: "right", mono: true, render: t => <span style={{ color: t[3] ? "var(--bad)" : undefined, fontWeight: 500 }}>{t[3]}</span> },
          { k: "s", label: "Share below", w: "0.9fr", align: "right", mono: true, render: t => pct((t[3] / t[1]) * 100, 0) },
        ]} />
        <div style={{ padding: "12px 20px 16px" }}>
          <Note tone="warn">Every promotional and every manual-override customer is below the required margin. Contract and customer-specific agreements hold 25 of the {below}: they are fixed for a term, so a supplier increase lands straight on our margin.</Note>
        </div>
      </Card>

      <Card title="Who is buying below required margin, and why" sub={"Lines flagged by the Margin Agent · required margin " + pct(FLOOR)} pad={false} style={{ marginTop: 14 }}
        right={<Seg value={f} onChange={setF} items={[["all", "All"], ["below", "Below " + pct(FLOOR, 0)], ["cost", "Cost not passed (" + causeCount("cost") + ")"], ["promo", "Expired promo (" + causeCount("promo") + ")"], ["override", "Override (" + causeCount("override") + ")"]]} />}>
        <Table rows={rows} onRow={r => dx.open("sku", r.sku)} rowTone={r => (r.margin < r.target ? (r.margin < r.target - 5 ? "bad" : "warn") : undefined)} cols={[
          { k: "c", label: "Customer · price type", w: "1.6fr", render: r => (
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
              <RecLink kind="cust" id={r.cust} plain>{customer(r.cust).name}</RecLink>
              <span className="dx-faint" style={{ fontSize: 11.5 }}>{r.type}</span>
            </span>) },
          { k: "sku", label: "SKU", w: "0.85fr", render: r => <RecLink kind="sku" id={r.sku} /> },
          { k: "p", label: "Price", w: "0.75fr", align: "right", mono: true, render: r => eur(r.price, 2) },
          { k: "cost", label: "Cost", w: "0.75fr", align: "right", mono: true, render: r => eur(r.cost, 2) },
          { k: "m", label: "Margin", w: "0.75fr", align: "right", mono: true, render: r => <span style={{ color: r.margin < r.target ? "var(--bad)" : "var(--ok)", fontWeight: 600 }}>{pct(r.margin)}</span> },
          { k: "why", label: "Why", w: "2.3fr", render: r => (
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2, whiteSpace: "normal", lineHeight: 1.35 }}>
              <span>{CAUSE_TXT[causeOf(r)]}</span>
              <span className="dx-faint" style={{ fontSize: 11.5 }}>{(r.flag ? r.flag + " · " : "") + "reviewed " + r.reviewed}</span>
            </span>) },
          { k: "act", label: "", w: "1.5fr", align: "right", render: r => <PriceAction r={r} /> },
        ]} empty="No flagged lines for this filter." />
      </Card>

      <div className="dx-section">
        <div className="dx-section-head"><div className="dx-section-title">Contracts and renewals</div><span className="dx-faint" style={{ fontSize: 12.5 }}>Fixed-term agreements and what they carry at today's cost</span></div>
        <AiCard agent="Margin Agent" title="Renew O'Brien before approving the rollout"
          actions={<>
            <ActBtn id="obrien-renewal" kind="primary" small label="Start renewal" done="Renewal opened · David Kelly"
              toast="Contract renewal opened for O'Brien Facilities, 31 Oct. Fixings repriced at current EuroFix cost, sent to David Kelly and Michael Doyle." />
            <Btn small onClick={() => dx.open("quote", "QT-2841")}>Open QT-2841</Btn>
          </>}>
          O'Brien Facilities' 2025 contract expires <b>31 Oct</b>. <RecLink kind="sku" id="FIX-2201" /> sells at 13.4% under it because EuroFix's 10.4% increase never went in.
          {" "}<RecLink kind="quote" id="QT-2841" /> (€18,420 at 17.2%) would carry that price into a four-region rollout. Renew at current cost first, then price the rollout on the new contract.
        </AiCard>
        <Card pad={false} style={{ marginTop: 14 }}>
          <Table rows={CONTRACTS} onRow={k => dx.go("Customers", "detail", { cust: k.cust })} rowTone={k => (k.tone === "ok" ? undefined : k.tone)} cols={[
            { k: "c", label: "Customer", w: "1.6fr", render: k => <RecLink kind="cust" id={k.cust} plain>{customer(k.cust).name}</RecLink> },
            { k: "n", label: "Contract", w: "1.1fr", render: k => <span className="dx-muted">{k.name}</span> },
            { k: "e", label: "Expires", w: "1.5fr", render: k => <span style={{ color: k.days && k.days < 45 ? "var(--bad)" : undefined, fontWeight: k.days && k.days < 45 ? 600 : 400 }}>{k.expires}{k.days ? " · " + k.days + " days" : ""}</span> },
            { k: "r", label: "Reviewed", w: "0.8fr", render: k => <span className="dx-muted">{k.reviewed}</span> },
            { k: "w", label: "Weakest line at today's cost", w: "2.2fr", render: k => <span style={{ color: k.tone === "ok" ? "var(--ok)" : k.tone === "bad" ? "var(--bad)" : "var(--body)" }}>{k.worst}</span> },
          ]} />
        </Card>
      </div>
    </Page>
  );
}

/* ================= EXCEPTIONS ================= */
type ExRow = { kind: "quote" | "order"; id: string; cust: string; revenue: number; std: number; margin: number; rep: string; reason: string };
const ORDER_EX: [string, string][] = [
  ["SO-10515", "National 2026 contract · M10 bolts at 15.4%"],
  ["SO-10499", "National 2026 contract · M10 bolts at 15.4%"],
  ["SO-10503", "Doyle 2026 list · concrete screws at 20.1%"],
  ["SO-10474", "McGrath list · nyloc nuts at 15.5%"],
];
const QUOTE_ROWS: ExRow[] = QUOTES.filter(q => q.status === "Pending approval")
  .map(q => ({ kind: "quote" as const, id: q.id, cust: q.cust, revenue: q.value, std: q.target, margin: q.margin, rep: q.rep, reason: q.reason || "—" }));
const ORDER_ROWS: ExRow[] = ORDER_EX.map(([id, reason]) => { const o = order(id); return { kind: "order" as const, id, cust: o.cust, revenue: o.value, std: FLOOR, margin: o.margin, rep: o.am, reason }; });

function Exceptions() {
  const dx = useDx();
  const rows = [...QUOTE_ROWS, ...ORDER_ROWS];
  const focus = dx.rec.quote;
  const pendingVal = QUOTE_ROWS.reduce((a, r) => a + r.revenue, 0);
  const orderGap = ORDER_ROWS.reduce((a, r) => a + (r.revenue * (r.std - r.margin)) / 100, 0);
  const obrien = QUOTES.find(q => q.id === "QT-2841")!;
  const others = DISCOUNTS.filter(d => DA_PLAN[d.id]);
  const approval = (r: ExRow) => {
    if (r.kind === "order") return <span title="Contract and customer-specific prices skip the discount check"><Badge tone="bad">NOT ASKED</Badge></span>;
    const da = DISCOUNTS.find(d => d.ref === r.id);
    const done = da ? daDone(dx.acted, da.id) : undefined;
    return done ? <span title={done}><Badge tone="ok">{done.split(" ")[0].toUpperCase()}</Badge></span> : <Badge tone="warn">PENDING</Badge>;
  };
  return (
    <Page eyebrow="Pricing & Margin" title="Margin exceptions"
      sub={<>Quotes and orders priced below the {pct(FLOOR)} required margin. Quotes wait for Michael Doyle. Contract and customer-specific prices go straight through, and nobody is asked.</>}
      right={<Btn kind="quiet" onClick={() => dx.go("Pricing", "discounts")}>Discount approvals</Btn>}>
      <KpiRow n={4}>
        <Kpi label="Pending exceptions" value={String(QUOTE_ROWS.length)} sub={eur(pendingVal) + " of quotes"} subTone="warn" />
        <Kpi label="Annualised shortfall" value={eur(MARGIN_EXCEPTION_TOTAL)} tone="bad" sub="On the four pending quotes' repeat volume" />
        <Kpi label="Largest variance" value={pts(obrien.margin - obrien.target)} tone="bad" sub="O'Brien Facilities · QT-2841" onClick={() => dx.open("quote", "QT-2841")} />
        <Kpi label="Passed without approval" value={String(ORDER_ROWS.length) + " orders"} sub={eur(orderGap) + " below required margin this week"} subTone="bad" />
      </KpiRow>

      <Card title="Exceptions" sub="Click a quote for its line groups and approval, or an order for its lines" pad={false}>
        <Table rows={rows} onRow={r => (r.kind === "quote" ? dx.open("quote", r.id) : dx.go("Orders", "detail", { order: r.id }))}
          rowTone={r => (r.id === focus ? "accent" : r.margin - r.std <= -3 ? "bad" : "warn")} cols={[
            { k: "c", label: "Customer", w: "1.35fr", render: r => <RecLink kind="cust" id={r.cust} plain>{customer(r.cust).name}</RecLink> },
            { k: "id", label: "Order / Quote", w: "0.95fr", render: r => (r.kind === "quote" ? <RecLink kind="quote" id={r.id} /> : <RecLink kind="order" id={r.id} />) },
            { k: "rev", label: "Revenue", w: "0.85fr", align: "right", mono: true, render: r => eur(r.revenue) },
            { k: "std", label: "Standard margin", w: "1.1fr", align: "right", mono: true, render: r => pct(r.std) },
            { k: "m", label: "Proposed margin", w: "1.1fr", align: "right", mono: true, render: r => <span style={{ color: "var(--bad)", fontWeight: 600 }}>{pct(r.margin)}</span> },
            { k: "d", label: "Difference", w: "0.85fr", align: "right", mono: true, render: r => <span style={{ color: r.margin - r.std <= -3 ? "var(--bad)" : "var(--warn)" }}>{pts(r.margin - r.std)}</span> },
            { k: "rep", label: "Sales rep", w: "1fr", render: r => <span title={who(r.rep).role}>{who(r.rep).name}</span> },
            { k: "why", label: "Reason", w: "1.5fr", render: r => <span style={{ whiteSpace: "normal", lineHeight: 1.35, fontSize: 12.5, color: "var(--dim)" }}>{r.reason}</span> },
            { k: "ap", label: "Approval", w: "1.15fr", render: r => approval(r) },
          ]} />
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ flex: 1 }}>Total annualised shortfall on the four pending quotes: <b className="dx-num" style={{ color: "var(--bad)" }}>{eur(MARGIN_EXCEPTION_TOTAL)}</b></span>
          <span>{QUOTE_ROWS.map(r => r.id + " " + eur(QUOTES.find(q => q.id === r.id)!.annualGap || 0)).join(" · ")}</span>
        </div>
      </Card>

      <Grid cols="minmax(0,6fr) minmax(0,6fr)" style={{ marginTop: 14 }}>
        <AiCard agent="Margin Agent · decision due 11:00" title={"O'Brien Facilities · QT-2841 at " + pct(obrien.margin)}
          actions={<><DaActions d={DISCOUNTS.find(d => d.id === "DA-418")!} /><Btn small kind="quiet" onClick={() => dx.open("quote", "QT-2841")}>Open quote</Btn></>}>
          David Kelly priced {eur(obrien.value)} as a strategic deal ahead of a four-region rollout: {(obrien.target - obrien.margin).toFixed(1)} pts below target, {eur(Math.round((obrien.value * (obrien.target - obrien.margin)) / 100))} short on this order and {eur(obrien.annualGap || 0)} a year on repeat volume.
          <div style={{ marginTop: 10 }}>
            <b>Counter at 21.5%.</b> Keep the strategic discount on PPE, where O'Brien is comparing us with a national supplier. Restore list on fixings: the EuroFix increase on 1 Sep never reached O'Brien's 2025 contract, so M10 bolts are in this quote at 11.6%.
          </div>
        </AiCard>
        <Card title="The other three" sub="All waiting on Michael Doyle · the Margin Agent's view on each" pad={false}>
          <div className="dx-list">
            {others.map((d, i) => (
              <div key={d.id} className="dx-li" style={{ borderTop: i ? undefined : 0, flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", width: "100%" }}>
                  <RecLink kind="quote" id={d.ref} />
                  <RecLink kind="cust" id={d.cust} plain>{customer(d.cust).name}</RecLink>
                  <span className="dx-faint" style={{ fontSize: 12 }}>· {eur(d.value)} · {pct(d.margin)} · {pct(d.discount)} off, limit {pct(d.tierLimit, 0)} · {first(d.rep)}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.5 }}>{DA_PLAN[d.id].say}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><DaActions d={d} /></div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <div style={{ marginTop: 14 }}>
        <Note tone="warn">
          The four orders above never reached an approver: contract and customer-specific prices skip the discount check. They went out {eur(orderGap)} below the required margin between them. Fixing the agreements on <button className="dx-link" onClick={() => dx.go("Pricing", "lists")}>Price lists</button> stops the next ones.
        </Note>
      </div>
    </Page>
  );
}

/* ================= COST CHANGES ================= */
const statusTone = (s: string): Tone => (/^Passed/.test(s) ? "ok" : /Partly/.test(s) ? "warn" : "bad");
const changePct = (prev: number, now: number) => ((now - prev) / prev) * 100;

function Costs() {
  const dx = useDx();
  const fx = COST_CHANGES.find(c => c.sku === "FIX-2201")!;
  const p = product(fx.sku);
  const onHand = p.dub.onHand + p.nas.onHand;
  const open = COST_CHANGES.filter(c => !/^Passed/.test(c.status));
  const openImpact = open.reduce((a, c) => a + c.impact, 0);
  const passLeak = LEAKAGE.find(l => /cost increases/.test(l[0]))![1];
  const bySupplier = Object.entries(open.reduce((m, c) => ({ ...m, [c.supplier]: (m[c.supplier] || 0) + c.impact }), {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);
  const affected = PRICE_ROWS.filter(r => r.sku === fx.sku);
  return (
    <Page eyebrow="Pricing & Margin" title="Cost change watch"
      sub={<>Supplier price file imported 08:22: <b style={{ color: "var(--ink)" }}>428 changes identified</b>. The Margin Agent matched them to every customer price, quote and open order they touch.</>}
      right={<Btn kind="quiet" onClick={() => dx.go("Pricing", "lists")}>Price lists</Btn>}>
      <KpiRow n={4}>
        <Kpi label="Price changes imported" value="428" sub="Supplier feeds · 08:22 today" />
        <Kpi label="Not passed through" value={eur(passLeak) + " / mo"} tone="bad" sub={eur(passLeak * 12) + " a year"} />
        <Kpi label="Largest single line" value={eur(fx.impact) + " / mo"} sub={p.name + " · " + supplier(fx.supplier).name} subTone="bad" onClick={() => dx.open("sku", fx.sku)} />
        <Kpi label="Customers on old M10 pricing" value={String(fx.customers)} sub={num(fx.volume) + " boxes a month"} subTone="warn" />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card tone="bad" title={<><RecLink kind="supplier" id={fx.supplier} plain>{supplier(fx.supplier).name}</RecLink> · {p.name}</>}
            sub={"Effective " + fx.effective + " · matched to customer pricing at 08:58 · " + fx.status} right={<Badge tone="bad">+{pct(changePct(fx.prev, fx.now))}</Badge>}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <span className="dx-num" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.8px" }}>{eur(fx.prev, 2)} <span className="dx-faint" style={{ fontWeight: 400 }}>→</span> {eur(fx.now, 2)}</span>
              <span style={{ fontSize: 13, color: "var(--dim)" }}>cost per box of 100, <RecLink kind="sku" id={fx.sku} /></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginTop: 14 }}>
              <div className="dx-fact"><div className="dx-fact-k">Customers on old pricing</div><div className="dx-fact-v">{fx.customers}</div></div>
              <div className="dx-fact"><div className="dx-fact-k">Monthly volume</div><div className="dx-fact-v dx-num">{num(fx.volume)} boxes</div></div>
              <div className="dx-fact"><div className="dx-fact-k">Margin impact</div><div className="dx-fact-v dx-num" style={{ color: "var(--bad)" }}>{eur(fx.impact)} / month</div></div>
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--faint)" }}>Lowest-margin agreements on this line</div>
            <div className="dx-list" style={{ margin: "6px -20px 0" }}>
              {affected.map(r => (
                <div key={r.cust} className="dx-li dx-click" onClick={() => dx.go("Customers", "detail", { cust: r.cust })} style={{ alignItems: "center", padding: "9px 20px" }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.45 }}>
                    <div>{customer(r.cust).name} <span className="dx-faint">· {r.type} · {eur(r.price, 2)}</span></div>
                    <div className="dx-faint" style={{ fontSize: 12 }}>{r.flag}</div>
                  </div>
                  <span className="dx-num" style={{ fontWeight: 600, color: r.margin < r.target ? "var(--bad)" : "var(--warn)", width: 52, textAlign: "right" }}>{pct(r.margin)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <ActBtn id="cost-FIX-2201" kind="primary" label="Review affected pricing" done="37 agreements queued for review"
                toast="37 customer agreements on FIX-2201 queued for Michael Doyle's review, with new prices proposed at the 24% required margin. Due 2 Oct." />
              <Btn onClick={() => dx.open("sku", fx.sku)}>Open FIX-2201</Btn>
            </div>
          </Card>
          <AiCard agent="Margin Agent · 08:58" title="Pass it through in two moves">
            Of the {fx.customers} agreements on the old cost, {fx.customers - 3} are Tier and Standard prices: move them with 30 days' notice, no approval needed. The three contract accounts need a conversation.
            O'Brien's renewal on 31 Oct is the natural point, Leinster's National contract has a cost review clause, and Murphy is still above 24%, so it can wait for its February review.
          </AiCard>
        </div>

        <Card title="What one supplier price change touches" sub="EuroFix M10 bolts, followed through the business">
          <Chain steps={[
            { k: "Supplier price increase", v: supplier(fx.supplier).name + " · +" + pct(changePct(fx.prev, fx.now)) + " from " + fx.effective, sub: "Confirmed in today's 08:22 price file, one of 428 changes", tone: "bad", icon: IC.factory, onClick: () => dx.open("supplier", fx.supplier) },
            { k: "Product cost", v: fx.sku + " · " + eur(fx.prev, 2) + " → " + eur(fx.now, 2), sub: "Updated in Sage 200 on import", icon: IC.euro, onClick: () => dx.open("sku", fx.sku) },
            { k: "Inventory", v: num(onHand) + " boxes on hand · " + eur(onHand * p.cost) + " at new cost", sub: <>{p.dub.onHand} Dublin, {p.nas.onHand} Naas · {num(p.incoming)} more on <RecLink kind="po" id={p.po || "PO-8830"} /> today</>, icon: IC.box, onClick: () => dx.open("sku", fx.sku) },
            { k: "Customer price lists", v: fx.customers + " agreements still on the old cost", sub: "O'Brien 13.4% · Leinster 15.4% · Murphy 24.3% (was 31.4%)", tone: "warn", icon: IC.doc, onClick: () => dx.go("Pricing", "lists") },
            { k: "Quotes", v: <>1 pending: <RecLink kind="quote" id="QT-2841" /> · O'Brien</>, sub: "Fixings group at 11.6% inside a 17.2% quote", tone: "warn", icon: IC.doc, onClick: () => dx.open("quote", "QT-2841") },
            { k: "Open orders", v: <><RecLink kind="order" id="SO-10482" /> · 60 boxes at {eur(SO10482_LINES.find(l => l.sku === fx.sku)!.price, 2)}</>, sub: <>Murphy Building Supplies · <RecLink kind="order" id="SO-10474" /> (McGrath) also carries M10 bolts</>, icon: IC.cart, onClick: () => dx.go("Orders", "detail", { order: "SO-10482" }) },
            { k: "Margin", v: eur(fx.impact) + " a month on this line", sub: eur(passLeak) + " a month across all increases not passed through", tone: "bad", icon: IC.spark, onClick: () => dx.go("Pricing", "margin") },
            { k: "Account managers", v: "David Kelly, Michael Doyle, Sarah Byrne", sub: "Own the three contract accounts · review task due 2 Oct", icon: IC.user, onClick: () => dx.go("Work", "tasks") },
          ]} />
        </Card>
      </Grid>

      <Card title="All supplier cost changes" sub={"The " + COST_CHANGES.length + " lines with the largest margin impact · " + eur(openImpact) + " of the " + eur(passLeak) + " monthly leak is on these lines"} pad={false} style={{ marginTop: 14 }}>
        <Table rows={COST_CHANGES} onRow={c => dx.open("sku", c.sku)} rowTone={c => (c.sku === fx.sku ? "bad" : /^Passed/.test(c.status) ? undefined : "warn")} cols={[
          { k: "sku", label: "Product · supplier", w: "2.6fr", render: c => (
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
              <span style={{ display: "flex", gap: 7, minWidth: 0 }}><RecLink kind="sku" id={c.sku} /><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{product(c.sku).name}</span></span>
              <span className="dx-faint" style={{ fontSize: 11.5 }}><RecLink kind="supplier" id={c.supplier} plain>{supplier(c.supplier).name}</RecLink> · effective {c.effective}</span>
            </span>) },
          { k: "p", label: "Was", w: "0.8fr", align: "right", mono: true, render: c => eur(c.prev, 2) },
          { k: "n", label: "Now", w: "0.8fr", align: "right", mono: true, render: c => eur(c.now, 2) },
          { k: "ch", label: "Change", w: "0.8fr", align: "right", mono: true, render: c => <span style={{ color: "var(--bad)" }}>+{pct(changePct(c.prev, c.now))}</span> },
          { k: "cu", label: "Customers", w: "0.9fr", align: "right", mono: true, render: c => String(c.customers) },
          { k: "v", label: "Volume / mo", w: "0.95fr", align: "right", mono: true, render: c => num(c.volume) },
          { k: "i", label: "Impact / mo", w: "0.95fr", align: "right", mono: true, render: c => <b style={{ fontWeight: 600, color: /^Passed/.test(c.status) ? "var(--dim)" : "var(--bad)" }}>{eur(c.impact)}</b> },
          { k: "st", label: "Status", w: "1.3fr", render: c => <span title={c.status}><Badge tone={statusTone(c.status)}>{c.status.replace(" through", "")}</Badge></span> },
        ]} />
      </Card>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <Card title="Unpassed impact by supplier" sub="Margin lost each month on the lines above until customer prices move">
          <HBars fmt={n => eur(n)} tone="bad" items={bySupplier.map(([s, v]) => ({ label: supplier(s).name, value: v, note: open.filter(c => c.supplier === s).length + (open.filter(c => c.supplier === s).length === 1 ? " line" : " lines") }))}
            onClick={i => dx.open("supplier", bySupplier[i][0])} />
        </Card>
        <Card title="What good looks like" sub="The one Atlas line that was passed through">
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--body)" }}>
            Cable ties (<RecLink kind="sku" id="IC-2290" />) went up 7.6% on 15 Aug and were repriced across 52 customers on 12 Sep: four weeks from price file to customer. EuroFix's increase on 1 Sep is 24 days old and still on old pricing for {fx.customers} customers.
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

/* ================= DISCOUNT APPROVALS ================= */
/* Decided discount requests this fortnight: the two in the database plus the rest of the log. */
const LOG: { id: string; cust: string; ref: string; value: number; discount: number; limit: number; margin: number; by: string; when: string; note: string }[] = [
  { id: "DA-417", cust: "kildare", ref: "SO-10511", value: 4190, discount: 5.0, limit: 6, margin: 25.3, by: "auto", when: "24 Sep", note: "Within tier" },
  { id: "DA-416", cust: "core", ref: "SO-10502", value: 6310, discount: 4.0, limit: 8, margin: 28.9, by: "auto", when: "24 Sep", note: "Within tier" },
  { id: "DA-414", cust: "core", ref: "SO-10478", value: 11880, discount: 9.0, limit: 8, margin: 28.4, by: "michael", when: "23 Sep", note: "Multi-site volume across three sites" },
  { id: "DA-413", cust: "midland", ref: "SO-10524", value: 3380, discount: 7.0, limit: 6, margin: 26.3, by: "none", when: "24 Sep", note: "Entered by Mark Ryan at order entry, over the 6% tier" },
  { id: "DA-411", cust: "horizon", ref: "QT-2854", value: 15260, discount: 7.0, limit: 8, margin: 25.1, by: "sarah", when: "20 Sep", note: "Within tier · quote won" },
  { id: "DA-410", cust: "westbrook", ref: "SO-10491", value: 8420, discount: 9.5, limit: 8, margin: 26.8, by: "michael", when: "24 Sep", note: "Three-branch volume" },
  { id: "DA-409", cust: "tallaght", ref: "Counter sale", value: 1480, discount: 17.3, limit: 6, margin: 13.5, by: "none", when: "21 Sep", note: "EL-5530 counter override, no reason code" },
];
const BEYOND = { total: 64, michael: 38, sarah: 17, none: 9 };
const AUTHORITY: [string, string][] = [
  ["Inside sales and trade counter", "Up to the customer's tier limit"], ["Account manager", "Up to the tier limit, 6–8%"],
  ["Senior account manager", "Up to 10%"], ["Commercial director", "Up to 15%"], ["Managing director", "Above 15%"],
];

function Discounts() {
  const dx = useDx();
  const pending = DISCOUNTS.filter(d => /^Pending/.test(d.status));
  const decidedDb = DISCOUNTS.filter(d => !/^Pending/.test(d.status)).map(d => ({
    id: d.id, cust: d.cust, ref: d.ref, value: d.value, discount: d.discount, limit: d.tierLimit, margin: d.margin,
    by: /Auto/.test(d.status) ? "auto" : /Sarah/.test(d.status) ? "sarah" : "michael", when: d.raised, note: d.reason + (d.rep === "sarah" && /Sarah/.test(d.status) ? " · approved her own quote" : ""),
  }));
  const log = [...decidedDb, ...LOG].sort((a, b) => b.id.localeCompare(a.id));
  const pendingVal = pending.reduce((a, d) => a + d.value, 0);
  const leak = LEAKAGE.find(l => /discount/i.test(l[0]))![1];
  const byTxt = (b: string) => (b === "auto" ? "Auto-approved" : b === "none" ? "No approval recorded" : who(b).name);
  return (
    <Page eyebrow="Pricing & Margin" title="Discount approvals"
      sub={<>Every discount beyond a customer's tier, who asked for it and who approved it. {BEYOND.total} orders went beyond tier this month; {BEYOND.none} of them have no approver on record.</>}
      right={<Btn kind="quiet" onClick={() => dx.go("Pricing", "exceptions")}>Margin exceptions</Btn>}>
      <KpiRow n={4}>
        <Kpi label="Waiting on Michael Doyle" value={String(pending.length)} sub={eur(pendingVal) + " of quotes"} subTone="warn" />
        <Kpi label="Beyond tier this month" value={String(BEYOND.total) + " orders"} sub="Discount above the customer's tier limit" />
        <Kpi label="Margin given away" value={eur(leak)} tone="bad" sub={"This month · " + eur(leak * 12) + " a year"} />
        <Kpi label="No approval recorded" value={BEYOND.none + " of " + BEYOND.total} tone="bad" sub="Entered at order entry or the counter" />
      </KpiRow>

      <Card title="Waiting for a decision" sub="Discount against the tier limit, the margin it leaves and the Margin Agent's recommendation" pad={false}>
        <div className="dx-list">
          {pending.map((d, i) => {
            const over = d.discount - d.tierLimit;
            return (
              <div key={d.id} className="dx-li" style={{ borderTop: i ? undefined : 0, alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: "2 1 260px", minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className="dx-num" style={{ fontWeight: 600 }}>{d.id}</span>
                    <RecLink kind="cust" id={d.cust} plain>{customer(d.cust).name}</RecLink>
                    <RefLink id={d.ref} />
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3 }}>{d.reason} · {who(d.rep).name} · raised {d.raised} · {eur(d.value)}</div>
                </div>
                <div style={{ flex: "1 1 170px", minWidth: 150 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span><b className="dx-num" style={{ color: "var(--bad)" }}>{pct(d.discount)}</b> <span className="dx-faint">off</span></span>
                    <span className="dx-faint dx-num">limit {pct(d.tierLimit, 0)} · {pts(over)}</span>
                  </div>
                  <div style={{ marginTop: 6 }}><Meter value={d.discount} max={15} tone={over > 3 ? "bad" : "warn"} /></div>
                </div>
                <div style={{ width: 86, textAlign: "right", flex: "none" }}>
                  <div className="dx-num" style={{ fontWeight: 600, color: d.margin < FLOOR ? "var(--bad)" : undefined }}>{pct(d.margin)}</div>
                  <div className="dx-faint" style={{ fontSize: 11.5 }}>margin</div>
                </div>
                <div style={{ flex: "none", display: "flex", gap: 8, justifyContent: "flex-end", minWidth: 250 }}><DaActions d={d} /></div>
                <div style={{ flexBasis: "100%", fontSize: 12.5, color: "var(--accent)", lineHeight: 1.5 }}>
                  Pulse says: {d.id === "DA-418" ? "Counter at 21.5%. Hold the strategic discount on PPE, restore list on fixings (EuroFix cost up 10.4%)." : DA_PLAN[d.id]?.say}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Who approved what" sub="Decided discount requests, last 14 days · answers 'who approved that discount?'" pad={false} style={{ marginTop: 14 }}>
        <Table rows={log} rowTone={l => (l.by === "none" ? "bad" : l.discount > l.limit ? "warn" : undefined)} cols={[
          { k: "id", label: "Request", w: "0.8fr", render: l => <span className="dx-num">{l.id}</span> },
          { k: "c", label: "Customer", w: "1.6fr", render: l => <RecLink kind="cust" id={l.cust} plain>{customer(l.cust).name}</RecLink> },
          { k: "r", label: "Ref", w: "0.95fr", render: l => <RefLink id={l.ref} /> },
          { k: "d", label: "Discount / limit", w: "1.05fr", align: "right", mono: true, render: l => <span style={{ color: l.discount > l.limit ? "var(--bad)" : undefined }}>{pct(l.discount)} / {pct(l.limit, 0)}</span> },
          { k: "m", label: "Margin", w: "0.7fr", align: "right", mono: true, render: l => <span style={{ color: l.margin < FLOOR ? "var(--bad)" : undefined }}>{pct(l.margin)}</span> },
          { k: "by", label: "Approved by", w: "1.4fr", render: l => (l.by === "auto" || l.by === "none" ? <Badge tone={l.by === "none" ? "bad" : "neutral"}>{l.by === "none" ? "No approval" : "Auto-approved"}</Badge> : <Person id={l.by} />) },
          { k: "w", label: "Decided", w: "0.7fr", render: l => <span className="dx-muted">{l.when}</span> },
          { k: "n", label: "Note", w: "2fr", render: l => <span style={{ whiteSpace: "normal", lineHeight: 1.35, fontSize: 12.5, color: "var(--dim)" }}>{l.note}</span> },
        ]} />
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)" }}>
          {log.filter(l => l.by === "none").length} of these have no approver on record: {log.filter(l => l.by === "none").map(l => l.id + " (" + customer(l.cust).name + ", " + pct(l.discount) + " against a " + pct(l.limit, 0) + " limit)").join(" and ")}.
        </div>
      </Card>

      <Grid cols="repeat(2,minmax(0,1fr))" style={{ marginTop: 14 }}>
          <Card title="Beyond-tier discounts this month" sub={BEYOND.total + " orders · " + eur(leak) + " of margin"}>
            <Strip fmt={n => String(n)} parts={[
              { label: "Michael Doyle", value: BEYOND.michael, tone: "accent" },
              { label: "Sarah Byrne", value: BEYOND.sarah, tone: "var(--chart-muted)" },
              { label: "No approval", value: BEYOND.none, tone: "bad" },
            ]} />
            <div style={{ marginTop: 12 }}>
              <Note tone="bad">The {BEYOND.none} with no approver are counter overrides and order-entry discounts. Tallaght's EL-5530 at 13.5% is the worst.</Note>
            </div>
          </Card>
          <Card title="Approval authority" sub="Set in Governance" pad={false}>
            <div className="dx-list">
              {AUTHORITY.map(([k, v], i) => (
                <div key={k} className="dx-li" style={{ borderTop: i ? undefined : 0, padding: "9px 20px", fontSize: 13 }}>
                  <span style={{ flex: 1 }}>{k}</span><span className="dx-muted">{v}</span>
                </div>
              ))}
            </div>
          </Card>
      </Grid>
    </Page>
  );
}

/* ================= PRODUCT PROFITABILITY ================= */
const gmroi = (r: { gp: number; invValue: number }) => r.gp / r.invValue;
const trendTone = (t: string) => (t.startsWith("+") ? "var(--ok)" : t.startsWith("−") ? "var(--bad)" : "var(--dim)");
const PROFIT_ORDERS = ["SO-10482", "SO-10503", "SO-10478", "SO-10499", "SO-10491", "SO-10474", "SO-10507", "SO-10520", "SO-10535"];

function Profit() {
  const dx = useDx();
  const [sort, setSort] = useLocal("profit-sort", "rev");
  const key = (r: (typeof PRODUCT_PROFIT)[number]) => (sort === "gp" ? r.gp : sort === "margin" ? r.margin : sort === "gmroi" ? gmroi(r) : r.revenue);
  const rows = [...PRODUCT_PROFIT].sort((a, b) => key(b) - key(a));
  const byRev = [...PRODUCT_PROFIT].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const byGp = [...PRODUCT_PROFIT].sort((a, b) => b.gp - a.gp).slice(0, 8);
  const byRoi = [...PRODUCT_PROFIT].sort((a, b) => gmroi(b) - gmroi(a));
  const gpOrder = [...PRODUCT_PROFIT].sort((a, b) => b.gp - a.gp).map(r => r.sku);
  const gpRank = (sku: string) => gpOrder.indexOf(sku) + 1;
  const el = PRODUCT_PROFIT.find(r => r.sku === "EL-2210")!, saf = PRODUCT_PROFIT.find(r => r.sku === "SAF-3310")!;
  const dead = PRODUCT_PROFIT.filter(r => r.sku === "TL-3321" || r.sku === "EL-6120");
  const deadStock = dead.reduce((a, r) => a + r.invValue, 0), deadGp = dead.reduce((a, r) => a + r.gp, 0);
  const totRev = PRODUCT_PROFIT.reduce((a, r) => a + r.revenue, 0), totGp = PRODUCT_PROFIT.reduce((a, r) => a + r.gp, 0);
  const lbl = (sku: string) => <span><span className="dx-num" style={{ color: "var(--ink)" }}>{sku}</span> <span className="dx-faint">{product(sku).name}</span></span>;
  const tl = SLOW_LINES.find(s => s.sku === "TL-3321")!, tray = SLOW_LINES.find(s => s.sku === "EL-6120")!;
  const so = order("SO-10482");
  const split = { delivery: SO10482_PROFIT.deliveryCost + SO10482_PROFIT.splitExtra, gp: SO10482_PROFIT.gp - SO10482_PROFIT.splitExtra };
  const shortVal = SO10482_LINES.filter(l => l.status === "Short").reduce((a, l) => a + l.qty * l.price, 0);
  return (
    <Page eyebrow="Pricing & Margin" title="Product profitability"
      sub="Revenue says what sells. Gross profit, and gross profit for every euro of stock it takes, say what pays. Last 12 months, top lines by revenue plus the two that tie up the most stock."
      right={<Btn kind="quiet" onClick={() => dx.go("Inventory", "slow")}>Slow & dead stock</Btn>}>
      <KpiRow n={4}>
        <Kpi label="Biggest line by revenue" value={eur(el.revenue)} sub={el.sku + " · " + pct(el.margin) + " margin"} subTone="warn" onClick={() => dx.open("sku", el.sku)} />
        <Kpi label="Biggest line by gross profit" value={eur(byGp[0].gp)} sub={byGp[0].sku + " · " + pct(byGp[0].margin) + " margin"} subTone="ok" onClick={() => dx.open("sku", byGp[0].sku)} />
        <Kpi label="Best GP per € of stock" value={eur(gmroi(saf), 2)} sub={saf.sku + " · turns " + saf.turn + " times a year"} subTone="ok" onClick={() => dx.open("sku", saf.sku)} />
        <Kpi label="Stock earning almost nothing" value={eur(deadStock)} tone="bad" sub={eur(deadGp) + " GP in 12 months · TL-3321, EL-6120"} onClick={() => dx.go("Inventory", "slow")} />
      </KpiRow>

      <Grid cols="repeat(2,minmax(0,1fr))">
        <Card title="Ranked by revenue" sub="12 months · the top eight lines">
          <HBars fmt={n => eurK(n)} items={byRev.map(r => ({ label: lbl(r.sku), value: r.revenue, note: "#" + gpRank(r.sku) + " by GP" }))} onClick={i => dx.open("sku", byRev[i].sku)} />
        </Card>
        <Card title="Ranked by gross profit" sub="12 months · the top eight lines">
          <HBars fmt={n => eurK(n)} tone="ok" items={byGp.map(r => ({ label: lbl(r.sku), value: r.gp, note: pct(r.margin) }))} onClick={i => dx.open("sku", byGp[i].sku)} />
        </Card>
      </Grid>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" style={{ marginTop: 14 }}>
        <AiCard agent="Margin Agent" title="High revenue is not the same as profitable"
          actions={<>
            <ActBtn id="ret-TL-3321" kind="primary" small label="Raise supplier return" done="Return raised with Toolcraft"
              toast={"Supplier return raised with Toolcraft Europe for " + tl.qty + " × TL-3321 (superseded 2023 model) at 15% restocking. Releases " + eur(tl.release) + "."} />
            <ActBtn id="offer-EL-6120" small label="Offer tray to Horizon and Liffey" done="Offers drafted"
              toast={"Cable tray offers drafted for Horizon Electrical and Liffey M&E: EL-6120, " + tray.qty + " lengths. Releases up to " + eur(tray.release) + "."} />
            <Btn small kind="quiet" onClick={() => dx.go("Inventory", "slow")}>Slow & dead stock</Btn>
          </>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div><RecLink kind="sku" id={el.sku} /> is the biggest line by revenue ({eur(el.revenue)}) but earns {pct(el.margin)}: {eur(el.gp)} of gross profit on {eur(el.invValue)} of stock.
              {" "}<RecLink kind="sku" id={saf.sku} /> turns over less than half the revenue ({eur(saf.revenue)}) and makes {eur(saf.gp)} at {pct(saf.margin)} on {eur(saf.invValue)} of stock: <b>{eur(gmroi(saf), 2)}</b> of gross profit for every euro on the shelf, against {eur(gmroi(el), 2)}.</div>
            <div><RecLink kind="sku" id="TL-3321" /> and <RecLink kind="sku" id="EL-6120" /> tie up <b>{eur(deadStock)}</b> of stock and made {eur(deadGp)} in 12 months (turn {dead.map(r => r.turn).join(" and ")}). Return the superseded drivers to Toolcraft and offer the tray to the two customers who bought it in 2025.</div>
          </div>
        </AiCard>
        <Card title="Gross profit per € of stock" sub="12-month GP ÷ stock value today">
          <HBars fmt={n => eur(n, 2)} items={byRoi.map(r => ({ label: r.sku, value: gmroi(r), tone: gmroi(r) < 0.1 ? "bad" : "accent" }))} onClick={i => dx.open("sku", byRoi[i].sku)} />
        </Card>
      </Grid>

      <Card title="Product profitability" sub={"12 months · these " + PRODUCT_PROFIT.length + " lines: " + eur(totRev) + " revenue, " + eur(totGp) + " gross profit"} pad={false} style={{ marginTop: 14 }}
        right={<Seg value={sort} onChange={setSort} items={[["rev", "By revenue"], ["gp", "By gross profit"], ["margin", "By margin"], ["gmroi", "GP per € stock"]]} />}>
        <Table rows={rows} onRow={r => dx.open("sku", r.sku)} rowTone={r => (r.turn < 0.1 ? "bad" : r.margin < 25 ? "warn" : undefined)} cols={[
          { k: "p", label: "Product", w: "2.3fr", render: r => (
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 1 }}>
              <span style={{ display: "flex", gap: 7, minWidth: 0 }}><RecLink kind="sku" id={r.sku} /><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{product(r.sku).name}</span></span>
              <span className="dx-faint" style={{ fontSize: 11.5 }}>{supplier(product(r.sku).supplier).name}</span>
            </span>) },
          { k: "rev", label: "Revenue", w: "0.95fr", align: "right", mono: true, render: r => eur(r.revenue) },
          { k: "u", label: "Units", w: "0.7fr", align: "right", mono: true, render: r => num(r.units) },
          { k: "c", label: "Cost", w: "0.95fr", align: "right", mono: true, render: r => eur(r.cost) },
          { k: "gp", label: "Gross profit", w: "0.95fr", align: "right", mono: true, render: r => <b style={{ fontWeight: 600 }}>{eur(r.gp)}</b> },
          { k: "m", label: "Margin", w: "0.7fr", align: "right", mono: true, render: r => <span style={{ color: r.margin < 25 ? "var(--warn)" : "var(--ok)" }}>{pct(r.margin)}</span> },
          { k: "inv", label: "Inventory value", w: "1.05fr", align: "right", mono: true, render: r => eur(r.invValue) },
          { k: "t", label: "Turn", w: "0.6fr", align: "right", mono: true, render: r => <span style={{ color: r.turn < 1 ? "var(--bad)" : undefined, fontWeight: r.turn < 1 ? 600 : 400 }}>{r.turn}</span> },
          { k: "ret", label: "Returns", w: "0.7fr", align: "right", mono: true, render: r => <span style={{ color: r.returns >= 5 ? "var(--warn)" : undefined }}>{r.returns}</span> },
          { k: "tr", label: "Trend", w: "0.7fr", align: "right", mono: true, render: r => <span style={{ color: trendTone(r.trend) }}>{r.trend}</span> },
        ]} />
      </Card>

      <div className="dx-section">
        <div className="dx-section-head"><div className="dx-section-title">Order profitability</div><span className="dx-faint" style={{ fontSize: 12.5 }}>Revenue against the profit left after product, delivery and discount</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card pad={false}>
            <Table rows={PROFIT_ORDERS.map(id => ({ o: order(id), p: orderProfit(order(id)) }))} onRow={r => dx.go("Orders", "detail", { order: r.o.id })}
              rowTone={r => (r.o.id === "SO-10482" ? "accent" : r.p.margin < FLOOR ? "warn" : undefined)} cols={[
                { k: "id", label: "Order", w: "0.85fr", render: r => <RecLink kind="order" id={r.o.id} /> },
                { k: "c", label: "Customer", w: "1.6fr", render: r => <RecLink kind="cust" id={r.o.cust} plain>{customer(r.o.cust).name}</RecLink> },
                { k: "rev", label: "Revenue", w: "0.85fr", align: "right", mono: true, render: r => eur(r.p.revenue) },
                { k: "pc", label: "Product cost", w: "0.9fr", align: "right", mono: true, render: r => eur(r.p.productCost) },
                { k: "dc", label: "Delivery", w: "0.9fr", align: "right", mono: true, render: r => <span>{eur(r.p.deliveryCost)} <span className="dx-faint">{pct((r.p.deliveryCost / r.p.revenue) * 100)}</span></span> },
                { k: "dis", label: "Discount", w: "0.7fr", align: "right", mono: true, render: r => <span className="dx-muted">{eur(r.p.discount)}</span> },
                { k: "gp", label: "Est. GP", w: "0.8fr", align: "right", mono: true, render: r => <b style={{ fontWeight: 600 }}>{eur(r.p.gp)}</b> },
                { k: "m", label: "Margin", w: "0.65fr", align: "right", mono: true, render: r => <span style={{ color: r.p.margin < FLOOR ? "var(--warn)" : "var(--ok)" }}>{pct(r.p.margin)}</span> },
              ]} />
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)" }}>
              Small drops cost the most to deliver: SO-10535 spends {pct((orderProfit(order("SO-10535")).deliveryCost / order("SO-10535").value) * 100)} of its revenue on the van, SO-10482 spends {pct((SO10482_PROFIT.deliveryCost / SO10482_PROFIT.revenue) * 100)}.
            </div>
          </Card>
          <Card tone="accent" title={<><RecLink kind="order" id="SO-10482" /> · Murphy Building Supplies · split or wait</>} sub={so.lines + " lines · " + so.short + " short on PO-8821 · route " + so.route + " · required " + so.required}
            right={<Btn small onClick={() => dx.go("Orders", "detail", { order: "SO-10482" })}>Open SO-10482</Btn>}>
            <Grid cols="minmax(0,1fr) minmax(0,1fr)" gap={22}>
              <div>
                <div className="dx-faint" style={{ fontSize: 11.5, marginBottom: 8 }}>Where the {eur(SO10482_PROFIT.revenue)} goes</div>
                <Strip fmt={n => eur(n)} parts={[
                  { label: "Product cost", value: SO10482_PROFIT.productCost, tone: "var(--chart-muted)" },
                  { label: "Delivery", value: SO10482_PROFIT.deliveryCost, tone: "warn" },
                  { label: "Gross profit", value: SO10482_PROFIT.gp, tone: "ok" },
                ]} />
                <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 10, lineHeight: 1.5 }}>Revenue is after {eur(SO10482_PROFIT.discount)} of contract discount. Profitable revenue, after product and delivery: {eur(SO10482_PROFIT.gp)}.</div>
              </div>
              <div>
                <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  <Table dense rows={[
                    { k: "One delivery", d: SO10482_PROFIT.deliveryCost, gp: SO10482_PROFIT.gp, m: SO10482_PROFIT.margin },
                    { k: "Split shipment", d: split.delivery, gp: split.gp, m: (split.gp / SO10482_PROFIT.revenue) * 100 },
                  ]} cols={[
                    { k: "k", label: "Option", w: "1.3fr" },
                    { k: "d", label: "Delivery", w: "0.9fr", align: "right", mono: true, render: r => eur(r.d) },
                    { k: "gp", label: "Est. GP", w: "0.9fr", align: "right", mono: true, render: r => eur(r.gp) },
                    { k: "m", label: "Margin", w: "0.8fr", align: "right", mono: true, render: r => pct(r.m) },
                  ]} />
                </div>
                <div style={{ fontSize: 13, color: "var(--body)", marginTop: 12, lineHeight: 1.55 }}>
                  Splitting adds <b>{eur(SO10482_PROFIT.splitExtra)}</b> of delivery cost: 15 lines ({eur(SO10482_PROFIT.revenue - shortVal)}) go on D14 today, the 3 short lines ({eur(shortVal)}) follow after PO-8821 lands. The order still clears the {pct(FLOOR)} required margin.
                </div>
              </div>
            </Grid>
          </Card>
        </div>
      </div>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = {
  margin: MarginControl,
  lists: PriceLists,
  exceptions: Exceptions,
  costs: Costs,
  discounts: Discounts,
  profit: Profit,
};
