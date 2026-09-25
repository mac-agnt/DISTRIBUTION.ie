/* Consulting DISTRIBUTION.ie: the one mock database behind every screen.
   Every figure a page shows is read from here, so a number is the same wherever it appears.
   "Today" in the demo is 25 Sep, 09:16. */

/* ---------- formatting ---------- */
export const eur = (n: number, dp = 0) =>
  (n < 0 ? "−€" : "€") + Math.abs(n).toLocaleString("en-IE", { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const eurK = (n: number) =>
  Math.abs(n) >= 1e6 ? "€" + (n / 1e6).toFixed(2).replace(/0$/, "") + "m" : "€" + Math.round(n / 1000).toLocaleString("en-IE") + "k";
export const num = (n: number) => n.toLocaleString("en-IE");
export const pct = (n: number, dp = 1) => n.toFixed(dp) + "%";

export const TODAY = { date: "25 Sep", long: "25 September", time: "09:16", tomorrow: "26 Sep" };

export const COMPANY = {
  name: "Consulting DISTRIBUTION.ie",
  mark: "CD",
  tagline: "Distribution, under control.",
  erp: "Sage 200",
  warehouses: 2, vehicles: 18, skus: 8426, accounts: 437, suppliers: 64, staff: 58,
  monthlyRevenue: 1280000, annualRevenue: 15400000,
};

/* ---------- people ---------- */
export type Person = { id: string; name: string; role: string; ini: string; dept: string; tint: string };
const P = (id: string, name: string, role: string, dept: string, tint: string): Person =>
  ({ id, name, role, dept, tint, ini: name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() });
export const STAFF: Record<string, Person> = Object.fromEntries([
  P("patrick", "Patrick Byrne", "Managing Director", "Management", "#7ea0ff"),
  P("michael", "Michael Doyle", "Commercial Director", "Commercial", "#9fd6f0"),
  P("emma", "Emma Walsh", "Purchasing Manager", "Purchasing", "#e6c78a"),
  P("ciaran", "Ciarán Doherty", "Buyer", "Purchasing", "#c8b4f0"),
  P("sarah", "Sarah Byrne", "Senior Account Manager", "Sales", "#a8e0c0"),
  P("david", "David Kelly", "Account Manager", "Sales", "#e2a08c"),
  P("mark", "Mark Ryan", "Account Manager", "Sales", "#9fd6f0"),
  P("karen", "Karen Moran", "Inside Sales", "Sales", "#c8b4f0"),
  P("fiona", "Fiona Lynch", "Customer Service Lead", "Customer Service", "#e6c78a"),
  P("liam", "Liam Murphy", "Warehouse Manager, Dublin", "Warehouse", "#a8e0c0"),
  P("aoife", "Aoife Brennan", "Warehouse Manager, Naas", "Warehouse", "#e2a08c"),
  P("kevin", "Kevin Brady", "Goods-In Supervisor, Dublin", "Warehouse", "#9fd6f0"),
  P("tomasz", "Tomasz Nowak", "Picker, Dublin", "Warehouse", "#c8b4f0"),
  P("grainne", "Gráinne Kavanagh", "Picker, Dublin", "Warehouse", "#e6c78a"),
  P("adam", "Adam Kowalski", "Picker, Dublin", "Warehouse", "#a8e0c0"),
  P("sean", "Seán Hogan", "Picker, Dublin", "Warehouse", "#e2a08c"),
  P("jade", "Jade Moore", "Packer, Dublin", "Warehouse", "#9fd6f0"),
  P("piotr", "Piotr Wiśniewski", "Picker, Naas", "Warehouse", "#c8b4f0"),
  P("orla", "Orla Quinn", "Transport Planner", "Transport", "#e6c78a"),
  P("james", "James Nolan", "Driver", "Transport", "#a8e0c0"),
  P("declan", "Declan Farrell", "Driver", "Transport", "#e2a08c"),
  P("shane", "Shane Molloy", "Driver", "Transport", "#9fd6f0"),
  P("eoin", "Eoin Walsh", "Driver", "Transport", "#c8b4f0"),
  P("conor", "Conor Healy", "Driver", "Transport", "#e6c78a"),
  P("niall", "Niall Treacy", "Driver", "Transport", "#a8e0c0"),
  P("paddy", "Paddy Geoghegan", "Driver", "Transport", "#e2a08c"),
  P("niamh", "Niamh Clarke", "Financial Controller", "Finance", "#9fd6f0"),
  P("rachel", "Rachel Hayes", "Credit Controller", "Finance", "#c8b4f0"),
].map(p => [p.id, p]));
export const who = (id: string) => STAFF[id] || STAFF.patrick;

/* ---------- warehouses ---------- */
export const WAREHOUSES = {
  DUB: { id: "DUB", name: "Dublin Distribution Centre", short: "Dublin", role: "Primary warehouse", addr: "Ballymount Industrial Estate, Dublin 12",
    value: 1720000, manager: "liam", pickers: 14, docks: 8, skus: 7210 },
  NAS: { id: "NAS", name: "Naas Distribution Centre", short: "Naas", role: "Secondary warehouse", addr: "Millennium Park, Naas, Co. Kildare",
    value: 740000, manager: "aoife", pickers: 6, docks: 4, skus: 4380 },
};
export type WH = keyof typeof WAREHOUSES;

/* ---------- headline numbers (the ones every page shares) ---------- */
export const KPI = {
  revenueMTD: 1084620, revenueDelta: "+8.4%",
  grossMargin: 23.8, marginTarget: 25.0, grossProfitMTD: 258140, marginGapEur: 13008,
  ordersToday: 94, ordersTodayValue: 176420,
  otif: 94.2, otifTarget: 97.0,
  inventory: 2460000, slowStock: 286420, deadStock: 74200, inventory120: 189580,
  backorders: 31, backorderValue: 84760,
  atRiskOrders: 14, atRiskValue: 84760, atRiskToday: 7, atRiskTodayValue: 46280,
  openOrders: 286, openOrderValue: 684200,
  receivables: 318000, overdue: 124000, creditHolds: 9,
  cashTiedUp: 2780000, wcRelease: 226000, slowRelease: 168000,
  openPOs: 82, openPOValue: 742000, posDueWeek: 34, latePOs: 11, fillRate: 94.8, recommendedBuy: 184000, reorderRecs: 147,
  activeAccounts: 437, avgOrder: 6420, quotesOpen: 186000, declining: 18,
  deliveriesToday: 76, delivered: 34, inTransit: 28, awaitingDispatch: 14, deliveriesAtRisk: 7,
  marginRecovery: 18600,
};

export const ORDER_PIPELINE = [
  // stage, orders, value — sums to 286 open orders / €684,200 (Dispatched & Delivered are today's flow, not open)
  { stage: "New", n: 38, value: 92400 },
  { stage: "Allocated", n: 112, value: 268300 },
  { stage: "Picking", n: 58, value: 131600 },
  { stage: "Packed", n: 24, value: 61800 },
  { stage: "Awaiting stock", n: 31, value: 84760, bottleneck: true },
  { stage: "Credit hold", n: 9, value: 38420, bottleneck: true },
  { stage: "Dispatch risk", n: 14, value: 6920 },
];
export const ORDER_STATUS_KPIS = { ready: 174, picking: 58, awaitingStock: 31, creditHold: 9, deliveryRisk: 14 };

/* ---------- customers ---------- */
export type Health = "Growing" | "Stable" | "Declining" | "At risk";
export type Customer = {
  id: string; name: string; acct: string; segment: string; am: string; area: string; sites: string[];
  terms: string; limit: number; balance: number; overdue: number; revYTD: number; revMTD: number; margin: number;
  ordersYTD: number; avgOrder: number; otif: number; trend: number; health: Health; status: "Active" | "Credit hold" | "Watch";
  priceList: string; lastOrder: string; delivery: string; categories: string[]; contact: [string, string, string];
};
const C = (o: Customer) => o;
export const CUSTOMERS: Customer[] = [
  C({ id: "murphy", name: "Murphy Building Supplies", acct: "C-1042", segment: "Builders' merchant", am: "sarah", area: "Dublin 12",
    sites: ["Naas Road yard, Dublin 12", "Tallaght branch"], terms: "30 days EOM", limit: 75000, balance: 18240, overdue: 0,
    revYTD: 418420, revMTD: 38960, margin: 25.4, ordersYTD: 84, avgOrder: 4981, otif: 93.6, trend: 12.4, health: "Growing", status: "Active",
    priceList: "Contract · Merchant Tier A", lastOrder: "Today 07:52", delivery: "Day-before PM delivery to Naas Road yard",
    categories: ["Electrical", "Fixings", "Tools"], contact: ["Gerry Murphy", "Buyer", "gerry@murphybuilding.ie"] }),
  C({ id: "westbrook", name: "Westbrook Hardware", acct: "C-1187", segment: "Retailer · 3 branches", am: "david", area: "Lucan",
    sites: ["Lucan", "Clondalkin", "Maynooth"], terms: "30 days", limit: 40000, balance: 11420, overdue: 0,
    revYTD: 212640, revMTD: 21180, margin: 26.9, ordersYTD: 71, avgOrder: 2995, otif: 96.2, trend: 4.1, health: "Stable", status: "Active",
    priceList: "Tier B · Retail", lastOrder: "Today 08:10", delivery: "AM drop per branch, before 11:00", categories: ["Tools", "Fixings", "PPE", "Janitorial"],
    contact: ["Ruth Kinsella", "Purchasing", "ruth@westbrookhardware.ie"] }),
  C({ id: "doyle", name: "Doyle Construction", acct: "C-1301", segment: "Contractor", am: "sarah", area: "Blanchardstown",
    sites: ["Site: Hansfield SHD, Dublin 15", "Yard: Blanchardstown"], terms: "30 days", limit: 50000, balance: 42680, overdue: 14860,
    revYTD: 286300, revMTD: 24910, margin: 22.6, ordersYTD: 38, avgOrder: 7534, otif: 95.0, trend: 6.8, health: "At risk", status: "Credit hold",
    priceList: "Customer-specific · Doyle 2026", lastOrder: "Today 08:31", delivery: "Site delivery, booked slot, crane on Tue/Thu",
    categories: ["Fixings", "Electrical", "PPE", "Industrial Consumables"], contact: ["Kieran Doyle", "Contracts Manager", "kieran@doyleconstruction.ie"] }),
  C({ id: "core", name: "Core Facilities Ltd", acct: "C-1066", segment: "Facilities · multi-site", am: "mark", area: "Park West",
    sites: ["Park West", "Sandyford", "Citywest"], terms: "45 days", limit: 60000, balance: 22940, overdue: 0,
    revYTD: 341780, revMTD: 33420, margin: 28.1, ordersYTD: 102, avgOrder: 3351, otif: 97.4, trend: 9.2, health: "Growing", status: "Active",
    priceList: "Contract · Facilities 2026", lastOrder: "Yesterday 16:40", delivery: "Per-site drops, Naas or Dublin stock", categories: ["Janitorial", "PPE", "Electrical"],
    contact: ["Anne-Marie Walsh", "Procurement Lead", "amwalsh@corefacilities.ie"] }),
  C({ id: "obrien", name: "O'Brien Facilities", acct: "C-1422", segment: "Facilities · national", am: "david", area: "Dublin 18",
    sites: ["Sandyford HQ", "Cork", "Limerick", "Galway"], terms: "45 days", limit: 45000, balance: 9860, overdue: 0,
    revYTD: 198450, revMTD: 17630, margin: 23.1, ordersYTD: 46, avgOrder: 4314, otif: 94.8, trend: 2.3, health: "Stable", status: "Active",
    priceList: "Contract · O'Brien 2025 (expires 31 Oct)", lastOrder: "22 Sep", delivery: "National, via Naas trunk", categories: ["Janitorial", "PPE", "Industrial Consumables"],
    contact: ["Sinéad O'Brien", "Operations Director", "sinead@obrienfacilities.ie"] }),
  C({ id: "ryan", name: "Ryan Trade Supplies", acct: "C-1115", segment: "Independent merchant", am: "mark", area: "Portlaoise",
    sites: ["Portlaoise"], terms: "30 days", limit: 25000, balance: 6180, overdue: 0,
    revYTD: 96240, revMTD: 5120, margin: 27.3, ordersYTD: 52, avgOrder: 1851, otif: 92.1, trend: -28, health: "Declining", status: "Active",
    priceList: "Tier B · Merchant", lastOrder: "9 Sep", delivery: "M01 route, Tue & Fri", categories: ["Fixings", "Tools", "PPE"],
    contact: ["Declan Ryan", "Owner", "declan@ryantrade.ie"] }),
  C({ id: "horizon", name: "Horizon Electrical", acct: "C-1256", segment: "Electrical contractor", am: "sarah", area: "Dublin 22",
    sites: ["Clondalkin yard"], terms: "30 days", limit: 30000, balance: 14210, overdue: 2140,
    revYTD: 164880, revMTD: 15320, margin: 25.9, ordersYTD: 49, avgOrder: 3365, otif: 91.8, trend: 7.5, health: "Growing", status: "Active",
    priceList: "Tier A · Electrical", lastOrder: "Yesterday 14:05", delivery: "Yard delivery before 08:30", categories: ["Electrical", "Fixings"],
    contact: ["Barry Keogh", "Director", "barry@horizonelectrical.ie"] }),
  C({ id: "leinster", name: "Leinster Property Services", acct: "C-1478", segment: "National account", am: "michael", area: "Dublin 4",
    sites: ["14 managed sites"], terms: "60 days", limit: 80000, balance: 31560, overdue: 0,
    revYTD: 392110, revMTD: 36880, margin: 21.4, ordersYTD: 118, avgOrder: 3323, otif: 95.9, trend: 3.1, health: "Stable", status: "Active",
    priceList: "Contract · National 2026", lastOrder: "Today 07:14", delivery: "Consolidated weekly per site", categories: ["Janitorial", "Electrical", "PPE", "Fixings"],
    contact: ["Colm Fahy", "Head of Procurement", "cfahy@leinsterps.ie"] }),
  C({ id: "quinlan", name: "Quinlan Electrical Contractors", acct: "C-1340", segment: "Electrical contractor", am: "david", area: "Swords",
    sites: ["Swords"], terms: "30 days", limit: 30000, balance: 8740, overdue: 0,
    revYTD: 128400, revMTD: 10960, margin: 24.8, ordersYTD: 41, avgOrder: 3132, otif: 94.1, trend: -6.2, health: "Stable", status: "Active",
    priceList: "Tier A · Electrical", lastOrder: "Yesterday 11:20", delivery: "D04 route, AM", categories: ["Electrical"], contact: ["Eamon Quinlan", "Owner", "eamon@quinlanelectrical.ie"] }),
  C({ id: "harbourpoint", name: "Harbour Point Facilities", acct: "C-1510", segment: "Facilities", am: "mark", area: "Dún Laoghaire",
    sites: ["Dún Laoghaire", "Bray"], terms: "30 days", limit: 20000, balance: 5230, overdue: 0,
    revYTD: 74920, revMTD: 8640, margin: 26.4, ordersYTD: 33, avgOrder: 2270, otif: 96.8, trend: 18.0, health: "Growing", status: "Active",
    priceList: "Tier B · Facilities", lastOrder: "Today 08:48", delivery: "W01 route", categories: ["Janitorial", "PPE"], contact: ["Louise Tierney", "Facilities Manager", "louise@harbourpoint.ie"] }),
  C({ id: "grange", name: "Grange Contracts", acct: "C-1377", segment: "Contractor", am: "sarah", area: "Naas",
    sites: ["Site: Craddockstown, Naas"], terms: "30 days", limit: 35000, balance: 12880, overdue: 0,
    revYTD: 143650, revMTD: 11240, margin: 23.5, ordersYTD: 29, avgOrder: 4953, otif: 93.2, trend: -3.4, health: "Stable", status: "Active",
    priceList: "Customer-specific · Grange", lastOrder: "Yesterday 09:02", delivery: "Naas stock, site slot 07:30", categories: ["Fixings", "Industrial Consumables", "Electrical"], contact: ["Tadhg Grange", "QS", "tadhg@grangecontracts.ie"] }),
  C({ id: "mcgrath", name: "McGrath Civil Engineering", acct: "C-1202", segment: "Civil contractor", am: "sarah", area: "Newbridge",
    sites: ["Newbridge yard", "Site: N7 Kill upgrade"], terms: "30 days", limit: 40000, balance: 27410, overdue: 8940,
    revYTD: 231040, revMTD: 19870, margin: 22.9, ordersYTD: 44, avgOrder: 5251, otif: 94.4, trend: 5.6, health: "At risk", status: "Watch",
    priceList: "Customer-specific · McGrath", lastOrder: "Today 06:58", delivery: "K01 route, site gate", categories: ["Fixings", "PPE", "Industrial Consumables"], contact: ["Fergal McGrath", "Director", "fergal@mcgrathcivil.ie"] }),
  C({ id: "swords", name: "Swords Building Supplies", acct: "C-1093", segment: "Builders' merchant", am: "david", area: "Swords",
    sites: ["Swords"], terms: "30 days EOM", limit: 45000, balance: 16350, overdue: 3120,
    revYTD: 187300, revMTD: 13110, margin: 24.2, ordersYTD: 63, avgOrder: 2973, otif: 93.9, trend: -11.8, health: "Declining", status: "Active",
    priceList: "Contract · Merchant Tier A", lastOrder: "23 Sep", delivery: "D04 route", categories: ["Fixings", "Electrical", "Tools"], contact: ["Alan Brophy", "Branch Manager", "alan@swordsbuilding.ie"] }),
  C({ id: "kildare", name: "Kildare Build Centre", acct: "C-1164", segment: "Builders' merchant", am: "mark", area: "Kildare Town",
    sites: ["Kildare Town"], terms: "30 days", limit: 35000, balance: 9470, overdue: 0,
    revYTD: 156720, revMTD: 14250, margin: 25.1, ordersYTD: 58, avgOrder: 2702, otif: 95.3, trend: 1.2, health: "Stable", status: "Active",
    priceList: "Tier B · Merchant", lastOrder: "Yesterday 15:12", delivery: "N04 route", categories: ["Fixings", "Tools", "Electrical"], contact: ["Maura Dempsey", "Buyer", "maura@kildarebuild.ie"] }),
  C({ id: "liffey", name: "Liffey Mechanical & Electrical", acct: "C-1289", segment: "M&E contractor", am: "david", area: "Dublin 8",
    sites: ["Dublin 8", "Site: Heuston South Quarter"], terms: "30 days", limit: 30000, balance: 10960, overdue: 0,
    revYTD: 118500, revMTD: 7840, margin: 23.8, ordersYTD: 36, avgOrder: 3292, otif: 92.7, trend: -9.4, health: "Declining", status: "Active",
    priceList: "Tier A · Electrical", lastOrder: "Yesterday 10:44", delivery: "D09 route, site gate by 08:00", categories: ["Electrical", "Fixings"], contact: ["Rory Byrne", "Buyer", "rory@liffeyme.ie"] }),
  C({ id: "greenfield", name: "Greenfield Maintenance Services", acct: "C-1455", segment: "Facilities", am: "mark", area: "Carlow",
    sites: ["Carlow"], terms: "30 days", limit: 15000, balance: 3910, overdue: 0,
    revYTD: 62380, revMTD: 6010, margin: 27.8, ordersYTD: 31, avgOrder: 2012, otif: 97.9, trend: 4.4, health: "Stable", status: "Active",
    priceList: "Tier B · Facilities", lastOrder: "22 Sep", delivery: "K01 route", categories: ["Janitorial", "PPE"], contact: ["Paul Nolan", "Owner", "paul@greenfieldms.ie"] }),
  C({ id: "wicklow", name: "Wicklow Hardware & DIY", acct: "C-1321", segment: "Retailer", am: "david", area: "Bray",
    sites: ["Bray"], terms: "30 days", limit: 20000, balance: 7640, overdue: 1980,
    revYTD: 88140, revMTD: 4870, margin: 29.2, ordersYTD: 47, avgOrder: 1875, otif: 95.6, trend: -14.6, health: "Declining", status: "Active",
    priceList: "Tier C · Retail", lastOrder: "18 Sep", delivery: "W01 route", categories: ["Tools", "Janitorial", "Fixings"], contact: ["Helen Cullen", "Owner", "helen@wicklowhardware.ie"] }),
  C({ id: "fitzwilliam", name: "Fitzwilliam Property Management", acct: "C-1533", segment: "Facilities", am: "mark", area: "Dublin 2",
    sites: ["6 managed buildings"], terms: "30 days", limit: 15000, balance: 4120, overdue: 0,
    revYTD: 54610, revMTD: 9920, margin: 26.0, ordersYTD: 19, avgOrder: 2874, otif: 98.1, trend: 31.0, health: "Growing", status: "Active",
    priceList: "Tier B · Facilities", lastOrder: "Today 08:05", delivery: "D16 route", categories: ["Janitorial", "Electrical"], contact: ["Ciara Nolan", "Property Manager", "ciara@fitzwilliampm.ie"] }),
  C({ id: "clondalkin", name: "Clondalkin Plant Hire", acct: "C-1148", segment: "Plant hire", am: "sarah", area: "Clondalkin",
    sites: ["Clondalkin"], terms: "30 days", limit: 20000, balance: 6830, overdue: 0,
    revYTD: 71260, revMTD: 5910, margin: 24.4, ordersYTD: 34, avgOrder: 2096, otif: 94.0, trend: 0.8, health: "Stable", status: "Active",
    priceList: "Tier B · Trade", lastOrder: "Yesterday 12:30", delivery: "D11 route", categories: ["Industrial Consumables", "PPE", "Tools"], contact: ["Martin Kehoe", "Yard Manager", "martin@clondalkinplant.ie"] }),
  C({ id: "midland", name: "Midland Timber & Hardware", acct: "C-1097", segment: "Independent merchant", am: "mark", area: "Athlone",
    sites: ["Athlone"], terms: "30 days", limit: 30000, balance: 11060, overdue: 4380,
    revYTD: 109870, revMTD: 7120, margin: 26.6, ordersYTD: 44, avgOrder: 2497, otif: 91.4, trend: -8.1, health: "Declining", status: "Watch",
    priceList: "Tier B · Merchant", lastOrder: "17 Sep", delivery: "M01 route, Tue", categories: ["Fixings", "Tools"], contact: ["Seamus Kenny", "Buyer", "seamus@midlandtimber.ie"] }),
  C({ id: "tallaght", name: "Tallaght Trade Centre", acct: "C-1210", segment: "Trade counter", am: "david", area: "Tallaght",
    sites: ["Tallaght"], terms: "30 days", limit: 25000, balance: 24310, overdue: 6420,
    revYTD: 97330, revMTD: 8560, margin: 27.1, ordersYTD: 51, avgOrder: 1908, otif: 95.1, trend: -2.0, health: "At risk", status: "Credit hold",
    priceList: "Tier B · Trade", lastOrder: "Today 08:22", delivery: "D14 route", categories: ["Fixings", "PPE", "Tools"], contact: ["Noel Purcell", "Manager", "noel@tallaghttrade.ie"] }),
];
export const customer = (id: string) => CUSTOMERS.find(c => c.id === id) as Customer;
export const HEALTH_COUNTS: [Health, number][] = [["Growing", 96], ["Stable", 301], ["Declining", 18], ["At risk", 22]];

/* ---------- suppliers ---------- */
export type Supplier = {
  id: string; name: string; country: string; currency: string; cats: string[]; spend: number; otif: number; fill: number;
  delay: number; quality: number; returns: number; priceChanges: number; leadAcc: number; claims: number; affected: number;
  lead: number; terms: string; buyer: string; status: "Preferred" | "Approved" | "Needs review" | "On watch"; openPOs: number;
};
export const SUPPLIERS: Supplier[] = [
  { id: "atlas", name: "Atlas Industrial Supplies", country: "UK · Manchester", currency: "EUR", cats: ["Electrical", "Industrial Consumables"], spend: 1840000,
    otif: 86.2, fill: 91.4, delay: 3.8, quality: 7, returns: 11, priceChanges: 3, leadAcc: 71, claims: 3, affected: 126, lead: 28, terms: "60 days", buyer: "emma", status: "Needs review", openPOs: 9 },
  { id: "eurofix", name: "EuroFix GmbH", country: "Germany · Dortmund", currency: "EUR", cats: ["Fixings"], spend: 1260000,
    otif: 95.4, fill: 97.8, delay: 1.1, quality: 2, returns: 3, priceChanges: 2, leadAcc: 92, claims: 0, affected: 18, lead: 14, terms: "45 days", buyer: "ciaran", status: "Preferred", openPOs: 8 },
  { id: "safepro", name: "SafePro Workwear & PPE", country: "Ireland · Cork", currency: "EUR", cats: ["PPE"], spend: 940000,
    otif: 97.1, fill: 98.6, delay: 0.6, quality: 1, returns: 4, priceChanges: 1, leadAcc: 95, claims: 0, affected: 6, lead: 10, terms: "30 days", buyer: "ciaran", status: "Preferred", openPOs: 5 },
  { id: "eurocable", name: "EuroCable BV", country: "Netherlands · Eindhoven", currency: "EUR", cats: ["Electrical"], spend: 880000,
    otif: 97.8, fill: 98.9, delay: 0.4, quality: 1, returns: 2, priceChanges: 1, leadAcc: 96, claims: 0, affected: 4, lead: 9, terms: "45 days", buyer: "emma", status: "Preferred", openPOs: 6 },
  { id: "toolcraft", name: "Toolcraft Europe BV", country: "Netherlands · Venlo", currency: "EUR", cats: ["Tools"], spend: 610000,
    otif: 93.0, fill: 96.2, delay: 1.6, quality: 3, returns: 6, priceChanges: 2, leadAcc: 88, claims: 1, affected: 21, lead: 21, terms: "60 days", buyer: "ciaran", status: "Approved", openPOs: 6 },
  { id: "hansen", name: "Hansen Adhesives A/S", country: "Denmark · Aarhus", currency: "DKK", cats: ["Industrial Consumables"], spend: 520000,
    otif: 91.6, fill: 95.1, delay: 2.2, quality: 5, returns: 9, priceChanges: 2, leadAcc: 83, claims: 2, affected: 29, lead: 18, terms: "45 days", buyer: "emma", status: "On watch", openPOs: 4 },
  { id: "kingfield", name: "Kingfield Janitorial Supplies", country: "Ireland · Drogheda", currency: "EUR", cats: ["Janitorial"], spend: 470000,
    otif: 96.5, fill: 97.9, delay: 0.7, quality: 1, returns: 2, priceChanges: 1, leadAcc: 94, claims: 0, affected: 5, lead: 5, terms: "30 days", buyer: "ciaran", status: "Preferred", openPOs: 7 },
  { id: "lumos", name: "Lumos Lighting Ltd", country: "UK · Leeds", currency: "GBP", cats: ["Electrical"], spend: 440000,
    otif: 92.4, fill: 95.8, delay: 1.9, quality: 2, returns: 5, priceChanges: 2, leadAcc: 86, claims: 1, affected: 17, lead: 16, terms: "60 days", buyer: "emma", status: "Approved", openPOs: 4 },
  { id: "bristol", name: "Bristol Abrasives Ltd", country: "UK · Bristol", currency: "GBP", cats: ["Industrial Consumables"], spend: 390000,
    otif: 94.2, fill: 96.7, delay: 1.3, quality: 1, returns: 3, priceChanges: 3, leadAcc: 90, claims: 0, affected: 9, lead: 12, terms: "45 days", buyer: "emma", status: "Approved", openPOs: 3 },
  { id: "ifc", name: "Irish Fastener Company", country: "Ireland · Limerick", currency: "EUR", cats: ["Fixings"], spend: 360000,
    otif: 96.0, fill: 97.2, delay: 0.8, quality: 1, returns: 2, priceChanges: 1, leadAcc: 93, claims: 0, affected: 7, lead: 6, terms: "30 days", buyer: "ciaran", status: "Preferred", openPOs: 5 },
  { id: "midpack", name: "Midland Packaging Ltd", country: "UK · Coventry", currency: "GBP", cats: ["Packaging"], spend: 310000,
    otif: 95.0, fill: 97.0, delay: 1.0, quality: 0, returns: 1, priceChanges: 2, leadAcc: 91, claims: 0, affected: 3, lead: 10, terms: "30 days", buyer: "ciaran", status: "Approved", openPOs: 3 },
  { id: "celtic", name: "Celtic Tools Distribution", country: "Ireland · Athlone", currency: "EUR", cats: ["Tools"], spend: 280000,
    otif: 94.8, fill: 96.4, delay: 1.2, quality: 1, returns: 2, priceChanges: 1, leadAcc: 90, claims: 0, affected: 6, lead: 7, terms: "30 days", buyer: "ciaran", status: "Approved", openPOs: 2 },
];
export const supplier = (id: string) => SUPPLIERS.find(s => s.id === id) as Supplier;

/* ---------- products ---------- */
export type Stock = { onHand: number; avail: number; alloc: number };
export type Health2 = "Critical" | "Low" | "Healthy" | "Excess" | "Dead" | "Stockout";
export type Product = {
  sku: string; name: string; cat: string; supplier: string; cost: number; price: number; uom: string;
  dub: Stock; nas: Stock; incoming: number; po?: string; wkDemand: number; wkDemandNas: number; reorder: number; safety: number;
  moq: number; lead: number; health: Health2; cover: string; lastMove: number; trend: "up" | "flat" | "down"; returns: number;
  revenue12: number; units12: number; bin: string;
};
const mk = (o: Omit<Product, "revenue12" | "units12"> & { units12: number }): Product => ({ ...o, revenue12: Math.round(o.units12 * o.price) });
export const PRODUCTS: Product[] = [
  mk({ sku: "EL-4408", name: "Industrial Cable 100m", cat: "Electrical", supplier: "atlas", cost: 21.40, price: 28.40, uom: "drum",
    dub: { onHand: 38, avail: 12, alloc: 26 }, nas: { onHand: 72, avail: 64, alloc: 8 }, incoming: 120, po: "PO-8821", wkDemand: 32, wkDemandNas: 11,
    reorder: 75, safety: 40, moq: 100, lead: 28, health: "Critical", cover: "2.6 days", lastMove: 0, trend: "up", returns: 1, units12: 1920, bin: "D-14-03" }),
  mk({ sku: "EL-4412", name: "Industrial Cable Pro 100m", cat: "Electrical", supplier: "eurocable", cost: 27.20, price: 36.80, uom: "drum",
    dub: { onHand: 96, avail: 84, alloc: 12 }, nas: { onHand: 30, avail: 30, alloc: 0 }, incoming: 0, wkDemand: 9, wkDemandNas: 3,
    reorder: 40, safety: 20, moq: 50, lead: 9, health: "Healthy", cover: "9.3 weeks", lastMove: 1, trend: "flat", returns: 0, units12: 468, bin: "D-14-05" }),
  mk({ sku: "EL-4521", name: "SWA Cable Gland 20mm (pack 10)", cat: "Electrical", supplier: "atlas", cost: 17.10, price: 24.60, uom: "pack",
    dub: { onHand: 22, avail: 0, alloc: 22 }, nas: { onHand: 40, avail: 34, alloc: 6 }, incoming: 300, po: "PO-8821", wkDemand: 46, wkDemandNas: 12,
    reorder: 120, safety: 60, moq: 100, lead: 28, health: "Stockout", cover: "0 days", lastMove: 0, trend: "up", returns: 0, units12: 2210, bin: "D-15-11" }),
  mk({ sku: "EL-2210", name: "Twin & Earth 2.5mm 100m", cat: "Electrical", supplier: "eurocable", cost: 48.90, price: 64.80, uom: "coil",
    dub: { onHand: 214, avail: 168, alloc: 46 }, nas: { onHand: 88, avail: 80, alloc: 8 }, incoming: 150, po: "PO-8834", wkDemand: 41, wkDemandNas: 14,
    reorder: 120, safety: 60, moq: 50, lead: 9, health: "Healthy", cover: "5.2 weeks", lastMove: 0, trend: "flat", returns: 2, units12: 2860, bin: "D-12-01" }),
  mk({ sku: "EL-5530", name: "Metal Clad Double Socket", cat: "Electrical", supplier: "atlas", cost: 6.40, price: 8.95, uom: "each",
    dub: { onHand: 410, avail: 170, alloc: 240 }, nas: { onHand: 260, avail: 248, alloc: 12 }, incoming: 600, po: "PO-8821", wkDemand: 118, wkDemandNas: 30,
    reorder: 350, safety: 150, moq: 200, lead: 28, health: "Low", cover: "1.4 weeks", lastMove: 0, trend: "up", returns: 3, units12: 6120, bin: "D-16-07" }),
  mk({ sku: "EL-3102", name: "LED Batten 1500mm Twin", cat: "Electrical", supplier: "lumos", cost: 19.20, price: 27.50, uom: "each",
    dub: { onHand: 342, avail: 252, alloc: 90 }, nas: { onHand: 120, avail: 120, alloc: 0 }, incoming: 0, wkDemand: 38, wkDemandNas: 9,
    reorder: 150, safety: 70, moq: 60, lead: 16, health: "Healthy", cover: "6.6 weeks", lastMove: 0, trend: "flat", returns: 5, units12: 2140, bin: "D-18-02" }),
  mk({ sku: "EL-6120", name: "Cable Tray 300mm × 3m Galv", cat: "Electrical", supplier: "atlas", cost: 41.60, price: 58.00, uom: "length",
    dub: { onHand: 184, avail: 184, alloc: 0 }, nas: { onHand: 258, avail: 258, alloc: 0 }, incoming: 0, wkDemand: 1, wkDemandNas: 0,
    reorder: 40, safety: 20, moq: 50, lead: 28, health: "Dead", cover: "8+ years", lastMove: 212, trend: "down", returns: 0, units12: 18, bin: "N-04-12" }),
  mk({ sku: "FIX-2201", name: "M10 Hex Bolt Box 100", cat: "Fixings", supplier: "eurofix", cost: 18.10, price: 23.90, uom: "box",
    dub: { onHand: 684, avail: 520, alloc: 164 }, nas: { onHand: 210, avail: 196, alloc: 14 }, incoming: 500, po: "PO-8830", wkDemand: 148, wkDemandNas: 34,
    reorder: 320, safety: 150, moq: 250, lead: 14, health: "Healthy", cover: "4.6 weeks", lastMove: 0, trend: "flat", returns: 1, units12: 7440, bin: "D-02-04" }),
  mk({ sku: "FIX-2240", name: "M10 Nyloc Nut Box 200", cat: "Fixings", supplier: "eurofix", cost: 14.20, price: 19.60, uom: "box",
    dub: { onHand: 390, avail: 330, alloc: 60 }, nas: { onHand: 120, avail: 120, alloc: 0 }, incoming: 300, po: "PO-8830", wkDemand: 86, wkDemandNas: 18,
    reorder: 200, safety: 90, moq: 150, lead: 14, health: "Healthy", cover: "4.5 weeks", lastMove: 0, trend: "flat", returns: 0, units12: 4380, bin: "D-02-06" }),
  mk({ sku: "FIX-1180", name: "Concrete Screw 7.5×100 Box 100", cat: "Fixings", supplier: "eurofix", cost: 23.10, price: 32.40, uom: "box",
    dub: { onHand: 146, avail: 96, alloc: 50 }, nas: { onHand: 62, avail: 62, alloc: 0 }, incoming: 0, wkDemand: 44, wkDemandNas: 9,
    reorder: 110, safety: 50, moq: 100, lead: 14, health: "Low", cover: "2.2 weeks", lastMove: 0, trend: "up", returns: 0, units12: 2210, bin: "D-03-01" }),
  mk({ sku: "FIX-3105", name: "Chemical Anchor Resin 380ml", cat: "Fixings", supplier: "hansen", cost: 8.20, price: 11.80, uom: "cartridge",
    dub: { onHand: 520, avail: 400, alloc: 120 }, nas: { onHand: 180, avail: 180, alloc: 0 }, incoming: 0, wkDemand: 64, wkDemandNas: 16,
    reorder: 240, safety: 100, moq: 240, lead: 18, health: "Healthy", cover: "8.1 weeks", lastMove: 0, trend: "flat", returns: 6, units12: 3320, bin: "D-05-09" }),
  mk({ sku: "FIX-4410", name: "Threaded Rod M12 × 3m Galv", cat: "Fixings", supplier: "ifc", cost: 4.90, price: 6.95, uom: "length",
    dub: { onHand: 860, avail: 710, alloc: 150 }, nas: { onHand: 300, avail: 300, alloc: 0 }, incoming: 0, wkDemand: 110, wkDemandNas: 28,
    reorder: 400, safety: 180, moq: 300, lead: 6, health: "Healthy", cover: "7.8 weeks", lastMove: 0, trend: "flat", returns: 0, units12: 5690, bin: "D-07-02" }),
  mk({ sku: "SAF-1892", name: "Safety Glasses Clear", cat: "PPE", supplier: "safepro", cost: 2.10, price: 3.95, uom: "pair",
    dub: { onHand: 420, avail: 380, alloc: 40 }, nas: { onHand: 1840, avail: 1630, alloc: 210 }, incoming: 0, wkDemand: 64, wkDemandNas: 82,
    reorder: 300, safety: 150, moq: 500, lead: 10, health: "Excess", cover: "22 weeks", lastMove: 0, trend: "down", returns: 0, units12: 4260, bin: "N-11-03" }),
  mk({ sku: "SAF-2204", name: "Hi-Vis Vest Yellow XL", cat: "PPE", supplier: "safepro", cost: 1.85, price: 3.60, uom: "each",
    dub: { onHand: 960, avail: 820, alloc: 140 }, nas: { onHand: 600, avail: 560, alloc: 40 }, incoming: 0, wkDemand: 120, wkDemandNas: 60,
    reorder: 500, safety: 200, moq: 500, lead: 10, health: "Healthy", cover: "8.7 weeks", lastMove: 0, trend: "flat", returns: 1, units12: 9180, bin: "D-21-04" }),
  mk({ sku: "SAF-3310", name: "Nitrile Gloves Box 100 (L)", cat: "PPE", supplier: "safepro", cost: 4.60, price: 7.40, uom: "box",
    dub: { onHand: 280, avail: 150, alloc: 130 }, nas: { onHand: 140, avail: 120, alloc: 20 }, incoming: 800, po: "PO-8826", wkDemand: 180, wkDemandNas: 64,
    reorder: 400, safety: 200, moq: 400, lead: 10, health: "Low", cover: "0.8 weeks", lastMove: 0, trend: "up", returns: 2, units12: 11640, bin: "D-21-09" }),
  mk({ sku: "SAF-1450", name: "Safety Helmet White Vented", cat: "PPE", supplier: "safepro", cost: 5.90, price: 9.80, uom: "each",
    dub: { onHand: 240, avail: 210, alloc: 30 }, nas: { onHand: 180, avail: 180, alloc: 0 }, incoming: 0, wkDemand: 26, wkDemandNas: 10,
    reorder: 100, safety: 50, moq: 100, lead: 10, health: "Healthy", cover: "11 weeks", lastMove: 0, trend: "flat", returns: 1, units12: 1480, bin: "D-22-01" }),
  mk({ sku: "SAF-4020", name: "Ear Defenders SNR 30", cat: "PPE", supplier: "safepro", cost: 7.40, price: 12.90, uom: "each",
    dub: { onHand: 610, avail: 610, alloc: 0 }, nas: { onHand: 714, avail: 714, alloc: 0 }, incoming: 0, wkDemand: 0, wkDemandNas: 0,
    reorder: 60, safety: 30, moq: 200, lead: 10, health: "Dead", cover: "No demand", lastMove: 196, trend: "down", returns: 0, units12: 22, bin: "N-12-07" }),
  mk({ sku: "IC-2290", name: "Heavy Duty Cable Ties 300mm (100)", cat: "Industrial Consumables", supplier: "atlas", cost: 4.95, price: 7.40, uom: "bag",
    dub: { onHand: 60, avail: 0, alloc: 60 }, nas: { onHand: 210, avail: 180, alloc: 30 }, incoming: 600, po: "PO-8821", wkDemand: 96, wkDemandNas: 25,
    reorder: 250, safety: 120, moq: 500, lead: 28, health: "Stockout", cover: "0 days", lastMove: 0, trend: "up", returns: 0, units12: 5040, bin: "D-09-02" }),
  mk({ sku: "IC-1044", name: "Cutting Disc 115mm (box 25)", cat: "Industrial Consumables", supplier: "bristol", cost: 24.80, price: 34.50, uom: "box",
    dub: { onHand: 188, avail: 128, alloc: 60 }, nas: { onHand: 74, avail: 74, alloc: 0 }, incoming: 0, wkDemand: 36, wkDemandNas: 9,
    reorder: 90, safety: 40, moq: 60, lead: 12, health: "Healthy", cover: "5.2 weeks", lastMove: 0, trend: "flat", returns: 1, units12: 1880, bin: "D-10-04" }),
  mk({ sku: "IC-5120", name: "Silicone Sealant Clear 310ml (box 25)", cat: "Industrial Consumables", supplier: "hansen", cost: 38.60, price: 52.50, uom: "box",
    dub: { onHand: 132, avail: 84, alloc: 48 }, nas: { onHand: 60, avail: 60, alloc: 0 }, incoming: 0, wkDemand: 22, wkDemandNas: 6,
    reorder: 60, safety: 30, moq: 40, lead: 18, health: "Healthy", cover: "6 weeks", lastMove: 0, trend: "flat", returns: 9, units12: 1170, bin: "D-11-06" }),
  mk({ sku: "IC-6602", name: "Spray Adhesive 500ml (box 12)", cat: "Industrial Consumables", supplier: "hansen", cost: 55.10, price: 71.40, uom: "box",
    dub: { onHand: 74, avail: 44, alloc: 30 }, nas: { onHand: 26, avail: 26, alloc: 0 }, incoming: 0, wkDemand: 8, wkDemandNas: 2,
    reorder: 30, safety: 15, moq: 20, lead: 18, health: "Healthy", cover: "9.2 weeks", lastMove: 0, trend: "flat", returns: 1, units12: 420, bin: "D-11-08" }),
  mk({ sku: "IC-4470", name: "PTFE Tape 12mm (pack 10)", cat: "Industrial Consumables", supplier: "atlas", cost: 2.30, price: 3.90, uom: "pack",
    dub: { onHand: 140, avail: 90, alloc: 50 }, nas: { onHand: 0, avail: 0, alloc: 0 }, incoming: 800, po: "PO-8821", wkDemand: 74, wkDemandNas: 18,
    reorder: 300, safety: 150, moq: 500, lead: 28, health: "Low", cover: "1.2 weeks", lastMove: 0, trend: "up", returns: 0, units12: 3860, bin: "D-09-07" }),
  mk({ sku: "IC-7715", name: "Anti-Slip Tape 50mm Yellow/Black", cat: "Industrial Consumables", supplier: "atlas", cost: 11.80, price: 18.40, uom: "roll",
    dub: { onHand: 220, avail: 220, alloc: 0 }, nas: { onHand: 300, avail: 300, alloc: 0 }, incoming: 0, wkDemand: 1, wkDemandNas: 0,
    reorder: 40, safety: 20, moq: 100, lead: 28, health: "Dead", cover: "10+ years", lastMove: 188, trend: "down", returns: 0, units12: 30, bin: "N-06-02" }),
  mk({ sku: "TL-7710", name: "SDS Drill Bit Set 12pc", cat: "Tools", supplier: "toolcraft", cost: 29.80, price: 42.00, uom: "set",
    dub: { onHand: 96, avail: 72, alloc: 24 }, nas: { onHand: 40, avail: 40, alloc: 0 }, incoming: 0, wkDemand: 14, wkDemandNas: 4,
    reorder: 40, safety: 20, moq: 24, lead: 21, health: "Healthy", cover: "6.9 weeks", lastMove: 0, trend: "flat", returns: 2, units12: 760, bin: "D-24-01" }),
  mk({ sku: "TL-3321", name: "Cordless Impact Driver 18V (body, 2023 model)", cat: "Tools", supplier: "toolcraft", cost: 79.00, price: 119.00, uom: "each",
    dub: { onHand: 88, avail: 88, alloc: 0 }, nas: { onHand: 92, avail: 92, alloc: 0 }, incoming: 0, wkDemand: 0, wkDemandNas: 0,
    reorder: 20, safety: 10, moq: 24, lead: 21, health: "Dead", cover: "Superseded", lastMove: 241, trend: "down", returns: 0, units12: 6, bin: "N-15-03" }),
  mk({ sku: "TL-5009", name: "Spirit Level 1200mm", cat: "Tools", supplier: "celtic", cost: 19.60, price: 29.90, uom: "each",
    dub: { onHand: 118, avail: 88, alloc: 30 }, nas: { onHand: 60, avail: 60, alloc: 0 }, incoming: 0, wkDemand: 10, wkDemandNas: 3,
    reorder: 40, safety: 20, moq: 20, lead: 7, health: "Healthy", cover: "11.8 weeks", lastMove: 0, trend: "flat", returns: 0, units12: 540, bin: "D-24-06" }),
  mk({ sku: "JAN-2210", name: "Heavy Duty Refuse Sacks (200)", cat: "Janitorial", supplier: "kingfield", cost: 14.80, price: 21.90, uom: "box",
    dub: { onHand: 310, avail: 260, alloc: 50 }, nas: { onHand: 180, avail: 170, alloc: 10 }, incoming: 200, po: "PO-8837", wkDemand: 62, wkDemandNas: 30,
    reorder: 150, safety: 70, moq: 100, lead: 5, health: "Healthy", cover: "5 weeks", lastMove: 0, trend: "flat", returns: 0, units12: 4710, bin: "D-30-02" }),
  mk({ sku: "JAN-4150", name: "Antibacterial Hand Soap 5L", cat: "Janitorial", supplier: "kingfield", cost: 9.40, price: 14.60, uom: "each",
    dub: { onHand: 240, avail: 200, alloc: 40 }, nas: { onHand: 150, avail: 150, alloc: 0 }, incoming: 0, wkDemand: 34, wkDemandNas: 16,
    reorder: 100, safety: 50, moq: 60, lead: 5, health: "Healthy", cover: "7 weeks", lastMove: 0, trend: "flat", returns: 1, units12: 2560, bin: "D-30-07" }),
  mk({ sku: "PK-1130", name: "Stretch Wrap 400mm Clear", cat: "Packaging", supplier: "midpack", cost: 16.20, price: 22.21, uom: "roll",
    dub: { onHand: 420, avail: 380, alloc: 40 }, nas: { onHand: 160, avail: 160, alloc: 0 }, incoming: 0, wkDemand: 40, wkDemandNas: 12,
    reorder: 150, safety: 70, moq: 120, lead: 10, health: "Healthy", cover: "10.5 weeks", lastMove: 0, trend: "flat", returns: 0, units12: 2480, bin: "D-33-01" }),
  mk({ sku: "PK-2240", name: "Pallet Strapping Kit 12mm", cat: "Packaging", supplier: "midpack", cost: 64.00, price: 89.00, uom: "kit",
    dub: { onHand: 40, avail: 40, alloc: 0 }, nas: { onHand: 62, avail: 62, alloc: 0 }, incoming: 0, wkDemand: 0, wkDemandNas: 0,
    reorder: 10, safety: 5, moq: 20, lead: 10, health: "Dead", cover: "No demand", lastMove: 183, trend: "down", returns: 0, units12: 4, bin: "N-18-01" }),
];
export const product = (sku: string) => PRODUCTS.find(p => p.sku === sku) as Product;
export const stockValue = (p: Product) => (p.dub.onHand + p.nas.onHand) * p.cost;

export const INVENTORY_BY_CAT: [string, number][] = [
  ["Electrical", 742000], ["Fixings", 486000], ["Industrial Consumables", 412000], ["PPE", 338000], ["Tools", 264000], ["Janitorial", 126000], ["Packaging", 92000],
];
export const INVENTORY_AGEING: [string, number][] = [
  ["0–30 days", 1402600], ["31–60 days", 516400], ["61–90 days", 254580], ["91–180 days", 212220], ["180+ days", 74200],
];
export const INVENTORY_SPLIT = { available: 1940000, allocated: 234000, slow: 286420 };
export const STOCK_HEALTH: [string, number][] = [
  ["Healthy", 6874], ["Low", 598], ["Critical", 64], ["Stockout", 28], ["Excess", 486], ["Dead", 376],
];

/* Slow & dead stock (€286,420): three age bands, the listed lines are the biggest in each band. */
export const SLOW_BANDS = [
  { band: "90–120 days", value: 96840, skus: 214 },
  { band: "120–180 days", value: 115380, skus: 188 },
  { band: "180+ days", value: 74200, skus: 376 },
];
export type SlowLine = { sku: string; name: string; wh: string; qty: number; value: number; days: number; lastSale: string; action: string; why: string; release: number };
export const SLOW_LINES: SlowLine[] = [
  { sku: "TL-3321", name: "Cordless Impact Driver 18V (2023 model)", wh: "Naas + Dublin", qty: 180, value: 14220, days: 241, lastSale: "28 Jan", action: "Supplier return candidate",
    why: "Superseded by the 2025 model. Toolcraft accepts returns on superseded lines at 15% restocking.", release: 12090 },
  { sku: "EL-6120", name: "Cable Tray 300mm × 3m Galv", wh: "Naas", qty: 442, value: 18390, days: 212, lastSale: "24 Feb", action: "Target specific customers",
    why: "Horizon Electrical and Liffey M&E bought tray in 2025. Neither has been offered it this year.", release: 11030 },
  { sku: "SAF-4020", name: "Ear Defenders SNR 30", wh: "Naas + Dublin", qty: 1324, value: 9800, days: 196, lastSale: "13 Mar", action: "Bundle with fast seller",
    why: "Bundle with Hi-Vis Vest (SAF-2204, 180/wk) in site-starter packs for contractors.", release: 6860 },
  { sku: "IC-7715", name: "Anti-Slip Tape 50mm Yellow/Black", wh: "Naas", qty: 520, value: 6140, days: 188, lastSale: "20 Mar", action: "Promotion candidate",
    why: "Facilities accounts buy it in Q4 for winter. Run it in the October flyer.", release: 4300 },
  { sku: "PK-2240", name: "Pallet Strapping Kit 12mm", wh: "Naas + Dublin", qty: 102, value: 6530, days: 183, lastSale: "25 Mar", action: "Stop replenishment",
    why: "No customer demand in six months. The reorder point still says 10.", release: 3260 },
  { sku: "SAF-1892", name: "Safety Glasses Clear", wh: "Naas", qty: 1840, value: 3860, days: 104, lastSale: "Today", action: "Transfer warehouse",
    why: "22 weeks' cover in Naas. Dublin sells 64/wk. Move 600 and skip the next PO.", release: 2940 },
  { sku: "EL-3102", name: "LED Batten 1500mm Twin (Naas)", wh: "Naas", qty: 120, value: 2300, days: 132, lastSale: "12 Aug", action: "Transfer warehouse",
    why: "Naas has 120 and sells 9/wk. Dublin sells 38/wk. Move 80.", release: 1540 },
  { sku: "FIX-3105", name: "Chemical Anchor Resin 380ml", wh: "Naas", qty: 180, value: 1480, days: 96, lastSale: "2 Sep", action: "Reduce purchase quantity",
    why: "MOQ of 240 is double Naas's monthly demand. Buy for Dublin only, feed Naas by shuttle.", release: 980 },
];
export const SLOW_ACTIONS: [string, number, number][] = [
  // action, lines, release
  ["Stop replenishment", 96, 22400], ["Transfer warehouse", 58, 31600], ["Bundle with fast seller", 41, 18900],
  ["Target specific customers", 73, 34200], ["Reduce purchase quantity", 112, 21700], ["Promotion candidate", 64, 19800], ["Supplier return candidate", 38, 19400],
];

/* ---------- purchase orders ---------- */
export type POLine = { sku: string; qty: number; cost: number };
export type PO = {
  id: string; supplier: string; value: number; items: number; ordered: string; promised: string; expected: string; wh: WH;
  status: "Late" | "Due today" | "On time" | "Confirmed" | "Awaiting confirmation" | "Received" | "Part received" | "Draft";
  deps: number; depValue: number; risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; daysLate: number; buyer: string; eta?: string; pallets?: number; lines?: POLine[]; note?: string;
};
export const POS: PO[] = [
  { id: "PO-8821", supplier: "atlas", value: 38640, items: 14, ordered: "15 Sep", promised: "20 Sep", expected: "26 Sep", wh: "DUB", status: "Late", deps: 6, depValue: 41880,
    risk: "CRITICAL", daysLate: 5, buyer: "emma", eta: "Tomorrow 10:30", pallets: 18, note: "Atlas has moved the date three times: 20 Sep, then 24 Sep, then 25 Sep. Last change at 09:04 today: now 26 Sep 10:30.",
    lines: [
      { sku: "EL-4408", qty: 120, cost: 21.40 }, { sku: "EL-4521", qty: 300, cost: 17.10 }, { sku: "EL-5530", qty: 600, cost: 6.40 }, { sku: "IC-2290", qty: 600, cost: 4.95 },
      { sku: "IC-4470", qty: 800, cost: 2.30 },
    ] },
  { id: "PO-8817", supplier: "hansen", value: 12460, items: 6, ordered: "8 Sep", promised: "22 Sep", expected: "29 Sep", wh: "DUB", status: "Late", deps: 3, depValue: 7820,
    risk: "HIGH", daysLate: 3, buyer: "emma", eta: "29 Sep", pallets: 6, note: "Hansen short-shipped the resin line in August as well." },
  { id: "PO-8809", supplier: "toolcraft", value: 18920, items: 9, ordered: "2 Sep", promised: "23 Sep", expected: "27 Sep", wh: "DUB", status: "Late", deps: 2, depValue: 3940,
    risk: "MEDIUM", daysLate: 2, buyer: "ciaran", eta: "27 Sep", pallets: 8 },
  { id: "PO-8812", supplier: "lumos", value: 9840, items: 4, ordered: "4 Sep", promised: "22 Sep", expected: "30 Sep", wh: "NAS", status: "Late", deps: 1, depValue: 1280,
    risk: "MEDIUM", daysLate: 3, buyer: "emma", eta: "30 Sep", pallets: 4 },
  { id: "PO-8815", supplier: "atlas", value: 22310, items: 11, ordered: "5 Sep", promised: "24 Sep", expected: "2 Oct", wh: "NAS", status: "Late", deps: 2, depValue: 5360,
    risk: "HIGH", daysLate: 1, buyer: "emma", eta: "2 Oct", pallets: 10 },
  { id: "PO-8830", supplier: "eurofix", value: 32400, items: 12, ordered: "11 Sep", promised: "25 Sep", expected: "25 Sep", wh: "DUB", status: "Due today", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "ciaran", eta: "Today 11:00", pallets: 48 },
  { id: "PO-8826", supplier: "safepro", value: 9800, items: 5, ordered: "15 Sep", promised: "25 Sep", expected: "25 Sep", wh: "NAS", status: "Due today", deps: 1, depValue: 2140,
    risk: "LOW", daysLate: 0, buyer: "ciaran", eta: "Today 08:40 · arrived", pallets: 22 },
  { id: "PO-8834", supplier: "eurocable", value: 26180, items: 7, ordered: "16 Sep", promised: "25 Sep", expected: "25 Sep", wh: "DUB", status: "Due today", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "emma", eta: "Today 13:15", pallets: 34 },
  { id: "PO-8837", supplier: "kingfield", value: 14920, items: 8, ordered: "22 Sep", promised: "25 Sep", expected: "25 Sep", wh: "DUB", status: "Due today", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "ciaran", eta: "Today 10:00", pallets: 41 },
  { id: "PO-8839", supplier: "bristol", value: 18460, items: 6, ordered: "12 Sep", promised: "25 Sep", expected: "25 Sep", wh: "DUB", status: "Due today", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "emma", eta: "Today 14:30", pallets: 28 },
  { id: "PO-8841", supplier: "midpack", value: 11240, items: 4, ordered: "17 Sep", promised: "25 Sep", expected: "25 Sep", wh: "NAS", status: "Due today", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "ciaran", eta: "Today 12:00", pallets: 39 },
  { id: "PO-8843", supplier: "ifc", value: 35000, items: 10, ordered: "19 Sep", promised: "25 Sep", expected: "25 Sep", wh: "DUB", status: "Due today", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "ciaran", eta: "Today 15:45", pallets: 34 },
  { id: "PO-8846", supplier: "eurocable", value: 21760, items: 5, ordered: "21 Sep", promised: "30 Sep", expected: "30 Sep", wh: "DUB", status: "Confirmed", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "emma", eta: "30 Sep", pallets: 12 },
  { id: "PO-8848", supplier: "eurofix", value: 28450, items: 9, ordered: "23 Sep", promised: "7 Oct", expected: "7 Oct", wh: "NAS", status: "Confirmed", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "ciaran", eta: "7 Oct", pallets: 20 },
  { id: "PO-8850", supplier: "toolcraft", value: 16280, items: 7, ordered: "24 Sep", promised: "15 Oct", expected: "—", wh: "DUB", status: "Awaiting confirmation", deps: 0, depValue: 0,
    risk: "LOW", daysLate: 0, buyer: "ciaran", eta: "Not confirmed", pallets: 7 },
];
export const po = (id: string) => POS.find(p => p.id === id) as PO;
/* Who needs each constrained SKU right now: order, quantity, whether it is allocated. */
export const SKU_DEMAND: Record<string, { so: string; qty: number; status: "Short" | "Allocated" }[]> = {
  "EL-4408": [{ so: "SO-10482", qty: 28, status: "Short" }, { so: "SO-10526", qty: 18, status: "Short" }, { so: "SO-10497", qty: 12, status: "Short" }, { so: "SO-10509", qty: 10, status: "Short" },
    { so: "SO-10529", qty: 12, status: "Allocated" }, { so: "SO-10499", qty: 8, status: "Allocated" }, { so: "SO-10502", qty: 6, status: "Allocated" }],
  "EL-4521": [{ so: "SO-10482", qty: 60, status: "Short" }, { so: "SO-10499", qty: 22, status: "Allocated" }],
  "IC-2290": [{ so: "SO-10482", qty: 80, status: "Short" }, { so: "SO-10515", qty: 40, status: "Short" }, { so: "SO-10502", qty: 60, status: "Allocated" }],
  "IC-4470": [{ so: "SO-10488", qty: 40, status: "Short" }, { so: "SO-10520", qty: 20, status: "Short" }, { so: "SO-10499", qty: 50, status: "Allocated" }],
};
/* PO-8821's six dependent customer orders: €41,880. */
export const PO8821_DEPS = ["SO-10482", "SO-10497", "SO-10509", "SO-10515", "SO-10488", "SO-10520"];

/* Goods in today: 7 supplier deliveries, 246 pallets, €148,000. */
export const GOODS_IN_TODAY = ["PO-8826", "PO-8837", "PO-8830", "PO-8841", "PO-8834", "PO-8839", "PO-8843"];

/* ---------- sales orders ---------- */
export type SOLine = { sku: string; qty: number; price: number; alloc: number; status: "Allocated" | "Short" | "Picked" | "Substitute offered" };
export type SO = {
  id: string; cust: string; am: string; value: number; margin: number; lines: number; short: number; stock: string; wh: WH; required: string;
  status: string; route: string; risk: "HIGH" | "MEDIUM" | "ON TRACK" | "LOW"; reason?: string; placed: string; channel: string; custPO: string;
  depPO?: string; today?: boolean; picker?: string;
};
const SOx = (o: SO) => o;
export const ORDERS: SO[] = [
  SOx({ id: "SO-10482", cust: "murphy", am: "sarah", value: 27640, margin: 24.7, lines: 18, short: 3, stock: "3 short", wh: "DUB", required: "26 Sep", status: "Part allocated",
    route: "D14", risk: "HIGH", reason: "Late supplier · PO-8821", placed: "22 Sep 11:18", channel: "Rep order", custPO: "MBS-77412", depPO: "PO-8821", today: true, picker: "tomasz" }),
  SOx({ id: "SO-10491", cust: "westbrook", am: "david", value: 8420, margin: 26.8, lines: 11, short: 0, stock: "Available", wh: "DUB", required: "26 Sep", status: "Picking",
    route: "D07", risk: "ON TRACK", placed: "24 Sep 15:40", channel: "B2B portal", custPO: "WH-LUC-2209", picker: "grainne" }),
  SOx({ id: "SO-10503", cust: "doyle", am: "sarah", value: 16240, margin: 22.1, lines: 9, short: 0, stock: "Available", wh: "DUB", required: "26 Sep", status: "Credit hold",
    route: "—", risk: "HIGH", reason: "Credit hold · €8,920 over limit", placed: "Today 08:31", channel: "Email", custPO: "DC-HSF-0918" }),
  SOx({ id: "SO-10478", cust: "core", am: "mark", value: 11880, margin: 28.4, lines: 7, short: 0, stock: "Available", wh: "NAS", required: "26 Sep", status: "Packed",
    route: "N04", risk: "ON TRACK", placed: "23 Sep 09:12", channel: "EDI", custPO: "CF-PW-44120" }),
  SOx({ id: "SO-10497", cust: "horizon", am: "sarah", value: 4860, margin: 25.2, lines: 6, short: 1, stock: "1 short", wh: "DUB", required: "26 Sep", status: "Part allocated",
    route: "D14", risk: "HIGH", reason: "Late supplier · PO-8821", placed: "24 Sep 14:05", channel: "Phone", custPO: "HE-3381", depPO: "PO-8821", today: true }),
  SOx({ id: "SO-10509", cust: "quinlan", am: "david", value: 3120, margin: 24.9, lines: 4, short: 1, stock: "1 short", wh: "DUB", required: "26 Sep", status: "Part allocated",
    route: "D04", risk: "HIGH", reason: "Late supplier · PO-8821", placed: "24 Sep 11:20", channel: "B2B portal", custPO: "QEC-1190", depPO: "PO-8821", today: true }),
  SOx({ id: "SO-10515", cust: "leinster", am: "michael", value: 2480, margin: 21.0, lines: 5, short: 1, stock: "1 short", wh: "DUB", required: "29 Sep", status: "Part allocated",
    route: "D16", risk: "MEDIUM", reason: "Late supplier · PO-8821", placed: "25 Sep 07:14", channel: "EDI", custPO: "LPS-SITE09-771", depPO: "PO-8821" }),
  SOx({ id: "SO-10488", cust: "grange", am: "sarah", value: 2210, margin: 23.4, lines: 3, short: 1, stock: "1 short", wh: "NAS", required: "29 Sep", status: "Part allocated",
    route: "N02", risk: "MEDIUM", reason: "Late supplier · PO-8821", placed: "23 Sep 16:02", channel: "Phone", custPO: "GC-CRD-45", depPO: "PO-8821" }),
  SOx({ id: "SO-10520", cust: "kildare", am: "mark", value: 1570, margin: 25.6, lines: 4, short: 1, stock: "1 short", wh: "NAS", required: "29 Sep", status: "Part allocated",
    route: "N04", risk: "MEDIUM", reason: "Late supplier · PO-8821", placed: "24 Sep 15:12", channel: "B2B portal", custPO: "KBC-9921", depPO: "PO-8821" }),
  SOx({ id: "SO-10526", cust: "liffey", am: "david", value: 4480, margin: 23.9, lines: 5, short: 1, stock: "1 short", wh: "DUB", required: "26 Sep", status: "Part allocated",
    route: "D09", risk: "HIGH", reason: "Stock shortage · EL-4408 in Naas, not Dublin", placed: "24 Sep 10:44", channel: "Rep order", custPO: "LME-HSQ-212", today: true }),
  SOx({ id: "SO-10531", cust: "westbrook", am: "david", value: 2380, margin: 27.2, lines: 7, short: 0, stock: "Available", wh: "DUB", required: "25 Sep", status: "Packed",
    route: "D11", risk: "HIGH", reason: "Vehicle capacity · D11 over weight by 340kg", placed: "24 Sep 12:02", channel: "B2B portal", custPO: "WH-MAY-2211", today: true }),
  SOx({ id: "SO-10536", cust: "harbourpoint", am: "mark", value: 2120, margin: 26.7, lines: 8, short: 0, stock: "Available", wh: "DUB", required: "25 Sep", status: "Picking",
    route: "W01", risk: "HIGH", reason: "Picking delay · 2 lines not started, cutoff 11:30", placed: "Today 08:48", channel: "Email", custPO: "HPF-0925", today: true, picker: "adam" }),
  SOx({ id: "SO-10474", cust: "mcgrath", am: "sarah", value: 11040, margin: 22.4, lines: 10, short: 1, stock: "Count mismatch", wh: "NAS", required: "26 Sep", status: "Picking",
    route: "K01", risk: "MEDIUM", reason: "Stock discrepancy · bin N-07-04 shows 60, found 24", placed: "23 Sep 06:58", channel: "Phone", custPO: "MCE-N7-338", picker: "piotr" }),
  SOx({ id: "SO-10540", cust: "swords", am: "david", value: 2160, margin: 24.1, lines: 6, short: 0, stock: "Available", wh: "DUB", required: "26 Sep", status: "Allocated",
    route: "D04", risk: "MEDIUM", reason: "Warehouse delay · wave 3 behind by 40 min", placed: "Yesterday 15:30", channel: "B2B portal", custPO: "SBS-5520" }),
  SOx({ id: "SO-10528", cust: "clondalkin", am: "sarah", value: 1680, margin: 24.6, lines: 5, short: 0, stock: "Available", wh: "DUB", required: "25 Sep", status: "Packed",
    route: "D11", risk: "HIGH", reason: "Vehicle capacity · D11 over weight", placed: "24 Sep 12:30", channel: "Phone", custPO: "CPH-771", today: true }),
  SOx({ id: "SO-10533", cust: "tallaght", am: "david", value: 2780, margin: 26.8, lines: 7, short: 0, stock: "Available", wh: "DUB", required: "26 Sep", status: "Credit hold",
    route: "—", risk: "MEDIUM", reason: "Credit hold · €6,420 overdue 60+ days", placed: "Today 08:22", channel: "Rep order", custPO: "TTC-0925" }),
  // on track
  SOx({ id: "SO-10499", cust: "leinster", am: "michael", value: 9640, margin: 21.8, lines: 22, short: 0, stock: "Available", wh: "DUB", required: "26 Sep", status: "Allocated",
    route: "D16", risk: "ON TRACK", placed: "24 Sep 09:10", channel: "EDI", custPO: "LPS-SITE03-760" }),
  SOx({ id: "SO-10502", cust: "core", am: "mark", value: 6310, margin: 28.9, lines: 12, short: 0, stock: "Available", wh: "DUB", required: "26 Sep", status: "Picking",
    route: "D14", risk: "ON TRACK", placed: "24 Sep 16:40", channel: "EDI", custPO: "CF-SF-44131", picker: "sean" }),
  SOx({ id: "SO-10505", cust: "fitzwilliam", am: "mark", value: 3840, margin: 26.2, lines: 9, short: 0, stock: "Available", wh: "DUB", required: "25 Sep", status: "Dispatched",
    route: "D16", risk: "ON TRACK", placed: "Today 08:05", channel: "Email", custPO: "FPM-B4-19" }),
  SOx({ id: "SO-10507", cust: "obrien", am: "david", value: 7260, margin: 23.6, lines: 14, short: 0, stock: "Available", wh: "NAS", required: "29 Sep", status: "Allocated",
    route: "Naas trunk", risk: "ON TRACK", placed: "22 Sep 10:30", channel: "EDI", custPO: "OBF-CRK-2241" }),
  SOx({ id: "SO-10511", cust: "kildare", am: "mark", value: 4190, margin: 25.3, lines: 8, short: 0, stock: "Available", wh: "NAS", required: "26 Sep", status: "Packed",
    route: "N04", risk: "ON TRACK", placed: "24 Sep 11:45", channel: "B2B portal", custPO: "KBC-9914" }),
  SOx({ id: "SO-10514", cust: "greenfield", am: "mark", value: 2640, margin: 27.9, lines: 6, short: 0, stock: "Available", wh: "NAS", required: "26 Sep", status: "Picking",
    route: "K01", risk: "ON TRACK", placed: "24 Sep 13:20", channel: "Phone", custPO: "GMS-311", picker: "piotr" }),
  SOx({ id: "SO-10518", cust: "horizon", am: "sarah", value: 5210, margin: 26.1, lines: 9, short: 0, stock: "Available", wh: "DUB", required: "25 Sep", status: "Delivered",
    route: "D07", risk: "ON TRACK", placed: "24 Sep 09:02", channel: "Phone", custPO: "HE-3377" }),
  SOx({ id: "SO-10522", cust: "wicklow", am: "david", value: 1960, margin: 29.4, lines: 7, short: 0, stock: "Available", wh: "DUB", required: "26 Sep", status: "New",
    route: "W01", risk: "ON TRACK", placed: "Today 09:02", channel: "B2B portal", custPO: "WHD-0925" }),
  SOx({ id: "SO-10524", cust: "midland", am: "mark", value: 3380, margin: 26.3, lines: 8, short: 0, stock: "Available", wh: "NAS", required: "29 Sep", status: "Allocated",
    route: "M01", risk: "ON TRACK", placed: "24 Sep 17:05", channel: "Email", custPO: "MTH-4410" }),
  SOx({ id: "SO-10529", cust: "murphy", am: "sarah", value: 4120, margin: 25.9, lines: 6, short: 0, stock: "Available", wh: "DUB", required: "29 Sep", status: "Allocated",
    route: "D14", risk: "ON TRACK", placed: "Today 07:52", channel: "B2B portal", custPO: "MBS-77430" }),
  SOx({ id: "SO-10535", cust: "ryan", am: "mark", value: 1240, margin: 27.8, lines: 4, short: 0, stock: "Available", wh: "NAS", required: "29 Sep", status: "New",
    route: "M01", risk: "ON TRACK", placed: "Today 08:55", channel: "Phone", custPO: "RTS-0925" }),
];
export const order = (id: string) => ORDERS.find(o => o.id === id) as SO;
export const AT_RISK_IDS = ["SO-10482", "SO-10503", "SO-10474", "SO-10531", "SO-10497", "SO-10526", "SO-10536", "SO-10509", "SO-10533", "SO-10515", "SO-10488", "SO-10540", "SO-10528", "SO-10520"];
/* Seven of the fourteen are on today's dispatch and at risk of fulfilment (credit holds excluded): €46,280. */
export const AT_RISK_TODAY = ["SO-10482", "SO-10497", "SO-10509", "SO-10526", "SO-10531", "SO-10536", "SO-10528"];
export const RISK_PROB: Record<string, number> = {
  "SO-10482": 0.92, "SO-10503": 0.85, "SO-10474": 0.55, "SO-10531": 0.7, "SO-10497": 0.9, "SO-10526": 0.8, "SO-10536": 0.65,
  "SO-10509": 0.9, "SO-10533": 0.6, "SO-10515": 0.45, "SO-10488": 0.45, "SO-10540": 0.4, "SO-10528": 0.7, "SO-10520": 0.4,
};

/* Murphy SO-10482: 18 lines, 15 allocated, 3 short on Atlas PO-8821. Lines total €27,640. */
export const SO10482_LINES: SOLine[] = [
  { sku: "FIX-2201", qty: 60, price: 23.90, alloc: 60, status: "Allocated" },
  { sku: "FIX-2240", qty: 40, price: 19.60, alloc: 40, status: "Allocated" },
  { sku: "FIX-1180", qty: 50, price: 32.40, alloc: 50, status: "Allocated" },
  { sku: "FIX-3105", qty: 120, price: 11.80, alloc: 120, status: "Allocated" },
  { sku: "FIX-4410", qty: 150, price: 6.95, alloc: 150, status: "Allocated" },
  { sku: "EL-4408", qty: 28, price: 28.40, alloc: 0, status: "Short" },
  { sku: "EL-4521", qty: 60, price: 24.60, alloc: 0, status: "Short" },
  { sku: "IC-2290", qty: 80, price: 7.40, alloc: 0, status: "Short" },
  { sku: "EL-2210", qty: 40, price: 64.80, alloc: 40, status: "Allocated" },
  { sku: "EL-5530", qty: 200, price: 8.95, alloc: 200, status: "Allocated" },
  { sku: "EL-3102", qty: 90, price: 27.50, alloc: 90, status: "Allocated" },
  { sku: "EL-6120", qty: 40, price: 58.00, alloc: 40, status: "Allocated" },
  { sku: "TL-7710", qty: 24, price: 42.00, alloc: 24, status: "Allocated" },
  { sku: "TL-5009", qty: 30, price: 29.90, alloc: 30, status: "Allocated" },
  { sku: "IC-1044", qty: 60, price: 34.50, alloc: 60, status: "Allocated" },
  { sku: "IC-5120", qty: 48, price: 52.50, alloc: 48, status: "Allocated" },
  { sku: "IC-6602", qty: 30, price: 71.40, alloc: 30, status: "Allocated" },
  { sku: "PK-1130", qty: 30, price: 22.21, alloc: 30, status: "Allocated" },
];
export const SO10482_PROFIT = { revenue: 27640, productCost: 20418, deliveryCost: 395, discount: 1940, gp: 6827, margin: 24.7, splitExtra: 185 };

/* Generic order profitability for the orders table (revenue, cost, delivery, discount). */
export const orderProfit = (o: SO) => {
  if (o.id === "SO-10482") return SO10482_PROFIT;
  const gp = Math.round(o.value * o.margin / 100);
  const deliveryCost = Math.round(38 + o.lines * 6.5);
  const discount = Math.round(o.value * (o.margin < 23 ? 0.09 : 0.05));
  return { revenue: o.value, productCost: o.value - gp - deliveryCost, deliveryCost, discount, gp, margin: o.margin, splitExtra: 0 };
};

/* ---------- inventory intelligence ---------- */
export const TRANSFER_EL4408 = {
  sku: "EL-4408", dubAvail: 12, nasAvail: 64, dubDemand7: 58, nasDemand7: 11, qty: 40, stockouts: 1, orders: ["SO-10497", "SO-10509", "SO-10526"], value: 12460,
  shuttle: "Naas → Dublin van at 11:00, lands 11:45, in time for D14 at 13:45",
  freeNote: "The 12 free in Dublin are held as trade-counter safety stock, so no waiting line can be completed from them.",
  murphyNote: "Murphy's 28 ship with its other two short lines on PO-8821, so 40 covers everything that can go today.",
};
export type Transfer = { id: string; sku: string; from: string; to: string; qty: number; why: string; protects: string; value: number; status: string };
export const TRANSFERS: Transfer[] = [
  { id: "TR-2291", sku: "EL-4408", from: "Naas", to: "Dublin", qty: 40, why: "Dublin has 12 free against 58 demand in 7 days. Naas has 64 against 11.", protects: "3 orders · 1 stockout avoided", value: 12460, status: "Recommended" },
  { id: "TR-2292", sku: "SAF-1892", from: "Naas", to: "Dublin", qty: 600, why: "Naas holds 22 weeks' cover. Moving 600 lets Dublin skip its October PO.", protects: "€1,260 PO avoided", value: 1260, status: "Recommended" },
  { id: "TR-2293", sku: "EL-3102", from: "Naas", to: "Dublin", qty: 80, why: "Naas sells 9/wk, Dublin 38/wk. Frees €1,540 of Naas slow stock.", protects: "Dublin cover to 8.7 weeks", value: 2200, status: "Recommended" },
  { id: "TR-2294", sku: "EL-4521", from: "Naas", to: "Dublin", qty: 30, why: "Dublin is at zero until PO-8821. 30 packs protect tomorrow's AM routes.", protects: "2 orders", value: 738, status: "Recommended" },
  { id: "TR-2288", sku: "IC-2290", from: "Naas", to: "Dublin", qty: 120, why: "Cable ties stocked out in Dublin on 23 Sep.", protects: "4 orders", value: 888, status: "In transit · lands 14:00" },
  { id: "TR-2285", sku: "FIX-2201", from: "Dublin", to: "Naas", qty: 60, why: "Naas below reorder point after the Grange order.", protects: "Naas cover to 7 weeks", value: 1434, status: "Completed 24 Sep" },
];
export const SUBSTITUTE = {
  orig: "EL-4408", sub: "EL-4412", unavailable: 28, available: 84, priceDiff: 8.40, compat: "Approved substitute", margin: 26.1,
  note: "Same conductor spec, higher sheath rating. Murphy has accepted EL-4412 twice this year.",
};
export type Replen = {
  sku: string; current: number; avail: number; forecast4w: number; lead: number; existingPO: string; suggest: number; when: string; stockout: string;
  confidence: number; reason: string; supplier: string; value: number;
};
export const REPLEN: Replen[] = [
  { sku: "EL-4408", current: 38, avail: 12, forecast4w: 141, lead: 28, existingPO: "PO-8821 · 120 due tomorrow", suggest: 160, when: "TODAY", stockout: "28 Sep",
    confidence: 91, reason: "Existing incoming PO does not provide sufficient cover against expected demand.", supplier: "atlas", value: 3424 },
  { sku: "EL-4521", current: 22, avail: 0, forecast4w: 196, lead: 28, existingPO: "PO-8821 · 300 due tomorrow", suggest: 200, when: "TODAY", stockout: "Now",
    confidence: 88, reason: "Demand up 34% on last quarter. PO-8821 covers 6 weeks, lead time is 4.", supplier: "atlas", value: 3420 },
  { sku: "SAF-3310", current: 280, avail: 150, forecast4w: 780, lead: 10, existingPO: "PO-8826 · 800 arrived 08:40", suggest: 400, when: "30 Sep", stockout: "14 Oct",
    confidence: 84, reason: "Winter uplift starts in October. Last year demand rose 22% in the first three weeks.", supplier: "safepro", value: 1840 },
  { sku: "FIX-1180", current: 146, avail: 96, forecast4w: 188, lead: 14, existingPO: "None", suggest: 200, when: "TODAY", stockout: "5 Oct",
    confidence: 86, reason: "No PO open. Three open quotes (€9,420) include it.", supplier: "eurofix", value: 4620 },
  { sku: "EL-5530", current: 410, avail: 170, forecast4w: 520, lead: 28, existingPO: "PO-8821 · 600 due tomorrow", suggest: 0, when: "No action", stockout: "—",
    confidence: 79, reason: "PO-8821 covers the next 8 weeks once it lands.", supplier: "atlas", value: 0 },
  { sku: "IC-4470", current: 140, avail: 90, forecast4w: 310, lead: 28, existingPO: "PO-8821 · 800 due tomorrow", suggest: 0, when: "No action", stockout: "—",
    confidence: 82, reason: "Covered by PO-8821.", supplier: "atlas", value: 0 },
  { sku: "JAN-2210", current: 310, avail: 260, forecast4w: 290, lead: 5, existingPO: "PO-8837 · 200 due today", suggest: 0, when: "No action", stockout: "—",
    confidence: 93, reason: "Kingfield delivers in 5 days. Hold until next weekly run.", supplier: "kingfield", value: 0 },
  { sku: "SAF-1892", current: 2260, avail: 2010, forecast4w: 590, lead: 10, existingPO: "Next PO planned 3 Oct", suggest: -500, when: "Cancel planned PO", stockout: "—",
    confidence: 95, reason: "22 weeks' cover in Naas. Transfer instead of buying.", supplier: "safepro", value: -1050 },
];
export const SUPPLIER_COMPARE_EL4408 = [
  { supplier: "atlas", cost: 21.40, lead: 28, moq: 100, otif: 86.2, avail: 500, currency: "EUR", landed: 22.10, rec: false },
  { supplier: "eurocable", cost: 22.20, lead: 9, moq: 50, otif: 97.8, avail: 800, currency: "EUR", landed: 22.55, rec: true },
];
/* Projected available stock vs forecast demand, EL-4408 Dublin, per day for 90 days (sampled weekly). */
export const FORECAST_EL4408 = {
  weeks: ["25 Sep", "2 Oct", "9 Oct", "16 Oct", "23 Oct", "30 Oct", "6 Nov", "13 Nov", "20 Nov", "27 Nov", "4 Dec", "11 Dec", "18 Dec"],
  projected: [12, 94, 61, 27, -8, -41, -74, -106, -139, -172, -204, -236, -268],
  withPO: [12, 94, 61, 27, 154, 121, 88, 55, 22, 149, 116, 84, 51],
  demand: [58, 38, 33, 34, 35, 33, 33, 32, 33, 33, 32, 32, 32],
};
export const FORECAST_TABLE = [
  // sku, 7d, 30d, 60d, 90d projected available, first stockout
  { sku: "EL-4408", d7: 74, d30: -8, d60: -139, d90: -268, stockout: "21 Oct", note: "PO-8821 lands 26 Sep (+120). No further cover." },
  { sku: "EL-4521", d7: 242, d30: 88, d60: -110, d90: -304, stockout: "4 Nov", note: "Demand up 34% on last quarter." },
  { sku: "SAF-3310", d7: 770, d30: 212, d60: -330, d90: -870, stockout: "14 Oct", note: "Winter uplift. Includes PO-8826 (+800)." },
  { sku: "FIX-1180", d7: 52, d30: -92, d60: -280, d90: -470, stockout: "5 Oct", note: "Three open quotes include it." },
  { sku: "IC-4470", d7: 816, d30: 574, d60: 256, d90: -62, stockout: "18 Dec", note: "Covered by PO-8821 for 8 weeks." },
  { sku: "FIX-2201", d7: 872, d30: 386, d60: -248, d90: -882, stockout: "6 Nov", note: "PO-8830 lands today (+500)." },
  { sku: "EL-5530", d7: 652, d30: 162, d60: -348, d90: -858, stockout: "26 Oct", note: "Includes PO-8821 (+600)." },
];

/* ---------- warehouse ---------- */
export const WAREHOUSE_TODAY = {
  DUB: { toPick: 94, lines: 1284, completed: 48, picking: 26, waiting: 14, urgent: 6, packing: 11, dispatched: 34 },
  NAS: { toPick: 38, lines: 452, completed: 21, picking: 9, waiting: 6, urgent: 2, packing: 4, dispatched: 16 },
};
export type Pick = { prio: "URGENT" | "HIGH" | "NORMAL"; so: string; lines: number; loc: string; picker: string; started: string; target: string; progress: number; cutoff: string; issue?: string };
export const PICKS: Pick[] = [
  { prio: "URGENT", so: "SO-10482", lines: 15, loc: "Aisles 02–24", picker: "tomasz", started: "08:55", target: "12:40", progress: 46, cutoff: "13:30", issue: "3 lines short · PO-8821" },
  { prio: "URGENT", so: "SO-10536", lines: 8, loc: "Aisles 21–30", picker: "adam", started: "09:02", target: "10:15", progress: 30, cutoff: "11:30", issue: "2 lines not started" },
  { prio: "URGENT", so: "SO-10531", lines: 7, loc: "Aisles 02–24", picker: "jade", started: "07:40", target: "08:50", progress: 100, cutoff: "10:00", issue: "Packed · D11 over weight" },
  { prio: "HIGH", so: "SO-10491", lines: 11, loc: "Aisles 02–33", picker: "grainne", started: "08:48", target: "10:05", progress: 64, cutoff: "11:45" },
  { prio: "HIGH", so: "SO-10502", lines: 12, loc: "Aisles 21–30", picker: "sean", started: "08:59", target: "10:20", progress: 58, cutoff: "13:30" },
  { prio: "HIGH", so: "SO-10474", lines: 10, loc: "Naas N-02–N-12", picker: "piotr", started: "08:20", target: "09:30", progress: 70, cutoff: "10:30", issue: "Count mismatch N-07-04" },
  { prio: "HIGH", so: "SO-10499", lines: 22, loc: "Aisles 02–33", picker: "tomasz", started: "—", target: "11:50", progress: 0, cutoff: "13:30" },
  { prio: "NORMAL", so: "SO-10514", lines: 6, loc: "Naas N-11–N-18", picker: "piotr", started: "09:05", target: "09:45", progress: 40, cutoff: "10:30" },
  { prio: "NORMAL", so: "SO-10540", lines: 6, loc: "Aisles 02–16", picker: "adam", started: "—", target: "11:10", progress: 0, cutoff: "11:45", issue: "Wave 3 running 40 min behind" },
  { prio: "NORMAL", so: "SO-10529", lines: 6, loc: "Aisles 02–18", picker: "grainne", started: "—", target: "12:30", progress: 0, cutoff: "13:30" },
];
export const PICK_DELAYS = [
  { picker: "adam", so: "SO-10536", loc: "D-30-07", expected: "10:15 → 10:55", issue: "Reach truck on charge, pallet above level 2" },
  { picker: "piotr", so: "SO-10474", loc: "N-07-04", expected: "09:30 → 10:10", issue: "Bin shows 60 boxes, 24 found. Recount raised." },
  { picker: "sean", so: "SO-10540", loc: "Wave 3", expected: "11:10 → 11:50", issue: "Two pickers on goods-in for PO-8830" },
];
export type Dispatch = { route: string; status: "Ready" | "Loading" | "Waiting" | "Departed" | "Held"; note: string; depart: string; loaded: number; wh: WH };
export const DISPATCH: Dispatch[] = [
  { route: "D04", status: "Ready", note: "9 stops · loaded, departs 11:30", depart: "11:30", loaded: 100, wh: "DUB" },
  { route: "D07", status: "Loading", note: "PM run · 7 of 11 orders loaded (AM run departed 08:34)", depart: "12:15", loaded: 64, wh: "DUB" },
  { route: "D11", status: "Held", note: "Over weight by 340kg · move SO-10528 to D09", depart: "10:00", loaded: 100, wh: "DUB" },
  { route: "D14", status: "Waiting", note: "Waiting on SO-10482 · 15 of 18 lines", depart: "13:45", loaded: 72, wh: "DUB" },
  { route: "W01", status: "Waiting", note: "Waiting on SO-10536 · cutoff 11:30", depart: "12:00", loaded: 81, wh: "DUB" },
  { route: "N04", status: "Loading", note: "SO-10478, SO-10511, SO-10520 (part)", depart: "11:00", loaded: 58, wh: "NAS" },
];
export type Exception = { id: string; kind: string; ref: string; detail: string; owner: string; raised: string; sev: "HIGH" | "MEDIUM" | "LOW" };
export const WH_EXCEPTIONS: Exception[] = [
  { id: "EX-3312", kind: "Stock discrepancy", ref: "N-07-04 · FIX-2201", detail: "System 60 boxes, counted 24. SO-10474 short 12 boxes. Recount raised.", owner: "aoife", raised: "09:08", sev: "HIGH" },
  { id: "EX-3310", kind: "Short delivery", ref: "PO-8826 · SafePro", detail: "800 nitrile gloves ordered, 760 received. Supplier claim drafted.", owner: "kevin", raised: "08:52", sev: "MEDIUM" },
  { id: "EX-3309", kind: "Route cutoff missed", ref: "SO-10536 · Harbour Point", detail: "Order placed 08:48 after W01 wave release. Squeezed into wave 2.", owner: "liam", raised: "08:50", sev: "MEDIUM" },
  { id: "EX-3307", kind: "Over weight", ref: "Route D11", detail: "Load plan 7,840kg on a 7.5t rigid. Move SO-10528 (380kg) to D09.", owner: "orla", raised: "08:36", sev: "HIGH" },
  { id: "EX-3305", kind: "Damaged on receipt", ref: "PO-8837 · Kingfield", detail: "2 cartons of hand soap crushed. Photographed, credit requested.", owner: "kevin", raised: "Yesterday 16:10", sev: "LOW" },
  { id: "EX-3302", kind: "Wrong item picked", ref: "SO-10466 · Core Facilities", detail: "Nitrile gloves (M) sent instead of (L). Replacement on N04 today.", owner: "liam", raised: "Yesterday 14:22", sev: "LOW" },
];
export const PACKING = [
  { so: "SO-10531", cust: "westbrook", cartons: 6, pallets: 1, weight: 380, packer: "jade", status: "Packed · held (D11)" },
  { so: "SO-10528", cust: "clondalkin", cartons: 4, pallets: 1, weight: 380, packer: "jade", status: "Packed · move to D09" },
  { so: "SO-10478", cust: "core", cartons: 9, pallets: 1, weight: 420, packer: "piotr", status: "Packed · N04 loading" },
  { so: "SO-10511", cust: "kildare", cartons: 5, pallets: 1, weight: 260, packer: "piotr", status: "Packed · N04 loading" },
  { so: "SO-10491", cust: "westbrook", cartons: 0, pallets: 0, weight: 0, packer: "jade", status: "Arriving from pick 10:05" },
  { so: "SO-10482", cust: "murphy", cartons: 0, pallets: 0, weight: 0, packer: "jade", status: "Arriving from pick 12:40 (15 lines)" },
];

/* ---------- delivery ---------- */
export type Stop = { n: number; cust: string; site: string; so: string; eta: string; status: "Delivered" | "Next" | "Scheduled" | "At risk" | "Failed"; note?: string };
export type Route = {
  id: string; driver: string; vehicle: string; type: string; stops: number; value: number; depart: string; complete: string; wh: WH;
  status: "Delivered" | "In transit" | "Loading" | "Awaiting dispatch" | "Held"; done: number; otif: number; risk?: string; area: string; km: number; list?: Stop[];
};
export const ROUTES: Route[] = [
  { id: "D14", driver: "james", vehicle: "232-D-18420", type: "12t rigid, tail-lift", stops: 12, value: 48620, depart: "13:45", complete: "17:20", wh: "DUB", status: "Awaiting dispatch",
    done: 0, otif: 92.8, risk: "Waiting on SO-10482", area: "Dublin 12 · 22 · Naas Road", km: 64, list: [
      { n: 1, cust: "core", site: "Park West", so: "SO-10502", eta: "14:05", status: "Scheduled" },
      { n: 2, cust: "murphy", site: "Naas Road yard", so: "SO-10482", eta: "14:30", status: "At risk", note: "15 of 18 lines. Remaining 3 on PO-8821." },
      { n: 3, cust: "horizon", site: "Clondalkin yard", so: "SO-10497", eta: "15:05", status: "At risk", note: "1 line short (EL-4408 ×12). Transfer TR-2291 covers it if approved by 10:30." },
      { n: 4, cust: "westbrook", site: "Clondalkin branch", so: "SO-10532", eta: "15:25", status: "Scheduled" },
      { n: 5, cust: "tallaght", site: "Tallaght", so: "SO-10533", eta: "15:50", status: "At risk", note: "On credit hold. Drops off the route unless released by 13:00." },
      { n: 6, cust: "murphy", site: "Tallaght branch", so: "SO-10529", eta: "16:10", status: "Scheduled" },
    ] },
  { id: "D07", driver: "declan", vehicle: "231-D-44102", type: "7.5t rigid", stops: 8, value: 31460, depart: "08:34", complete: "12:05", wh: "DUB", status: "In transit",
    done: 4, otif: 96.4, area: "Lucan · Leixlip · Maynooth", km: 58, list: [
      { n: 1, cust: "horizon", site: "Clondalkin yard", so: "SO-10518", eta: "08:48", status: "Delivered", note: "POD 08:47 · signed B. Keogh" },
      { n: 2, cust: "westbrook", site: "Lucan", so: "SO-10486", eta: "09:02", status: "Delivered", note: "POD 09:01" },
      { n: 3, cust: "clondalkin", site: "Clondalkin", so: "SO-10489", eta: "09:09", status: "Delivered", note: "POD 09:08" },
      { n: 4, cust: "leinster", site: "Site 11 · Liffey Valley", so: "SO-10494", eta: "09:14", status: "Delivered", note: "POD 09:15 · 1 carton refused, damaged" },
      { n: 5, cust: "westbrook", site: "Maynooth", so: "SO-10490", eta: "09:40", status: "Next" },
      { n: 6, cust: "kildare", site: "Leixlip drop", so: "SO-10495", eta: "10:15", status: "Scheduled" },
    ] },
  { id: "D04", driver: "eoin", vehicle: "221-D-30955", type: "7.5t rigid", stops: 6, value: 22840, depart: "11:30", complete: "15:10", wh: "DUB", status: "Loading",
    done: 0, otif: 95.1, area: "Swords · Santry · Airport", km: 49 },
  { id: "D09", driver: "conor", vehicle: "222-D-11873", type: "7.5t rigid", stops: 7, value: 19750, depart: "07:05", complete: "11:40", wh: "DUB", status: "In transit",
    done: 6, otif: 93.9, risk: "SO-10526 needs EL-4408 from Naas", area: "Dublin 8 · city centre", km: 31 },
  { id: "D11", driver: "niall", vehicle: "241-D-20417", type: "7.5t rigid", stops: 4, value: 18430, depart: "10:00", complete: "13:30", wh: "DUB", status: "Held",
    done: 0, otif: 94.6, risk: "Over weight by 340kg", area: "Clondalkin · Ballymount", km: 22 },
  { id: "D16", driver: "paddy", vehicle: "231-D-58810", type: "3.5t van", stops: 7, value: 21980, depart: "06:50", complete: "09:05", wh: "DUB", status: "Delivered",
    done: 7, otif: 97.2, area: "Dublin 2 · 4 · Ballsbridge", km: 36 },
  { id: "D18", driver: "shane", vehicle: "212-D-7741", type: "3.5t van", stops: 6, value: 9420, depart: "06:40", complete: "09:10", wh: "DUB", status: "Delivered",
    done: 6, otif: 100, area: "Tallaght · Firhouse", km: 28 },
  { id: "W01", driver: "declan", vehicle: "242-D-9318", type: "7.5t rigid", stops: 5, value: 17260, depart: "12:00", complete: "16:30", wh: "DUB", status: "Awaiting dispatch",
    done: 0, otif: 95.8, risk: "Waiting on SO-10536", area: "Dún Laoghaire · Bray · Wicklow", km: 71 },
  { id: "N02", driver: "shane", vehicle: "242-KE-1187", type: "12t rigid", stops: 5, value: 14880, depart: "06:30", complete: "08:55", wh: "NAS", status: "Delivered",
    done: 5, otif: 96.0, area: "Naas · Sallins · Clane", km: 42 },
  { id: "N04", driver: "paddy", vehicle: "241-KE-3302", type: "7.5t rigid", stops: 4, value: 23540, depart: "11:00", complete: "14:45", wh: "NAS", status: "Loading",
    done: 0, otif: 96.7, area: "Kildare · Newbridge · Park West", km: 67 },
  { id: "K01", driver: "conor", vehicle: "231-KE-8841", type: "12t rigid", stops: 5, value: 26910, depart: "07:15", complete: "13:00", wh: "NAS", status: "In transit",
    done: 4, otif: 93.1, risk: "SO-10474 count mismatch", area: "Carlow · Athy · Kill", km: 118 },
  { id: "M01", driver: "niall", vehicle: "222-KE-5520", type: "12t rigid", stops: 4, value: 19880, depart: "06:20", complete: "14:10", wh: "NAS", status: "In transit",
    done: 2, otif: 91.9, area: "Portlaoise · Tullamore · Athlone", km: 212 },
];
export const route = (id: string) => ROUTES.find(r => r.id === id) as Route;
export type Vehicle = { reg: string; type: string; route: string; driver: string; status: string; util: number; service: string; km: number; issue?: string };
export const VEHICLES: Vehicle[] = [
  { reg: "232-D-18420", type: "12t rigid, tail-lift", route: "D14", driver: "james", status: "At dock 4 · loading 13:00", util: 78, service: "14 Nov", km: 86420 },
  { reg: "231-D-44102", type: "7.5t rigid", route: "D07", driver: "declan", status: "On route · stop 5 of 8", util: 91, service: "2 Oct", km: 112380 },
  { reg: "221-D-30955", type: "7.5t rigid", route: "D04", driver: "eoin", status: "Loaded · dock 2", util: 88, service: "20 Dec", km: 141220 },
  { reg: "222-D-11873", type: "7.5t rigid", route: "D09", driver: "conor", status: "On route · last stop", util: 84, service: "7 Oct", km: 128900 },
  { reg: "241-D-20417", type: "7.5t rigid", route: "D11", driver: "niall", status: "Held at dock 6 · over weight", util: 104, service: "30 Jan", km: 38110, issue: "340kg over plated weight" },
  { reg: "231-D-58810", type: "3.5t van", route: "D16", driver: "paddy", status: "Returning to Dublin · all 7 delivered", util: 79, service: "11 Oct", km: 96470 },
  { reg: "212-D-7741", type: "3.5t van", route: "D18", driver: "shane", status: "Back at depot 09:10", util: 72, service: "Overdue · 19 Sep", km: 188340, issue: "Service overdue 6 days" },
  { reg: "242-D-9318", type: "7.5t rigid", route: "W01", driver: "declan", status: "Loading · dock 5", util: 81, service: "3 Mar", km: 21890 },
  { reg: "242-KE-1187", type: "12t rigid", route: "N02", driver: "shane", status: "Back at Naas 08:55", util: 76, service: "18 Jan", km: 24310 },
  { reg: "241-KE-3302", type: "7.5t rigid", route: "N04", driver: "paddy", status: "Loading · Naas dock 1", util: 83, service: "9 Nov", km: 44870 },
  { reg: "231-KE-8841", type: "12t rigid", route: "K01", driver: "conor", status: "On route · stop 5 of 5", util: 90, service: "28 Oct", km: 101650 },
  { reg: "222-KE-5520", type: "12t rigid", route: "M01", driver: "niall", status: "On route · stop 3 of 4", util: 86, service: "15 Oct", km: 133480 },
  { reg: "232-D-4406", type: "12t rigid", route: "Naas trunk", driver: "eoin", status: "Shuttle · departs Naas 14:00", util: 64, service: "22 Nov", km: 71230 },
  { reg: "211-D-9927", type: "3.5t van", route: "Spare", driver: "—", status: "Spare · Dublin yard", util: 0, service: "4 Oct", km: 201440 },
  { reg: "221-KE-6015", type: "7.5t rigid", route: "Workshop", driver: "—", status: "In workshop · clutch", util: 0, service: "In progress", km: 164020, issue: "Back 29 Sep" },
];
export const OTIF = {
  current: 94.2, target: 97.0,
  trend: [[" 3 Jul", 95.8], ["10 Jul", 96.1], ["17 Jul", 95.4], ["24 Jul", 96.3], ["31 Jul", 95.9], [" 7 Aug", 95.1], ["14 Aug", 94.6], ["21 Aug", 95.2], ["28 Aug", 94.3], [" 4 Sep", 93.8], ["11 Sep", 94.0], ["18 Sep", 93.6], ["25 Sep", 94.2]] as [string, number][],
  reasons: [["Supplier delay", 31], ["Stock shortage", 24], ["Warehouse delay", 18], ["Transport", 14], ["Customer unavailable", 8], ["Other", 5]] as [string, number][],
  byWarehouse: [["Dublin", 93.4], ["Naas", 96.1]] as [string, number][],
  byCategory: [["Electrical", 91.2], ["Industrial Consumables", 92.8], ["Fixings", 95.6], ["Tools", 96.0], ["PPE", 97.3], ["Janitorial", 98.1], ["Packaging", 98.4]] as [string, number][],
  bySupplierDep: [["Atlas Industrial", 86.2], ["Hansen Adhesives", 91.6], ["Lumos Lighting", 92.4], ["Toolcraft Europe", 93.0], ["EuroFix GmbH", 95.4], ["All others", 97.1]] as [string, number][],
  byRoute: [["M01", 91.9], ["D14", 92.8], ["K01", 93.1], ["D09", 93.9], ["D11", 94.6], ["D04", 95.1], ["W01", 95.8], ["N02", 96.0], ["D07", 96.4], ["N04", 96.7], ["D16", 97.2], ["D18", 100]] as [string, number][],
  byCustomer: [["Ryan Trade Supplies", 92.1], ["Midland Timber", 91.4], ["Horizon Electrical", 91.8], ["Liffey M&E", 92.7], ["Murphy Building", 93.6], ["Swords Building", 93.9], ["Leinster Property", 95.9], ["Core Facilities", 97.4]] as [string, number][],
  lateThisMonth: 64, incompleteThisMonth: 41,
};
export type DelIssue = { id: string; route: string; cust: string; so: string; kind: string; detail: string; status: string; value: number; owner: string; when: string };
export const DELIVERY_ISSUES: DelIssue[] = [
  { id: "DI-771", route: "D14", cust: "murphy", so: "SO-10482", kind: "Incomplete delivery (planned)", detail: "3 lines short on PO-8821. Partial shipment awaiting approval.", status: "Decision needed", value: 2863, owner: "sarah", when: "Today" },
  { id: "DI-770", route: "D11", cust: "clondalkin", so: "SO-10528", kind: "Vehicle capacity", detail: "D11 340kg over plated weight. Proposed move to D09 second drop.", status: "Open", value: 1680, owner: "orla", when: "08:36" },
  { id: "DI-768", route: "N02", cust: "grange", so: "SO-10471", kind: "Transport damage", detail: "1 box of cutting discs crushed in transit. Third N02 damage this month.", status: "Credit raised", value: 34.5, owner: "aoife", when: "Yesterday" },
  { id: "DI-766", route: "M01", cust: "ryan", so: "SO-10463", kind: "Customer unavailable", detail: "Yard closed at 16:30. Redelivered next day, €68 cost.", status: "Closed", value: 1240, owner: "orla", when: "23 Sep" },
  { id: "DI-765", route: "D09", cust: "liffey", so: "SO-10460", kind: "Wrong item", detail: "SWA gland 25mm sent instead of 20mm. Replacement on D09 today.", status: "Replacement booked", value: 246, owner: "liam", when: "23 Sep" },
  { id: "DI-762", route: "K01", cust: "mcgrath", so: "SO-10452", kind: "Late delivery", detail: "Arrived 10:40 against 08:00 site slot. Crane already stood down.", status: "Closed", value: 5320, owner: "orla", when: "22 Sep" },
];
export type POD = { so: string; cust: string; route: string; time: string; signed: string; photo: boolean; gps: boolean; exceptions: string };
export const PODS: POD[] = [
  { so: "SO-10518", cust: "horizon", route: "D07", time: "08:47", signed: "B. Keogh", photo: true, gps: true, exceptions: "None" },
  { so: "SO-10486", cust: "westbrook", route: "D07", time: "09:01", signed: "R. Kinsella", photo: true, gps: true, exceptions: "None" },
  { so: "SO-10489", cust: "clondalkin", route: "D07", time: "09:08", signed: "M. Kehoe", photo: true, gps: true, exceptions: "None" },
  { so: "SO-10505", cust: "fitzwilliam", route: "D16", time: "09:02", signed: "Reception · C. Nolan", photo: true, gps: true, exceptions: "None" },
  { so: "SO-10484", cust: "leinster", route: "D16", time: "08:21", signed: "Site 03 · J. Fox", photo: true, gps: true, exceptions: "1 carton refused, damaged" },
  { so: "SO-10470", cust: "kildare", route: "N02", time: "07:48", signed: "M. Dempsey", photo: false, gps: true, exceptions: "No photo taken" },
  { so: "SO-10471", cust: "grange", route: "N02", time: "07:31", signed: "T. Grange", photo: true, gps: true, exceptions: "1 box crushed" },
  { so: "SO-10476", cust: "tallaght", route: "D18", time: "07:12", signed: "N. Purcell", photo: true, gps: true, exceptions: "None" },
];

/* ---------- commercial: quotes, pricing, margin ---------- */
export type Quote = { id: string; cust: string; value: number; margin: number; target: number; rep: string; status: string; age: string; expires: string; reason?: string; annualGap?: number; lines: number };
export const QUOTES: Quote[] = [
  { id: "QT-2841", cust: "obrien", value: 18420, margin: 17.2, target: 24.0, rep: "david", status: "Pending approval", age: "2 days", expires: "2 Oct", reason: "Strategic deal", annualGap: 5010, lines: 26 },
  { id: "QT-2856", cust: "leinster", value: 11240, margin: 20.4, target: 24.0, rep: "mark", status: "Pending approval", age: "1 day", expires: "30 Sep", reason: "Competitor match", annualGap: 4856, lines: 18 },
  { id: "QT-2849", cust: "harbourpoint", value: 7980, margin: 21.1, target: 24.0, rep: "mark", status: "Pending approval", age: "3 days", expires: "1 Oct", reason: "Volume commitment", annualGap: 2777, lines: 12 },
  { id: "QT-2862", cust: "grange", value: 9650, margin: 21.6, target: 24.0, rep: "sarah", status: "Pending approval", age: "Today", expires: "2 Oct", reason: "Manual override", annualGap: 2765, lines: 9 },
  { id: "QT-2858", cust: "murphy", value: 24300, margin: 25.8, target: 24.0, rep: "sarah", status: "Sent", age: "4 days", expires: "5 Oct", lines: 31 },
  { id: "QT-2851", cust: "core", value: 31640, margin: 27.9, target: 24.0, rep: "mark", status: "Sent", age: "6 days", expires: "3 Oct", lines: 40 },
  { id: "QT-2846", cust: "doyle", value: 22180, margin: 22.8, target: 24.0, rep: "sarah", status: "Sent", age: "8 days", expires: "30 Sep", lines: 16 },
  { id: "QT-2839", cust: "liffey", value: 14620, margin: 24.4, target: 24.0, rep: "david", status: "No response · 21 days", age: "21 days", expires: "28 Sep", lines: 19 },
  { id: "QT-2833", cust: "swords", value: 12910, margin: 24.9, target: 24.0, rep: "david", status: "No response · 18 days", age: "18 days", expires: "Expired", lines: 22 },
  { id: "QT-2860", cust: "fitzwilliam", value: 8720, margin: 26.5, target: 24.0, rep: "mark", status: "Draft", age: "Today", expires: "—", lines: 11 },
  { id: "QT-2854", cust: "horizon", value: 15260, margin: 25.1, target: 24.0, rep: "sarah", status: "Won", age: "5 days", expires: "—", lines: 14 },
  { id: "QT-2848", cust: "quinlan", value: 9460, margin: 24.2, target: 24.0, rep: "david", status: "Sent", age: "9 days", expires: "4 Oct", lines: 10 },
];
export const quote = (id: string) => QUOTES.find(q => q.id === id) as Quote;
/* Four pending quotes below target: €15,408 annualised shortfall on expected repeat volumes. */
export const MARGIN_EXCEPTION_TOTAL = 15408;

export const LEAKAGE: [string, number, string][] = [
  ["Outdated customer pricing", 4820, "112 customer price agreements not reviewed since the last supplier increase."],
  ["Excessive discounting", 3260, "Discounts beyond the rep's tier on 64 orders this month."],
  ["Supplier cost increases not passed through", 2940, "428 price-file changes imported, 37 customer agreements still on old cost."],
  ["Low margin quotes", 1460, "Quotes accepted below 20% margin this month."],
  ["Manual price overrides", 528, "19 manual overrides at order entry, 11 without a reason code."],
];
export type CostChange = { supplier: string; sku: string; prev: number; now: number; customers: number; volume: number; impact: number; effective: string; status: string };
export const COST_CHANGES: CostChange[] = [
  { supplier: "eurofix", sku: "FIX-2201", prev: 16.40, now: 18.10, customers: 37, volume: 482, impact: 819, effective: "1 Sep", status: "Not passed through" },
  { supplier: "eurofix", sku: "FIX-2240", prev: 13.10, now: 14.20, customers: 29, volume: 344, impact: 378, effective: "1 Sep", status: "Not passed through" },
  { supplier: "atlas", sku: "EL-5530", prev: 5.95, now: 6.40, customers: 44, volume: 472, impact: 212, effective: "15 Aug", status: "Partly passed through" },
  { supplier: "hansen", sku: "IC-5120", prev: 35.20, now: 38.60, customers: 21, volume: 88, impact: 299, effective: "1 Aug", status: "Not passed through" },
  { supplier: "bristol", sku: "IC-1044", prev: 23.40, now: 24.80, customers: 33, volume: 144, impact: 202, effective: "1 Sep", status: "Not passed through" },
  { supplier: "atlas", sku: "IC-2290", prev: 4.60, now: 4.95, customers: 52, volume: 384, impact: 134, effective: "15 Aug", status: "Passed through 12 Sep" },
  { supplier: "toolcraft", sku: "TL-7710", prev: 27.90, now: 29.80, customers: 18, volume: 56, impact: 106, effective: "1 Sep", status: "Not passed through" },
];
export const PRICE_TYPES: [string, number, number, number][] = [
  // type, customers, avg margin, below target
  ["Standard list", 141, 29.6, 3], ["Tier", 168, 26.2, 9], ["Contract", 64, 23.1, 14], ["Customer-specific", 43, 22.4, 11], ["Promotional", 12, 18.9, 12], ["Manual override", 9, 17.6, 9],
];
export type PriceRow = { cust: string; sku: string; type: string; price: number; cost: number; margin: number; target: number; reviewed: string; flag?: string };
export const PRICE_ROWS: PriceRow[] = [
  { cust: "obrien", sku: "FIX-2201", type: "Contract", price: 20.90, cost: 18.10, margin: 13.4, target: 24, reviewed: "Oct 2025", flag: "Cost up 10.4%, contract unchanged" },
  { cust: "leinster", sku: "FIX-2201", type: "Contract", price: 21.40, cost: 18.10, margin: 15.4, target: 24, reviewed: "Jan 2026", flag: "Cost up 10.4%, contract unchanged" },
  { cust: "doyle", sku: "FIX-1180", type: "Customer-specific", price: 28.90, cost: 23.10, margin: 20.1, target: 24, reviewed: "Mar 2026" },
  { cust: "murphy", sku: "FIX-2201", type: "Contract", price: 23.90, cost: 18.10, margin: 24.3, target: 24, reviewed: "Feb 2026", flag: "Was 31.4% before 1 Sep" },
  { cust: "grange", sku: "IC-5120", type: "Customer-specific", price: 44.90, cost: 38.60, margin: 14.0, target: 24, reviewed: "Nov 2025", flag: "Cost up 9.7%" },
  { cust: "mcgrath", sku: "FIX-2240", type: "Customer-specific", price: 16.80, cost: 14.20, margin: 15.5, target: 24, reviewed: "Dec 2025", flag: "Cost up 8.4%" },
  { cust: "core", sku: "JAN-2210", type: "Contract", price: 20.40, cost: 14.80, margin: 27.5, target: 24, reviewed: "Jan 2026" },
  { cust: "westbrook", sku: "TL-7710", type: "Tier", price: 39.90, cost: 29.80, margin: 25.3, target: 24, reviewed: "Apr 2026" },
  { cust: "harbourpoint", sku: "SAF-3310", type: "Promotional", price: 5.60, cost: 4.60, margin: 17.9, target: 24, reviewed: "Aug 2026", flag: "Promo ended 31 Aug, still applied" },
  { cust: "tallaght", sku: "EL-5530", type: "Manual override", price: 7.40, cost: 6.40, margin: 13.5, target: 24, reviewed: "Sep 2026", flag: "Override by counter, no reason code" },
];
export type Discount = { id: string; cust: string; ref: string; rep: string; value: number; discount: number; tierLimit: number; margin: number; reason: string; status: string; raised: string };
export const DISCOUNTS: Discount[] = [
  { id: "DA-418", cust: "obrien", ref: "QT-2841", rep: "david", value: 18420, discount: 14.5, tierLimit: 8, margin: 17.2, reason: "Strategic deal · 4-region rollout", status: "Pending · Michael Doyle", raised: "23 Sep" },
  { id: "DA-421", cust: "leinster", ref: "QT-2856", rep: "mark", value: 11240, discount: 10.0, tierLimit: 8, margin: 20.4, reason: "Competitor match · Brenmark quote attached", status: "Pending · Michael Doyle", raised: "24 Sep" },
  { id: "DA-422", cust: "harbourpoint", ref: "QT-2849", rep: "mark", value: 7980, discount: 9.0, tierLimit: 8, margin: 21.1, reason: "Volume commitment · 12 months", status: "Pending · Michael Doyle", raised: "22 Sep" },
  { id: "DA-424", cust: "grange", ref: "QT-2862", rep: "sarah", value: 9650, discount: 8.5, tierLimit: 8, margin: 21.6, reason: "Manual override · site deal", status: "Pending · Michael Doyle", raised: "Today" },
  { id: "DA-415", cust: "swords", ref: "SO-10471", rep: "david", value: 3420, discount: 6.0, tierLimit: 6, margin: 23.9, reason: "Within tier", status: "Auto-approved", raised: "22 Sep" },
  { id: "DA-412", cust: "doyle", ref: "QT-2846", rep: "sarah", value: 22180, discount: 7.5, tierLimit: 8, margin: 22.8, reason: "Within tier", status: "Approved · Sarah Byrne", raised: "17 Sep" },
];
export type ProdProfit = { sku: string; revenue: number; units: number; cost: number; gp: number; margin: number; invValue: number; turn: number; returns: number; trend: string };
export const PRODUCT_PROFIT: ProdProfit[] = [
  { sku: "EL-2210", revenue: 185330, units: 2860, cost: 139850, gp: 45480, margin: 24.5, invValue: 14770, turn: 9.5, returns: 2, trend: "+6%" },
  { sku: "FIX-2201", revenue: 177820, units: 7440, cost: 128720, gp: 49100, margin: 27.6, invValue: 16180, turn: 8.0, returns: 1, trend: "flat" },
  { sku: "SAF-3310", revenue: 86140, units: 11640, cost: 53540, gp: 32600, margin: 37.8, invValue: 1930, turn: 27.7, returns: 2, trend: "+14%" },
  { sku: "FIX-4410", revenue: 39550, units: 5690, cost: 27880, gp: 11670, margin: 29.5, invValue: 5680, turn: 4.9, returns: 0, trend: "flat" },
  { sku: "EL-5530", revenue: 54770, units: 6120, cost: 38170, gp: 16600, margin: 30.3, invValue: 4290, turn: 8.9, returns: 3, trend: "+9%" },
  { sku: "EL-4408", revenue: 54530, units: 1920, cost: 41090, gp: 13440, margin: 24.6, invValue: 2350, turn: 17.5, returns: 1, trend: "+21%" },
  { sku: "IC-5120", revenue: 61430, units: 1170, cost: 45160, gp: 16270, margin: 26.5, invValue: 7410, turn: 6.1, returns: 9, trend: "−4%" },
  { sku: "EL-3102", revenue: 58850, units: 2140, cost: 41090, gp: 17760, margin: 30.2, invValue: 8870, turn: 4.6, returns: 5, trend: "flat" },
  { sku: "SAF-1892", revenue: 16830, units: 4260, cost: 8950, gp: 7880, margin: 46.8, invValue: 4750, turn: 1.9, returns: 0, trend: "−12%" },
  { sku: "TL-3321", revenue: 714, units: 6, cost: 474, gp: 240, margin: 33.6, invValue: 14220, turn: 0.03, returns: 0, trend: "−96%" },
  { sku: "EL-6120", revenue: 1044, units: 18, cost: 749, gp: 295, margin: 28.3, invValue: 18390, turn: 0.04, returns: 0, trend: "−91%" },
  { sku: "IC-1044", revenue: 64860, units: 1880, cost: 46620, gp: 18240, margin: 28.1, invValue: 6500, turn: 7.2, returns: 1, trend: "flat" },
];
export const CATEGORY_MARGIN: [string, number, number][] = [
  // category, revenue MTD, margin
  ["Electrical", 318400, 22.8], ["Fixings", 246900, 25.2], ["Industrial Consumables", 181300, 19.6], ["PPE", 132600, 27.4], ["Tools", 102800, 26.1], ["Janitorial", 71500, 24.8], ["Packaging", 31120, 22.3],
];

/* ---------- finance ---------- */
export const REVENUE_MONTHS: [string, number, number][] = [
  // month, revenue, gross margin %
  ["Oct", 1214000, 24.9], ["Nov", 1262000, 25.1], ["Dec", 1046000, 24.6], ["Jan", 1118000, 24.8], ["Feb", 1172000, 24.7], ["Mar", 1296000, 24.9],
  ["Apr", 1248000, 24.6], ["May", 1331000, 24.5], ["Jun", 1302000, 24.3], ["Jul", 1344000, 24.2], ["Aug", 1287000, 24.0], ["Sep", 1084620, 23.8],
];
export const DEBTOR_AGEING: [string, number][] = [["Current", 194000], ["30 days", 68000], ["60 days", 34000], ["90+ days", 22000]];
export type Invoice = { id: string; cust: string; amount: number; issued: string; due: string; days: number; status: string; promise?: string };
export const INVOICES: Invoice[] = [
  { id: "INV-28482", cust: "doyle", amount: 14860, issued: "20 Jul", due: "20 Aug", days: 67, status: "Overdue 36 days", promise: "Promised 'this week' on 18 Sep" },
  { id: "INV-28561", cust: "doyle", amount: 16220, issued: "12 Aug", due: "11 Sep", days: 44, status: "Overdue 14 days" },
  { id: "INV-28655", cust: "doyle", amount: 11600, issued: "5 Sep", due: "5 Oct", days: 20, status: "Current" },
  { id: "INV-28410", cust: "mcgrath", amount: 8940, issued: "26 Jun", due: "26 Jul", days: 91, status: "90+ days", promise: "Disputed delivery 22 Sep" },
  { id: "INV-28502", cust: "tallaght", amount: 6420, issued: "25 Jul", due: "24 Aug", days: 62, status: "Overdue 32 days" },
  { id: "INV-28519", cust: "midland", amount: 4380, issued: "30 Jul", due: "29 Aug", days: 57, status: "Overdue 27 days", promise: "Cheque posted 23 Sep" },
  { id: "INV-28577", cust: "swords", amount: 3120, issued: "14 Aug", due: "30 Sep EOM", days: 42, status: "Overdue 12 days" },
  { id: "INV-28590", cust: "horizon", amount: 2140, issued: "18 Aug", due: "17 Sep", days: 38, status: "Overdue 8 days" },
  { id: "INV-28601", cust: "wicklow", amount: 1980, issued: "20 Aug", due: "19 Sep", days: 36, status: "Overdue 6 days" },
  { id: "INV-28688", cust: "murphy", amount: 9860, issued: "10 Sep", due: "31 Oct EOM", days: 15, status: "Current" },
  { id: "INV-28702", cust: "murphy", amount: 5140, issued: "16 Sep", due: "31 Oct EOM", days: 9, status: "Current" },
  { id: "INV-28719", cust: "murphy", amount: 3240, issued: "22 Sep", due: "31 Oct EOM", days: 3, status: "Current" },
];
export const CREDIT_HOLDS = [
  { cust: "doyle", so: "SO-10503", order: 16240, balance: 42680, limit: 50000, overdue: 14860, projected: 58920, days: "67 days oldest", owner: "rachel" },
  { cust: "tallaght", so: "SO-10533", order: 2780, balance: 24310, limit: 25000, overdue: 6420, projected: 27090, days: "62 days oldest", owner: "rachel" },
  { cust: "mcgrath", so: "SO-10538", order: 4610, balance: 27410, limit: 40000, overdue: 8940, projected: 32020, days: "91 days · disputed", owner: "rachel" },
  { cust: "midland", so: "SO-10539", order: 2960, balance: 11060, limit: 30000, overdue: 4380, projected: 14020, days: "57 days · cheque posted", owner: "rachel" },
];
export const CASH = {
  bank: 412600, facility: 750000, facilityUsed: 185000, payables: 1380000, payablesOverdue: 96000, dso: 38, dpo: 44, dio: 58,
  weeks: [["28 Sep", 318, 344], ["5 Oct", 296, 312], ["12 Oct", 334, 301], ["19 Oct", 342, 356], ["26 Oct", 321, 298], ["2 Nov", 305, 322], ["9 Nov", 338, 311], ["16 Nov", 351, 346]] as [string, number, number][],
};
export const WC_OPPS: [string, number, string][] = [
  ["Slow & dead stock actions", 168000, "Supplier returns, transfers, bundles and stopped replenishment across 482 slow lines."],
  ["Improved collections", 38000, "Bring the 60 and 90+ day buckets back inside terms: Doyle, McGrath, Tallaght, Midland."],
  ["Supplier terms", 14000, "Atlas and Hansen from 45 to 60 days, in exchange for forecast sharing."],
  ["Stock optimisation", 6000, "Right-size safety stock on 140 fast movers using actual lead-time variance."],
];

/* ---------- returns & claims ---------- */
export type Return = { id: string; cust: string; so: string; sku: string; qty: number; reason: string; value: number; replacement: string; credit: string; claim: string; owner: string; when: string };
export const RETURNS: Return[] = [
  { id: "RT-1188", cust: "leinster", so: "SO-10484", sku: "IC-5120", qty: 4, reason: "Defective", value: 210, replacement: "Sent D16", credit: "Not needed", claim: "Hansen claim HC-212", owner: "fiona", when: "Today" },
  { id: "RT-1186", cust: "grange", so: "SO-10471", sku: "IC-1044", qty: 1, reason: "Transport damage", value: 34.5, replacement: "On N02 tomorrow", credit: "Raised CN-4471", claim: "—", owner: "aoife", when: "Yesterday" },
  { id: "RT-1184", cust: "core", so: "SO-10466", sku: "SAF-3310", qty: 20, reason: "Wrong item", value: 148, replacement: "On N04 today", credit: "Not needed", claim: "—", owner: "liam", when: "Yesterday" },
  { id: "RT-1181", cust: "horizon", so: "SO-10444", sku: "IC-5120", qty: 3, reason: "Defective", value: 157.5, replacement: "Delivered", credit: "Not needed", claim: "Hansen claim HC-212", owner: "fiona", when: "22 Sep" },
  { id: "RT-1179", cust: "liffey", so: "SO-10460", sku: "EL-4521", qty: 6, reason: "Wrong item", value: 147.6, replacement: "On D09 today", credit: "Not needed", claim: "—", owner: "liam", when: "23 Sep" },
  { id: "RT-1176", cust: "murphy", so: "SO-10431", sku: "EL-3102", qty: 5, reason: "Damaged", value: 137.5, replacement: "Delivered", credit: "Not needed", claim: "Lumos claim LC-88", owner: "fiona", when: "19 Sep" },
  { id: "RT-1172", cust: "swords", so: "SO-10420", sku: "FIX-3105", qty: 12, reason: "Customer error", value: 141.6, replacement: "—", credit: "Credit €127 less 10% restock", claim: "—", owner: "fiona", when: "17 Sep" },
  { id: "RT-1169", cust: "kildare", so: "SO-10411", sku: "IC-5120", qty: 2, reason: "Defective", value: 105, replacement: "Delivered", credit: "Not needed", claim: "Hansen claim HC-212", owner: "fiona", when: "15 Sep" },
  { id: "RT-1165", cust: "wicklow", so: "SO-10398", sku: "EL-5530", qty: 10, reason: "Shortage", value: 89.5, replacement: "Delivered", credit: "Not needed", claim: "—", owner: "liam", when: "12 Sep" },
];
export const RETURN_PATTERN = "IC-5120 Silicone Sealant: 9 returns this month, all batch 2231, nozzle splitting. Hansen claim HC-212 open for €472.50.";

/* ---------- opportunities & customer intelligence ---------- */
export type Opp = { id: string; cust: string; kind: string; detail: string; value: string; owner: string; confidence: number };
export const OPPORTUNITIES: Opp[] = [
  { id: "OP-311", cust: "murphy", kind: "Category gap", detail: "Buys Electrical, Fixings and Tools but not PPE. 68% of similar merchants buy PPE from us.", value: "€22,000–€34,000 / yr", owner: "sarah", confidence: 72 },
  { id: "OP-309", cust: "murphy", kind: "Lapsed category", detail: "Has not bought Safety & PPE in 74 days after ordering monthly.", value: "€4,800–€6,200", owner: "sarah", confidence: 81 },
  { id: "OP-307", cust: "ryan", kind: "Buying pattern changed", detail: "M10 Hex Bolts every 18–24 days. Last purchase 47 days ago.", value: "€34,080 / yr at risk", owner: "mark", confidence: 77 },
  { id: "OP-305", cust: "core", kind: "Site expansion", detail: "Citywest site ordering 40% more janitorial since July. No contract pricing on that site.", value: "€9,600 / yr", owner: "mark", confidence: 68 },
  { id: "OP-302", cust: "horizon", kind: "Cross-sell", detail: "Buys SWA cable and glands but not cable tray. Tray is dead stock in Naas.", value: "€11,030 stock release", owner: "sarah", confidence: 64 },
  { id: "OP-299", cust: "fitzwilliam", kind: "New account growth", detail: "Spend up 31% in 90 days across 6 buildings. Qualifies for Tier A.", value: "€14,000 / yr", owner: "mark", confidence: 70 },
  { id: "OP-296", cust: "liffey", kind: "Quote going cold", detail: "QT-2839 (€14,620) sent 21 days ago, no response. Expires 28 Sep.", value: "€14,620", owner: "david", confidence: 45 },
];
export type HealthSignal = { cust: string; signal: string; metric: string; impact: string; action: string };
export const HEALTH_SIGNALS: HealthSignal[] = [
  { cust: "ryan", signal: "Spend down 28% in 90 days", metric: "Primary decline: Fixings", impact: "€18,600 annualised", action: "Account manager call" },
  { cust: "swords", signal: "Lost PPE category", metric: "PPE spend €0 since July (was €1,400/mo)", impact: "€16,800 annualised", action: "Visit with PPE range" },
  { cust: "wicklow", signal: "Order frequency down", metric: "Every 11 days → every 19 days", impact: "€12,900 annualised", action: "Review Tier C pricing" },
  { cust: "liffey", signal: "Quote inactivity", metric: "2 quotes unanswered, 21 and 14 days", impact: "€22,400 open", action: "Call before QT-2839 expires" },
  { cust: "midland", signal: "Unresolved delivery problems", metric: "OTIF 91.4%, 3 late M01 drops in September", impact: "€8,800 annualised", action: "Move to Tue + Fri drops" },
  { cust: "mcgrath", signal: "Overdue debt", metric: "€8,940 at 91 days, disputed delivery", impact: "€8,940 exposure", action: "Resolve DI-762 credit" },
  { cust: "doyle", signal: "Credit exposure", metric: "€42,680 of €50,000 used, €14,860 overdue", impact: "€16,240 order held", action: "Part-release against payment" },
  { cust: "tallaght", signal: "Reduced margin", metric: "Counter overrides pushed margin 27.1% → 24.0% this month", impact: "€1,120 / mo", action: "Remove override rights" },
];
export const BUYING_PATTERN = {
  cust: "ryan", sku: "FIX-2201", every: "18–24 days", last: "47 days ago", monthly: 2840, annual: 34080,
};
export const CUSTOMER_SUMMARY_MURPHY =
  "Murphy Building Supplies' spend is up 12.4% YTD. Electrical products account for most of the growth. They have not purchased Safety & PPE products in 74 days despite previously ordering monthly. Estimated opportunity €4,800–€6,200.";
export const MURPHY_HISTORY: [string, number][] = [
  ["Oct", 41200], ["Nov", 44800], ["Dec", 29600], ["Jan", 40000], ["Feb", 41900], ["Mar", 49100], ["Apr", 46700], ["May", 51600], ["Jun", 47900], ["Jul", 53000], ["Aug", 49260], ["Sep", 38960],
];
export const MURPHY_TOP: [string, number, string][] = [
  ["EL-2210", 58320, "Every 12 days"], ["FIX-2201", 41460, "Every 9 days"], ["EL-5530", 30420, "Every 14 days"], ["EL-3102", 27500, "Monthly"], ["IC-5120", 22050, "Monthly"], ["TL-7710", 16800, "Every 6 weeks"],
];

/* ---------- decisions, alerts, tasks ---------- */
export type Decision = { id: string; title: string; who: string; area: string; impact: string; reason: string; rec: string; owner: string; deadline: string; needsYou: boolean; go: [string, string, Record<string, string>?] };
export const DECISIONS: Decision[] = [
  { id: "d-quote", title: "Approve €18,420 quote at 17.2% margin", who: "O'Brien Facilities", area: "Commercial", impact: "−€1,253 vs target on this order · €5,010 a year on repeat volume",
    reason: "David Kelly priced it as a strategic deal ahead of a four-region rollout. 6.8 pts below target.", rec: "Counter at 21.5%: hold the strategic discount on PPE, restore list on fixings (cost up 10.4%).",
    owner: "michael", deadline: "Today 11:00", needsYou: true, go: ["Pricing", "exceptions", { quote: "QT-2841" }] },
  { id: "d-credit", title: "Release €16,240 order above customer credit limit", who: "Doyle Construction", area: "Finance", impact: "€8,920 over the €50,000 limit if released in full",
    reason: "€42,680 already on account, €14,860 overdue on INV-28482 (67 days).", rec: "Release €7,320 now against available credit. Release the balance when INV-28482 is paid.",
    owner: "patrick", deadline: "Today 10:00", needsYou: true, go: ["Finance", "credit", { cust: "doyle" }] },
  { id: "d-expedite", title: "Expedite PO-8821 for €420 additional freight", who: "Atlas Industrial Supplies", area: "Purchasing", impact: "Protects €41,880 across 6 customer orders",
    reason: "Atlas can put 14 SKUs on a dedicated van tonight for €420. Otherwise it arrives on tomorrow's 10:30 groupage.", rec: "Approve. It lands at 06:30, before tomorrow's first wave.",
    owner: "emma", deadline: "Today 09:30", needsYou: true, go: ["Purchasing", "orders", { po: "PO-8821" }] },
  { id: "d-transfer", title: "Transfer 40 units from Naas to Dublin", who: "EL-4408 Industrial Cable 100m", area: "Inventory", impact: "Protects €12,460 across 3 orders · avoids 1 stockout",
    reason: "Dublin has 12 free against 58 demand in the next 7 days. Naas has 64 free against 11.", rec: "Approve for the 11:00 Naas van. It lands at 11:45, in time for D14.",
    owner: "liam", deadline: "Today 10:30", needsYou: false, go: ["Inventory", "transfers", { sku: "EL-4408" }] },
];
export type Alert = { sev: "CRITICAL" | "HIGH" | "MEDIUM"; kind: string; title: string; ref: string; lines: string[]; cta: string; go: [string, string, Record<string, string>?] };
export const ALERTS: Alert[] = [
  { sev: "CRITICAL", kind: "Order at risk", title: "Murphy Building Supplies", ref: "SO-10482", lines: ["€27,640", "3 lines short", "Promised tomorrow", "Supplier delivery delayed"], cta: "Resolve order", go: ["Orders", "detail", { order: "SO-10482" }] },
  { sev: "HIGH", kind: "Late supplier", title: "Atlas Industrial Supplies", ref: "PO-8821", lines: ["5 days late", "6 customer orders affected", "€41,880 revenue exposed"], cta: "View impact", go: ["Purchasing", "orders", { po: "PO-8821" }] },
  { sev: "HIGH", kind: "Margin exception", title: "O'Brien Facilities", ref: "QT-2841", lines: ["Revenue €18,420", "Projected margin 17.2%", "Target 24%"], cta: "Review pricing", go: ["Pricing", "exceptions", { quote: "QT-2841" }] },
  { sev: "MEDIUM", kind: "Inventory", title: "Industrial Cable 100m", ref: "EL-4408", lines: ["7 days stock remaining", "28-day supplier lead time"], cta: "Review replenishment", go: ["Inventory", "replenishment", { sku: "EL-4408" }] },
  { sev: "MEDIUM", kind: "Credit hold", title: "Doyle Construction", ref: "SO-10503", lines: ["Outstanding: €42,680", "Credit limit: €50,000", "New order: €16,240"], cta: "Review account", go: ["Finance", "credit", { cust: "doyle" }] },
];
export const BRIEFING = [
  "94 orders worth €176,420 are scheduled today.",
  "There are 7 orders at risk, representing €46,280 revenue.",
  "The largest issue is Murphy Building Supplies order SO-10482 (€27,640). Three items are short because PO-8821 from Atlas Industrial Supplies is five days late. A partial delivery can be made today. The remaining products are expected tomorrow at 10:30.",
  "Gross margin is currently 23.8%, 1.2 points below target. Most of the gap comes from the Industrial Consumables category and three customer-specific price agreements that have not been updated following supplier cost increases. I've identified €18,600 annualised margin recovery opportunity across these accounts.",
  "Inventory contains approximately €286,000 in slow-moving stock. €74,200 has had no movement in more than 180 days.",
  "3 decisions require approval.",
];
export type Task = { id: string; title: string; owner: string; dept: string; prio: "Critical" | "High" | "Medium" | "Low"; due: string; related: string; status: string; late?: boolean };
export const TASKS: Task[] = [
  { id: "t1", title: "Expedite Atlas PO-8821", owner: "emma", dept: "Purchasing", prio: "Critical", due: "Today 09:30", related: "PO-8821", status: "In progress" },
  { id: "t2", title: "Review Doyle Construction credit hold", owner: "patrick", dept: "Finance", prio: "High", due: "Today 10:00", related: "SO-10503", status: "Not started" },
  { id: "t3", title: "Approve O'Brien Facilities pricing", owner: "michael", dept: "Commercial", prio: "High", due: "Today 11:00", related: "QT-2841", status: "Not started" },
  { id: "t4", title: "Confirm partial shipment with Murphy Building Supplies", owner: "sarah", dept: "Sales", prio: "High", due: "Today 11:30", related: "SO-10482", status: "In progress" },
  { id: "t5", title: "Move SO-10528 from D11 to D09", owner: "orla", dept: "Transport", prio: "High", due: "Today 09:45", related: "D11", status: "In progress" },
  { id: "t6", title: "Recount bin N-07-04 (M10 Hex Bolts)", owner: "aoife", dept: "Warehouse", prio: "Medium", due: "Today 10:30", related: "EX-3312", status: "Not started" },
  { id: "t7", title: "Approve Naas → Dublin transfer TR-2291", owner: "liam", dept: "Warehouse", prio: "Medium", due: "Today 10:30", related: "EL-4408", status: "Not started" },
  { id: "t8", title: "Review 37 agreements on old EuroFix pricing", owner: "michael", dept: "Commercial", prio: "Medium", due: "Fri 2 Oct", related: "FIX-2201", status: "Not started" },
  { id: "t9", title: "Call Ryan Trade Supplies about M10 bolts", owner: "mark", dept: "Sales", prio: "Medium", due: "Today 15:00", related: "OP-307", status: "Not started" },
  { id: "t10", title: "Raise Hansen claim for sealant batch 2231", owner: "emma", dept: "Purchasing", prio: "Medium", due: "Mon 28 Sep", related: "HC-212", status: "In progress" },
  { id: "t11", title: "Chase McGrath disputed delivery credit", owner: "rachel", dept: "Finance", prio: "Medium", due: "Yesterday", related: "INV-28410", status: "In progress", late: true },
  { id: "t12", title: "Book D18 van service (overdue)", owner: "orla", dept: "Transport", prio: "Low", due: "19 Sep", related: "212-D-7741", status: "Not started", late: true },
];

/* ---------- activity ---------- */
export type Act = { t: string; actor: string; kind: "agent" | "person" | "system"; text: string; ref?: string; go?: [string, string, Record<string, string>?]; attention?: boolean };
export const ACTIVITY: Act[] = [
  { t: "09:14", actor: "Inventory Agent", kind: "agent", text: "Detected projected stockout for EL-4408.", ref: "EL-4408", go: ["Inventory", "replenishment", { sku: "EL-4408" }], attention: true },
  { t: "09:11", actor: "Sarah Byrne", kind: "person", text: "Updated Murphy Building Supplies order SO-10482.", ref: "SO-10482", go: ["Orders", "detail", { order: "SO-10482" }] },
  { t: "09:08", actor: "Aoife Brennan", kind: "person", text: "Raised stock discrepancy on bin N-07-04: system 60, counted 24.", ref: "EX-3312", go: ["Warehouse", "exceptions"], attention: true },
  { t: "09:04", actor: "Atlas Industrial Supplies", kind: "system", text: "Changed PO-8821 expected arrival to 26 Sep 10:30.", ref: "PO-8821", go: ["Purchasing", "orders", { po: "PO-8821" }], attention: true },
  { t: "09:02", actor: "B2B ordering portal", kind: "system", text: "Wicklow Hardware placed SO-10522 (€1,960).", ref: "SO-10522", go: ["Orders", "live"] },
  { t: "08:58", actor: "Margin Agent", kind: "agent", text: "Identified 37 customer price agreements affected by EuroFix cost increase.", ref: "FIX-2201", go: ["Pricing", "costs"] },
  { t: "08:52", actor: "Warehouse system", kind: "system", text: "Confirmed 244 units received on PO-8826 (SafePro). 40 short.", ref: "PO-8826", go: ["Warehouse", "goodsin"] },
  { t: "08:48", actor: "Outlook", kind: "system", text: "Customer email linked to SO-10482: “Any update on the cable and glands?”", ref: "SO-10482", go: ["Orders", "detail", { order: "SO-10482" }] },
  { t: "08:47", actor: "Warehouse", kind: "person", text: "Completed SO-10478 for Core Facilities.", ref: "SO-10478", go: ["Warehouse", "packing"] },
  { t: "08:42", actor: "Credit Agent", kind: "agent", text: "Placed SO-10503 on hold. Doyle Construction would exceed its €50,000 limit.", ref: "SO-10503", go: ["Finance", "credit", { cust: "doyle" }], attention: true },
  { t: "08:36", actor: "Dispatch Agent", kind: "agent", text: "Flagged D11 340kg over plated weight. Suggested moving SO-10528 to D09.", ref: "D11", go: ["Delivery", "routes", { route: "D11" }], attention: true },
  { t: "08:34", actor: "Transport system", kind: "system", text: "Marked Route D07 departed Dublin warehouse.", ref: "D07", go: ["Delivery", "routes", { route: "D07" }] },
  { t: "08:31", actor: "Outlook", kind: "system", text: "Doyle Construction order SO-10503 (€16,240) created from email.", ref: "SO-10503" },
  { t: "08:22", actor: "Supplier feeds", kind: "system", text: "Supplier price file imported: 428 changes identified.", go: ["Pricing", "costs"] },
  { t: "08:16", actor: "Sage", kind: "system", text: "Updated 12 customer payment statuses.", go: ["Finance", "debtors"] },
  { t: "08:10", actor: "Sage 200", kind: "system", text: "Synced 18 new orders.", go: ["Orders", "live"] },
  { t: "08:03", actor: "Briefing Agent", kind: "agent", text: "Completed morning operational briefing.", go: ["Home", "command"] },
  { t: "07:52", actor: "Murphy Building Supplies", kind: "system", text: "Placed SO-10529 (€4,120) through the B2B portal.", ref: "SO-10529" },
  { t: "07:30", actor: "Purchasing Agent", kind: "agent", text: "Atlas missed its second promised date on PO-8821. Emma notified.", ref: "PO-8821", go: ["Purchasing", "orders", { po: "PO-8821" }] },
  { t: "07:05", actor: "Transport system", kind: "system", text: "Route D09 departed with 8 stops.", ref: "D09" },
];

/* ---------- integrations ---------- */
export const SYSTEMS = [
  { name: "Sage 200", kind: "ERP", status: "Connected", last: "Synced 08:10 · 18 new orders", records: "Orders, customers, products, stock, POs" },
  { name: "Sage Accounts", kind: "Accounting", status: "Connected", last: "08:16 · 12 payment statuses", records: "Invoices, receipts, credit notes, ledgers" },
  { name: "Microsoft Outlook", kind: "Email", status: "Connected", last: "08:48 · email linked to SO-10482", records: "Customer and supplier mail, linked to records" },
  { name: "Warehouse system", kind: "WMS", status: "Connected", last: "08:52 · 244 units received", records: "Bins, picks, packs, receipts, counts" },
  { name: "Route planner", kind: "Transport", status: "Connected", last: "08:34 · D07 departed", records: "Routes, stops, vehicles, PODs, GPS" },
  { name: "B2B ordering portal", kind: "E-commerce", status: "Connected", last: "09:02 · SO-10522", records: "Web orders, customer price lists" },
  { name: "Supplier feeds", kind: "CSV / EDI", status: "Connected", last: "08:22 · 428 price changes", records: "Price files, ASNs, confirmations" },
  { name: "HubSpot", kind: "CRM", status: "Read only", last: "Nightly · 02:00", records: "Contacts, call notes" },
];

/* ---------- agents: what they answer ---------- */
export const AGENT_QA: { q: RegExp; a: string; rows?: [string, string, string][]; go?: [string, string, Record<string, string>?][] }[] = [
  { q: /cost us money|money today|biggest (risk|problem)/i,
    a: "Three issues represent approximately €59,288 of immediate commercial exposure.\n\n1. Murphy Building Supplies, €27,640. Order SO-10482 is at risk due to three stock shortages linked to late supplier PO-8821.\n2. Doyle Construction, €16,240. Order SO-10503 is currently held because the account would exceed its €50,000 credit limit.\n3. Margin exceptions, €15,408. Four pending quotes are below target margin. O'Brien Facilities has the largest variance at 17.2% versus a 24% target.\n\nI recommend resolving the Murphy order first because its required delivery date is tomorrow.",
    go: [["Orders", "detail", { order: "SO-10482" }], ["Finance", "credit", { cust: "doyle" }], ["Pricing", "exceptions"]] },
  { q: /fix today|need to (do|fix)|what should i do|what needs my|decision/i,
    a: "Five things, in this order.\n\n1. 09:30 · Approve €420 freight to expedite Atlas PO-8821. It protects €41,880 across 6 orders, including Murphy.\n2. 10:00 · Doyle Construction. Release €7,320 of SO-10503 against available credit and ask for INV-28482 (€14,860) before releasing the rest.\n3. 11:00 · O'Brien QT-2841 at 17.2%. Counter at 21.5%: keep the PPE discount, restore list on fixings.\n4. 11:30 · Murphy SO-10482. Ship 15 lines on D14 today, the remaining 3 tomorrow afternoon. Sarah has the customer email drafted.\n5. 13:00 · Approve the 40-unit Naas → Dublin transfer of EL-4408. It protects 3 more orders on tomorrow's AM routes.\n\nEverything else is covered: D11 weight is being fixed by Orla, and the N-07-04 recount is with Aoife.",
    go: [["Home", "command"], ["Orders", "detail", { order: "SO-10482" }], ["Inventory", "transfers"]] },
  { q: /late|go late|at risk/i,
    a: "14 orders worth €84,760 are at risk this week. 7 of them (€46,280) are on today's dispatch. The cause is mostly one supplier: 6 orders depend on Atlas PO-8821. The rest are D11 over weight (2), a picking delay on W01, a count mismatch in Naas and two credit holds.",
    go: [["Orders", "risk"]] },
  { q: /buy|purchase|reorder/i,
    a: "Buy three lines today. EL-4408 Industrial Cable (160 units, order today, stockout 28 Sep without it): I'd buy from EuroCable, not Atlas. €0.45 more landed, 9 days instead of 28, 97.8% OTIF. EL-4521 glands (200) and FIX-1180 concrete screws (200). Cancel the planned SafePro glasses PO and transfer 600 from Naas instead.",
    go: [["Purchasing", "recommendations"], ["Inventory", "replenishment"]] },
  { q: /margin|losing|leak/i,
    a: "Margin is 23.8% against a 25.0% target, a €13,008 gap this month (€156,096 annualised). Biggest leaks: outdated customer pricing €4,820, excessive discounting €3,260, supplier cost increases not passed through €2,940. The EuroFix increase alone: 37 customers still on old M10 bolt pricing, €819 a month.",
    go: [["Pricing", "margin"], ["Pricing", "costs"]] },
  { q: /inventory|working capital|trapped|cash|stock can/i,
    a: "€2.78m is tied up: €2.46m in stock and €318k in receivables. €286,420 of the stock is slow-moving and €74,200 hasn't moved in 180 days. I can see €226,000 to release: €168,000 from slow and dead stock actions, €38,000 from collections, €14,000 from supplier terms and €6,000 from safety stock.",
    go: [["Finance", "wc"], ["Inventory", "slow"]] },
  { q: /reduc|declin|stopped|spend/i,
    a: "18 accounts are declining. The three that matter most: Ryan Trade Supplies (down 28% in 90 days, M10 bolts 47 days since last order), Swords Building Supplies (lost the PPE category since July) and Wicklow Hardware (ordering every 19 days instead of 11).",
    go: [["Customers", "health"]] },
  { q: /otif|on time/i,
    a: "OTIF is 94.2% against 97%. Supplier delay causes 31% of failures and Atlas alone is behind most of them (86.2% OTIF, 126 orders affected this year). Electrical is the weakest category at 91.2%. Fix Atlas and OTIF recovers about 1.6 points.",
    go: [["Delivery", "otif"], ["Purchasing", "performance"]] },
  { q: /atlas|supplier|disrupt/i,
    a: "Atlas Industrial Supplies is causing the most disruption: 86.2% OTIF, 3.8 days average delay, 126 customer orders affected this year and 7 quality claims. 6 orders (€41,880) depend on PO-8821 right now. EuroCable can supply EL-4408 in 9 days at €0.45 more landed.",
    go: [["Purchasing", "performance"], ["Purchasing", "orders", { po: "PO-8821" }]] },
  { q: /sarah|call/i,
    a: "Sarah should make three calls today. Murphy (confirm the partial shipment and mention PPE, 74 days since their last order). Doyle Construction (payment on INV-28482 releases their order). Grange Contracts (QT-2862 is 2.4 pts under target and needs a price before it goes to Michael).",
    go: [["Customers", "detail", { cust: "murphy" }]] },
];
