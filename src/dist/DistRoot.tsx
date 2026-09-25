import type { ComponentType } from "react";
import { DxProvider, Icon, IC } from "./ui";
import RecordDrawer from "./Drawers";
import { PAGES as Home } from "./pages/Home";
import { PAGES as Orders } from "./pages/Orders";
import { PAGES as Inventory } from "./pages/Inventory";
import { PAGES as Purchasing } from "./pages/Purchasing";
import { PAGES as Warehouse } from "./pages/Warehouse";
import { PAGES as Delivery } from "./pages/Delivery";
import { PAGES as Customers } from "./pages/Customers";
import { PAGES as Pricing } from "./pages/Pricing";
import { PAGES as Finance } from "./pages/Finance";
import { PAGES as Agents } from "./pages/AgentActivity";
import "./dist.css";

const REGISTRY: Record<string, Record<string, ComponentType>> = { Home, Orders, Inventory, Purchasing, Warehouse, Delivery, Customers, Pricing, Finance, AgentActivity: Agents };

/* Renders the distribution page for the current module and sub-page. */
export default function DistRoot({ v }: { v: any }) {
  const dx = v.dx;
  if (!dx) return null;
  const mod = REGISTRY[dx.page] || {};
  const P = mod[dx.sub] || Object.values(mod)[0];
  if (!P) return null;
  return (
    <DxProvider value={dx}>
      <P key={dx.page + "/" + dx.sub + "/" + (dx.rec.order || "") + (dx.rec.cust || "")} />
    </DxProvider>
  );
}

/* The record drawer and the confirmation toast sit above every page, Pulse's own included. */
export function DistOverlay({ v }: { v: any }) {
  const dx = v.dx;
  if (!dx) return null;
  return (
    <DxProvider value={dx}>
      {dx.drawer && <RecordDrawer />}
      {dx.toast && (
        <div className="dx-toast" key={dx.toast.t} role="status">
          <span className="dx-toast-ic"><Icon d={IC.check} s={13} w={2.4} /></span>
          <span>{dx.toast.text}</span>
        </div>
      )}
    </DxProvider>
  );
}
