/* Distribution content for Pulse's own pages: Chat, Work approvals, Activity, the command palette,
   notifications and the mini chat. Every figure is read from (or reconciles with) src/dist/db.ts,
   so a number here is the same number the distribution pages show. Today is 25 Sep, 09:16. */
import {
  COMPANY, KPI, STAFF, who, CUSTOMERS, customer, SUPPLIERS, supplier, PRODUCTS, POS, po, ORDERS,
  ROUTES, route, QUOTES, INVOICES, REPLEN, SKU_DEMAND, TASKS, ACTIVITY, DECISIONS, SYSTEMS, eur, pct
} from "../dist/db";
import { MODULES } from "../dist/modules";

const OK = "var(--ok)", WARN = "var(--warn)", BAD = "var(--bad)", ACC = "var(--accent)", NEU = "var(--neutral)";

/* The signed-in user. Approvals whose pending step sits with this name are "Awaiting you". */
export const ME = { id: "patrick", name: "Patrick Byrne", first: "Patrick", role: "Managing Director", ini: "PB" };

export const greetingFor = (h) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

/* A page id as a person would say it. */
export const pageLabel = (page) => {
  if (page === "Home") return "Home";
  if (page === "Command") return "Command Centre";
  if (page === "Dashboard") return "Executive Dashboard";
  if (page === "AgentActivity") return "Agent Activity";
  const m = MODULES.find(x => x.id === page);
  return m ? m.label : page;
};

/* ---------- Work → Approvals: eight distribution approvals, same shape as before ---------- */
export const APPROVALS = [
  {id:"a8", title:"Special delivery · Atlas expedite on PO-8821 €420", subject:"Dedicated van tonight instead of tomorrow's groupage · raised by Emma Walsh", age:"8m", status:"awaiting you",
   steps:[{who:"Purchasing Agent",state:"proposed 09:06",dot:OK},{who:"Emma Walsh",state:"raised 09:08",dot:OK},{who:"Patrick Byrne",state:"pending",dot:WARN}],
   work:{kind:"table", label:"FREIGHT QUOTE", viewLabel:"View quote",
     headline:"Atlas Industrial Supplies · dedicated van, Manchester to Dublin", sub:"Lands 26 Sep 06:30 instead of 10:30 · terms 60 days",
     cols:["Line","Qty","Unit","Total"], align:["left","right","right","right"],
     rows:[["Dedicated van · 14 SKUs, 18 pallets","1","€420.00","€420.00"],
           ["Groupage already booked (no change)","1","€0.00","€0.00"]],
     totals:[["Revenue protected","€41,880.00"],["Orders protected","6"],["Cost to approve","€420.00"]],
     thinking:[["Counted the dependants","6 customer orders worth €41,880 wait on PO-8821. Murphy SO-10482 is the largest at €27,640"],
               ["Compared arrival","Groupage lands 10:30, after the first pick wave. The van lands 06:30, before it"],
               ["Checked the freight budget","Freight outside the carrier contract needs MD sign-off"],
               ["Asked Atlas to share it","No answer yet. Logged against Atlas for the October review"]],
     tools:[["po.read","read"],["orders.read","read"],["freight.book","external"]],
     risk:"Deadline 09:30. After that Atlas cannot load the van tonight and the 10:30 groupage stands."}},
  {id:"a2", title:"Credit override · Doyle Construction SO-10503 €16,240", subject:"€8,920 over the €50,000 limit if released in full · raised by Rachel Hayes", age:"34m", status:"awaiting you",
   steps:[{who:"Credit Agent",state:"held 08:42",dot:OK},{who:"Rachel Hayes",state:"raised 08:50",dot:OK},{who:"Sarah Byrne",state:"supports 08:58",dot:OK},{who:"Patrick Byrne",state:"pending",dot:WARN}],
   work:{kind:"diff", label:"CREDIT DECISION", viewLabel:"View change",
     headline:"Doyle Construction · account C-1301", sub:"Four fields change on approval, one unchanged",
     diff:[["Order SO-10503","Credit hold","Part released"],["Released now","€0","€7,320"],["Held until INV-28482 is paid","€16,240","€8,920"],
           ["Account exposure","€42,680","€50,000"],["Credit limit","€50,000","€50,000"]],
     thinking:[["Read the account","€42,680 on account against a €50,000 limit, 30-day terms"],
               ["Checked overdue","INV-28482 €14,860 at 67 days. Kieran Doyle promised payment 'this week' on 18 Sep"],
               ["Checked the order","SO-10503, 9 lines, all in stock in Dublin, required 26 Sep"],
               ["Split the release","€7,320 fits inside the limit today. The €8,920 balance waits for INV-28482"]],
     tools:[["accounts.read","read"],["invoices.read","read"],["orders.release","write"],["email.send","external"]],
     risk:"Releasing in full takes exposure to €58,920 with €14,860 already 67 days overdue."}},
  {id:"a5", title:"Purchase order PO-8854 · EuroFix GmbH €28,525", subject:"Three fixings lines for Q4 · raised by Ciarán Doherty", age:"36m", status:"awaiting you",
   steps:[{who:"Ciarán Doherty",state:"raised 08:40",dot:OK},{who:"Emma Walsh",state:"approved 08:58",dot:OK},{who:"Patrick Byrne",state:"pending",dot:WARN}],
   work:{kind:"table", label:"PURCHASE ORDER", viewLabel:"View order",
     headline:"PO-8854 · EuroFix GmbH, Dortmund", sub:"Delivery 9 Oct to Dublin · terms 45 days",
     cols:["Line","Qty","Unit","Total"], align:["left","right","right","right"],
     rows:[["FIX-2201 M10 Hex Bolt Box 100","850","€18.10","€15,385.00"],
           ["FIX-2240 M10 Nyloc Nut Box 200","600","€14.20","€8,520.00"],
           ["FIX-1180 Concrete Screw 7.5×100 Box 100","200","€23.10","€4,620.00"]],
     totals:[["Net","€28,525.00"],["VAT (reverse charge, DE)","€0.00"],["Payable","€28,525.00"]],
     thinking:[["Checked cover","FIX-1180 runs out 5 Oct and FIX-2201 6 Nov on current demand"],
               ["Checked open quotes","Three open quotes worth €9,420 include FIX-1180"],
               ["Checked the price","EuroFix's 1 Sep list: FIX-2201 at €18.10, up 10.4% from €16.40"],
               ["Checked the threshold","€3,525 over the €25,000 MD limit, so it routed to you"]],
     tools:[["stock.read","read"],["po.create","write"],["edi.send","external"]],
     risk:"37 customer agreements still price FIX-2201 on the old €16.40 cost. Buying at €18.10 without repricing keeps the €819 a month leak."}},
  {id:"a4", title:"Supplier change · dual-source EL-4408 and EL-4521", subject:"Drafted by Purchasing Agent · raised by Emma Walsh", age:"1h", status:"awaiting you",
   steps:[{who:"Purchasing Agent",state:"drafted 07:34",dot:OK},{who:"Emma Walsh",state:"approved 08:05",dot:OK},{who:"Patrick Byrne",state:"pending",dot:WARN}],
   work:{kind:"doc", label:"SUPPLIER PROPOSAL · 4 SECTIONS", viewLabel:"Read proposal",
     headline:"Add EuroCable BV alongside Atlas Industrial Supplies", sub:"EL-4408 Industrial Cable 100m and EL-4521 SWA Cable Gland 20mm",
     doc:[["Proposal","Add EuroCable BV as a second supplier on EL-4408 and EL-4521. EuroCable becomes primary on EL-4408. Atlas stays primary on EL-4521 and backup on EL-4408."],
          ["Why now","Atlas has missed two promised dates on PO-8821. Six customer orders worth €41,880 wait on it, Murphy SO-10482 among them. Atlas OTIF is 86.2% against 97.8% at EuroCable."],
          ["Cost","EuroCable lists EL-4408 at €22.20 against €21.40 at Atlas, €22.55 landed against €22.10. On 1,920 drums a year that is about €864 more."],
          ["Terms","45 days, MOQ 50, 9-day lead time from Eindhoven against 28 days from Manchester. 800 drums available now."]],
     totals:[["Lead time","28 days → 9 days"],["Extra cost a year","€864"],["Revenue exposed today","€41,880"]],
     thinking:[["Scored Atlas","86.2% OTIF, 3.8 days average delay, 126 customer orders affected this year"],
               ["Compared EuroCable","97.8% OTIF, 9-day lead time, 800 drums available"],
               ["Costed the switch","€0.45 more per drum landed, about €864 a year on 1,920 drums"],
               ["Kept Atlas in","Atlas stays primary on EL-4521, so no line is single-sourced on EuroCable"]],
     tools:[["suppliers.read","read"],["products.update","write"]],
     risk:"EL-4408 is about €41,000 a year of Atlas spend at cost. Expect Atlas to raise it at the October review."}},
  {id:"a1", title:"Pricing exception · O'Brien Facilities QT-2841 at 17.2%", subject:"€18,420 quote against a 24% target · raised by David Kelly", age:"2 days", status:"awaiting Michael Doyle",
   steps:[{who:"David Kelly",state:"raised 23 Sep",dot:OK},{who:"Margin Agent",state:"flagged 23 Sep",dot:OK},{who:"Michael Doyle",state:"pending",dot:WARN}],
   work:{kind:"table", label:"QUOTE · 26 LINES", viewLabel:"View quote",
     headline:"QT-2841 · O'Brien Facilities", sub:"26 lines · expires 2 Oct · 45-day terms",
     cols:["Category","Lines","Value","Margin"], align:["left","right","right","right"],
     rows:[["PPE","8","€6,940.00","19.2%"],
           ["Janitorial","9","€5,810.00","17.3%"],
           ["Industrial Consumables","6","€3,650.00","15.4%"],
           ["Fixings (FIX-2201 at €20.90)","3","€2,020.00","13.4%"]],
     totals:[["Gross profit at 17.2%","€3,168.24"],["Gross profit at 24% target","€4,420.80"],["Shortfall on this order","€1,252.56"],["Quote value","€18,420.00"]],
     thinking:[["Compared to target","17.2% against the 24% target, 6.8 pts below. €5,010 a year on repeat volume"],
               ["Checked the reason","David Kelly marked it a strategic deal ahead of a four-region rollout"],
               ["Checked costs","EuroFix raised FIX-2201 10.4% on 1 Sep. O'Brien's contract still prices it at €20.90"],
               ["Proposed a counter","21.5%: keep the PPE discount, restore list on fixings"]],
     tools:[["quotes.read","read"],["pricing.read","read"],["quotes.approve","write"]],
     risk:"O'Brien's 2025 contract expires 31 Oct. Approving at 17.2% sets the floor for the renewal."}},
  {id:"a3", title:"Emergency purchase · PO-8852 EuroCable €3,552", subject:"160 × EL-4408 Industrial Cable 100m · raised by Ciarán Doherty", age:"1m", status:"awaiting Emma Walsh",
   steps:[{who:"Inventory Agent",state:"flagged 09:14",dot:OK},{who:"Ciarán Doherty",state:"raised 09:15",dot:OK},{who:"Emma Walsh",state:"pending",dot:WARN}],
   work:{kind:"table", label:"PURCHASE ORDER", viewLabel:"View order",
     headline:"PO-8852 · EuroCable BV, Eindhoven", sub:"Delivery 4 Oct to Dublin · terms 45 days",
     cols:["Line","Qty","Unit","Total"], align:["left","right","right","right"],
     rows:[["EL-4408 Industrial Cable 100m","160","€22.20","€3,552.00"]],
     totals:[["Net","€3,552.00"],["Landed at €22.55","€3,608.00"],["Payable","€3,552.00"]],
     thinking:[["Projected the stockout","Dublin has 12 free against 32 a week. Stockout 21 Oct even with PO-8821"],
               ["Compared suppliers","EuroCable €22.20, 9 days, 97.8% OTIF. Atlas €21.40, 28 days, 86.2%"],
               ["Checked landed cost","€22.55 against €22.10 at Atlas: €72 more on 160 drums"],
               ["Checked the threshold","Inside Emma's €10,000 purchasing limit"]],
     tools:[["stock.read","read"],["suppliers.read","read"],["po.create","write"],["edi.send","external"]],
     risk:"If Atlas also lands PO-8821 in full tomorrow, Dublin holds about 9 weeks of EL-4408."}},
  {id:"a6", title:"Supplier return · TL-3321 impact drivers €14,220", subject:"180 units back to Toolcraft at 15% restocking · raised by Liam Murphy", age:"Yesterday", status:"awaiting Niamh Clarke",
   steps:[{who:"Inventory Agent",state:"proposed 24 Sep",dot:OK},{who:"Liam Murphy",state:"raised 24 Sep",dot:OK},{who:"Niamh Clarke",state:"pending",dot:WARN}],
   work:{kind:"diff", label:"STOCK RETURN", viewLabel:"View return",
     headline:"TL-3321 Cordless Impact Driver 18V (2023 model)", sub:"Four fields change on approval, one unchanged",
     diff:[["Stock on hand (Dublin 88, Naas 92)","180","0"],["Stock value","€14,220","€0"],["Supplier credit from Toolcraft","—","€12,090"],
           ["Restocking fee at 15%","—","€2,130"],["Replenishment","Stopped","Stopped"]],
     thinking:[["Checked movement","241 days since the last sale, 6 sold in 12 months"],
               ["Checked the line","Superseded by the 2025 model. No open quotes include it"],
               ["Checked the terms","Toolcraft takes superseded lines back at 15% restocking"],
               ["Compared options","Return releases €12,090. Discounting to clear would release about €7,000"]],
     tools:[["stock.read","read"],["returns.create","write"],["edi.send","external"]],
     risk:"Collection needs 2 pallet spaces at each dock. Toolcraft collects on 1 Oct."}},
  {id:"a7", title:"Customer credit · RT-1186 Grange Contracts €34.50", subject:"1 box of cutting discs crushed on N02 · raised by Aoife Brennan", age:"Yesterday", status:"approved",
   steps:[{who:"Aoife Brennan",state:"raised",dot:OK},{who:"Fiona Lynch",state:"approved",dot:OK}],
   work:{kind:"diff", label:"CREDIT NOTE", viewLabel:"View credit",
     headline:"CN-4471 · Grange Contracts", sub:"Three fields change on approval",
     diff:[["Credit note","—","CN-4471 €34.50"],["Replacement","—","1 × IC-1044 on N02 tomorrow"],["Return RT-1186","Open","Closed"],["Reason","Transport damage","Transport damage"]],
     thinking:[["Matched the POD","T. Grange signed at 07:31 with '1 box crushed' noted"],
               ["Checked the pattern","Third N02 transport damage this month"],
               ["Checked the value","€34.50, inside Customer Service's €250 credit limit"]],
     tools:[["returns.read","read"],["credits.create","write"]],
     risk:"Third N02 damage this month. Worth checking how N02 is loaded."}}
];

/* ---------- Patrick's own work (tasks from db TASKS, plus his sign-offs) ---------- */
const prioMap = { Critical: "high", High: "high", Medium: "normal", Low: "low" };
const MINE = [
  {id:"p1", title:"Approve €420 Atlas expedite on PO-8821", due:"09:30", related:"PO-8821", prio:"Critical"},
  {id:"p2", title:"Sign off PO-8854 EuroFix €28,525", due:"12:00", related:"PO-8854", prio:"High"},
  {id:"p3", title:"Decide EuroCable dual-sourcing on EL-4408", due:"15:00", related:"EL-4408", prio:"Medium"}
];
export const WORK_QUEUE = MINE.map(t => ({id:t.id, title:t.title, due:t.due, who:ME.ini, queue:["mine"], subject:t.related, priority:prioMap[t.prio]}))
  .concat(TASKS.map(t => {
    const p = who(t.owner), mine = t.owner === ME.id, today = /^Today/.test(t.due);
    const queue = [mine ? "mine" : "team"];
    if (t.late) queue.push("overdue");
    else if (!today) queue.push("upcoming");
    return {id:t.id, title:t.title, due:t.due.replace(/^Today /, ""), who:p.ini, queue, subject:t.related, priority:prioMap[t.prio] || "normal", late:!!t.late};
  }));
export const DEFAULT_TIMER_TASK = "Review Doyle Construction credit hold";

/* ---------- Chat page and mini chat ---------- */
export const CHAT_SUGGESTIONS = ["What is most likely to cost us money today?", "What do I need to fix today?", "Which customers have reduced spend?"];
export const MINI_SUGGESTIONS = ["What do I need to fix today?", "Which orders will go late?", "What should we buy this week?"];
export const COMPOSER_PROMPTS = [
  ["Why is Murphy's order SO-10482 at risk?", "ORDERS"],
  ["What should we buy this week?", "PURCHASING"],
  ["Where are we losing margin?", "MARGIN"]
];
/* Chat hero pill: the decisions waiting on Patrick and the revenue riding on the late Atlas PO. */
export const DECISION_PILL = DECISIONS.filter(d => d.needsYou).length + " DECISIONS · " + eur(po("PO-8821").depValue) + " EXPOSED";

export const TODAY_NUMBERS = [
  {label:"Revenue MTD", value:eur(KPI.revenueMTD), delta:KPI.revenueDelta + " on last month", tone:"up"},
  {label:"Orders today", value:String(KPI.ordersToday), delta:eur(KPI.ordersTodayValue) + " to ship", tone:"flat"},
  {label:"Gross margin", value:pct(KPI.grossMargin), delta:(KPI.marginTarget - KPI.grossMargin).toFixed(1) + " pts under target", tone:"down"},
  {label:"OTIF", value:pct(KPI.otif), delta:"target " + pct(KPI.otifTarget), tone:"down"}
];

export const DELIVERY_WIDGET = ["D14", "D07", "D11"].map(id => {
  const r = route(id);
  const state = r.status === "Held" ? "Held · " + (r.risk || "")
    : r.risk ? r.risk
    : r.status === "In transit" ? "In transit · " + r.done + " of " + r.stops + " delivered"
    : r.status;
  return {id, title:id + " · " + who(r.driver).name + " · " + state,
    when: r.status === "In transit" ? "ETA " + r.complete : r.depart,
    tone: r.status === "Held" ? "bad" : r.risk ? "warn" : "ok"};
});
export const DELIVERY_HINT = KPI.deliveriesToday + " TODAY · " + KPI.deliveriesAtRisk + " AT RISK";

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
export const ACTIVITY_WIDGET = ACTIVITY.slice(0, 5).map(a => {
  const verb = /^[A-Z][a-z]+ed\b/.test(a.text);
  return {who:a.actor, what: verb ? lowerFirst(a.text) : "· " + a.text,
    event:(a.go ? a.go[0].toLowerCase() : "pulse") + "." + (a.ref || a.kind), when:a.t,
    tone: a.attention ? "warn" : a.kind === "agent" ? "accent" : "neutral", go:a.go};
});

/* ---------- notifications (header bell) ---------- */
export const NOTIFICATIONS = [
  {tone:"warn", text:"EL-4408 Industrial Cable 100m projected to stock out on 21 Oct. 12 available in Dublin", event:"inventory.stockout.projected", meta:"09:14", go:["dgo","Inventory","replenishment",{sku:"EL-4408"}]},
  {tone:"bad", text:"Atlas moved PO-8821 to 26 Sep 10:30. 6 customer orders worth €41,880 wait on it", event:"purchasing.po.late", meta:"09:04", go:["dopen","po","PO-8821"]},
  {tone:"accent", text:"EuroFix cost increase touches 37 customer price agreements on FIX-2201", event:"margin.cost.changed", meta:"08:58", go:["dgo","Pricing","costs"]},
  {tone:"warn", text:"Credit Agent held SO-10503 for Doyle Construction. €16,240 would take the account past its €50,000 limit", event:"credit.order.held", meta:"08:42", go:["dgo","Finance","credit",{cust:"doyle"}]},
  {tone:"bad", text:"Route D11 is 340kg over plated weight. Dispatch Agent suggests moving SO-10528 to D09", event:"dispatch.route.overweight", meta:"08:36", go:["dopen","route","D11"]},
  {tone:"neutral", text:"Morning briefing ready: 94 orders today, 7 at risk (€46,280), 3 decisions for you", event:"briefing.morning.sent", meta:"08:03", go:["dgo","Home","command"]}
];

/* ---------- Activity: the Systems lens ---------- */
export const SYSTEM_KPIS = (() => {
  const live = SYSTEMS.filter(s => s.status === "Connected");
  const ro = SYSTEMS.filter(s => s.status !== "Connected").map(s => s.name);
  const last = ACTIVITY.find(a => a.kind === "system");
  return [
    ["Systems connected", String(SYSTEMS.length), live.length + " live" + (ro.length ? " · " + ro.join(", ") + " read only" : ""), "#6ad0f0"],
    ["Orders synced", "18", COMPANY.erp + " at 08:10", "var(--accent)"],
    ["Price changes imported", "428", "supplier feeds at 08:22", "#f0c04b"],
    ["Last system event", last ? last.t : "—", last ? last.actor : "", "var(--warn)"]
  ];
})();
export const SYSTEM_ROSTER = SYSTEMS.map(s => ({name:s.name, kind:s.kind, status:s.status, last:s.last, records:s.records}));

/* People lens: the staff whose work shows up most this morning. */
const ROSTER_IDS = ["sarah", "emma", "michael", "aoife", "orla", "rachel"];
export const PEOPLE_ROSTER = ROSTER_IDS.map(id => {
  const p = STAFF[id];
  const act = ACTIVITY.find(a => a.actor === p.name);
  const task = TASKS.find(t => t.owner === id);
  const waiting = APPROVALS.filter(a => a.status !== "approved" && a.steps.some(s => s.state === "pending" && s.who === p.name)).length;
  return {id, name:p.name, role:p.role, ini:p.ini, preview: act ? act.t + " · " + act.text : task ? "Working on: " + task.title : "Nothing today", waiting};
});

/* ---------- command palette ---------- */
const lc = (s) => String(s || "").toLowerCase();
const squash = (s) => lc(s).replace(/[^a-z0-9]/g, "");
/* Every word of the query must appear, as typed or with punctuation ignored (so "el4408" finds EL-4408). */
export const matches = (hay, q) => {
  const words = lc(q).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const h = lc(hay), hs = squash(hay);
  return words.every(w => h.includes(w) || (squash(w).length >= 3 && hs.includes(squash(w))));
};
const plural = (n, one, many) => n + " " + (n === 1 ? one : (many || one + "s"));
const OPEN_STATUS = (o) => o.status !== "Delivered" && o.status !== "Dispatched";

function customerRows(c, seen){
  const rows = [];
  const open = ORDERS.filter(o => o.cust === c.id && OPEN_STATUS(o));
  const risky = open.filter(o => o.risk === "HIGH" || o.risk === "MEDIUM" || o.short > 0).sort((a, b) => b.value - a.value).slice(0, 2);
  const lead = risky.length ? risky : open.sort((a, b) => b.value - a.value).slice(0, 1);
  lead.forEach(o => {
    const state = o.status === "Credit hold" ? "on credit hold" : o.short ? plural(o.short, "line") + " short" : lc(o.status);
    seen.add("order:" + o.id);
    rows.push({title:o.id + " · " + eur(o.value) + " open order · " + state,
      meta:c.name + " · required " + o.required + (o.reason ? " · " + o.reason : ""), hint:"ORDER", glyph:"order",
      go:["dgo","Orders","detail",{order:o.id}], recent:o.id});
  });
  if (c.balance > 0){
    const inv = INVOICES.filter(i => i.cust === c.id);
    const exact = inv.length && inv.reduce((n, i) => n + i.amount, 0) === c.balance;
    const credit = c.status === "Credit hold" || c.overdue > 0;
    rows.push({title:eur(c.balance) + " outstanding" + (exact ? " · " + plural(inv.length, "invoice") : "") + (c.overdue ? " · " + eur(c.overdue) + " overdue" : ""),
      meta:c.name + " · " + c.terms + " · limit " + eur(c.limit) + (c.status === "Credit hold" ? " · on credit hold" : ""), hint:"INVOICES", glyph:"money",
      go: credit ? ["dgo","Finance","credit",{cust:c.id}] : ["dgo","Finance","debtors",{cust:c.id}], recent:c.name});
  }
  const stops = [];
  ROUTES.forEach(r => (r.list || []).forEach(s => { if (s.cust === c.id && s.status === "At risk") stops.push([r, s]); }));
  if (!stops.length){
    open.filter(o => o.today && o.risk === "HIGH" && o.route && o.route !== "—").forEach(o => { const r = route(o.route); if (r) stops.push([r, {so:o.id, eta:r.depart, note:o.reason}]); });
  }
  if (stops.length){
    const ids = Array.from(new Set(stops.map(x => x[0].id)));
    const [r, s] = stops[0];
    ids.forEach(id => seen.add("route:" + id));
    rows.push({title:plural(stops.length, "delivery", "deliveries") + " at risk · Route " + ids.join(", "),
      meta:c.name + " · " + s.so + " · ETA " + s.eta + (s.note ? " · " + s.note : ""), hint:"DELIVERY", glyph:"route",
      go:["dopen","route",r.id], recent:"Route " + r.id});
  }
  return rows;
}

function productRows(p, seen){
  const rows = [];
  const P = p.po ? po(p.po) : null;
  if (P){
    const line = (P.lines || []).find(l => l.sku === p.sku);
    const qty = line ? line.qty : p.incoming;
    seen.add("po:" + P.id);
    rows.push({title:P.id + " incoming · " + qty + " units · " + (P.status === "Late" ? plural(P.daysLate, "day") + " late" : "due " + (P.eta || P.expected)),
      meta:supplier(P.supplier).name + " · expected " + P.expected + (P.eta ? " · ETA " + P.eta : ""), hint:"PO", glyph:"po",
      go:["dopen","po",P.id], recent:P.id});
  }
  const r = REPLEN.find(x => x.sku === p.sku);
  if (r && r.stockout && r.stockout !== "—"){
    rows.push({title: r.stockout === "Now" ? "Out of stock in Dublin now" : "Projected stockout " + r.stockout,
      meta: r.suggest > 0 ? "Order " + r.suggest + " " + (r.when === "TODAY" ? "today" : "by " + r.when) + " · " + r.lead + "-day lead time · " + r.confidence + "% confidence" : r.reason,
      hint:"FORECAST", glyph:"forecast", go:["dgo","Inventory","replenishment",{sku:p.sku}], recent:p.sku});
  }
  const short = (SKU_DEMAND[p.sku] || []).filter(d => d.status === "Short").length;
  if (P && P.deps){
    rows.push({title:P.deps + " customer orders depend on " + P.id,
      meta:eur(P.depValue) + " revenue exposed" + (short ? " · " + short + " short on " + p.sku : "") + " · " + supplier(P.supplier).name, hint:"IMPACT", glyph:"order",
      go:["dgo","Purchasing","orders",{po:P.id}], recent:P.id});
  } else if (short){
    rows.push({title:plural(short, "customer order") + " short on " + p.sku, meta:"Waiting for stock in Dublin", hint:"IMPACT", glyph:"order",
      go:["dgo","Orders","backorders"], recent:p.sku});
  }
  return rows;
}

/* Record search for the palette. Returns groups of already-matched rows; each row's `go` is a
   descriptor the logic runs: ["dgo", module, sub, rec] | ["dopen", kind, id] | ["ask", q] | ["approval", id]. */
export function searchRecords(q){
  const seen = new Set();
  const groups = [];
  /* A group ranks by its best row: title starts with the query, title contains it, or only the detail does. */
  const add = (group, scope, items) => {
    if (!items.length) return;
    const ql = lc(q).trim();
    const score = Math.min.apply(null, items.map(i => i.rank !== undefined ? i.rank : lc(i.title).startsWith(ql) ? 0 : matches(i.title, q) ? 1 : 2));
    groups.push({group, scope, items, score});
  };
  const rank = (name, hay) => lc(name).startsWith(lc(q).trim()) ? 0 : matches(name, q) ? 1 : matches(hay, q) ? 2 : 9;

  /* customers: the best match brings its open order, balance and deliveries with it */
  const custs = CUSTOMERS.map(c => {
    const hay = [c.name, c.acct, c.id, c.contact[0], c.area, c.segment, who(c.am).name].join(" ");
    return {c, r: rank(c.name, hay)};
  }).filter(x => x.r < 9).sort((a, b) => a.r - b.r);
  const custItems = [];
  custs.forEach((x, i) => {
    const c = x.c;
    seen.add("cust:" + c.id);
    custItems.push({title:c.name, meta:who(c.am).name + ", account manager · " + c.acct + " · " + c.area, hint:"CUSTOMER", glyph:"org",
      go:["dgo","Customers","detail",{cust:c.id}], recent:c.name, rank:x.r});
    if (i === 0 && x.r < 2) customerRows(c, seen).forEach(r => custItems.push(r));
  });
  add("Customers", "Customers", custItems);

  /* products: the best match brings its incoming PO, stockout and the orders waiting on it */
  const prods = PRODUCTS.map(p => {
    const hay = [p.sku, p.name, p.cat, supplier(p.supplier).name].join(" ");
    return {p, r: squash(p.sku) === squash(q) || lc(p.sku).startsWith(lc(q).trim()) ? 0 : rank(p.name, hay)};
  }).filter(x => x.r < 9).sort((a, b) => a.r - b.r);
  const prodItems = [];
  prods.forEach((x, i) => {
    const p = x.p;
    prodItems.push({title:p.name + " · " + p.dub.avail + " available · " + p.dub.alloc + " allocated",
      meta:p.sku + " · Dublin · Naas " + p.nas.avail + " free · " + supplier(p.supplier).name + " · " + p.health, hint:"SKU", glyph:"sku",
      go:["dopen","sku",p.sku], recent:p.sku, rank:x.r});
    if (i === 0 && x.r < 2) productRows(p, seen).forEach(r => prodItems.push(r));
  });

  const orders = ORDERS.filter(o => !seen.has("order:" + o.id) && matches([o.id, o.custPO, customer(o.cust).name].join(" "), q))
    .map(o => ({title:o.id + " · " + customer(o.cust).name,
      meta:eur(o.value) + " · " + o.status + " · required " + o.required + (o.reason ? " · " + o.reason : ""), hint:"ORDER", glyph:"order",
      go:["dgo","Orders","detail",{order:o.id}], recent:o.id}));
  add("Orders", "Orders", orders);
  add("Products", "Products", prodItems);

  const pos = POS.filter(P => !seen.has("po:" + P.id) && matches([P.id, supplier(P.supplier).name, (P.lines || []).map(l => l.sku).join(" ")].join(" "), q))
    .map(P => ({title:P.id + " · " + supplier(P.supplier).name,
      meta:eur(P.value) + " · " + P.status + (P.daysLate ? ", " + plural(P.daysLate, "day") + " late" : "") + " · expected " + P.expected + " · " + plural(P.deps, "dependent order"),
      hint:"PO", glyph:"po", go:["dopen","po",P.id], recent:P.id}));
  add("Purchase orders", "Purchase orders", pos);

  const sups = SUPPLIERS.filter(s => matches([s.name, s.id, s.country, s.cats.join(" ")].join(" "), q))
    .map(s => ({title:s.name, meta:s.country + " · " + s.cats.join(", ") + " · OTIF " + pct(s.otif) + " · " + s.status, hint:"SUPPLIER", glyph:"supplier",
      go:["dopen","supplier",s.id], recent:s.name}));
  add("Suppliers", "Suppliers", sups);

  const routes = ROUTES.filter(r => !seen.has("route:" + r.id) && matches(["Route", r.id, who(r.driver).name, r.area, r.vehicle].join(" "), q))
    .map(r => ({title:"Route " + r.id + " · " + who(r.driver).name,
      meta:r.status + " · " + plural(r.stops, "stop") + " · " + eur(r.value) + " · departs " + r.depart + (r.risk ? " · " + r.risk : ""), hint:"ROUTE", glyph:"route",
      go:["dopen","route",r.id], recent:"Route " + r.id}));
  add("Routes", "Routes", routes);

  const quotes = QUOTES.filter(x => matches([x.id, customer(x.cust).name, who(x.rep).name].join(" "), q))
    .map(x => ({title:x.id + " · " + customer(x.cust).name,
      meta:eur(x.value) + " · " + pct(x.margin) + " margin, target " + pct(x.target) + " · " + x.status, hint:"QUOTE", glyph:"quote",
      go:["dopen","quote",x.id], recent:x.id}));
  add("Quotes", "Quotes", quotes);

  const work = APPROVALS.filter(a => a.status !== "approved" && matches(a.title + " " + a.subject, q))
    .map(a => ({title:a.title, meta:a.subject, hint:"APPROVAL", glyph:"task", go:["approval",a.id], recent:a.title}))
    .concat(TASKS.filter(t => matches([t.title, t.related, who(t.owner).name, t.dept].join(" "), q))
      .map(t => ({title:t.title, meta:who(t.owner).name + " · due " + t.due + " · " + t.related, hint:"TASK", glyph:"task", go:["dgo","Work","tasks"], recent:t.title})));
  add("Work", "Work", work);

  const pages = [];
  MODULES.forEach(m => m.subs.forEach(([k, l]) => {
    const title = m.id === "Home" || l === m.label ? l : l + " · " + m.label;
    if (matches(title + " " + m.id, q)) pages.push({title, meta:m.label + " page", hint:"PAGE", glyph:"page", go:["dgo",m.id,k], recent:title});
  }));
  if (matches("Settings organisation teams systems integrations governance AI controls experience", q))
    pages.push({title:"Settings", meta:"Organisation, teams, systems, integrations, governance, AI controls", hint:"PAGE", glyph:"page", go:["settings"], recent:"Settings"});
  add("Pages", "Pages", pages);
  return groups.sort((a, b) => a.score - b.score);
}

export const PALETTE_ACTIONS = [
  {title:"Ask: What do I need to fix today?", meta:"Pulse · the five things, in order", go:["ask","What do I need to fix today?"]},
  {title:"Ask: What is most likely to cost us money today?", meta:"Pulse · exposure across orders, credit and margin", go:["ask","What is most likely to cost us money today?"]},
  {title:"Open at-risk orders", meta:KPI.atRiskOrders + " orders · " + eur(KPI.atRiskValue) + " this week", go:["dgo","Orders","risk"]},
  {title:"Resolve Murphy SO-10482", meta:"3 lines short on PO-8821 · Route D14 at 13:45", go:["dgo","Orders","detail",{order:"SO-10482"}]},
  {title:"Review margin", meta:pct(KPI.grossMargin) + " against " + pct(KPI.marginTarget) + " target · " + eur(KPI.marginGapEur) + " gap this month", go:["dgo","Pricing","margin"]},
  {title:"Open Doyle credit case", meta:"SO-10503 " + eur(16240) + " held · " + eur(42680) + " of " + eur(50000) + " used", go:["dgo","Finance","credit",{cust:"doyle"}]},
  {title:"Approvals waiting on you", meta:"Work · approvals", go:["dgo","Work","approvals"]},
  {title:"Deliveries today", meta:KPI.deliveriesToday + " deliveries · " + KPI.deliveriesAtRisk + " at risk", go:["dgo","Delivery","today"]},
  {title:"Systems activity", meta:SYSTEMS.length + " connected systems · " + COMPANY.erp, go:["dgo","Activity","systems"]}
];

export const PALETTE_FREQUENT = [
  {title:"Orders at risk", count:"31×", icon:"orders", go:["dgo","Orders","risk"]},
  {title:"Approvals", count:"24×", icon:"approvals", go:["dgo","Work","approvals"]},
  {title:"Murphy Building Supplies", count:"18×", icon:"customers", go:["dgo","Customers","detail",{cust:"murphy"}]},
  {title:"PO-8821 · Atlas", count:"12×", icon:"purchasing", go:["dopen","po","PO-8821"]},
  {title:"Margin Control", count:"9×", icon:"pricing", go:["dgo","Pricing","margin"]},
  {title:"Deliveries today", count:"7×", icon:"delivery", go:["dgo","Delivery","today"]}
];

/* Launcher tiles for the page you are on (no query typed). */
export const PALETTE_KITS = {
  Command: [
    {title:"Ask what needs fixing today", meta:"Pulse · the five things, in order", icon:"helios", go:["ask","What do I need to fix today?"]},
    {title:"Orders at risk", meta:KPI.atRiskOrders + " orders · " + eur(KPI.atRiskValue), icon:"orders", go:["dgo","Orders","risk"]},
    {title:"Approvals waiting on you", meta:"Work · approvals", icon:"approvals", go:["dgo","Work","approvals"]},
    {title:"Executive Dashboard", meta:"The month in numbers", icon:"navDash", go:["dgo","Home","exec"]}
  ],
  Home: [
    {title:"What is most likely to cost us money today?", meta:"Ask Pulse", icon:"helios", go:["ask","What is most likely to cost us money today?"]},
    {title:"Edit widgets", meta:"Rearrange the right rail", icon:"dash", go:["widgets"]},
    {title:"Command Centre", meta:"Everything that needs you today", icon:"navHome", go:["dgo","Home","command"]},
    {title:"My work", meta:"Tasks due today", icon:"work", go:["dgo","Work","tasks"]}
  ],
  Work: [
    {title:"Approvals awaiting you", meta:"Work · approvals", icon:"approvals", go:["dgo","Work","approvals"]},
    {title:"Tasks", meta:TASKS.length + " open across the team", icon:"work", go:["dgo","Work","tasks"]},
    {title:"Workflows", meta:"What runs on its own", icon:"autos", go:["dgo","Work","workflows"]},
    {title:"Schedules", meta:"Recurring routines", icon:"visits", go:["dgo","Work","schedules"]}
  ],
  Agents: [
    {title:"Agent Activity", meta:"What every agent did today", icon:"agents", go:["dgo","Agents","activity"]},
    {title:"Ask Pulse", meta:"Chat with every agent at once", icon:"helios", go:["dgo","Home","home"]},
    {title:"Build an agent", meta:"Start from a blank brief", icon:"modules", go:["builder"]},
    {title:"Tools and grants", meta:"What agents may do", icon:"navAdmin", go:["settings"]}
  ],
  Activity: [
    {title:"Needs attention", meta:"Failures and decisions parked", icon:"health", go:["dgo","Activity","attention"]},
    {title:"Agents", meta:"Only what the agents did", icon:"agents", go:["dgo","Activity","ai"]},
    {title:"People", meta:"Only what the team did", icon:"people", go:["dgo","Activity","people"]},
    {title:"Systems", meta:COMPANY.erp + ", warehouse, routes, Outlook", icon:"pulseLine", go:["dgo","Activity","systems"]}
  ],
  Settings: [
    {title:"Roles and grants", meta:"Who can see and do what", icon:"navAdmin", go:["settings"]},
    {title:"Integrations", meta:SYSTEMS.length + " connected systems", icon:"modules", go:["settings"]},
    {title:"Systems activity", meta:"Everything the systems sent today", icon:"health", go:["dgo","Activity","systems"]},
    {title:"Command Centre", meta:"Back to today", icon:"navHome", go:["dgo","Home","command"]}
  ]
};
PALETTE_KITS.Chat = PALETTE_KITS.Home;
