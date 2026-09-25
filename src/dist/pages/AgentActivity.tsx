/* Agent activity: the eight agents, what each one watches, and everything they did between 06:00 and 09:16.
   The six agent entries in ACTIVITY (db.ts) are the spine; the other entries are local and only reference
   records that exist in db.ts. Every entry says what was found, what was done or proposed, and who decides. */
import type { ComponentType, ReactNode } from "react";
import { ACTIVITY, COMPANY, CUSTOMERS, KPI, ORDERS, POS, PRODUCTS, QUOTES, ROUTES, SYSTEMS, TODAY, who } from "../db";
import { RAIL_ICONS } from "../modules";
import { ActBtn, Avatar, Badge, Btn, Card, Grid, IC, Icon, INK, Kpi, KpiRow, Page, Person, RecLink, Seg, useDx, useLocal, type Tone } from "../ui";

type AgentName = "Briefing Agent" | "Ops Watchdog" | "Inventory Agent" | "Purchasing Agent" | "Margin Agent" | "Customer Agent" | "Dispatch Agent" | "Credit Agent";
type Agent = { name: AgentName; short: string; icon: string; role: string; watches: string[]; scope: string; cadence: string; owners: string[]; ownerLabel?: string };

const AGENTS: Agent[] = [
  { name: "Briefing Agent", short: "Briefing", icon: IC.doc, role: "Morning and evening briefs. Reads the whole business.",
    watches: ["What the other seven agents found", "Orders, stock, deliveries, margin and cash"], scope: SYSTEMS.length + " connected systems", cadence: "Evening brief 17:30", owners: ["patrick"] },
  { name: "Ops Watchdog", short: "Ops Watchdog", icon: RAIL_ICONS.warehouse, role: "Finds what will stop an order leaving on time.",
    watches: ["Late orders", "Warehouse bottlenecks", "Fulfilment risk", "Dispatch issues", "Stock problems"], scope: KPI.openOrders + " open orders · " + KPI.ordersToday + " to dispatch today", cadence: "Every 5 min", owners: ["liam"] },
  { name: "Inventory Agent", short: "Inventory", icon: RAIL_ICONS.inventory, role: "Sees stock problems before they reach an order.",
    watches: ["Stockout predictions", "Excess stock", "Reorder recommendations", "Warehouse balancing", "Slow stock"], scope: COMPANY.skus.toLocaleString("en-IE") + " SKUs in 2 warehouses", cadence: "Every 15 min", owners: ["liam", "emma"] },
  { name: "Purchasing Agent", short: "Purchasing", icon: RAIL_ICONS.purchasing, role: "Follows every PO from order to goods in.",
    watches: ["Supplier POs", "Delays", "Purchase recommendations", "Supplier performance", "Incoming stock"], scope: KPI.openPOs + " open POs · " + COMPANY.suppliers + " suppliers", cadence: "Every 15 min", owners: ["emma", "ciaran"] },
  { name: "Margin Agent", short: "Margin", icon: RAIL_ICONS.pricing, role: "Catches margin leaking out through prices, costs and discounts.",
    watches: ["Pricing leakage", "Cost increases", "Discounts", "Low-margin orders", "Price exceptions"], scope: "Pricing on " + COMPANY.accounts + " accounts · 428 cost changes today", cadence: "On every price file and quote", owners: ["michael"] },
  { name: "Customer Agent", short: "Customer", icon: RAIL_ICONS.customers, role: "Notices when an account changes how it buys.",
    watches: ["Account health", "Declining spend", "Opportunities", "Service problems", "Buying patterns"], scope: COMPANY.accounts + " active accounts", cadence: "Hourly", owners: ["sarah", "david", "mark"], ownerLabel: "The account manager" },
  { name: "Dispatch Agent", short: "Dispatch", icon: RAIL_ICONS.delivery, role: "Checks every route, load and ETA against the plan.",
    watches: ["Delivery risk", "Routes", "Sequencing", "Late deliveries", "OTIF"], scope: KPI.deliveriesToday + " deliveries · " + COMPANY.vehicles + " vehicles", cadence: "Every 5 min", owners: ["orla"] },
  { name: "Credit Agent", short: "Credit", icon: RAIL_ICONS.finance, role: "Watches exposure and decides what gets chased first.",
    watches: ["Overdue accounts", "Exposure", "Held orders", "Collection priorities"], scope: "€318k receivables · " + KPI.creditHolds + " held orders", cadence: "On every order and payment", owners: ["rachel", "patrick"] },
];

type Out = "handled" | "waiting" | "approved";
type Act = { id: string; label: string; done: string; toast: string };
type Entry = { t: string; agent: AgentName; detected: string; did: string; out: Out; who?: string; at?: string; act?: Act; go?: [string, string, Record<string, string>?] };

/* The six agent entries already in the activity feed, with what each one found and did. */
const FROM_DB: Record<string, Omit<Entry, "t" | "agent" | "go">> = {
  "09:14": { detected: "Projected stockout for EL-4408 Industrial Cable 100m: 12 free in Dublin, 32 a week of demand, 28-day lead time from Atlas.",
    did: "Recommended 160 units today from EuroCable (9 days, €0.45 more landed) rather than Atlas (28 days). The incoming PO-8821 doesn't give enough cover.", out: "waiting", who: "emma",
    act: { id: "po-el4408", label: "Create Purchase Order", done: "PO-8852 drafted", toast: "PO-8852 drafted: 160 × EL-4408 from EuroCable BV, €3,552. Waiting on Emma's approval." } },
  "08:58": { detected: "37 customer price agreements affected by the EuroFix cost increase on FIX-2201 (€16.40 to €18.10).",
    did: "Listed the 37 agreements, €819 a month of margin, and set a review for Michael Doyle due 2 Oct.", out: "handled" },
  "08:42": { detected: "Doyle Construction order SO-10503 (€16,240) would take the account to €58,920 against its €50,000 limit.",
    did: "Placed it on hold under credit policy. Proposed releasing €7,320 against available credit and requesting INV-28482 (€14,860) before the rest.", out: "waiting", who: "patrick",
    act: { id: "d-credit", label: "Release €7,320", done: "€7,320 released", toast: "SO-10503 part-released: €7,320 against available credit. Payment request for INV-28482 sent to Kieran Doyle." } },
  "08:36": { detected: "D11 is 340kg over its plated weight: 7,840kg on a 7.5t rigid.",
    did: "Suggested moving SO-10528 (Clondalkin Plant Hire, 380kg) to D09's second drop. Both orders still arrive inside their slots.", out: "waiting", who: "orla",
    act: { id: "d11-move", label: "Move SO-10528 to D09", done: "Moved to D09", toast: "SO-10528 moved to D09. D11 now 7,460kg, cleared to depart." } },
  "08:03": { detected: "Overnight and early-morning changes across all " + SYSTEMS.length + " connected systems.",
    did: "Completed the morning briefing for Patrick Byrne: 94 orders worth €176,420, 7 at risk (€46,280), 3 decisions waiting.", out: "handled" },
  "07:30": { detected: "Atlas missed its second promised date on PO-8821.",
    did: "Notified Emma Walsh with the 6 customer orders that depend on it (€41,880).", out: "handled" },
};

const LOCAL: Entry[] = [
  { t: "06:00", agent: "Briefing Agent", detected: "Overnight changes in Sage 200, Sage Accounts, the warehouse system, the route planner and supplier feeds.",
    did: "Read them into one picture for today: 94 orders to dispatch worth €176,420, 76 deliveries and 7 supplier deliveries due in.", out: "handled", go: ["Home", "command"] },
  { t: "06:05", agent: "Ops Watchdog", detected: "SO-10482 for Murphy Building Supplies (€27,640, 18 lines) has 3 lines short, all waiting on PO-8821.",
    did: "Marked it HIGH and put it at the top of today's at-risk list.", out: "handled", go: ["Orders", "detail", { order: "SO-10482" }] },
  { t: "06:12", agent: "Inventory Agent", detected: "EL-4521 SWA Cable Gland 20mm is at zero available in Dublin. Naas has 34 free.",
    did: "Proposed transfer TR-2294: 30 packs Naas to Dublin, protecting 2 orders on tomorrow's AM routes.", out: "waiting", who: "liam",
    act: { id: "tr-2294", label: "Approve transfer", done: "TR-2294 approved", toast: "TR-2294 approved: 30 × EL-4521 on the 11:00 Naas van. Liam Murphy and Aoife Brennan notified." },
    go: ["Inventory", "transfers", { sku: "EL-4521" }] },
  { t: "06:30", agent: "Purchasing Agent", detected: "Seven supplier deliveries due in today: 246 pallets, €148,000 of stock. PO-8830 from EuroFix (48 pallets) lands in Dublin at 11:00.",
    did: "Proposed moving two Dublin pickers to goods-in from 10:30 so PO-8830 is cleared before the afternoon deliveries.", out: "approved", who: "liam", at: "06:48",
    go: ["Warehouse", "goodsin"] },
  { t: "06:40", agent: "Credit Agent", detected: "No payment from Doyle Construction overnight against INV-28482 (€14,860). Kieran Doyle promised it 'this week' on 18 Sep.",
    did: "Marked the promise broken and put Doyle Construction first on Rachel Hayes's call list.", out: "handled", go: ["Finance", "debtors"] },
  { t: "06:52", agent: "Dispatch Agent", detected: "First departures from both warehouses: M01, N02, D18 and D16 left between 06:20 and 06:50.",
    did: "Checked each against its plan. All on time, nothing to change.", out: "handled", go: ["Delivery", "today"] },
  { t: "06:58", agent: "Customer Agent", detected: "Ryan Trade Supplies normally buys M10 Hex Bolts (FIX-2201) every 18 to 24 days. Its last bolt order was 47 days ago.",
    did: "Created a follow-up call for Mark Ryan at 15:00 today. €34,080 a year at risk.", out: "handled", go: ["Customers", "health"] },
  { t: "07:05", agent: "Margin Agent", detected: "Harbour Point Facilities is still getting promotional pricing on SAF-3310 nitrile gloves. The promotion ended 31 Aug; margin is 17.9%.",
    did: "Proposed moving the line back to its Tier B price from the next order.", out: "waiting", who: "michael",
    act: { id: "aa-harbour-promo", label: "Restore Tier B price", done: "Tier B restored", toast: "Harbour Point Facilities: SAF-3310 back on Tier B pricing from the next order. Mark Ryan told." },
    go: ["Pricing", "lists"] },
  { t: "07:12", agent: "Inventory Agent", detected: "SAF-1892 Safety Glasses: 22 weeks' cover in Naas, and another SafePro PO planned for 3 Oct.",
    did: "Proposed cancelling the planned PO and moving 600 pairs to Dublin instead (TR-2292).", out: "waiting", who: "emma",
    act: { id: "tr-2292", label: "Cancel PO, transfer", done: "TR-2292 approved", toast: "Planned SafePro PO for SAF-1892 cancelled. TR-2292: 600 pairs Naas to Dublin on the next shuttle." },
    go: ["Inventory", "transfers", { sku: "SAF-1892" }] },
  { t: "07:20", agent: "Customer Agent", detected: "Swords Building Supplies has bought no PPE since July, after spending about €1,400 a month on it.",
    did: "Proposed a visit from David Kelly with the PPE range. €16,800 a year.", out: "waiting", who: "david",
    act: { id: "aa-swords-visit", label: "Book the visit", done: "Visit booked", toast: "Visit to Swords Building Supplies booked for David Kelly with the PPE range. Alan Brophy invited." },
    go: ["Customers", "health"] },
  { t: "07:45", agent: "Inventory Agent", detected: "TL-3321 Cordless Impact Driver (2023 model): 180 units, 241 days without a sale, superseded by the 2025 model.",
    did: "Proposed returning them to Toolcraft, who take superseded lines back at 15% restocking. Releases €12,090.", out: "waiting", who: "ciaran",
    act: { id: "aa-tl3321-return", label: "Raise supplier return", done: "Return raised", toast: "Supplier return raised with Toolcraft Europe for 180 × TL-3321. €12,090 credit expected." },
    go: ["Inventory", "slow"] },
  { t: "08:05", agent: "Inventory Agent", detected: "EL-4408 in Dublin: 12 free against 58 demand in the next 7 days. Naas has 64 free against 11.",
    did: "Proposed transfer TR-2291: 40 units on the 11:00 Naas van, landing 11:45 in time for D14. Protects 3 orders worth €12,460.", out: "waiting", who: "liam",
    act: { id: "d-transfer", label: "Approve Transfer", done: "Transfer TR-2291 approved", toast: "TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van. Liam and Aoife notified." },
    go: ["Inventory", "transfers", { sku: "EL-4408" }] },
  { t: "08:15", agent: "Customer Agent", detected: "Murphy Building Supplies hasn't bought Safety & PPE in 74 days, after ordering it monthly.",
    did: "Proposed raising it on Sarah Byrne's 11:30 call about the SO-10482 part shipment. €4,800 to €6,200 opportunity.", out: "waiting", who: "sarah",
    act: { id: "aa-murphy-ppe", label: "Add to Sarah's call", done: "Added to call plan", toast: "PPE added to Sarah Byrne's 11:30 call with Gerry Murphy (OP-309, €4,800 to €6,200)." },
    go: ["Customers", "detail", { cust: "murphy" }] },
  { t: "08:16", agent: "Credit Agent", detected: "Sage Accounts updated 12 payment statuses. Midland Timber & Hardware's cheque for INV-28519 (€4,380) hasn't been banked yet.",
    did: "Kept Midland Timber & Hardware on watch and set a check for 29 Sep.", out: "handled", go: ["Finance", "debtors"] },
  { t: "08:20", agent: "Ops Watchdog", detected: "Dublin wave 3 will run about 40 minutes behind once two pickers move to goods-in for PO-8830.",
    did: "Proposed picking D04's lines first so SO-10540 for Swords Building Supplies still makes its 11:30 departure.", out: "waiting", who: "liam",
    act: { id: "aa-wave3", label: "Re-sequence wave 3", done: "Wave 3 re-sequenced", toast: "Wave 3 re-sequenced with D04 lines first. SO-10540 target now 11:05." },
    go: ["Warehouse", "picking"] },
  { t: "08:24", agent: "Credit Agent", detected: "Tallaght Trade Centre placed SO-10533 (€2,780) at 08:22 with €6,420 overdue 62 days and €690 of credit left.",
    did: "Held it under credit policy and asked Rachel Hayes to call Noel Purcell before 13:00, when it drops off D14.", out: "handled", go: ["Finance", "credit", { cust: "tallaght" }] },
  { t: "08:30", agent: "Margin Agent", detected: "The 08:22 price file confirms EuroFix's 10.4% increase on FIX-2201. QT-2841 for O'Brien Facilities still prices fixings on the old contract: 17.2% overall against 24%.",
    did: "Proposed countering at 21.5%: keep the PPE discount, restore list price on fixings.", out: "waiting", who: "michael",
    act: { id: "d-quote", label: "Counter at 21.5%", done: "Countered at 21.5%", toast: "QT-2841 revised to 21.5% and sent to David Kelly to present." },
    go: ["Pricing", "exceptions", { quote: "QT-2841" }] },
  { t: "08:45", agent: "Dispatch Agent", detected: "SO-10482 can't go on D14 in full: 15 of 18 lines will be ready for the 13:30 cutoff.",
    did: "Proposed a split: 15 lines on D14 at 13:45 today, the other 3 on tomorrow's D14 PM run after PO-8821 lands.", out: "waiting", who: "orla",
    act: { id: "d14-plan", label: "Confirm load plan", done: "Load plan confirmed", toast: "D14 load plan confirmed: 11 stops, departs 13:45. James Nolan notified." },
    go: ["Delivery", "routes", { route: "D14" }] },
  { t: "08:49", agent: "Ops Watchdog", detected: "SO-10536 for Harbour Point Facilities came in at 08:48, after W01's wave was released. Pick cutoff 11:30.",
    did: "Proposed squeezing it into wave 2 so W01 still leaves at 12:00.", out: "approved", who: "liam", at: "08:50", go: ["Warehouse", "exceptions"] },
  { t: "08:50", agent: "Customer Agent", detected: "Gerry Murphy emailed about SO-10482 at 08:48: “Any update on the cable and glands?”",
    did: "Drafted Sarah Byrne's reply: 15 lines on D14 this afternoon, the other 3 tomorrow once PO-8821 lands.", out: "waiting", who: "sarah",
    act: { id: "aa-murphy-reply", label: "Approve reply", done: "Reply sent", toast: "Reply sent to Gerry Murphy from Sarah Byrne: 15 lines today on D14, 3 tomorrow." },
    go: ["Orders", "detail", { order: "SO-10482" }] },
  { t: "08:53", agent: "Purchasing Agent", detected: "PO-8826 from SafePro arrived 40 boxes short on SAF-3310 nitrile gloves: 760 of 800.",
    did: "Drafted a short-delivery claim and kept the PO open for the balance.", out: "waiting", who: "ciaran",
    act: { id: "aa-po8826-claim", label: "Send claim", done: "Claim sent", toast: "Short-delivery claim sent to SafePro for 40 × SAF-3310 on PO-8826." },
    go: ["Warehouse", "goodsin"] },
  { t: "09:00", agent: "Customer Agent", detected: "QT-2839 for Liffey Mechanical & Electrical (€14,620) has had no reply in 21 days and expires 28 Sep.",
    did: "Proposed a call from David Kelly before it expires.", out: "waiting", who: "david",
    act: { id: "aa-qt2839", label: "Assign call", done: "Call assigned", toast: "Call to Rory Byrne at Liffey M&E assigned to David Kelly for today, about QT-2839." },
    go: ["Customers", "quotes"] },
  { t: "09:06", agent: "Purchasing Agent", detected: "Atlas moved PO-8821 again at 09:04, now 26 Sep 10:30. Atlas can send a dedicated van tonight for €420.",
    did: "Proposed expediting: it lands at 06:30 tomorrow, before the first wave, and protects 6 orders worth €41,880.", out: "waiting", who: "emma",
    act: { id: "d-expedite", label: "Expedite · €420", done: "Expedited · lands 06:30", toast: "PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow." },
    go: ["Purchasing", "orders", { po: "PO-8821" }] },
  { t: "09:10", agent: "Ops Watchdog", detected: "Stock discrepancy on bin N-07-04: the system shows 60 boxes of FIX-2201, 24 were found. SO-10474 for McGrath Civil Engineering is 12 boxes short.",
    did: "Flagged the FIX-2201 line on SO-10474 and proposed a recount by Aoife Brennan before 10:30.", out: "waiting", who: "aoife",
    act: { id: "aa-n0704", label: "Confirm recount", done: "Recount booked", toast: "Recount of N-07-04 booked for Aoife Brennan by 10:30. The SO-10474 line waits until then." },
    go: ["Warehouse", "exceptions"] },
  { t: "09:12", agent: "Margin Agent", detected: "Tallaght Trade Centre's counter sold EL-5530 at €7.40 on a manual override: 13.5% margin, no reason code.",
    did: "Proposed removing counter override rights on the account. Overrides took its margin from 27.1% to 24.0% this month.", out: "waiting", who: "michael",
    act: { id: "aa-tallaght-override", label: "Remove override rights", done: "Override rights removed", toast: "Manual price overrides switched off for Tallaght Trade Centre. David Kelly told." },
    go: ["Pricing", "lists"] },
];

const ENTRIES: Entry[] = [
  ...ACTIVITY.filter(a => a.kind === "agent" && FROM_DB[a.t]).map(a => ({ t: a.t, agent: a.actor as AgentName, go: a.go, ...FROM_DB[a.t] })),
  ...LOCAL,
].sort((a, b) => (a.t < b.t ? 1 : a.t > b.t ? -1 : 0));

const QUESTIONS = [
  "What is most likely to cost us money today?",
  "What do I need to fix today?",
  "What should we buy today?",
  "Where are we losing margin?",
  "Why has OTIF fallen?",
  "Which supplier is causing the most disruption?",
  "What should Sarah call customers about today?",
  "Where is our working capital trapped?",
];

const ROUTING: [string, string][] = [
  ["Credit releases above limit", "patrick"], ["Prices, quotes and discounts", "michael"], ["Purchase orders and expedites", "emma"],
  ["Stock transfers and picking", "liam"], ["Loads and routes", "orla"], ["Collections", "rachel"],
];

/* ---------- record ids and customer names inside sentences become links ---------- */
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

const first = (id: string) => who(id).name.split(" ")[0];

function AgentActivity() {
  const dx = useDx();
  const [agent, setAgent] = useLocal("aa-agent", "all");
  const [out, setOut] = useLocal("aa-out", "all");
  const isDone = (e: Entry) => e.out === "approved" || !!(e.act && dx.acted[e.act.id]);
  const isWaiting = (e: Entry) => e.out === "waiting" && !(e.act && dx.acted[e.act.id]);
  const waiting = ENTRIES.filter(isWaiting).length;
  const handled = ENTRIES.filter(e => e.out === "handled").length;
  const approved = ENTRIES.filter(isDone).length;
  const rows = ENTRIES.filter(e => (agent === "all" || e.agent === agent)
    && (out === "all" || (out === "waiting" ? isWaiting(e) : out === "handled" ? e.out === "handled" : isDone(e))));
  const pickAgent = (name: string) => {
    setAgent(name);
    setOut("all");
    document.getElementById("aa-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Page eyebrow={"Agents · " + TODAY.long + " · " + TODAY.time} title="Agent activity"
      sub="Eight agents watch orders, stock, suppliers, margin, customers, deliveries and credit. They find the problem, propose the fix and wait for the person who owns the decision."
      right={<>
        <Btn icon={IC.chat} onClick={() => dx.go("Agents", "chat")}>Open chat</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Activity", "ai")}>All activity</Btn>
      </>}>
      <KpiRow n={5}>
        <Kpi label="Agent actions today" value={String(ENTRIES.length)} sub="06:00 to 09:16 · 8 agents" />
        <Kpi label="Waiting for a person" value={String(waiting)} tone={waiting ? "warn" : "ok"} sub="Each routed to its named owner" onClick={() => { setAgent("all"); setOut("waiting"); document.getElementById("aa-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
        <Kpi label="Handled on their own" value={String(handled)} sub="Notifications, tasks and policy holds" />
        <Kpi label="Approved" value={String(approved)} tone={approved ? "ok" : undefined} sub="By the owner, this morning" />
        <Kpi label="Systems read" value={String(SYSTEMS.length)} sub="Read access, nothing written back" onClick={() => dx.go("Activity", "systems")} />
      </KpiRow>

      <Card pad={false}>
        <Grid cols="minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.7fr)" gap={0}>
          {[
            { k: "Read", v: "Everything", s: SYSTEMS.map(x => x.name).join(", ") + "." },
            { k: "Write", v: "Nothing without approval", s: "Agents draft POs, transfers, emails and price changes. A person sends, books or approves each one." },
            { k: "On their own", v: "Notify, create tasks, hold", s: "The only automatic actions: telling the owner, adding a task, and a credit hold when an order breaks the account's limit or terms." },
          ].map((g, i) => (
            <div key={g.k} style={{ padding: "16px 20px", borderLeft: i ? "1px solid var(--border)" : undefined }}>
              <div className="dx-eyebrow">{g.k}</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 8, color: "var(--ink)" }}>{g.v}</div>
              <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5, lineHeight: 1.5 }}>{g.s}</div>
            </div>
          ))}
          <div style={{ padding: "16px 20px", borderLeft: "1px solid var(--border)" }}>
            <div className="dx-eyebrow">Approvals go to the named owner</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "9px 16px", marginTop: 10 }}>
              {ROUTING.map(([k, id]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Avatar id={id} size={22} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{who(id).name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Grid>
      </Card>

      <div className="dx-section">
        <div className="dx-section-head">
          <div className="dx-section-title">The eight agents</div>
          <span className="dx-faint" style={{ fontSize: 12.5 }}>Today since 06:00 · click one to filter its actions</span>
        </div>
        <Grid cols="repeat(4,minmax(0,1fr))" gap={12}>
          {AGENTS.map(a => {
            const mine = ENTRIES.filter(e => e.agent === a.name);
            const w = mine.filter(isWaiting).length;
            const stats: [string, number, Tone?][] = [
              ["Detections", mine.length],
              ["Proposed", mine.filter(e => e.out !== "handled").length],
              ["Waiting", w, w ? "warn" : undefined],
              ["Handled", mine.filter(e => e.out === "handled").length, "ok"],
            ];
            return (
              <Card key={a.name} pad={false} onClick={() => pickAgent(a.name)} tone={agent === a.name ? "accent" : undefined} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px 18px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span className="dx-ai-mark" style={{ flex: "none" }}><Icon d={a.icon} s={14} w={1.8} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.2px" }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>Last run {mine[0]?.t || "—"} · {a.cadence}</div>
                  </div>
                </div>
                <div style={{ padding: "10px 18px 0", fontSize: 13, color: "var(--ink)", lineHeight: 1.45 }}>{a.role}</div>
                <div style={{ padding: "6px 18px 0", fontSize: 12, color: "var(--dim)", lineHeight: 1.5, flex: 1 }}>
                  Watches {a.watches.map((x, i) => (i ? x.charAt(0).toLowerCase() + x.slice(1) : x)).join(", ")}.
                  <div style={{ color: "var(--faint)", marginTop: 4 }}>{a.scope}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", marginTop: 14, borderTop: "1px solid var(--border)" }}>
                  {stats.map(([k, v, tone], i) => (
                    <div key={k} style={{ padding: "10px 10px 11px", borderLeft: i ? "1px solid var(--border)" : undefined, minWidth: 0 }}>
                      <div className="dx-num" style={{ fontSize: 18, fontWeight: 600, color: tone && v ? INK[tone] : "var(--ink)" }}>{v}</div>
                      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 18px 13px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--dim)", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ flex: "none" }}>Approvals</span>
                  {a.owners.length > 1 && a.ownerLabel
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ display: "inline-flex", gap: 3 }}>{a.owners.map(o => <Avatar key={o} id={o} size={20} />)}</span>
                        <span style={{ color: "var(--body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.ownerLabel}</span>
                      </span>
                    : <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        {a.owners.map(o => <Person key={o} id={o} />).reduce<ReactNode[]>((acc, el, i) => (i ? acc.concat([<span key={"s" + i} className="dx-faint">·</span>, el]) : [el]), [])}
                      </span>}
                </div>
              </Card>
            );
          })}
        </Grid>
      </div>

      <Card title="What would you like to ask?" sub="Answers come from the same records as this page, with a link to each one." style={{ marginTop: 26 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QUESTIONS.map(q => <Btn key={q} small icon={IC.chat} onClick={() => dx.ask(q)}>{q}</Btn>)}
        </div>
      </Card>

      <div className="dx-section" id="aa-timeline" style={{ scrollMarginTop: 20 }}>
        <div className="dx-section-head">
          <div className="dx-section-title">Today's agent actions</div>
          <span className="dx-faint" style={{ fontSize: 12.5 }}>{rows.length} of {ENTRIES.length} · newest first · every record id opens it</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "0 0 12px" }}>
          <Seg value={agent} onChange={setAgent} items={[["all", "All agents"], ...AGENTS.map(a => [a.name, a.short] as [string, string])]} />
          <Seg value={out} onChange={setOut} items={[["all", "Everything"], ["waiting", "Waiting (" + waiting + ")"], ["handled", "Handled on its own"], ["approved", "Approved"]]} />
        </div>
        <Card pad={false}>
          <div className="dx-list">
            {rows.map((e, i) => {
              const acted = e.act ? dx.acted[e.act.id] : undefined;
              const wait = e.out === "waiting" && !acted;
              const badge: [string, Tone] = e.out === "handled" ? ["Handled on its own", "neutral"]
                : e.out === "approved" ? ["Approved by " + first(e.who!) + " · " + e.at, "ok"]
                : acted ? ["Approved", "ok"] : ["Waiting for " + first(e.who!), "warn"];
              return (
                <div key={e.t + e.agent} className="dx-li" style={{ borderTop: i ? undefined : 0, gap: 14 }}>
                  <span className="dx-num" style={{ width: 40, flex: "none", fontSize: 12.5, color: "var(--faint)", paddingTop: 1 }}>{e.t}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button className="dx-link dx-link-plain" style={{ fontSize: 13, fontWeight: 600 }} onClick={() => setAgent(e.agent)}>{e.agent}</button>
                      <Badge tone={badge[1]} dot={wait}>{badge[0]}</Badge>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr)", gap: "5px 10px", marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
                      <span className="dx-faint">Detected</span>
                      <span style={{ color: "var(--body)" }}><Linked text={e.detected} /></span>
                      <span className="dx-faint">Action</span>
                      <span style={{ color: "var(--ink)" }}><Linked text={e.did} /></span>
                      <span className="dx-faint">Person</span>
                      <span style={{ color: "var(--dim)" }}>
                        {e.out === "handled" ? "Not needed: within policy, logged here."
                          : e.out === "approved" ? <>Approved by {who(e.who!).name} at {e.at}.</>
                          : acted ? <span style={{ color: "var(--ok)" }}>{acted}.</span>
                          : <>Waiting for {who(e.who!).name}, {who(e.who!).role}.</>}
                      </span>
                    </div>
                  </div>
                  <div style={{ flex: "none", width: 196, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, paddingTop: 1 }}>
                    {e.act && e.out === "waiting" && (
                      <ActBtn id={e.act.id} small kind={wait ? "primary" : "ghost"} label={e.act.label} done={e.act.done} toast={e.act.toast} />
                    )}
                    {e.go && <Btn small kind="quiet" onClick={() => dx.go(e.go![0], e.go![1], e.go![2])}>Open</Btn>}
                  </div>
                </div>
              );
            })}
            {!rows.length && <div className="dx-empty">Nothing matches this filter.</div>}
          </div>
        </Card>
      </div>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = { activity: AgentActivity };
