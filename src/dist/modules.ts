/* The sidebar: thirteen modules, each with its own pages. Pulse's own pages (Work, Agents,
   Activity, Settings, the Executive Dashboard and Chat) keep their ids so their logic is untouched. */

export type Module = { id: string; label: string; icon: string; subs: [string, string][]; dot?: boolean };

export const MODULES: Module[] = [
  { id: "Home", label: "Home", icon: "navHome", subs: [["home", "Home"], ["command", "Command Centre"], ["exec", "Executive Dashboard"]], dot: true },
  { id: "Orders", label: "Orders", icon: "orders", subs: [["overview", "Overview"], ["live", "Live Orders"], ["risk", "At Risk"], ["backorders", "Backorders"], ["allocation", "Allocation"], ["detail", "Order Detail"]], dot: true },
  { id: "Inventory", label: "Inventory", icon: "inventory", subs: [["overview", "Overview"], ["stock", "Stock"], ["availability", "Availability"], ["replenishment", "Replenishment"], ["slow", "Slow & Dead"], ["forecast", "Forecast"], ["transfers", "Transfers"]] },
  { id: "Purchasing", label: "Purchasing", icon: "purchasing", subs: [["overview", "Overview"], ["recommendations", "Recommendations"], ["orders", "Purchase Orders"], ["incoming", "Incoming"], ["suppliers", "Suppliers"], ["performance", "Performance"]] },
  { id: "Warehouse", label: "Warehouse", icon: "warehouse", subs: [["board", "Control Board"], ["picking", "Picking"], ["packing", "Packing"], ["goodsin", "Goods In"], ["dispatch", "Dispatch"], ["exceptions", "Exceptions"]] },
  { id: "Delivery", label: "Delivery", icon: "delivery", subs: [["today", "Today"], ["routes", "Routes"], ["vehicles", "Vehicles"], ["otif", "OTIF"], ["issues", "Delivery Issues"], ["pod", "Proof of Delivery"]] },
  { id: "Customers", label: "Customers", icon: "customers", subs: [["overview", "Overview"], ["accounts", "Accounts"], ["opportunities", "Opportunities"], ["health", "Customer Health"], ["quotes", "Quotes"], ["detail", "Customer Detail"]] },
  { id: "Pricing", label: "Pricing & Margin", icon: "pricing", subs: [["margin", "Margin Control"], ["lists", "Price Lists"], ["exceptions", "Exceptions"], ["costs", "Cost Changes"], ["discounts", "Discounts"], ["profit", "Profitability"]] },
  { id: "Finance", label: "Finance", icon: "finance", subs: [["overview", "Overview"], ["revenue", "Revenue"], ["debtors", "Debtors"], ["credit", "Credit Control"], ["cash", "Cash"], ["wc", "Working Capital"]] },
  { id: "Work", label: "Work", icon: "navWork", subs: [["tasks", "Tasks"], ["approvals", "Approvals"], ["workflows", "Workflows"], ["schedules", "Schedules"]] },
  { id: "Agents", label: "Agents", icon: "navAgents", subs: [["agents", "Agents"], ["activity", "Agent Activity"], ["chat", "Chat"]] },
  { id: "Activity", label: "Activity", icon: "pulseLine", subs: [["all", "Everything"], ["people", "People"], ["ai", "Agents"], ["systems", "Systems"], ["attention", "Needs Attention"]], dot: true },
];
export const DIST_MODULES = ["Orders", "Inventory", "Purchasing", "Warehouse", "Delivery", "Customers", "Pricing", "Finance"];

/* Pulse page ids that belong to each rail module (for the active state). */
export const MODULE_PAGES: Record<string, string[]> = {
  Home: ["Home", "Command", "Dashboard"],
  Agents: ["Agents", "AgentActivity", "Chat"],
};

export const RAIL_ICONS: Record<string, string> = {
  orders: "M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13.5l-2.6-1.6-2.4 1.6-2.5-1.6-2.5 1.6-2.4-1.6-2.6 1.6V6A1.5 1.5 0 0 1 5.5 4.5H7Z M8.5 9h7 M8.5 12.5h7 M8.5 16h4",
  inventory: "M12 3.2 4 7.2v9.6l8 4 8-4V7.2l-8-4Z M4 7.2l8 4 8-4 M12 11.2v9.6 M8 5.2l8 4",
  purchasing: "M3.5 4.5h2.2l2.1 10.2h10l2-7H6.6 M9.5 19.6a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z M16.8 19.6a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z",
  warehouse: "M3 20V8.6L12 4l9 4.6V20 M7 20v-7.5h10V20 M7 15.5h10 M7 18h10",
  delivery: "M2.8 6.5h11v9.4h-11z M13.8 9.6h3.8l3.6 3.5v2.8h-7.4 M6.8 18.8a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z M17.1 18.8a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z",
  customers: "M9 11.6a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z M2.8 19.8c.8-2.9 3.2-4.6 6.2-4.6s5.4 1.7 6.2 4.6 M15.6 5.2a3.2 3.2 0 0 1 0 6.2 M17.8 15.4c1.9.5 3 1.9 3.4 4.4",
  pricing: "M3.8 12.6 11.4 5a1.8 1.8 0 0 1 1.3-.5h5.5A1.8 1.8 0 0 1 20 6.3v5.5a1.8 1.8 0 0 1-.5 1.3L11.9 20.7a1.8 1.8 0 0 1-2.6 0L3.8 15.2a1.8 1.8 0 0 1 0-2.6Z M15.9 8.6h.01",
  finance: "M4 20V10.5 M9.3 20V5 M14.6 20v-7 M19.9 20V8 M3 20h18",
};
