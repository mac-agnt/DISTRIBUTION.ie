/* Demo data and pure helpers for the Pulse prototype (Consulting DISTRIBUTION.ie).
   Every figure here is read from, or agrees with, src/dist/db.ts. "Today" is 25 Sep, 09:16. */
import { MODULES, MODULE_PAGES, RAIL_ICONS } from "../dist/modules";
import { KPI, STAFF, REVENUE_MONTHS, INVENTORY_BY_CAT, INVENTORY_AGEING, CATEGORY_MARGIN, OTIF, CASH, SUPPLIERS,
  HEALTH_COUNTS, ORDER_PIPELINE, TASKS as DB_TASKS, eur, eurK } from "../dist/db";

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0"
};
Object.assign(ICONS, RAIL_ICONS);

const REC_SECTIONS = [
  {id:"contacts", label:"Contacts", blurb:"Everyone the business deals with: staff, customer buyers and supplier contacts."},
  {id:"files", label:"Files", blurb:"Contracts, supplier agreements and price files, indexed where Pulse can read them."},
  {id:"ontology", label:"Ontology", blurb:"How every record connects: customer, order, stock, supplier, route and invoice."}
];

/* name, role, email, organisation, tag, avatar tint */
const CONTACTS = [
  ["Patrick Byrne","Managing Director","patrick@consultingdistribution.ie","Consulting DISTRIBUTION.ie","staff","var(--accent)"],
  ["Emma Walsh","Purchasing Manager","emma@consultingdistribution.ie","Consulting DISTRIBUTION.ie","staff","#e6c78a"],
  ["Sarah Byrne","Senior Account Manager","sarah@consultingdistribution.ie","Consulting DISTRIBUTION.ie","staff","#a8e0c0"],
  ["Rachel Hayes","Credit Controller","rachel@consultingdistribution.ie","Consulting DISTRIBUTION.ie","staff","#c8b4f0"],
  ["Liam Murphy","Warehouse Manager, Dublin","liam@consultingdistribution.ie","Consulting DISTRIBUTION.ie","staff","#9fd6f0"],
  ["Gerry Murphy","Buyer","gerry@murphybuilding.ie","Murphy Building Supplies","customer","#9fd6f0"],
  ["Kieran Doyle","Contracts Manager","kieran@doyleconstruction.ie","Doyle Construction","credit hold","#e2a08c"],
  ["Sinéad O'Brien","Operations Director","sinead@obrienfacilities.ie","O'Brien Facilities","customer","#a8e0c0"],
  ["Fergal McGrath","Director","fergal@mcgrathcivil.ie","McGrath Civil Engineering","watch","#e6c78a"],
  ["Declan Ryan","Owner","declan@ryantrade.ie","Ryan Trade Supplies","customer","#c8b4f0"],
  ["Gareth Holt","Account Manager","gareth.holt@atlasindustrial.co.uk","Atlas Industrial Supplies","supplier","#c8b4f0"],
  ["Jonas Weber","Key Account Manager","j.weber@eurofix.de","EuroFix GmbH","supplier","#9fd6f0"]
];

const FILE_TREE = [
  {type:"folder", id:"f-cust", name:"Customers", depth:0},
  {type:"file", id:"fl-1", name:"O'Brien contract 2025.pdf", depth:1, parent:"f-cust", indexed:true,
   path:"Customers / O'Brien Facilities", title:"O'Brien Facilities contract 2025",
   facts:[["TYPE","PDF · 8 pages"],["EXPIRES","31 Oct 2026"],["INDEXED","All 8 pages"],["OWNER","David Kelly"]],
   body:["A national facilities contract across four regions on 45-day terms, supplied from Naas on the trunk run.",
     "Fixings are at a fixed contract rate with no cost-variation clause, so the EuroFix increase on 1 Sep came straight out of margin: FIX-2201 sells at €20.90 against a cost of €18.10 (13.4%).",
     "The contract expires on 31 October. QT-2841 (€18,420 at 17.2%) is David Kelly's proposal for the four-region rollout ahead of renewal."],
   links:[["O'Brien Facilities","org"],["Sinéad O'Brien","person"],["QT-2841","quote"]]},
  {type:"file", id:"fl-2", name:"Doyle Construction credit application.pdf", depth:1, parent:"f-cust", indexed:true,
   path:"Customers / Doyle Construction", title:"Doyle Construction credit application",
   facts:[["TYPE","PDF · 4 pages"],["LIMIT","€50,000"],["INDEXED","All 4 pages"],["OWNER","Rachel Hayes"]],
   body:["Signed by Kieran Doyle, setting a €50,000 limit on 30-day terms.",
     "The account stands at €42,680 with €14,860 overdue on INV-28482 (67 days). Kieran promised payment 'this week' on 18 Sep.",
     "Section 5 allows new orders to be held while any invoice is more than 30 days past due. That is the basis for holding SO-10503."],
   links:[["Doyle Construction","org"],["Kieran Doyle","person"],["INV-28482","invoice"]]},
  {type:"folder", id:"f-sup", name:"Suppliers", depth:0},
  {type:"file", id:"fl-3", name:"Atlas supply agreement 2026.pdf", depth:1, parent:"f-sup", indexed:true,
   path:"Suppliers / Atlas Industrial Supplies", title:"Atlas supply agreement 2026",
   facts:[["TYPE","PDF · 12 pages"],["TERMS","60 days"],["INDEXED","All 12 pages"],["OWNER","Emma Walsh"]],
   body:["Covers electrical and industrial consumables on a 28-day standard lead time and 60-day terms.",
     "Promised dates are binding within two working days. PO-8821 was promised for 20 Sep and has moved twice, most recently at 09:04 today to 26 Sep 10:30.",
     "There is no exclusivity clause, so buying EL-4408 from EuroCable as a second source does not breach it."],
   links:[["Atlas Industrial Supplies","org"],["Gareth Holt","person"],["PO-8821","order"]]},
  {type:"file", id:"fl-4", name:"EuroFix price file 1 Sep.csv", depth:1, parent:"f-sup", indexed:true,
   path:"Suppliers / EuroFix GmbH", title:"EuroFix price file, effective 1 Sep",
   facts:[["TYPE","CSV · 428 rows"],["EFFECTIVE","1 Sep 2026"],["IMPORTED","Today 08:22"],["OWNER","Ciarán Doherty"]],
   body:["428 cost changes from EuroFix, loaded into Sage 200 at 08:22.",
     "The one that matters most is FIX-2201 M10 Hex Bolt Box 100: €16.40 to €18.10, up 10.4%. 37 customer agreements still sell it on the old cost, worth €819 a month.",
     "Price files are read as data rather than text, so the costs Pulse quotes are the ones in Sage 200 after import."],
   links:[["EuroFix GmbH","org"],["Jonas Weber","person"],["FIX-2201","product"]]},
  {type:"folder", id:"f-fin", name:"Finance", depth:0},
  {type:"file", id:"fl-5", name:"INV-28482.pdf", depth:1, parent:"f-fin", indexed:true,
   path:"Finance / Invoices", title:"INV-28482",
   facts:[["TYPE","PDF · 1 page"],["VALUE","€14,860"],["AGE","67 days"],["OWNER","Rachel Hayes"]],
   body:["Issued to Doyle Construction on 20 Jul, due 20 Aug. The oldest open invoice on the account and the reason SO-10503 is on hold.",
     "Kieran Doyle promised payment 'this week' on 18 Sep. A payment request is drafted and waiting on Rachel Hayes."],
   links:[["Doyle Construction","org"],["Credit limit","workflow"]]},
  {type:"file", id:"fl-6", name:"Debtors ageing, August.xlsx", depth:1, parent:"f-fin", indexed:false,
   path:"Finance / Month end", title:"Debtors ageing, August",
   facts:[["TYPE","XLSX · 6 sheets"],["ADDED","1 Sep 2026"],["INDEXED","Not indexed"],["OWNER","Niamh Clarke"]],
   body:["The working file behind the August close.",
     "Spreadsheets are stored but not indexed by default. The debtor figures Pulse quotes come from Sage Accounts, not from here."],
   links:[["Finance","area"],["Month-end close","workflow"]]}
];

/* label, kind, x, y, primary, note. Order sits in the middle: everything a distributor
   does hangs off a sales order. */
const ONTO_NODES = [
  ["Customer","entity",300,190,1,"Trade accounts, each with its own price list, terms, credit limit and account manager. 437 active."],
  ["Order","entity",500,300,1,"Sales orders from reps, the B2B portal, EDI, email and phone. Stock, routes and invoices all hang off one."],
  ["Product","entity",700,190,1,"8,426 active SKUs with stock by warehouse, reorder point, lead time and supplier."],
  ["Route","module",250,430,1,"Today's vehicle runs from the route planner: stops, driver, load and proof of delivery."],
  ["Warehouse","entity",690,430,1,"Dublin and Naas. Where stock is on hand, allocated, picked and dispatched from."],
  ["Supplier","entity",850,320,0,"64 suppliers, ranked on OTIF, fill rate, delay and quality rather than spend."],
  ["Invoice","ledger",390,95,0,"Read from Sage Accounts. Overdue invoices are what put orders on credit hold."],
  ["Price List","ledger",620,95,0,"Standard, tier, contract and customer-specific prices, mastered in Sage 200."],
  ["Purchase Order","ledger",860,470,0,"POs from Sage 200 with promised dates, ASNs and every customer order waiting on them."],
  ["Quote","ledger",140,300,0,"Quotes from Sage 200, with margin against the customer's target."],
  ["places","predicate",395,240,0,"Customer → Order."],
  ["contains","predicate",605,240,0,"Order → Product."],
  ["delivered on","predicate",360,370,0,"Order → Route."],
  ["picked from","predicate",600,370,0,"Order → Warehouse."],
  ["converts to","predicate",140,372,0,"Quote → Order."]
];

const ONTO_EDGES = [
  [500,300,300,190],[500,300,700,190],[500,300,250,430],[500,300,690,430],
  [500,300,850,320],[500,300,390,95],[500,300,620,95],[500,300,140,300],
  [300,190,250,430],[700,190,860,470],[690,430,850,320],[690,430,860,470],
  [300,190,140,300],[390,95,620,95],[700,190,850,320]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid. The default for a customer, product or supplier.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","A portrait, key fields and every linked record in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, built for lists.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for a claim or a delivery issue.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by status. For returns, claims or anything that moves through stages.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due time on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals. For anything with amounts and dates.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status, built to be sent rather than just stored.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text with linked records pulled out down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of images with a caption on each. For PODs and damage photos.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Map & locations","Ops","A pinboard of sites and drops, with the record's fields beside each pin.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of deliveries or bookings against this record, with recurring rules.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];

/* ---- admin hub: 25 settings areas in seven groups ---- */
/* name, job title, email, warehouse, status, role, last active. The first six are the
   staff roster on Activity → People. */
const PEOPLE = [
  ["Patrick Byrne","Managing Director","patrick@consultingdistribution.ie","Dublin","active","Admin","Just now"],
  ["Michael Doyle","Commercial Director","michael@consultingdistribution.ie","Dublin","active","Admin","6 min ago"],
  ["Emma Walsh","Purchasing Manager","emma@consultingdistribution.ie","Dublin","active","Manager","3 min ago"],
  ["Sarah Byrne","Senior Account Manager","sarah@consultingdistribution.ie","Dublin","active","Standard","5 min ago"],
  ["Aoife Brennan","Warehouse Manager, Naas","aoife@consultingdistribution.ie","Naas","active","Manager","8 min ago"],
  ["Liam Murphy","Warehouse Manager, Dublin","liam@consultingdistribution.ie","Dublin","active","Manager","26 min ago"],
  ["Orla Quinn","Transport Planner","orla@consultingdistribution.ie","Dublin","active","Standard","40 min ago"],
  ["Rachel Hayes","Credit Controller","rachel@consultingdistribution.ie","Dublin","active","Standard","34 min ago"],
  ["Niamh Clarke","Financial Controller","niamh@consultingdistribution.ie","Dublin","active","Manager","1 h ago"],
  ["Paddy Geoghegan","Driver","paddy@consultingdistribution.ie","Naas","inactive","Standard","12 days ago"],
  ["Gerry Murphy","Buyer · Murphy Building Supplies","gerry@murphybuilding.ie","—","external","External","Today 07:52"],
  ["Ruth Kinsella","Purchasing · Westbrook Hardware","ruth@westbrookhardware.ie","—","external","External","Yesterday"]
];
const ROLE_LEVELS = ["Admin","Manager","Standard","External"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve decisions"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve decisions","Say yes to parked work"],
  ["pay","Release credit holds","Let a held order ship"],
  ["export","Export data","Download and share out"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Systems, roles, thresholds"],
  ["audit","Read the audit log","Every action, everyone"]
];
const ROLE_SCOPES = ["All records","Their warehouse","Their accounts"];
const DEFAULT_PERMS = {Admin:{view:true,edit:true,approve:true}, Manager:{view:true,edit:true,approve:true},
  Standard:{view:true,edit:true,approve:false}, External:{view:true,edit:false,approve:false}};
/* Every system Pulse reads, as in db SYSTEMS. */
const INTEGRATIONS = [
  {name:"Sage 200", blurb:"The ERP and system of record. Orders, customers, products, stock and POs sync both ways, and nothing is written back without a named approver.", tint:"#5fe0a8", status:"connected", statusKind:"ok",
   glyph:"M4 8 12 4.5 20 8 12 11.5 4 8Z M4 13 12 16.5 20 13 M4 18 12 21.5 20 18",
   lastSync:"08:10 · 18 new orders", usage:"1,840 orders a month", auth:"Service account", scopes:["Read","Write"]},
  {name:"Sage Accounts", blurb:"Invoices, receipts, credit notes and ledgers, so credit decisions use the balances finance sees.", tint:"#6ad0f0", status:"connected", statusKind:"ok",
   glyph:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
   lastSync:"08:16 · 12 payment statuses", usage:"€318k receivables", auth:"Service account", scopes:["Read","Write"]},
  {name:"Microsoft Outlook", blurb:"Customer and supplier mail attaches to the order, PO or invoice it mentions. Drafts wait for the sender's yes.", tint:"#8fa6ff", status:"connected", statusKind:"ok",
   glyph:"M4 7.2 12 13 20 7.2 M4 7.2v10.6h16V7.2 M4 7.2 8.5 4h7L20 7.2",
   lastSync:"08:48 · email linked to SO-10482", usage:"25 mailboxes", auth:"OAuth 2.0", scopes:["Read","Draft"]},
  {name:"Warehouse system", blurb:"Bins, picks, packs, receipts and counts in Dublin and Naas, beside the orders they serve.", tint:"#f0c04b", status:"connected", statusKind:"ok",
   glyph:RAIL_ICONS.warehouse,
   lastSync:"08:52 · PO-8826 booked in", usage:"1,736 lines to pick today", auth:"API key", scopes:["Read","Write"]},
  {name:"Route planner", blurb:"Routes, stops, vehicles, PODs and GPS, so a late drop shows up before the customer rings.", tint:"#e2705c", status:"connected", statusKind:"ok",
   glyph:RAIL_ICONS.delivery,
   lastSync:"08:34 · D07 departed", usage:"12 routes · 76 drops today", auth:"API key", scopes:["Read","Write"]},
  {name:"B2B ordering portal", blurb:"Web orders priced from each account's own price list, with available stock per warehouse.", tint:"#9d8cf5", status:"connected", statusKind:"ok",
   glyph:RAIL_ICONS.purchasing,
   lastSync:"09:02 · SO-10522", usage:"Customer price lists from Sage 200", auth:"API key", scopes:["Read"]},
  {name:"Supplier feeds", blurb:"Price files, ASNs and order confirmations by CSV or EDI, checked every hour and matched to POs.", tint:"#f07a9d", status:"1 file rejected", statusKind:"warn",
   glyph:"M4.5 12a7.5 7.5 0 0 1 12.8-5.3 M19.5 12a7.5 7.5 0 0 1-12.8 5.3 M17.3 4v3.3h-3.3 M6.7 20v-3.3H10",
   lastSync:"09:00 · Hansen file rejected", usage:"428 cost changes today", auth:"SFTP · EDI", scopes:["Read"]},
  {name:"HubSpot", blurb:"Contacts and call notes, read nightly. Sage 200 stays the master for accounts, so nothing is written back.", tint:"#f0994b", status:"read only", statusKind:"warn",
   glyph:"M12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z M12 4v3.4 M12 16.6V20 M4 12h3.4 M16.6 12H20 M6.5 6.5l2.4 2.4 M15.1 15.1l2.4 2.4 M17.5 6.5l-2.4 2.4 M8.9 15.1l-2.4 2.4",
   lastSync:"Nightly · 02:00", usage:"Contacts, call notes", auth:"OAuth 2.0", scopes:["Read"]}
];

/* Background catalogue. Each entry is pure CSS so a tile is the real thing at
   thumbnail size, not a picture of it. */
const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"harbour", label:"Harbour", group:"Dark", bg:"#0b0e10", surface:"#13171a", ink:"#f3f5f4", accent:"#7ea0ff"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"light", label:"Cream", group:"Light", bg:"#f4f2ed", surface:"#ffffff", ink:"#16181c", accent:"#0071e3"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3",
  pin:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  calendar:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z",
  warehouse:RAIL_ICONS.warehouse,
  truck:RAIL_ICONS.delivery,
  cart:RAIL_ICONS.purchasing,
  mail:"M4 7.2 12 13 20 7.2 M4 7.2v10.6h16V7.2 M4 7.2 8.5 4h7L20 7.2"
};

/* Rows are [label, value] or [label, note, on] for a switch. */
const ADMIN_CARDS = [
  /* ORGANISATION */
  {id:"org", group:"ORGANISATION", title:"Organisation profile", icon:"structure", tint:"var(--accent)",
   blurb:"Who the business is, what it trades and the figures Pulse treats as fixed.",
   tags:["58 staff","2 warehouses","18 vehicles"],
   footer:"Figures refresh from Sage 200 overnight", action:"Edit profile",
   listLabel:"ON RECORD",
   rows:[["Company","Consulting DISTRIBUTION.ie"],["Business","B2B wholesale distribution"],["Active accounts","437"],
     ["Suppliers","64"],["Active SKUs","8,426"],["Annualised revenue","€15.4m"],["ERP","Sage 200"],
     ["Currency and timezone","EUR · Europe/Dublin"]]},
  {id:"structure", group:"ORGANISATION", title:"Locations", icon:"pin", tint:"#6ad0f0",
   blurb:"Both warehouses, their docks and who runs them.",
   tags:["Dublin","Naas","12 docks"],
   listLabel:"WAREHOUSES",
   rows:[["Dublin Distribution Centre","Ballymount Industrial Estate, Dublin 12"],["Dublin manager","Liam Murphy · 8 docks · 14 pickers"],
     ["Dublin stock","€1.72m · 7,210 SKUs"],["Naas Distribution Centre","Millennium Park, Naas, Co. Kildare"],
     ["Naas manager","Aoife Brennan · 4 docks · 6 pickers"],["Naas stock","€740k · 4,380 SKUs"],
     ["Shuttle","Naas → Dublin van at 11:00 and 14:00"]]},
  {id:"hours", group:"ORGANISATION", title:"Trading calendar", icon:"calendar", tint:"#f0c04b",
   blurb:"Opening hours, route cut-offs and the dates the business closes.",
   tags:["Mon to Fri","Irish holidays"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Warehouse hours","05:30 to 18:00"],["Office hours","08:30 to 17:30"],["First route out","06:20 · M01 from Naas"],
     ["Dispatch cut-offs","per route · W01 11:30, D14 13:30"],["Next-day order cut-off","16:00"],
     ["Holidays","Irish public holidays"],["Month end","last working day · 30 Sep"]]},

  /* TEAMS */
  {id:"people", group:"TEAMS", title:"People & access", icon:"people", tint:"#6ad0f0",
   blurb:"Invite, suspend and offboard the people who use Pulse.",
   tags:["58 people","9 teams","2 warehouses"], badge:"2 invites", badgeKind:"warn",
   footer:"Last login checked 4 minutes ago", action:"Review 2 invites",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Add, invite or remove staff","58 people"],["Suspend accounts","none suspended"],["Driver accounts","route app only"],
     ["View last login","58 people tracked"]]},
  {id:"teams", group:"TEAMS", title:"Teams", icon:"teams", tint:"#f0c04b",
   blurb:"Nine teams, each with a lead who owns its queue.",
   tags:["9 teams","58 people"],
   listLabel:"TEAM · LEAD",
   rows:[["Management","Patrick Byrne · 2 people"],["Commercial","Michael Doyle · 2 people"],["Purchasing","Emma Walsh · 3 people"],
     ["Sales","Sarah Byrne · 6 people"],["Customer Service","Fiona Lynch · 3 people"],["Warehouse Dublin","Liam Murphy · 18 people"],
     ["Warehouse Naas","Aoife Brennan · 8 people"],["Transport","Orla Quinn · 12 people"],["Finance","Niamh Clarke · 4 people"]]},
  {id:"roles", group:"TEAMS", title:"Roles & permissions", icon:"shield", tint:"var(--accent)",
   blurb:"Permission templates, and exactly what each person can reach.",
   tags:["4 roles","3 scopes"],
   heroLabel:"THE QUESTION THIS ANSWERS", heroAction:"Show me what someone can access",
   heroText:"Pick a person and see every order, account, price and export they can reach, resolved through their grants rather than guessed from the menus.",
   footer:"Preview Pulse as another user", action:"Open preview",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Admin","Patrick Byrne, Michael Doyle"],["Manager","team leads, approve inside their limits"],
     ["Standard","their accounts or their warehouse"],["External","customer portal users"],
     ["Account managers see margin","own accounts only", true],["Warehouse staff see prices","", false],
     ["Preview Pulse as another user",""]]},

  /* SYSTEMS */
  {id:"erp", group:"SYSTEMS", title:"Sage 200", icon:"data", tint:"#5fe0a8",
   blurb:"The ERP and system of record: orders, customers, products, stock and POs.",
   tags:["Primary ERP","Connected","Two-way"],
   footer:"Last sync 08:10 · 18 new orders", action:"View sync log",
   listLabel:"CONNECTION",
   rows:[["Status","connected"],["Last sync","08:10 · 18 new orders"],["Reads","orders, customers, products, stock, POs"],
     ["Price lists","mastered in Sage 200"],["Write back holds, POs and transfers","after a named approver", true]]},
  {id:"accounts", group:"SYSTEMS", title:"Sage Accounts", icon:"audit", tint:"#6ad0f0",
   blurb:"Invoices, receipts, credit notes and the ledgers behind every credit decision.",
   tags:["Connected","Debtors","Credit notes"],
   listLabel:"CONNECTION",
   rows:[["Last sync","08:16 · 12 payment statuses"],["Reads","invoices, receipts, credit notes, ledgers"],
     ["Statements and reminders","sent from Sage"],["Raise credit notes","after the customer service lead's yes", true]]},
  {id:"wms", group:"SYSTEMS", title:"Warehouse system", icon:"warehouse", tint:"#f0c04b",
   blurb:"Bins, picks, packs, receipts and counts in Dublin and Naas.",
   tags:["Dublin","Naas","Live"], badge:"1 count out", badgeKind:"warn",
   footer:"Bin N-07-04 shows 60, 24 counted", action:"Open exceptions",
   listLabel:"CONNECTION",
   rows:[["Last event","08:52 · PO-8826 booked in, 40 short"],["Reads","bins, picks, packs, receipts, counts"],
     ["Open count variances","1 · N-07-04"],["Change pick priority and transfers","after the warehouse manager's yes", true]]},
  {id:"routes", group:"SYSTEMS", title:"Route planner", icon:"truck", tint:"#e2705c",
   blurb:"Routes, stops, vehicles, PODs and GPS for both fleets.",
   tags:["12 routes today","18 vehicles"],
   listLabel:"CONNECTION",
   rows:[["Last event","08:34 · D07 departed"],["Routes today","12 · 76 drops"],["Vehicles","18 · 1 in the workshop, 1 spare"],
     ["PODs","signature, photo and GPS"],["Move stops between routes","after the transport planner's yes", true]]},
  {id:"health", group:"SYSTEMS", title:"Data health", icon:"health", tint:"#e2705c",
   blurb:"What is wrong with the data, how much it matters, and the fix.",
   tags:["7 issue types","190 records affected"], badge:"112 price agreements", badgeKind:"bad",
   footer:"Last scanned 12 minutes ago", action:"Review the worst first",
   listLabel:"ISSUES FOUND",
   trend:[238,226,219,207,201,196,190],
   bySeverity:[["High","124",RED],["Medium","65",AMBER],["Low","1",DIM]],
   issues:[["Price agreements not reviewed","112","high","Not reviewed since the last supplier increase","Review"],
     ["Manual overrides with no reason","11","high","11 of 19 order-entry overrides this month","Assign"],
     ["Bin count out","1","high","N-07-04: Sage 200 says 60 boxes, 24 counted","Recount"],
     ["Products missing a lead time","38","medium","No supplier lead time, so no reorder date","Fix automatically"],
     ["Duplicate customer contacts","26","medium","Same email on two accounts","Merge"],
     ["Supplier file rejected","1","medium","Hansen DKK price file has no currency column","Retry"],
     ["POD without a photo","1","low","SO-10470 on N02 this morning","Review"]],
   rows:[]},

  /* INTEGRATIONS */
  {id:"integrations", group:"INTEGRATIONS", title:"Connections", icon:"plug", tint:"#6ad0f0",
   blurb:"Every system Pulse reads, and which way the data flows.",
   tags:["8 connected","1 read only"], badge:"1 file rejected", badgeKind:"warn",
   footer:"Hansen's price file was rejected at 09:00", action:"Open supplier feeds",
   listLabel:"CONNECTIONS",
   rows:[["Sage 200","read and write"],["Sage Accounts","read and write"],["Microsoft Outlook","read and draft"],
     ["Warehouse system","read and write"],["Route planner","read and write"],["B2B ordering portal","read"],
     ["Supplier feeds","read"],["HubSpot","read only"]]},
  {id:"feeds", group:"INTEGRATIONS", title:"Supplier feeds", icon:"flow", tint:"#f07a9d",
   blurb:"Price files, ASNs and order confirmations from suppliers, by CSV or EDI.",
   tags:["CSV · EDI","Hourly"], badge:"1 rejected", badgeKind:"warn",
   listLabel:"LATEST PER SUPPLIER",
   rows:[["EuroFix GmbH","price file loaded 08:22 · 428 changes"],["Atlas Industrial Supplies","PO-8821 date change 09:04"],
     ["SafePro Workwear & PPE","ASN for PO-8826 · 40 short"],["Hansen Adhesives A/S","rejected 09:00 · currency missing"],
     ["Import schedule","hourly, 06:00 to 20:00"],["Load new costs into Sage 200","on import", true]]},
  {id:"portal", group:"INTEGRATIONS", title:"B2B ordering portal", icon:"cart", tint:"#9d8cf5",
   blurb:"Customer web orders, priced from each account's own price list.",
   tags:["Connected","Customer pricing"],
   listLabel:"CONNECTION",
   rows:[["Last order","09:02 · Wicklow Hardware, SO-10522"],["Price lists","customer-specific, from Sage 200"],
     ["Stock shown","available to promise, per warehouse"],["Block checkout on credit hold","", true]]},
  {id:"outlook", group:"INTEGRATIONS", title:"Microsoft Outlook", icon:"mail", tint:"#8fa6ff",
   blurb:"Mail in and out, attached to the order, PO or invoice it mentions.",
   tags:["25 mailboxes","Drafts only"],
   listLabel:"CONNECTION",
   rows:[["Last linked","08:48 · customer email on SO-10482"],["Mailboxes","sales@, orders@, accounts@ and 22 staff"],
     ["Links mail to","orders, quotes, POs, invoices"],["Drafts wait for the sender's yes","", true]]},
  {id:"hubspot", group:"INTEGRATIONS", title:"HubSpot", icon:"people", tint:"#f0994b",
   blurb:"Contacts and call notes, read nightly. Nothing is written back.",
   tags:["Read only","Nightly"],
   listLabel:"CONNECTION",
   rows:[["Mode","read only"],["Last sync","02:00 nightly"],["Reads","contacts, call notes"],["Master for accounts","Sage 200"]]},

  /* GOVERNANCE */
  {id:"approvals", group:"GOVERNANCE", title:"Approval thresholds", icon:"shield", tint:"var(--accent)",
   blurb:"Who has to say yes, and above what amount.",
   tags:["5 thresholds","4 approvers"], badge:"6 pending", badgeKind:"warn",
   heroLabel:"THE RULE", heroAction:"Show pending approvals",
   heroText:"Nothing that changes a price, a credit limit, a PO or a customer's order goes through without a named person's yes. Agents propose, these people decide.",
   footer:"4 discount requests are with Michael Doyle", action:"Open approvals",
   listLabel:"THRESHOLD · APPROVER",
   rows:[["Discount beyond the rep's tier","Commercial Director · Michael Doyle"],
     ["Credit limit override","Managing Director · Patrick Byrne"],
     ["Purchase orders over €25,000","Managing Director · Patrick Byrne"],
     ["Stock write-off over €1,000","Financial Controller · Niamh Clarke"],
     ["Special delivery cost over €250","Purchasing Manager · Emma Walsh"],
     ["An approver's own request","goes up one level"],
     ["Below every threshold","the record owner decides"]]},
  {id:"audit", group:"GOVERNANCE", title:"Audit log", icon:"audit", tint:"#9d8cf5",
   blurb:"A locked history of who changed what. Searchable, exportable, never editable.",
   tags:["Append-only","7-year retention"],
   footer:"Nobody can edit or delete entries", action:"Export",
   listLabel:"WHAT IS RECORDED THIS MONTH",
   rows:[["Approvals and overrides","184"],["Price changes","428 imported · 23 manual"],["Credit holds and releases","31"],
     ["Agent actions","2,140"],["Permission changes","12"],["Data exports","7"],["Deleted records","2"]]},
  {id:"security", group:"GOVERNANCE", title:"Security", icon:"lock", tint:"#8fa6ff",
   blurb:"Sign-in, sessions, devices and the keys that reach the API.",
   tags:["SSO on","2FA enforced","4 API keys"], badge:"2 advisories", badgeKind:"warn",
   footer:"Route planner API key is 11 months old, and 2 warehouse terminals are unpatched", action:"Review",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Single sign-on","Microsoft 365", true],["Two-factor authentication","enforced", true],
     ["Warehouse terminals","12-hour session, badge sign-in"],["Active sessions","49"],["Approved devices","61 · 12 warehouse terminals"],
     ["Restrict terminals to warehouse IPs","", true],["Security alerts","", true],["API keys","4 active"],["Data retention","7 years"]]},

  /* AI CONTROLS */
  {id:"agents", group:"AI CONTROLS", title:"Agent permissions", icon:"agent", tint:"var(--accent)",
   blurb:"What each agent may read, what it may draft, and where it must stop.",
   tags:["8 agents","336 actions today","€1.12 spent"],
   heroLabel:"GLOBAL CONTROL", heroAction:"Pause every agent",
   heroText:"One switch stops every agent. Anything mid-run finishes its current step and then holds. Write tools always wait for a named approver.",
   footer:"Write and external tools always need a named yes", action:"Review scopes",
   listLabel:"READS · MAY DRAFT",
   rows:[["Briefing","every module · writes nothing"],["Ops Watchdog","orders, WMS, routes · raises tasks"],
     ["Inventory Agent","stock and demand · POs and transfers"],["Purchasing Agent","POs and supplier feeds · supplier emails"],
     ["Margin Agent","prices, costs, quotes · price changes"],["Customer Agent","accounts, orders, HubSpot · follow-ups"],
     ["Dispatch Agent","routes, loads, PODs · stop moves"],["Credit Agent","ledger and limits · credit holds, payment requests"],
     ["Write tools wait for a named approver","locked on", true]]},
  {id:"model", group:"AI CONTROLS", title:"Model & data residency", icon:"lock", tint:"#6ad0f0",
   blurb:"Which model the agents run on, and where your data is processed.",
   tags:["EU residency","No training"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Model provider","Anthropic · Claude"],["Data residency","EU"],["Records sent to the model","only what an agent's scopes allow"],
     ["Prompt and output retention","30 days"],["Train on company data","", false],["Customer data leaves the EU","never"]]},
  {id:"wf", group:"AI CONTROLS", title:"Workflow guardrails", icon:"flow", tint:"#9d8cf5",
   blurb:"The limits on what runs by itself. Building workflows lives under Work.",
   tags:["Managers only","Retry twice"],
   footer:"Building workflows happens in Work", action:"Open Work",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Who can create workflows","managers and above"],["Maximum autonomy","proposes, never sends", true],
     ["Approval thresholds","5, set under Governance"],["Failure handling","retry twice, then tell the owner"],
     ["Usage limit","500 runs a day"],["Pause all workflows","", false]]},

  /* EXPERIENCE */
  {id:"appearance", group:"EXPERIENCE", title:"Appearance & themes", icon:"brand", tint:"#6ad0f0",
   blurb:"Pick a light or dark theme for how Pulse looks to you.",
   tags:["13 themes","9 dark","4 light"],
   listLabel:"THEMES", rows:[]},
  {id:"notif", group:"EXPERIENCE", title:"Notifications", icon:"bell", tint:"#f0994b",
   blurb:"Which events reach people, on which channel, and when not to.",
   tags:["In-app","Outlook","Push"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Which events notify","18 of 27 events"],["Email via Outlook","", true],["Mobile push","", true],["In-app","", true],
     ["Escalation","after 30 minutes on anything due today"],["Quiet hours","19:00 to 06:30, warehouse leads excepted"],
     ["Summaries","08:00 briefing · 17:30 evening brief"]]},
  {id:"brand", group:"EXPERIENCE", title:"Branding & display", icon:"brand", tint:"var(--accent)",
   blurb:"Logo, accent colour, density and how numbers and dates read.",
   tags:["Harbour blue","Comfortable"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company logo","cd-mark.svg"],["Accent colour","Harbour blue"],["Density","comfortable"],["Start page","Command Centre"],
     ["Numbers","€1,084,620 · en-IE"],["Dates","25 Sep, 09:16"],["Show agent faces","", true]]}
];

const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(3,1fr)"],
  ["TEAMS", "repeat(3,1fr)"],
  ["SYSTEMS", "repeat(3,1fr)"],
  ["INTEGRATIONS", "repeat(3,1fr)"],
  ["GOVERNANCE", "repeat(3,1fr)"],
  ["AI CONTROLS", "repeat(3,1fr)"],
  ["EXPERIENCE", "repeat(3,1fr)"]
];

/* ---- activity feeds ---- */
const SRC_TINT = {"Sage 200":"#5fe0a8", Sage:"#6ad0f0", Outlook:"#8fa6ff", WMS:"#f0c04b", "Route planner":"#e2705c",
  "B2B portal":"#9d8cf5", "Supplier EDI":"#f07a9d", HubSpot:"#f0994b", Pulse:"var(--accent)", Agent:"var(--accent)"};
const SRC_ABBR = {"Sage 200":"S2", Sage:"SG", Outlook:"OL", WMS:"WM", "Route planner":"RP",
  "B2B portal":"B2", "Supplier EDI":"ED", HubSpot:"HS", Pulse:"PL", Agent:"AI"};

/* title, note, actor, related record, source, status. Newest first: the first five seed each lane. */
const DATA_EVENTS = [
  ["PO date changed","Atlas moved PO-8821 to 26 Sep 10:30. Second change: it was promised for 20 Sep.","Atlas Industrial Supplies","PO-8821","Supplier EDI","completed"],
  ["Web order received","Wicklow Hardware placed SO-10522 for €1,960 on the B2B portal.","Helen Cullen","Wicklow Hardware & DIY","B2B portal","completed"],
  ["Supplier file rejected","Hansen's DKK price file arrived with no currency column. Nothing loaded, so yesterday's costs stand.","Hansen Adhesives A/S","Price files","Supplier EDI","failed"],
  ["Goods received","PO-8826 from SafePro booked in at Naas: 760 of 800 nitrile gloves, 40 short.","Warehouse system","PO-8826","WMS","completed"],
  ["Customer email linked","“Any update on the cable and glands?” filed against SO-10482.","gerry@murphybuilding.ie","Murphy Building Supplies","Outlook","completed"],
  ["Route departed","D07 left Dublin at 08:34 with 8 stops for Lucan, Leixlip and Maynooth.","Declan Farrell","Route D07","Route planner","completed"],
  ["Order created from email","SO-10503 for €16,240 keyed from Kieran Doyle's email, customer PO DC-HSF-0918.","kieran@doyleconstruction.ie","Doyle Construction","Outlook","completed"],
  ["Price file imported","EuroFix's 1 Sep price file loaded into Sage 200: 428 cost changes.","EuroFix GmbH","428 SKUs","Supplier EDI","completed"],
  ["Payments updated","12 customer payment statuses updated from Sage Accounts.","Sage sync","12 accounts","Sage","completed"],
  ["Orders synced","18 new orders synced from Sage 200.","Sage 200 sync","18 orders","Sage 200","completed"],
  ["POD without a photo","SO-10470 for Kildare Build Centre, signed by M. Dempsey at 07:48 on N02. No photo taken.","Route planner","Kildare Build Centre","Route planner","completed"],
  ["Contacts refreshed","Nightly read of contacts and call notes. 6 call notes linked to accounts.","HubSpot sync","Contacts","HubSpot","completed"]
];

const PEOPLE_EVENTS = [
  ["Sarah proposed a partial shipment","SO-10482: 15 of 18 lines on D14 today, 3 when PO-8821 lands. Waiting on Murphy to confirm.","Sarah Byrne","Murphy Building Supplies","Pulse","completed"],
  ["Aoife raised a count discrepancy","Bin N-07-04 shows 60 boxes of M10 bolts, 24 counted. SO-10474 is 12 short. Recount raised.","Aoife Brennan","Naas warehouse","WMS","completed"],
  ["Karen keyed a phone order","SO-10535 for Ryan Trade Supplies, €1,240, on the M01 route.","Karen Moran","Ryan Trade Supplies","Pulse","completed"],
  ["Kevin logged a short delivery","PO-8826 from SafePro: 800 nitrile gloves ordered, 760 received. Supplier claim drafted.","Kevin Brady","SafePro Workwear & PPE","WMS","completed"],
  ["Liam re-waved a late order","SO-10536 for Harbour Point landed after the W01 wave went out. Moved into wave 2.","Liam Murphy","Harbour Point Facilities","WMS","completed"],
  ["Piotr packed an order","SO-10478 for Core Facilities packed at Naas: 9 cartons for N04.","Piotr Wiśniewski","Core Facilities Ltd","WMS","completed"],
  ["Discount request raised","Sarah asked for 8.5% on Grange QT-2862 (€9,650), over her 8% tier.","Sarah Byrne","Grange Contracts","Pulse","awaiting"],
  ["Fiona booked a replacement","RT-1188: 4 boxes of sealant from a defective batch, replaced on D16. Hansen claim HC-212.","Fiona Lynch","Leinster Property Services","Pulse","completed"],
  ["Emma asked Atlas for a dedicated van","€420 to bring PO-8821 in tonight instead of tomorrow's groupage. With Patrick, needs a yes by 09:30.","Emma Walsh","Atlas Industrial Supplies","Pulse","awaiting"],
  ["Rachel chased a disputed invoice","INV-28410 for McGrath, €8,940 at 91 days, disputed over the late K01 delivery on 22 Sep.","Rachel Hayes","McGrath Civil Engineering","Sage","awaiting"],
  ["David raised a discount request","DA-418: 14.5% on O'Brien QT-2841 (€18,420) against his 8% tier. With Michael Doyle.","David Kelly","O'Brien Facilities","Pulse","awaiting"]
];

const AI_EVENTS = [
  ["Inventory Agent drafted a transfer","TR-2291: 40 × EL-4408 from Naas to Dublin on the 11:00 van. Waiting on Liam Murphy.","Inventory Agent","Naas warehouse","Agent","awaiting"],
  ["Inventory Agent projected a stockout","EL-4408 runs out in Dublin on 21 Oct, even with PO-8821. 160 recommended, order today.","Inventory Agent","EL-4408 Industrial Cable 100m","Agent","working"],
  ["Ops Watchdog flagged a pick delay","SO-10536 for Harbour Point: 2 lines not started, reach truck on charge. W01 cutoff 11:30.","Ops Watchdog","Harbour Point Facilities","WMS","working"],
  ["Purchasing Agent traced PO-8821","6 customer orders (€41,880) wait on it. A customer update is drafted for each account manager.","Purchasing Agent","Atlas Industrial Supplies","Supplier EDI","awaiting"],
  ["Margin Agent flagged 37 price agreements","EuroFix's M10 bolt cost is up 10.4% and 37 customers are still on the old price: €819 a month.","Margin Agent","FIX-2201","Agent","completed"],
  ["Credit Agent paused for approval","Payment request to Kieran Doyle for INV-28482 (€14,860) drafted. Rachel Hayes sends it.","Credit Agent","Doyle Construction","Outlook","awaiting"],
  ["Credit Agent held an order","SO-10503 would take Doyle Construction to €58,920 against a €50,000 limit.","Credit Agent","Doyle Construction","Sage 200","completed"],
  ["Margin Agent checked a quote","Grange QT-2862 at 21.6% against 24%. DA-424 routed to Michael Doyle.","Margin Agent","Grange Contracts","Agent","completed"],
  ["Dispatch Agent flagged an overweight load","D11 is 340kg over its plated weight. Suggests moving SO-10528 to D09.","Dispatch Agent","Route D11","Route planner","awaiting"],
  ["Briefing posted the morning brief","94 orders today, 7 at risk (€46,280), 3 decisions for Patrick.","Briefing","Management","Agent","completed"],
  ["Customer Agent spotted a lapsed pattern","Ryan Trade Supplies buys M10 bolts every 18 to 24 days. Last order 47 days ago: €34,080 a year at risk.","Customer Agent","Ryan Trade Supplies","Agent","completed"],
  ["Purchasing Agent flagged a missed date","Atlas missed its second promised date on PO-8821. Emma Walsh notified.","Purchasing Agent","PO-8821","Agent","completed"]
];

const STREAM_DEFS = [
  {id:"data", title:"Systems", sub:"Arriving from Sage 200, the WMS, route planner and supplier feeds", pool:DATA_EVENTS, every:3200,
   tint:"#6ad0f0", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"},
  {id:"people", title:"People", sub:"What staff did and decided", pool:PEOPLE_EVENTS, every:6400,
   tint:"#f0c04b", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"Agents", sub:"The eight agents at work", pool:AI_EVENTS, every:4600,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];

/* The rail: Home, the eight distribution modules, then Pulse's own Work, Agents and Activity. */
const NAV = [];
MODULES.forEach((m, i) => {
  if (m.id === "Orders" || m.id === "Records") NAV.push({divider:true});
  NAV.push({label:m.label, icon:m.icon, page:m.id, pages:MODULE_PAGES[m.id] || [m.id], dot:m.dot});
});

/* Inbox items follow the real InboxItem shape: what happened, why it matters, what I can do. */
const ITEMS = {
  atlas:{kind:"Alert", importance:"critical", icon:ICONS.purchasing, age:"12m",
    title:"Atlas PO-8821 is 5 days late · 6 orders waiting",
    why:"€41,880 of customer orders depend on it, including Murphy SO-10482 (€27,640) on D14 today.",
    detail:"Atlas moved the date for the second time at 09:04: now 26 Sep 10:30 on groupage. For €420 they will put all 14 SKUs on a dedicated van tonight, landing at 06:30 before the first wave. Emma Walsh raised it, so it comes up to you, and Atlas needs a yes by 09:30.",
    actionLabel:"Approve €420 freight", secondaryLabel:"View impact", group:"Alerts",
    fields:[{k:"Supplier",v:"Atlas Industrial Supplies"},{k:"PO value",v:"€38,640 · 14 SKUs"},{k:"Promised",v:"20 Sep"},{k:"Now expected",v:"26 Sep 10:30"}],
    history:[{when:"15 Sep",text:"PO-8821 raised by Emma Walsh"},{when:"Today 07:30",text:"Purchasing Agent flagged the second missed date"},{when:"Today 09:04",text:"Atlas moved the ETA to 26 Sep 10:30"}]},
  credit:{kind:"Approval", importance:"high", icon:ICONS.finance, age:"34m",
    title:"Doyle Construction SO-10503 held · €8,920 over limit",
    why:"Releasing the €16,240 order takes the account to €58,920 against a €50,000 limit. A credit override needs the MD.",
    detail:"€42,680 is on account and €14,860 is overdue on INV-28482 (67 days). The Credit Agent recommends releasing €7,320 now against available credit and asking for INV-28482 before the balance goes. Rachel Hayes has the payment request drafted.",
    actionLabel:"Release €7,320", secondaryLabel:"Hold in full", group:"Approvals",
    fields:[{k:"Order",v:"SO-10503 · €16,240"},{k:"Balance",v:"€42,680 of €50,000"},{k:"Overdue",v:"€14,860 · INV-28482"},{k:"Decide by",v:"Today 10:00"}],
    history:[{when:"Today 08:31",text:"Order created from Kieran Doyle's email"},{when:"Today 08:42",text:"Credit Agent held it over the limit"}]},
  weight:{kind:"Task", importance:"high", icon:ICONS.delivery, age:"40m",
    title:"Route D11 is 340kg over plated weight",
    why:"D11 was due out at 10:00 with 7,840kg planned on a 7.5t rigid. It is held at dock 6 until the load changes.",
    detail:"The Dispatch Agent suggests moving SO-10528 for Clondalkin Plant Hire (380kg) to the second drop on D09. Westbrook's SO-10531 stays on D11. Orla Quinn owns the change.",
    actionLabel:"Move SO-10528 to D09", secondaryLabel:"Reassign", group:"Work",
    fields:[{k:"Vehicle",v:"241-D-20417 · 7.5t rigid"},{k:"Driver",v:"Niall Treacy"},{k:"Over by",v:"340kg"},{k:"Owner",v:"Orla Quinn"}],
    history:[{when:"Today 08:36",text:"Dispatch Agent flagged the load plan"},{when:"Today 08:36",text:"Task created for Orla Quinn, due 09:45"}]},
  transfer:{kind:"Approval", importance:"normal", icon:ICONS.inventory, age:"2m",
    title:"Transfer 40 × EL-4408 from Naas to Dublin",
    why:"Dublin has 12 free against 58 demand in the next 7 days. Naas has 64 free against 11.",
    detail:"TR-2291 goes on the 11:00 Naas van and lands at 11:45, in time for D14 at 13:45. It protects SO-10497, SO-10509 and SO-10526 (€12,460) and avoids one stockout. Murphy's 28 ship with its other short lines on PO-8821.",
    actionLabel:"Approve transfer", secondaryLabel:"Open stock", group:"Automations",
    fields:[{k:"Transfer",v:"TR-2291"},{k:"SKU",v:"EL-4408 Industrial Cable 100m"},{k:"Protects",v:"3 orders · €12,460"},{k:"Approver",v:"Liam Murphy by 10:30"}],
    history:[{when:"Today 09:14",text:"Inventory Agent projected the Dublin stockout"},{when:"Today 09:15",text:"Transfer drafted, waiting on Liam Murphy"}]},
  quote:{kind:"Approval", importance:"high", icon:ICONS.pricing, age:"2d",
    title:"O'Brien Facilities QT-2841 at 17.2% margin",
    why:"An €18,420 quote, 6.8 points under the 24% target. The 14.5% discount is beyond David Kelly's 8% tier, so it needs Michael Doyle.",
    detail:"David priced it as a strategic deal ahead of a four-region rollout. It is €1,253 under target on this quote and about €5,010 a year on repeat volume. The Margin Agent's counter is 21.5%: keep the PPE discount, restore list on fixings, where cost is up 10.4%.",
    actionLabel:"Counter at 21.5%", secondaryLabel:"Approve as quoted", group:"Approvals",
    fields:[{k:"Quote",v:"QT-2841 · 26 lines"},{k:"Margin",v:"17.2% vs 24.0%"},{k:"Rep",v:"David Kelly"},{k:"Approver",v:"Michael Doyle by 11:00"}],
    history:[{when:"23 Sep",text:"DA-418 raised by David Kelly"},{when:"Today 08:58",text:"Margin Agent linked it to the EuroFix cost increase"}]}
};
/* Deadline order: 09:30, 10:00, 10:00 departure, 10:30, 11:00. */
const ORDER = ["atlas","credit","weight","transfer","quote"];

/* Fallback answers for chat questions AGENT_QA in db.ts doesn't catch. Actions are
   [label, primary, go?]: with a go tuple the button jumps to that module page. */
const ANSWERS = {
  credit:{tool:"pulse_credit_read", effect:"read",
    text:"Two accounts would go over their limit if today's orders were released: Doyle Construction (€58,920 against €50,000) and Tallaght Trade Centre (€27,090 against €25,000). McGrath and Midland are held for age, not limit: €8,940 at 91 days on a disputed delivery, and €4,380 at 57 days with a cheque posted on 23 Sep. Doyle is the one to act on. Release €7,320 now against available credit and ask for INV-28482 (€14,860, 67 days) before the rest goes.",
    cols:["Customer","Balance / limit","Overdue","Held order"],
    rows:[["Doyle Construction","€42,680 / €50,000","€14,860","SO-10503 · €16,240"],["Tallaght Trade Centre","€24,310 / €25,000","€6,420","SO-10533 · €2,780"],
      ["McGrath Civil Engineering","€27,410 / €40,000","€8,940","SO-10538 · €4,610"],["Midland Timber & Hardware","€11,060 / €30,000","€4,380","SO-10539 · €2,960"]],
    actions:[["Draft the Doyle payment request",1],["Open credit control",0,["Finance","credit",{cust:"doyle"}]]]},
  late:{tool:"pulse_orders_find", effect:"read",
    text:"Seven orders on today's dispatch are behind, worth €46,280. Four trace back to stock: three wait on Atlas PO-8821 and Liffey's cable is sitting in Naas rather than Dublin. The other three are D11 being 340kg over weight (Westbrook and Clondalkin) and two unstarted lines on Harbour Point for the W01 cutoff at 11:30. Two tasks are past due as well: Rachel's credit chase on McGrath INV-28410, and the D18 van service, overdue since 19 Sep.",
    cols:["Order","Customer","Value","Cause"],
    rows:[["SO-10482","Murphy Building Supplies","€27,640","3 lines short · PO-8821"],["SO-10497","Horizon Electrical","€4,860","1 line short · PO-8821"],
      ["SO-10526","Liffey M&E","€4,480","EL-4408 in Naas"],["SO-10531","Westbrook Hardware","€2,380","D11 over weight"]],
    actions:[["Approve the Naas transfer",1,["Inventory","transfers",{sku:"EL-4408"}]],["Open at-risk orders",0,["Orders","risk"]]]},
  chase:{tool:"pulse_email_draft", effect:"write", confirm:true,
    confirmSummary:"Send one email from Rachel Hayes to Kieran Doyle (kieran@doyleconstruction.ie) asking for payment of INV-28482, €14,860, due 20 Aug, and confirming that the balance of SO-10503 is released once it clears.",
    text:"Drafted from Rachel Hayes to Kieran Doyle. It asks for INV-28482 (€14,860, due 20 Aug) and says the rest of SO-10503 goes as soon as it clears. Kieran promised payment 'this week' on 18 Sep, so it refers to that. Sending is a write tool, so nothing has gone: confirming sends exactly the stored draft, not anything typed after it.",
    actions:[["Confirm and send",1],["Edit draft",0]]},
  sync:{tool:"pulse_systems_health", effect:"read",
    text:"Seven of eight connections are clean. Sage 200 last synced at 08:10 (18 new orders), Sage Accounts at 08:16, the route planner at 08:34 and the WMS at 08:52. The one problem is a supplier feed: Hansen's 09:00 price file had no currency column, so nothing loaded and yesterday's costs stand. Two smaller things: SafePro's PO-8826 came in 40 gloves short, and the N02 POD for SO-10470 has no photo. HubSpot is read-only by design and refreshes at 02:00.",
    cols:["System","Last sync","Latest","Status"],
    rows:[["Sage 200","08:10","18 new orders","connected"],["Warehouse system","08:52","PO-8826 booked in","connected"],
      ["Supplier feeds","09:00","Hansen file rejected","1 rejected"],["HubSpot","02:00","contacts, call notes","read only"]],
    actions:[["Open goods in",1,["Warehouse","goodsin"]],["Open proof of delivery",0,["Delivery","pod"]]]},
  deliveries:{tool:"pulse_routes_read", effect:"read",
    text:"76 drops are planned today: 34 delivered, 28 in transit and 14 waiting to go. OTIF is 94.2% against 97%. Seven drops are at risk and three routes carry them. D14 (James Nolan, 13:45) waits on Murphy's SO-10482, D11 is held at dock 6 because it is 340kg over, and W01 waits on the last two lines for Harbour Point.",
    cols:["Route","Driver","Status","Risk"],
    rows:[["D14","James Nolan","Departs 13:45","Waiting on SO-10482"],["D11","Niall Treacy","Held at dock 6","340kg over weight"],
      ["W01","Declan Farrell","Departs 12:00","Waiting on SO-10536"],["D04","Eoin Walsh","Loaded · 11:30","On time"]],
    actions:[["Move SO-10528 to D09",1,["Delivery","routes",{route:"D11"}]],["Open today's deliveries",0,["Delivery","today"]]]},
  fallback:{tool:"pulse_search", effect:"read",
    text:"I couldn't tie that to one record, so here is what changed since the 08:03 briefing. Atlas moved PO-8821 to 26 Sep 10:30 (09:04). Aoife counted 24 boxes in bin N-07-04 where Sage 200 says 60 (09:08). EL-4408 runs out in Dublin on 21 Oct unless a new PO goes in today (09:14). Ask me about any order, customer, SKU, PO, route or invoice by its number.",
    actions:[["Open the Command Centre",1,["Home","command"]],["What needs my decision?",0]]}
};

// Turns a plain-English filter name into a full dashboard area — the "primitive
// vibe-coding" bit: no real backend, just a seeded generator so the same phrase
// always produces the same numbers, with direction and vocabulary nudged by
// keywords in the text (expansion/growth trends up, risk/issue trends down, a
// region/cost/people/ops/customer word picks which metrics show).
function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new site","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","incident","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("scotland","ireland","wales","england","region","dublin","naas","kildare","belfast","cork","galway","london","glasgow","edinburgh"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","warehouse","fleet")) vocab = "ops";
  else if (has("customer","client","retention","account")) vocab = "customer";

  const V = {
    region:   {labels:["New enquiries","Orders won","Revenue","Account coverage"], unit:"EUR · 30 DAYS"},
    cost:     {labels:["Spend","Cost per order","Savings found","Budget used"], unit:"EUR · 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockouts","Reorders raised"], unit:"DAYS"},
    customer: {labels:["Active accounts","Repeat rate","Churn","NPS"], unit:"ACCOUNTS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY · 30 DAYS"}
  }[vocab];

  const months = ["Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "\u2212") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + " \u00b7 direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing pipeline", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + " \u00b7 week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "\u2212") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning \u201c" + low + "\u201d"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "\u2014", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from \u201c" + trimmed + "\u201d: a plain-English filter, not a registered metric set. Refine it and Pulse will tighten this up.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where \u201c" + low + "\u201d shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Pipeline", "Other"]
  };
}

function pickAnswer(q){
  const s = q.toLowerCase();
  if (/deliver|\broutes?\b|\bvans?\b|driver|dispatch|\bpods?\b|\bdrops?\b/.test(s)) return ANSWERS.deliveries;
  if (/chase|e-?mail|draft|\bsend\b|remind|payment request/.test(s)) return ANSWERS.chase;
  if (/credit|limit|debtor|\bowe|outstanding|overdue|doyle|tallaght|mcgrath|\bheld\b|\bhold/.test(s)) return ANSWERS.credit;
  if (/backorder|behind|slip|short|task|\bwork\b|delay/.test(s)) return ANSWERS.late;
  if (/sync|\bsage\b|\bedi\b|feed|wms|integration|connect|fail|broke|health|system/.test(s)) return ANSWERS.sync;
  return ANSWERS.fallback;
}

/* name, type, balance, oldest, status */
const ORGS = [
  ["Murphy Building Supplies","Customer","€18,240","Current","active"],
  ["Doyle Construction","Customer","€42,680","67 days","credit hold"],
  ["O'Brien Facilities","Customer","€9,860","Current","active"],
  ["Atlas Industrial Supplies","Supplier","—","—","needs review"],
  ["McGrath Civil Engineering","Customer","€27,410","91 days","watch"],
  ["Tallaght Trade Centre","Customer","€24,310","62 days","credit hold"],
  ["EuroFix GmbH","Supplier","—","—","preferred"]
];
/* team, members, lead, key permission: 58 staff across nine teams */
const TEAMS = [
  ["Management","2 members","Patrick Byrne","all permissions"],
  ["Commercial","2 members","Michael Doyle","pricing:approve"],
  ["Purchasing","3 members","Emma Walsh","po:approve"],
  ["Sales","6 members","Sarah Byrne","orders:edit"],
  ["Customer Service","3 members","Fiona Lynch","returns:approve"],
  ["Warehouse Dublin","18 members","Liam Murphy","stock:adjust"],
  ["Warehouse Naas","8 members","Aoife Brennan","stock:adjust"],
  ["Transport","12 members","Orla Quinn","routes:edit"],
  ["Finance","4 members","Niamh Clarke","credit:hold"]
];
const LOCATIONS = [
  ["Dublin Distribution Centre","Ballymount Industrial Estate, Dublin 12","47 staff","active"],
  ["Naas Distribution Centre","Millennium Park, Naas, Co. Kildare","11 staff","active"]
];

/* The eight agents (SPEC §44). No group agent: every thread is one agent talking to Patrick. */
const AGENT_DEFS = [
  {id:"briefing", name:"Briefing", shape:"crown-pebble", tint:"#191c1f", state:"complete",
   role:"Reads every system before the day starts and writes the morning and evening briefs",
   when:"08:03", preview:"7 orders at risk, €46,280. 3 decisions need you.",
   thread:[
     {kind:"stamp", text:"Today 08:00"},
     {kind:"routine", text:"Ran routine", routine:"Morning briefing"},
     {kind:"agent", text:"morning briefing:", lines:[
       {k:"Orders", v:"94 today worth €176,420 · 7 at risk, €46,280"},
       {k:"Biggest issue", v:"Murphy SO-10482 (€27,640) · 3 lines short on Atlas PO-8821, 5 days late"},
       {k:"Margin", v:"23.8% against 25.0% · €18,600 a year recoverable on 3 price agreements"},
       {k:"Stock", v:"€286,420 slow-moving · €74,200 not moved in 180 days"},
       {k:"Decisions", v:"3 waiting on you"}]},
     {kind:"agent", text:"murphy can go part today: 15 of 18 lines on D14 at 13:45, the other three tomorrow once PO-8821 lands at 10:30. sarah has the customer email drafted."},
     {kind:"user", text:"what are the three"},
     {kind:"agent", text:"in deadline order:", lines:[
       {k:"09:30", v:"€420 freight to bring PO-8821 in tonight · protects €41,880"},
       {k:"10:00", v:"Doyle SO-10503 · release €7,320 against available credit"},
       {k:"11:00", v:"O'Brien QT-2841 at 17.2% · counter at 21.5%"}]},
     {kind:"user", text:"doyle after rachel's rung them. i'll do the rest from here"},
     {kind:"agent", text:"ok. rachel has INV-28482 open: €14,860, and kieran promised payment 'this week' on 18 sep. the freight goes stale at 09:30, atlas needs a yes by then for tonight's van."}
   ]},
  {id:"ops", name:"Ops Watchdog", shape:"shield", tint:"#2b1b1e", state:"attention",
   role:"Watches every open order, pick wave and dispatch cutoff, and flags what is going to miss",
   when:"09:05", preview:"7 orders on today's dispatch at risk. w01 is the tight one.",
   thread:[
     {kind:"stamp", text:"Today 07:00"},
     {kind:"routine", text:"Ran routine", routine:"Dispatch risk check"},
     {kind:"agent", text:"first pass: 94 orders to pick in dublin today, 1,284 lines, 6 urgent. naas has 38 orders and 452 lines."},
     {kind:"stamp", text:"Today 08:50"},
     {kind:"agent", text:"harbour point placed SO-10536 at 08:48, after the W01 wave went out. liam moved it into wave 2. 8 lines, cutoff 11:30."},
     {kind:"stamp", text:"Today 09:05"},
     {kind:"agent", text:"7 orders on today's dispatch are at risk, €46,280:", lines:[
       {k:"Stock", v:"SO-10482, SO-10497, SO-10509 wait on PO-8821 · SO-10526 needs EL-4408 from Naas"},
       {k:"Vehicle", v:"SO-10531, SO-10528 · D11 340kg over weight"},
       {k:"Picking", v:"SO-10536 · 2 lines not started, reach truck on charge"}]},
     {kind:"agent", text:"the naas transfer (TR-2291) fixes three of the four stock ones if liam approves by 10:30. the 11:00 van lands at 11:45, in time for D14."},
     {kind:"user", text:"why is the reach truck on charge at 9"},
     {kind:"agent", text:"the pallet for D-30-07 is above level 2 and the free truck went on charge after goods-in prep for PO-8830. adam's pick moves from 10:15 to 10:55 against an 11:30 cutoff. tight, not lost."},
     {kind:"user", text:"keep an eye on it"},
     {kind:"agent", text:"will do. if it slips past 11:10 i'll ask orla whether W01 can hold for 20 minutes."}
   ]},
  {id:"stock", name:"Inventory Agent", shape:"control-cube", tint:"#16241f", state:"thinking",
   role:"Stockouts, excess, reorder points and balancing stock between Dublin and Naas",
   when:"2m", preview:"el-4408 runs out in dublin on 21 oct, even with po-8821.",
   thread:[
     {kind:"stamp", text:"Today 09:14"},
     {kind:"agent", text:"projected stockout on EL-4408 Industrial Cable 100m:", lines:[
       {k:"Dublin", v:"38 on hand · 12 free · 26 allocated"},
       {k:"Demand", v:"32 a week · 58 in the next 7 days"},
       {k:"Incoming", v:"120 on PO-8821, now 26 Sep 10:30"},
       {k:"Lead time", v:"28 days from Atlas"},
       {k:"Stockout", v:"21 Oct, even with PO-8821"}]},
     {kind:"agent", text:"PO-8821 doesn't give enough cover against expected demand. an atlas order placed today lands 23 oct, two days after the stockout. i'd order 160 today from eurocable instead: €0.45 more landed, 9 days not 28, 97.8% OTIF."},
     {kind:"agent", text:"in the meantime naas has 64 free against 11 of demand. moving 40 on the 11:00 van protects SO-10497, SO-10509 and SO-10526 (€12,460)."},
     {kind:"user", text:"do both"},
     {kind:"agent", text:"both drafted, neither is live. the PO (160 at eurocable's €22.20, €3,552) waits on emma and the transfer TR-2291 waits on liam. i'll tell you when they say yes."}
   ]},
  {id:"purchasing", name:"Purchasing Agent", shape:"low-dome", tint:"#1b2430", state:"waiting",
   role:"Open POs, supplier dates, ASNs and what each late delivery does to customer orders",
   when:"09:04", preview:"atlas moved po-8821 again. 26 sep 10:30 now.",
   thread:[
     {kind:"stamp", text:"Today 07:30"},
     {kind:"agent", text:"atlas missed its second promised date on PO-8821 (€38,640, 14 SKUs). it was due on 20 sep. i've told emma."},
     {kind:"stamp", text:"Today 09:04"},
     {kind:"agent", text:"atlas changed the ETA again: 26 sep 10:30 on groupage. what's waiting on it:", lines:[
       {k:"Customer orders", v:"6 · €41,880 · Murphy SO-10482 is the biggest"},
       {k:"SKUs short", v:"EL-4408, EL-4521, IC-2290, IC-4470"},
       {k:"Option", v:"dedicated van tonight for €420 · lands 06:30, before the first wave"}]},
     {kind:"user", text:"is atlas worth keeping on cable"},
     {kind:"agent", text:"not as the only supplier. 86.2% OTIF this year, 3.8 days average delay, 126 customer orders affected and 7 quality claims. eurocable does EL-4408 at €22.55 landed against atlas's €22.10, in 9 days. i'd buy the top electrical lines from both and put atlas on review."},
     {kind:"user", text:"put it on emma's supplier review"},
     {kind:"agent", text:"added to emma's atlas review. the €420 freight is with you, and atlas needs the yes by 09:30."}
   ]},
  {id:"margin", name:"Margin Agent", shape:"precision-brow", tint:"#241b2e", state:"waiting",
   role:"Price lists, supplier cost changes, discounts and every order or quote under target margin",
   when:"08:58", preview:"37 customers still on old eurofix bolt pricing.",
   thread:[
     {kind:"stamp", text:"Today 08:22"},
     {kind:"routine", text:"Ran routine", routine:"Cost change watch"},
     {kind:"agent", text:"eurofix's 1 sep price file is in: 428 cost changes loaded into sage 200. most move with the price lists. 37 customer agreements don't, all on M10 hex bolts."},
     {kind:"stamp", text:"Today 08:58"},
     {kind:"agent", text:"FIX-2201 M10 Hex Bolt Box 100:", lines:[
       {k:"Cost", v:"€16.40 → €18.10 (+10.4%) from 1 Sep"},
       {k:"On old pricing", v:"37 customers · 482 boxes a month"},
       {k:"Impact", v:"€819 a month"},
       {k:"Lowest", v:"O'Brien Facilities at 13.4% · Leinster Property at 15.4%"}]},
     {kind:"agent", text:"O'Brien's QT-2841 is with michael at 17.2% against 24%, and it prices bolts on the old contract rate too. i'd counter at 21.5%: keep the PPE discount, restore list on fixings."},
     {kind:"user", text:"send michael the counter"},
     {kind:"agent", text:"it's on his approval, DA-418, due 11:00. i haven't changed a price. repricing the 37 agreements is a write, so that waits on michael as well."}
   ]},
  {id:"customer", name:"Customer Agent", shape:"soft-asymmetric", tint:"#191c1f", state:"working",
   role:"Account health, buying patterns, lapsed categories and who each account manager should call",
   when:"07:45", preview:"ryan trade hasn't bought m10 bolts in 47 days.",
   thread:[
     {kind:"stamp", text:"Today 07:45"},
     {kind:"routine", text:"Ran routine", routine:"Account health scan"},
     {kind:"agent", text:"18 accounts are declining. three matter this week:", lines:[
       {k:"Ryan Trade", v:"spend down 28% in 90 days · M10 bolts 47 days, normally every 18 to 24"},
       {k:"Swords Building", v:"no PPE since July · was €1,400 a month"},
       {k:"Wicklow Hardware", v:"ordering every 19 days, was every 11"}]},
     {kind:"agent", text:"ryan is €34,080 a year at risk on that one pattern. mark has the call at 15:00."},
     {kind:"user", text:"what about murphy, they're growing"},
     {kind:"agent", text:"up 12.4% this year, mostly electrical. but no PPE in 74 days after ordering it monthly: €4,800 to €6,200 there now. 68% of similar merchants buy PPE from us, so the full gap is €22,000 to €34,000 a year. sarah can raise it when she confirms the partial shipment."},
     {kind:"user", text:"tell sarah"},
     {kind:"agent", text:"added to sarah's murphy task as a talking point. nothing goes to the customer from me."}
   ]},
  {id:"dispatch", name:"Dispatch Agent", shape:"tall-unit", tint:"#16241f", state:"attention",
   role:"Routes, loads, delivery risk and OTIF, stop by stop",
   when:"08:36", preview:"d11 is 340kg over. move so-10528 to d09.",
   thread:[
     {kind:"stamp", text:"Today 08:36"},
     {kind:"agent", text:"route D11 is over its plated weight:", lines:[
       {k:"Vehicle", v:"241-D-20417 · 7.5t rigid · Niall Treacy"},
       {k:"Load", v:"7,840kg planned · 340kg over"},
       {k:"Fix", v:"move SO-10528, Clondalkin Plant Hire (380kg), to the second drop on D09"}]},
     {kind:"agent", text:"D11 was due out at 10:00. orla has it. westbrook's SO-10531 stays on D11."},
     {kind:"user", text:"does clondalkin still get it today"},
     {kind:"agent", text:"yes. D09 is on its last stop and back by 11:40, so clondalkin gets it in the early afternoon instead of the morning. worth telling them now."},
     {kind:"user", text:"ok"},
     {kind:"agent", text:"drafted a note to clondalkin's yard manager for orla to send. OTIF is 94.2% against 97%. D14 runs at 92.8% this month and carries today's biggest risk."}
   ]},
  {id:"credit", name:"Credit Agent", shape:"executive-capsule", tint:"#2a2118", state:"waiting",
   role:"Credit limits, overdue invoices, held orders and who to chase first",
   when:"08:42", preview:"doyle held. €7,320 can go now.",
   thread:[
     {kind:"stamp", text:"Today 08:42"},
     {kind:"agent", text:"doyle construction emailed SO-10503 at 08:31 (€16,240). releasing it takes them to €58,920 against a €50,000 limit, so it's on hold."},
     {kind:"agent", text:"the account:", lines:[
       {k:"Balance", v:"€42,680 of €50,000"},
       {k:"Overdue", v:"€14,860 on INV-28482 · 67 days · promised 'this week' on 18 Sep"},
       {k:"Available", v:"€7,320"}]},
     {kind:"agent", text:"i'd release €7,320 now against available credit and ask for INV-28482 before the rest goes. a credit override needs the MD, so that one's yours."},
     {kind:"user", text:"draft the payment request, rachel sends it"},
     {kind:"agent", text:"drafted from rachel to kieran doyle and parked for her yes. nothing's sent. when INV-28482 clears i'll bring the balance of SO-10503 back to you to release."},
     {kind:"agent", text:"tallaght trade's SO-10533 is held too: €6,420 at 62 days. it drops off D14 unless it's released by 13:00."}
   ]}
];

/* Keys are the ones Pulse's state already uses (revenue, cash, overdue, margin, jobs...). */
const KPI_DEFS = {
  revenue:{label:"Revenue MTD", value:eur(KPI.revenueMTD), delta:KPI.revenueDelta, dir:"up", hint:"vs last year", hero:true},
  margin:{label:"Gross margin", value:KPI.grossMargin.toFixed(1) + "%", delta:"−1.2pt", dir:"down", hint:"vs 25.0% target"},
  nps:{label:"OTIF", value:OTIF.current.toFixed(1) + "%", delta:"−2.8pt", dir:"down", hint:"vs 97.0% target"},
  jobs:{label:"Orders today", value:String(KPI.ordersToday), delta:KPI.atRiskToday + " at risk", dir:"down", hint:eur(KPI.ordersTodayValue) + " scheduled"},
  utilisation:{label:"Inventory", value:eurK(KPI.inventory), delta:eurK(KPI.slowStock) + " slow", dir:"down", hint:"€74.2k not moved in 180 days"},
  cash:{label:"Receivables", value:eur(KPI.receivables), delta:eurK(KPI.overdue) + " overdue", dir:"down", hint:"DSO " + CASH.dso + " days"},
  overdue:{label:"Overdue debt", value:eur(KPI.overdue), delta:"€22k at 90+ days", dir:"down", hint:"of €318k receivables"},
  backorders:{label:"Backorders", value:String(KPI.backorders), delta:eur(KPI.backorderValue), dir:"down", hint:"orders awaiting stock"},
  supplier:{label:"Supplier fill rate", value:KPI.fillRate.toFixed(1) + "%", delta:KPI.latePOs + " POs late", dir:"down", hint:"of " + KPI.openPOs + " open"},
  openOrders:{label:"Open orders", value:String(KPI.openOrders), delta:KPI.atRiskOrders + " at risk", dir:"down", hint:eur(KPI.openOrderValue)},
  creditHolds:{label:"Credit holds", value:String(KPI.creditHolds), delta:"€38,420 held", dir:"down", hint:"Doyle is the largest"},
  pipeline:{label:"Open quotes", value:eur(KPI.quotesOpen), delta:"4 under target", dir:"down", hint:"margin exceptions pending"}
};

/* ---- Executive Dashboard: six areas (SPEC §51) ---- */
const k1 = (n) => "€" + (n / 1000).toFixed(1) + "k";
const pctOf = (n, total) => Math.round(100 * n / total) + "%";
const CAT_OTHER = CATEGORY_MARGIN.slice(3).reduce((t, c) => t + c[1], 0);
const INV_OTHER = INVENTORY_BY_CAT.slice(3).reduce((t, c) => t + c[1], 0);
const SHORT_SUPPLIER = {atlas:"Atlas", eurofix:"EuroFix", safepro:"SafePro", eurocable:"EuroCable", toolcraft:"Toolcraft", hansen:"Hansen",
  kingfield:"Kingfield", lumos:"Lumos", bristol:"Bristol", ifc:"IFC", midpack:"Midpack", celtic:"Celtic"};
const HEALTH_SORTED = HEALTH_COUNTS.slice().sort((a, b) => b[1] - a[1]);
/* Lines picked per working day, both warehouses. Today (25 Sep) is the planned load. */
const THROUGHPUT = [["10 Sep",[1196,428]],["11 Sep",[1242,441]],["14 Sep",[1318,466]],["15 Sep",[1231,437]],["16 Sep",[1207,425]],["17 Sep",[1264,449]],
  ["18 Sep",[1189,432]],["21 Sep",[1302,471]],["22 Sep",[1246,440]],["23 Sep",[1228,436]],["24 Sep",[1271,458]],["25 Sep",[1284,452]]];

const ASPECT_DEFS = [
  /* id "sales" is kept so the dashboard's default area is Commercial. */
  {id:"sales", label:"Commercial", color:"var(--accent)", owner:"MICHAEL DOYLE", description:"Revenue, margin, order intake and quote conversion across 437 accounts.",
   kind:"columns", chartTitle:"Revenue by month", chartUnit:"EUR · SEP IS MONTH TO DATE",
   chart:REVENUE_MONTHS.map(r => [r[0], Math.round(r[1] / 1000), eurK(r[1])]),
   splitTitle:"Revenue by category, month to date",
   split:[["Electrical", k1(CATEGORY_MARGIN[0][1]), pctOf(CATEGORY_MARGIN[0][1], KPI.revenueMTD), 1],
     ["Fixings", k1(CATEGORY_MARGIN[1][1]), pctOf(CATEGORY_MARGIN[1][1], KPI.revenueMTD), 0],
     ["Consumables", k1(CATEGORY_MARGIN[2][1]), pctOf(CATEGORY_MARGIN[2][1], KPI.revenueMTD), 0],
     ["All other", k1(CAT_OTHER), pctOf(CAT_OTHER, KPI.revenueMTD), 0]],
   tableCols:["Quote","Value","vs target","Status"],
   table:[["QT-2841 · O'Brien Facilities","€18,420","−6.8pt","Pending · Michael Doyle"],["QT-2856 · Leinster Property","€11,240","−3.6pt","Pending · Michael Doyle"],
     ["QT-2862 · Grange Contracts","€9,650","−2.4pt","Pending · Michael Doyle"],["QT-2851 · Core Facilities","€31,640","+3.9pt","Sent 6 days ago"]],
   metrics:[["Revenue MTD", eur(KPI.revenueMTD), KPI.revenueDelta, "up", "vs last year", REVENUE_MONTHS.slice(-9).map(r => +(r[1] / 1344000).toFixed(2))],
     ["Gross margin", KPI.grossMargin.toFixed(1) + "%", "−1.2pt", "down", "vs 25.0% target", REVENUE_MONTHS.slice(-9).map(r => +((r[2] - 21.5) / 3.5).toFixed(2))],
     ["Average order", eur(KPI.avgOrder), "+2.6%", "up", "vs August", [.72,.74,.7,.76,.75,.78,.77,.8,.82]],
     ["Quote conversion", "34%", "−3pt", "down", "won, last 90 days", [.8,.78,.8,.74,.76,.7,.72,.68,.66]]]},

  {id:"customer", label:"Customer", color:"#9fd6f0", owner:"SARAH BYRNE", description:"Who is growing, who is slipping and what is still unresolved on 437 active accounts.",
   kind:"rows", rows:HEALTH_SORTED.map(h => [h[0], String(h[1]), h[1]]), chartTitle:"Accounts by health", chartUnit:"ACCOUNTS",
   chart:HEALTH_SORTED.map(h => [h[0], h[1], String(h[1])]),
   splitTitle:"Annualised revenue at risk",
   split:[["Ryan Trade","€18.6k","33%",1],["Swords","€16.8k","29%",0],["Wicklow","€12.9k","23%",0],["Midland","€8.8k","15%",0]],
   tableCols:["Account","Revenue YTD","Trend","Next action"],
   table:[["Ryan Trade Supplies","€96,240","−28%","Account manager call · Mark Ryan"],["Swords Building Supplies","€187,300","−11.8%","Visit with PPE range · David Kelly"],
     ["Wicklow Hardware & DIY","€88,140","−14.6%","Review Tier C pricing · David Kelly"],["Liffey Mechanical & Electrical","€118,500","−9.4%","Call before QT-2839 expires · David Kelly"]],
   metrics:[["Active accounts", String(KPI.activeAccounts), "96 growing", "up", "22 at risk", [.9,.91,.9,.92,.93,.92,.94,.95,.96]],
     ["Retention", "95.0%", "−0.8pt", "down", "rolling 12 months", [.84,.84,.83,.83,.82,.82,.81,.8,.8]],
     ["Declining", String(KPI.declining), "€57.1k at risk", "down", "top 4, annualised", [.3,.34,.36,.4,.46,.5,.56,.62,.7]],
     ["Service issues", "4", "6 this week", "down", "delivery issues open", [.4,.3,.5,.36,.44,.5,.38,.56,.6]]]},

  {id:"inventory", label:"Inventory", color:"#e6c78a", owner:"CIARÁN DOHERTY", description:"€2.46m of stock across 8,426 SKUs: what is free, what is ageing and what runs out next.",
   kind:"funnel", funnel:INVENTORY_AGEING.map((a, i) => [a[0], ["€1.40m","€516k","€255k","€212k","€74.2k"][i], i === 4 ? "3% · 376 SKUs" : pctOf(a[1], KPI.inventory) + " of value", a[1]]),
   chartTitle:"Stock by age", chartUnit:"EUR · €2.46M ON HAND",
   chart:INVENTORY_AGEING.map((a, i) => [a[0], Math.round(a[1] / 1000), ["€1.40m","€516k","€255k","€212k","€74.2k"][i]]),
   splitTitle:"Stock value by category",
   split:[["Electrical", eurK(INVENTORY_BY_CAT[0][1]), pctOf(INVENTORY_BY_CAT[0][1], KPI.inventory), 1],
     ["Fixings", eurK(INVENTORY_BY_CAT[1][1]), pctOf(INVENTORY_BY_CAT[1][1], KPI.inventory), 0],
     ["Consumables", eurK(INVENTORY_BY_CAT[2][1]), pctOf(INVENTORY_BY_CAT[2][1], KPI.inventory), 0],
     ["All other", eurK(INV_OTHER), pctOf(INV_OTHER, KPI.inventory), 0]],
   tableCols:["SKU","Available","Suggested order","Reason"],
   table:[["EL-4408 · Industrial Cable 100m","12","+160","Stockout 21 Oct · order today"],["EL-4521 · SWA Cable Gland 20mm","0","+200","Demand up 34% · order today"],
     ["FIX-1180 · Concrete Screw 7.5×100","96","+200","No PO open · stockout 5 Oct"],["SAF-1892 · Safety Glasses Clear","2,010","−500","22 weeks' cover · transfer instead"]],
   metrics:[["Inventory value", eurK(KPI.inventory), "€1.94m free", "up", "€234k allocated", [.94,.95,.96,.97,.98,.97,.99,1,1]],
     ["Stock turn", "6.3×", "−0.4", "down", CASH.dio + " days on hand", [.8,.78,.76,.77,.74,.72,.7,.69,.67]],
     ["Stockouts", "28", "64 critical", "down", "SKUs at zero", [.3,.28,.36,.4,.38,.46,.5,.58,.64]],
     ["Slow-moving", eurK(KPI.slowStock), "€74.2k dead", "down", "90+ days · 180+ dead", [.6,.62,.64,.66,.7,.72,.76,.8,.84]]]},

  {id:"supply", label:"Supply", color:"#e2705c", owner:"EMMA WALSH", description:"64 suppliers: who delivers on time, which POs are late and what is waiting on them.",
   kind:"dots", target:1.5, targetLabel:"Target: 1.5 days' average delay or less", chartTitle:"Average delay by supplier", chartUnit:"DAYS · TOP 12 BY SPEND",
   chart:SUPPLIERS.map(s => [SHORT_SUPPLIER[s.id] || s.name, s.delay, s.delay.toFixed(1) + "d"]),
   splitTitle:"Late PO value by supplier",
   split:[["Atlas ×2","€61.0k","49%",1],["Toolcraft","€18.9k","15%",0],["Hansen","€12.5k","10%",0],["Lumos","€9.8k","8%",0],["6 others","€21.4k","18%",0]],
   tableCols:["Supplier","OTIF","vs 95% target","Status"],
   table:[["Atlas Industrial Supplies","86.2%","−8.8pt","Needs review · 9 open POs"],["Hansen Adhesives A/S","91.6%","−3.4pt","On watch · 4 open POs"],
     ["Lumos Lighting Ltd","92.4%","−2.6pt","Approved · 4 open POs"],["EuroCable BV","97.8%","+2.8pt","Preferred · 6 open POs"]],
   metrics:[["Supplier fill rate", KPI.fillRate.toFixed(1) + "%", "−0.6pt", "down", "across 64 suppliers", [.9,.88,.9,.87,.86,.88,.85,.84,.83]],
     ["Late POs", String(KPI.latePOs), "of " + KPI.openPOs + " open", "down", "PO-8821 is 5 days late", [.3,.36,.34,.42,.4,.5,.56,.62,.7]],
     ["Average lead time", "13 days", "Atlas 28", "down", "top 12 by spend", [.5,.52,.5,.54,.56,.55,.58,.6,.6]],
     ["Due this week", String(KPI.posDueWeek), "7 arriving today", "up", "€148k booked in today", [.4,.5,.46,.6,.56,.64,.7,.66,.74]]]},

  {id:"operations", label:"Operations", color:"#dcded6", owner:"LIAM MURPHY", description:"Open orders, pick throughput in Dublin and Naas, and on-time-in-full delivery.",
   kind:"stacked", legend:["Dublin","Naas"], stacked:THROUGHPUT, chartTitle:"Lines picked by day", chartUnit:"LINES · 25 SEP IS PLANNED",
   chart:THROUGHPUT.map(d => [d[0], d[1][0] + d[1][1], String(d[1][0] + d[1][1])]),
   splitTitle:"Open orders by stage",
   split:ORDER_PIPELINE.slice().sort((a, b) => b.n - a.n).map((p, i) => [p.stage, String(p.n), pctOf(p.n, KPI.openOrders), i === 0 ? 1 : 0]),
   tableCols:["Route","Value","OTIF vs 97%","Status"],
   table:[["D14 · James Nolan","€48,620","−4.2pt","Waiting on SO-10482 · departs 13:45"],["D11 · Niall Treacy","€18,430","−2.4pt","Held · 340kg over weight"],
     ["W01 · Declan Farrell","€17,260","−1.2pt","Waiting on SO-10536 · departs 12:00"],["D16 · Paddy Geoghegan","€21,980","+0.2pt","All 7 delivered by 09:05"]],
   metrics:[["Open orders", String(KPI.openOrders), eur(KPI.openOrderValue), "up", "across both warehouses", [.8,.84,.82,.88,.86,.9,.92,.95,1]],
     ["At risk", String(KPI.atRiskOrders), eur(KPI.atRiskValue), "down", KPI.atRiskToday + " on today's dispatch", [.3,.4,.36,.5,.46,.6,.66,.7,.84]],
     ["Lines to pick", "1,736", "1,284 Dublin", "up", "452 Naas", THROUGHPUT.slice(-9).map(d => +((d[1][0] + d[1][1]) / 1789).toFixed(2))],
     ["OTIF", OTIF.current.toFixed(1) + "%", "−2.8pt", "down", "vs 97.0% target", OTIF.trend.slice(-9).map(t => +((t[1] - 92) / 4.5).toFixed(2))]]},

  /* id "finance" is kept for the Cash area. */
  {id:"finance", label:"Cash", color:"#7fd8a4", owner:"NIAMH CLARKE", description:"Receivables, overdue debt, credit holds and the cash tied up in stock.",
   kind:"area", chartTitle:"Forecast cash in by week", chartUnit:"€K · NEXT 8 WEEKS",
   chart:CASH.weeks.map(w => [w[0], w[1], "€" + w[1] + "k"]),
   splitTitle:"Debtors by age",
   split:[["Current","€194k","61%",1],["30 days","€68k","21%",0],["60 days","€34k","11%",0],["90+ days","€22k","7%",0]],
   tableCols:["Account","Balance","Headroom","Held order"],
   table:[["Doyle Construction","€42,680","−€8,920","SO-10503 · €16,240"],["Tallaght Trade Centre","€24,310","−€2,090","SO-10533 · €2,780"],
     ["McGrath Civil Engineering","€27,410","+€7,980","SO-10538 · 91 days, disputed"],["Midland Timber & Hardware","€11,060","+€15,980","SO-10539 · cheque posted"]],
   metrics:[["Receivables", eur(KPI.receivables), "DSO " + CASH.dso + " days", "down", "€194k current", [.8,.82,.85,.84,.88,.9,.92,.95,1]],
     ["Overdue", eur(KPI.overdue), "€22k at 90+", "down", "39% of receivables", [.5,.54,.58,.6,.66,.7,.76,.82,.9]],
     ["Credit holds", String(KPI.creditHolds), "€38,420", "down", "orders held", [.3,.4,.36,.5,.44,.56,.62,.7,.8]],
     ["Working capital", eurK(KPI.cashTiedUp), eurK(KPI.wcRelease) + " to release", "up", "stock plus receivables", [.9,.92,.94,.93,.96,.97,.98,.99,1]]]}
];

const FILTER_GROUPS = [
  {title:"AREA", items:["Commercial","Customer","Inventory","Supply","Operations","Cash"]},
  {title:"SPINE", items:["Warehouse","Account manager","Supplier","Category","Route"]},
  {title:"TIME", items:["This week","This month","This quarter","Year to date"]}
];

/* The operations control room. The first four are the client's workflows (SPEC §43).
   Ids are fixed so today's agenda (o5, o2, o3, o10, o4, o6, o9, o8) runs in time order. */
const OPS_DEFS = [
  {id:"o10", name:"Low stock", kind:"automation", owner:"Inventory Agent", ownerKind:"agent", initials:"IA",
   trigger:"Stock falls below reorder point", triggerKind:"event", next:"On event", last:"EL-4408 · PO and transfer drafted", status:"approval", rate:97, on:true,
   what:"When available stock drops below the reorder point in either warehouse, checks what is already incoming and what open orders, quotes and forecast demand need inside the lead time, then drafts a transfer from the other warehouse or a purchase order.",
   why:"Stockouts were found when a picker reached an empty bin, usually after the customer had been promised the goods.",
   saved:"14 hours a month",
   steps:[["Trigger","Available stock falls below the reorder point in Dublin or Naas"],["Check","Open POs and what is already incoming"],
     ["Check","Open orders, quotes and forecast demand against the supplier lead time"],["Find","Free stock in the other warehouse"],
     ["Draft","A transfer if the other site can cover it, a purchase order if not"],
     ["Approval","Buyer approves the PO, warehouse manager the transfer","gate"],
     ["Update","Raise it in Sage 200 and tell the account managers affected"]],
   runs:[["Today 09:14","9s","ok","EL-4408 · PO for 160 and TR-2291 drafted","€0.02"],["Today 06:10","7s","ok","FIX-1180 · PO for 200 drafted","€0.01"],
     ["24 Sep 15:40","6s","ok","EL-4521 · transfer of 30 drafted","€0.01"]]},
  {id:"o4", name:"Supplier delay", kind:"automation", owner:"Purchasing Agent", ownerKind:"agent", initials:"PA",
   trigger:"A supplier changes a promised date", triggerKind:"event", next:"On event", last:"PO-8821 · 6 orders, €41,880", status:"approval", rate:98, on:true,
   what:"When a supplier moves a date or short-ships, finds every customer order waiting on that PO, checks substitutes, the other warehouse and a faster supplier, and drafts new dates and a customer update for each account manager.",
   why:"A supplier delay used to surface when the customer rang to ask where their order was.",
   saved:"16 hours a month",
   steps:[["Trigger","A supplier moves a promised date or an ASN comes in short"],["Find","Every customer order waiting on that PO"],
     ["Check","Substitutes, stock in the other warehouse and a faster supplier"],
     ["Draft","New delivery dates and a customer update for each account manager"],
     ["Approval","The account manager approves each customer update","gate"],
     ["Send","Email the customer from Outlook"],["Update","Re-date the orders in Sage 200"]],
   runs:[["Today 09:04","11s","ok","PO-8821 · 6 orders, €41,880 · 4 updates drafted","€0.03"],["Today 07:30","10s","ok","PO-8821 · second missed date · Emma notified","€0.02"],
     ["24 Sep 11:02","8s","ok","PO-8815 · 2 orders re-dated","€0.02"]]},
  {id:"o6", name:"Low margin order", kind:"automation", owner:"Margin Agent", ownerKind:"agent", initials:"MA",
   trigger:"An order or quote lands below target margin", triggerKind:"event", next:"On event", last:"QT-2862 · 21.6% · with Michael", status:"approval", rate:99, on:true,
   what:"When an order or quote is priced under the customer's target margin, checks the price list, the current cost and the rep's discount tier, drafts a counter-offer that recovers the margin and routes anything beyond the tier to the Commercial Director.",
   why:"Deep discounts were only found at month end, after the goods had shipped.",
   saved:"8 hours a month",
   steps:[["Trigger","An order or quote is priced under the customer's target margin"],
     ["Check","Price list, current cost and any supplier increase not passed through"],["Check","The rep's discount tier"],
     ["Draft","A counter-offer that recovers the margin"],
     ["Approval","Commercial Director approves anything beyond the rep's tier","gate"],
     ["Update","Record the decision and the reason against the quote"]],
   runs:[["Today 08:40","5s","ok","QT-2862 · 21.6% · DA-424 raised","€0.01"],["24 Sep 14:12","6s","ok","QT-2856 · 20.4% · DA-421 raised","€0.01"],
     ["23 Sep 16:05","7s","ok","QT-2841 · 17.2% · DA-418 raised","€0.02"]]},
  {id:"o8", name:"Credit limit", kind:"automation", owner:"Credit Agent", ownerKind:"agent", initials:"CA",
   trigger:"An order would exceed a credit limit", triggerKind:"event", next:"On event", last:"SO-10503 · held, part-release proposed", status:"approval", rate:100, on:true,
   what:"When a new order would take an account over its limit, holds it in Sage 200, checks overdue invoices, payment promises and available credit, and proposes what can ship now and what payment to ask for first.",
   why:"Held orders sat in a queue nobody owned while the customer's site waited for the goods.",
   saved:"10 hours a month",
   steps:[["Trigger","A new order would take the account over its credit limit"],["Update","Hold the order in Sage 200"],
     ["Check","Overdue invoices, payment promises and available credit"],
     ["Draft","A part-release against available credit and a payment request"],
     ["Approval","Managing Director approves any override","gate"],
     ["Send","Credit controller sends the payment request"]],
   runs:[["Today 08:42","6s","ok","SO-10503 · Doyle · €8,920 over","€0.01"],["Today 08:24","4s","ok","SO-10533 · Tallaght · held","€0.01"],
     ["24 Sep 10:18","5s","ok","SO-10539 · Midland · held on age","€0.01"]]},
  {id:"o2", name:"Morning and evening brief", kind:"routine", owner:"Briefing", ownerKind:"agent", initials:"BR",
   trigger:"Weekdays, 08:00 and 17:30", triggerKind:"schedule", next:"Today 17:30", last:"Delivered 08:03", status:"healthy", rate:100, on:true,
   what:"Reads orders, stock, purchasing, deliveries, margin and cash overnight and tells management what changed, what matters and what needs a decision. The evening brief closes the day.",
   why:"Mornings started with twenty minutes of people reading numbers off their own screens.",
   saved:"9 hours a month",
   steps:[["Trigger","Every weekday at 08:00, again at 17:30"],["Find","Overnight changes across every module"],
     ["Check","Drop anything already handled"],["Draft","Write the briefing, biggest issue first"],["Send","Post to Home and to Patrick"]],
   runs:[["Today 08:00","3m 02s","ok","1 briefing · 3 decisions","€0.03"],["24 Sep 17:30","2m 40s","ok","Evening brief","€0.03"],
     ["24 Sep 08:00","2m 51s","ok","1 briefing · 2 decisions","€0.03"]]},
  {id:"o5", name:"Supplier price-file import", kind:"automation", owner:"Margin Agent", ownerKind:"agent", initials:"MA",
   trigger:"Hourly, 06:00 to 20:00", triggerKind:"schedule", next:"Today 10:00", last:"Hansen file rejected", status:"failed", rate:93, on:true,
   what:"Picks up supplier price files and EDI cost messages every hour, validates them, loads new costs into Sage 200 and hands the cost change watch every customer agreement that did not move with the cost.",
   why:"Price files sat in an inbox for weeks while customers were billed on the old cost.",
   saved:"12 hours a month",
   steps:[["Trigger","Every hour from 06:00 to 20:00"],["Check","Columns, currency and SKU matches in each file"],
     ["Update","Load new costs into Sage 200"],["Find","Customer agreements that did not move with the cost"],
     ["Draft","A price change per agreement, with the margin impact"],
     ["Approval","Commercial Director approves repricing","gate"]],
   runs:[["Today 09:00","12s","failed","Hansen Adhesives · 0 lines","€0.00","Currency column missing from the DKK file. Nothing loaded."],
     ["Today 08:00","22m 04s","ok","EuroFix · 428 cost changes loaded","€0.21"],["Today 07:00","9s","ok","No new files","€0.00"]]},
  {id:"o11", name:"POD exception to credit note", kind:"automation", owner:"Dispatch Agent", ownerKind:"agent", initials:"DA",
   trigger:"A POD comes back with an exception", triggerKind:"event", next:"On event", last:"SO-10484 · RT-1188 raised", status:"healthy", rate:94, on:true,
   what:"When a driver's POD records damage, a refusal or a shortage, checks the photo and GPS, then drafts the return, the replacement on the next route or the credit note.",
   why:"Damaged deliveries turned into credit notes weeks later, if at all, and the pattern behind them was never seen.",
   saved:"7 hours a month",
   steps:[["Trigger","A POD comes back with an exception"],["Check","Photo, GPS and what the customer signed for"],
     ["Draft","Return, replacement or credit note"],
     ["Approval","Customer service lead approves the credit note","gate"],
     ["Update","Raise it in Sage and book any replacement on the next route"]],
   runs:[["Today 08:21","4s","ok","SO-10484 · 1 carton refused · RT-1188","€0.01"],
     ["Today 07:48","2s","failed","SO-10470 · Kildare Build Centre","€0.00","No photo on the POD, so the exception can't be checked. Driver asked."],
     ["Today 07:31","5s","ok","SO-10471 · 1 box crushed on N02","€0.01"]]},
  {id:"o3", name:"Overdue reminders via Sage", kind:"routine", owner:"Credit Agent", ownerKind:"agent", initials:"CA",
   trigger:"Weekdays, 08:30", triggerKind:"schedule", next:"28 Sep 08:30", last:"4 sent · 3 held back", status:"healthy", rate:98, on:true,
   what:"After the morning payment sync, finds invoices past terms, holds back anything disputed, promised or already being handled, and queues a reminder per account for the credit controller to approve.",
   why:"Chasing happened in bursts, so the oldest debt got the least attention.",
   saved:"11 hours a month",
   steps:[["Trigger","Every weekday at 08:30, after the Sage payment sync"],["Find","Invoices past terms"],
     ["Check","Hold back disputed invoices, payment promises and anything already in hand"],
     ["Draft","One reminder per account, in Sage's statement format"],
     ["Approval","Credit controller approves the batch","gate"],["Send","Sage emails the reminders"],["Update","Log each one against the account"]],
   runs:[["Today 08:30","41s","ok","4 sent after Rachel's yes · 3 held back","€0.02"],["24 Sep 08:30","37s","ok","4 sent","€0.02"],
     ["23 Sep 08:30","39s","ok","6 sent","€0.02"]]},
  {id:"o9", name:"Goods-in to backorder release", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Goods booked in against a PO", triggerKind:"event", next:"On event", last:"PO-8826 · 1 order released", status:"healthy", rate:99, on:true,
   what:"When goods are booked in, checks the count against the PO and ASN, then releases the backorders waiting on those SKUs, oldest promise first, creates the pick tasks and tells the account managers.",
   why:"Stock arrived and sat in goods-in while the orders waiting on it stayed on backorder.",
   saved:"13 hours a month",
   steps:[["Trigger","Goods are booked in against a PO in the WMS"],["Check","Received quantities against the PO and the ASN"],
     ["Approval","Goods-in supervisor confirms the count","gate"],
     ["Update","Update stock and release backorders, oldest promise first"],["Update","Create the pick tasks for today's routes"],
     ["Send","Tell the account managers"]],
   runs:[["Today 08:52","6s","partial","PO-8826 · 760 of 800 · 1 order released","€0.01","40 short: SafePro claim drafted"],
     ["24 Sep 13:40","8s","ok","TR-2285 · FIX-2201 into Naas","€0.01"],["24 Sep 10:05","7s","ok","3 backorders released","€0.01"]]},
  {id:"o7", name:"Weekly slow-stock review", kind:"task", owner:"Ciarán Doherty", ownerKind:"person", initials:"CD",
   trigger:"Thursdays, 09:00", triggerKind:"schedule", next:"1 Oct 09:00", last:"8 actions · €43,000 to release", status:"healthy", rate:100, on:true,
   what:"The Inventory Agent lists every line with no sale in 90 days and an action for each. Ciarán agrees them, and anything written off goes to the Financial Controller.",
   why:"€286,420 was sitting in slow-moving stock, and nobody owned the list.",
   saved:"4 hours a month",
   steps:[["Trigger","Every Thursday at 09:00"],["Find","Lines with no sale in 90 days, by warehouse"],
     ["Draft","An action per line: return, transfer, bundle, promote or stop buying"],
     ["Approval","Financial Controller approves any write-off over €1,000","gate"],
     ["Update","Stop-replenishment flags and transfers in Sage 200"]],
   runs:[["24 Sep 09:00","2m 12s","ok","8 actions · €43,000 to release","€0.04"],["17 Sep 09:00","2m 04s","ok","6 actions agreed","€0.04"]]},
  {id:"o1", name:"OTIF weekly report", kind:"report", owner:"Dispatch Agent", ownerKind:"agent", initials:"DA",
   trigger:"Mondays, 08:00", triggerKind:"schedule", next:"28 Sep 08:00", last:"21 Sep · 93.6% · sent to 6", status:"healthy", rate:100, on:true,
   what:"Reports last week's on-time-in-full by warehouse, route, customer, supplier and category, with the reason behind every late or incomplete delivery.",
   why:"OTIF was a number quoted in meetings, not something anyone could act on.",
   saved:"6 hours a month",
   steps:[["Trigger","Every Monday at 08:00"],["Find","Last week's deliveries, PODs and failures"],
     ["Check","The reason for every late or incomplete delivery"],["Draft","OTIF by warehouse, route, customer and supplier"],
     ["Send","Email management and the warehouse leads"]],
   runs:[["21 Sep 08:00","1m 06s","ok","93.6% · 6 recipients","€0.05"],["14 Sep 08:00","59s","ok","94.0% · 6 recipients","€0.05"],
     ["7 Sep 08:00","1m 02s","ok","93.8% · 6 recipients","€0.05"]]}
];

const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];

const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"Everything assigned to you or your team across both warehouses, in one list.",
   views:["All tasks","Due tasks","Review","Done"], filters:["Due date","Any status","Anyone","Any team"]},
  {id:"approvals", label:"Approvals", blurb:"Discounts, credit overrides, POs and transfers waiting on a decision. Every yes is written as the person who gave it.",
   views:["Awaiting you","Awaiting others","Decided"], filters:["Raised date","Any value","Anyone"]},
  {id:"workflows", label:"Workflows", blurb:"What runs on its own, who owns it, and where it stops for a person.",
   views:[], filters:[]},
  {id:"schedules", label:"Schedules", blurb:"When recurring work fires: briefs, supplier imports, reviews and the month-end close.",
   views:[], filters:[]}
];

/* db TASKS, in the Work page's shape. */
const TASK_EXTRA = {
  t1:{due:"Today 09:30", client:"PO-8821 · Atlas Industrial Supplies", day:"Today", mins:"15 mins", view:"Due tasks"},
  t2:{due:"Today 10:00", client:"SO-10503 · Doyle Construction", day:"Today", mins:"20 mins", view:"Due tasks"},
  t3:{due:"Today 11:00", client:"QT-2841 · O'Brien Facilities", day:"Today", mins:"15 mins", view:"Review"},
  t4:{due:"Today 11:30", client:"SO-10482 · Murphy Building Supplies", day:"Today", mins:"10 mins", view:"Due tasks"},
  t5:{due:"Today 09:45", client:"Route D11", day:"Today", mins:"15 mins", view:"Due tasks"},
  t6:{due:"Today 10:30", client:"EX-3312 · Naas", day:"Today", mins:"30 mins", view:"Due tasks"},
  t7:{due:"Today 10:30", client:"EL-4408 · Industrial Cable 100m", day:"Today", mins:"5 mins", view:"Review"},
  t8:{due:"2 Oct", client:"FIX-2201 · EuroFix GmbH", day:"2 Oct", mins:"2 hours", view:"All tasks"},
  t9:{due:"Today 15:00", client:"OP-307 · Ryan Trade Supplies", day:"Today", mins:"15 mins", view:"Due tasks"},
  t10:{due:"28 Sep", client:"HC-212 · Hansen Adhesives", day:"28 Sep", mins:"30 mins", view:"All tasks"},
  t11:{due:"1d overdue", client:"INV-28410 · McGrath Civil Engineering", day:"Yesterday", mins:"20 mins", view:"Due tasks"},
  t12:{due:"6d overdue", client:"212-D-7741 · Route D18", day:"19 Sep", mins:"10 mins", view:"All tasks"}
};
const WORK_TASKS = DB_TASKS.map((t, i) => {
  const x = TASK_EXTRA[t.id];
  return {id:"w" + (i + 1), title:t.title, status:t.status, priority: t.prio === "Critical" ? "High" : t.prio,
    who:STAFF[t.owner].ini, due:x.due, late:!!t.late, client:x.client, day:x.day, mins:x.mins, view:x.view};
}).concat([
  {id:"w13", title:"Approve SafePro short-delivery claim on PO-8826", status:"Review", priority:"Medium", who:"EW",
   due:"Today 12:00", late:false, client:"PO-8826 · SafePro Workwear & PPE", day:"Today", mins:"5 mins", view:"Review"},
  {id:"w14", title:"Receive transfer TR-2285 into Naas", status:"Done", priority:"Medium", who:"AB",
   due:"Done 24 Sep", late:false, client:"FIX-2201 · Naas", day:"24 Sep", mins:"20 mins", view:"Done", done:true}
]);

const WORKFLOWS = [
  {name:"Low stock", state:"live", trigger:"event · stock below reorder point",
   actions:[["stock.read","read"],["po.draft","write"],["transfer.draft","write"]], lastRun:"Today 09:14",
   result:"PO and transfer drafted", resultKind:"ok", runSummary:"14 ok",
   runs:["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok"]},
  {name:"Supplier delay", state:"live", trigger:"event · supplier date change",
   actions:[["orders.find","read"],["outlook.draft","write"],["outlook.send","external"]], lastRun:"Today 09:04",
   result:"6 orders traced", resultKind:"ok", runSummary:"13 ok · 1 partial",
   runs:["ok","ok","idle","ok","ok","partial","ok","ok","ok","idle","ok","ok","ok","ok"]},
  {name:"Credit limit", state:"live", trigger:"event · order over credit limit",
   actions:[["ledger.read","read"],["order.hold","write"],["outlook.draft","write"]], lastRun:"Today 08:42",
   result:"SO-10503 held", resultKind:"warn", runSummary:"12 ok",
   runs:["ok","idle","ok","ok","ok","idle","ok","ok","ok","ok","ok","ok","ok","ok"]},
  {name:"Supplier price-file import", state:"failing", trigger:"schedule · hourly",
   actions:[["edi.read","read"],["sage200.cost.update","external"]], lastRun:"Today 09:00",
   result:"Hansen file rejected", resultKind:"bad", runSummary:"13 ok · 1 failed",
   runs:["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","failed"]}
];

const SCHEDULES = [
  {id:"s1", name:"Morning briefing", cadence:"Every weekday · 08:00", next:"28 Sep 08:00", owner:"Briefing", on:true, day:0},
  {id:"s2", name:"Evening brief", cadence:"Every weekday · 17:30", next:"Today 17:30", owner:"Briefing", on:true, day:4},
  {id:"s3", name:"Supplier EDI import", cadence:"Hourly · 06:00 to 20:00", next:"Today 10:00", owner:"Purchasing Agent", on:true, day:4},
  {id:"s4", name:"OTIF weekly report", cadence:"Mondays · 08:00", next:"28 Sep 08:00", owner:"Dispatch Agent", on:true, day:0},
  {id:"s5", name:"Slow-stock review", cadence:"Thursdays · 09:00", next:"1 Oct 09:00", owner:"Inventory Agent", on:true, day:3},
  {id:"s6", name:"Month-end close", cadence:"Last working day · 17:00", next:"30 Sep 17:00", owner:"Niamh Clarke", on:true, day:2}
];

/* "visits" keeps its id: the Home widget board toggles it by that name. */
const WIDGET_DEFS = [["inbox","Action inbox"],["work","My work"],["activity","Activity"],["kpi","Today's numbers"],["visits","Deliveries today"]];
/* Counts agree with db TASKS and DECISIONS: 3 decisions need Patrick, 2 tasks late, 2 due after today. */
const WORK_WIDGETS = [
  {id:"queue", label:"My queue", value:"3", hint:"waiting on your yes", icon:"work", queue:"mine"},
  {id:"late", label:"Running late", value:"2", hint:"past their due date", icon:"health", queue:"overdue"},
  {id:"unassigned", label:"Unassigned", value:"0", hint:"every task has an owner", icon:"teams", queue:"unassigned"},
  {id:"week", label:"Next 7 days", value:"2", hint:"due after today", icon:"visits", queue:"upcoming"}
];
const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool an agent could be granted.
   The builder shows the whole catalogue, grouped, rather than a sample. */
const CONTEXT_DEFS = [
  ["Customers","records","Accounts, price lists, limits, buying patterns"],
  ["Products","records","SKUs, stock by warehouse, lead times"],
  ["Suppliers","records","Costs, lead times, OTIF, open POs"],
  ["People","records","Staff and customer contacts"],
  ["Files","records","Contracts, agreements, price files"],
  ["Sales orders","work","Open orders, allocation, picking, dispatch"],
  ["Purchase orders","work","Promised dates, ASNs, what depends on them"],
  ["Routes","work","Today's routes, vehicles, PODs"],
  ["Tasks","work","Queues, owners, due times"],
  ["Approvals","work","What is waiting on a decision"],
  ["Invoices","money","Issued, paid, overdue"],
  ["Quotes","money","Sent, pending approval, expired"],
  ["Margin","money","Cost, price and discount by line"],
  ["Activity log","system","Every event, agent and person"],
  ["Systems","system","Sage 200, WMS, route planner, feeds"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read stock and demand","read"],
  ["Read orders and POs","read"],["Read the ledger","read"],["Check permissions","read"],
  ["Draft email","write"],["Create task","write"],["Draft purchase order","write"],
  ["Draft transfer","write"],["Propose price change","write"],["Hold an order","write"],
  ["Send email via Outlook","external"],["Post to Sage 200","external"],["Send supplier EDI","external"]
];
const TRAIN_PHASES = [
  ["Reading every record it can see", "8,426 SKUs · 437 accounts"],
  ["Learning how this business words things", "SO, PO, POD, OTIF"],
  ["Researching B2B wholesale distribution", "12 sources"],
  ["Writing its own system prompt", "1,240 tokens"]
];
/* The two questions the agent asks back once it knows the job. */
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like. You can refine it later.",
   options:[["Orders at risk","Anything that won't ship on time today"],["Stock","Stockouts coming inside lead time"],
            ["Margin","Orders and quotes under target"],["Cash","Overdue, credit holds and exposure"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Weekdays 07:00","Before the first pick wave"],["Weekdays 08:00","After the overnight Sage 200 and supplier syncs"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];
/* The words under a name, keyed to the same state the face lights with. */
const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Crown pebble"],["executive-capsule","Executive capsule"],["shield","Shield"],
  ["glass-visor","Glass visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Rim capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only — deliberately desaturated so none of them reads as a
   state. The eyes, rim and dots always carry the state colour. */
const FACE_TINTS = [
  ["#191c1f","Graphite"],["#1b2430","Slate"],["#241b2e","Aubergine"],
  ["#2a2118","Bronze"],["#16241f","Pine"],["#2b1b1e","Oxblood"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Customers",       "#c8f04b", 0.00, 0.62, 46],
  ["Products",        "#6ad0f0", 0.90, 0.70, 52],
  ["Suppliers",       "#b06cf0", 1.75, 0.66, 58],
  ["Orders",          "#f0c04b", 2.55, 0.72, 44],
  ["Invoices",        "#f0567f", 3.35, 0.60, 38],
  ["Routes",          "#5fe0a8", 4.15, 0.70, 40],
  ["Warehouses",      "#f0803a", 4.95, 0.64, 30],
  ["Purchase orders", "#5f7cf0", 5.65, 0.72, 34]
];

function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};
