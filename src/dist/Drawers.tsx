import type { ReactNode } from "react";
import {
  ORDERS, POS, PRODUCTS, SUPPLIERS, SKU_DEMAND, SUBSTITUTE, SUPPLIER_COMPARE_EL4408, TRANSFER_EL4408, REPLEN, COST_CHANGES, PRICE_ROWS, DISCOUNTS,
  customer, order, po, product, supplier, route, quote, who, eur, num, pct, stockValue, WAREHOUSES,
} from "./db";
import { ActBtn, AiCard, Badge, Btn, Card, Facts, Icon, IC, RecLink, Ripple, Risk, Table, useDx, Meter } from "./ui";

/* One drawer for every record that isn't a full page: product, purchase order, supplier, route, quote.
   Every id inside is itself a link, so the chain can be walked in either direction. */
export default function RecordDrawer() {
  const dx = useDx();
  const d = dx.drawer!;
  let head: { kind: string; title: ReactNode; badge?: ReactNode } = { kind: "", title: "" };
  let body: ReactNode = null;
  if (d.kind === "sku") { const p = product(d.id); head = { kind: "PRODUCT · " + p.sku, title: p.name, badge: <Risk r={p.health.toUpperCase()} /> }; body = <SkuBody sku={d.id} />; }
  else if (d.kind === "po") { const x = po(d.id); head = { kind: "PURCHASE ORDER", title: x.id + " · " + supplier(x.supplier).name, badge: <Risk r={x.status === "Late" ? "LATE · " + x.daysLate + " DAYS" : x.status.toUpperCase()} /> }; body = <PoBody id={d.id} />; }
  else if (d.kind === "supplier") { const s = supplier(d.id); head = { kind: "SUPPLIER", title: s.name, badge: <Risk r={s.status.toUpperCase()} /> }; body = <SupplierBody id={d.id} />; }
  else if (d.kind === "route") { const r = route(d.id); head = { kind: "ROUTE · " + WAREHOUSES[r.wh].short.toUpperCase(), title: "Route " + r.id + " · " + r.area, badge: <Risk r={r.status.toUpperCase()} /> }; body = <RouteBody id={d.id} />; }
  else if (d.kind === "quote") { const q = quote(d.id); head = { kind: "QUOTE", title: q.id + " · " + customer(q.cust).name, badge: <Risk r={q.margin < q.target ? "BELOW TARGET" : q.status.toUpperCase()} /> }; body = <QuoteBody id={d.id} />; }
  return (
    <div className="dx-drawer-scrim" onClick={dx.close}>
      <div className="dx-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label={String(head.kind)}>
        <div className="dx-drawer-head">
          {dx.canBack && <button className="dx-x" onClick={dx.back} title="Back"><Icon d="M15 6l-6 6 6 6" s={13} w={2.2} /></button>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <span className="dx-eyebrow">{head.kind}</span>{head.badge}
            </div>
            <div style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-.5px", marginTop: 8, lineHeight: 1.25 }}>{head.title}</div>
          </div>
          <button className="dx-x" onClick={dx.close} title="Close"><Icon d={IC.x} s={12} w={2.4} /></button>
        </div>
        <div className="dx-drawer-body">{body}</div>
      </div>
    </div>
  );
}

function SkuBody({ sku }: { sku: string }) {
  const dx = useDx();
  const p = product(sku);
  const s = supplier(p.supplier);
  const margin = ((p.price - p.cost) / p.price) * 100;
  const demand = SKU_DEMAND[sku] || [];
  const rep = REPLEN.find(r => r.sku === sku);
  const cost = COST_CHANGES.find(c => c.sku === sku);
  const prices = PRICE_ROWS.filter(r => r.sku === sku);
  return (
    <>
      <Facts cols={3} items={[
        ["Supplier", <RecLink kind="supplier" id={s.id}>{s.name}</RecLink>],
        ["Cost / sell", eur(p.cost, 2) + " / " + eur(p.price, 2)],
        ["List margin", pct(margin), margin < 24 ? "warn" : undefined],
        ["Weekly demand", p.wkDemand + " Dublin · " + p.wkDemandNas + " Naas"],
        ["Lead time", p.lead + " days · MOQ " + p.moq],
        ["Cover", p.cover, p.health === "Critical" || p.health === "Stockout" ? "bad" : p.health === "Excess" || p.health === "Dead" ? "warn" : "ok"],
      ]} />
      <Card title="Stock by warehouse" sub={"Reorder point " + p.reorder + " · safety stock " + p.safety + " · bin " + p.bin} pad={false}>
        <Table dense cols={[
          { k: "wh", label: "Warehouse", w: "1.3fr" }, { k: "on", label: "On hand", align: "right", mono: true }, { k: "av", label: "Available", align: "right", mono: true },
          { k: "al", label: "Allocated", align: "right", mono: true }, { k: "inc", label: "Incoming", align: "right", mono: true, w: "1.2fr" },
        ]} rows={[
          { wh: "Dublin", on: num(p.dub.onHand), av: p.dub.avail, al: num(p.dub.alloc), inc: p.po && sku !== "IC-4470" ? p.incoming : "—" },
          { wh: "Naas", on: num(p.nas.onHand), av: p.nas.avail, al: num(p.nas.alloc), inc: sku === "IC-4470" ? "200 cross-dock" : "—" },
        ]} />
        {p.po && <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 13, color: "var(--dim)", display: "flex", gap: 8, alignItems: "center" }}>
          <Icon d={IC.truck} s={14} /> Incoming {num(p.incoming)} on <RecLink kind="po" id={p.po} /> · {po(p.po).eta}
          {po(p.po).status === "Late" && <Badge tone="bad">{po(p.po).daysLate} days late</Badge>}
        </div>}
      </Card>
      {demand.length > 0 && (
        <Card title="Who needs it" sub={demand.filter(d => d.status === "Short").length + " orders waiting · " + num(demand.filter(d => d.status === "Short").reduce((a, b) => a + b.qty, 0)) + " units short"} pad={false}>
          <Table dense onRow={(r: any) => dx.go("Orders", "detail", { order: r.so })} cols={[
            { k: "so", label: "Order", w: "96px", render: (r: any) => <RecLink kind="order" id={r.so} /> },
            { k: "c", label: "Customer", w: "1.6fr", render: (r: any) => customer(order(r.so).cust).name },
            { k: "qty", label: "Qty", align: "right", mono: true, w: "0.5fr" },
            { k: "req", label: "Required", w: "0.8fr", render: (r: any) => order(r.so).required },
            { k: "st", label: "Line", w: "0.9fr", render: (r: any) => <Badge tone={r.status === "Short" ? "bad" : "ok"}>{r.status}</Badge> },
          ]} rows={demand} />
        </Card>
      )}
      {sku === "EL-4408" && (
        <>
          <AiCard agent="Inventory Agent" title="Transfer before it stocks out">
            Transfer <b>{TRANSFER_EL4408.qty} units</b> from Naas to Dublin. Dublin has {TRANSFER_EL4408.dubAvail} free against {TRANSFER_EL4408.dubDemand7} demand in 7 days; Naas has {TRANSFER_EL4408.nasAvail} against {TRANSFER_EL4408.nasDemand7}.
            {" "}Protects {TRANSFER_EL4408.orders.length} orders worth {eur(TRANSFER_EL4408.value)}. {TRANSFER_EL4408.shuttle}.
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <ActBtn id="d-transfer" kind="primary" small label="Approve Transfer" done="Transfer TR-2291 approved" toast="TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van. Liam and Aoife notified." />
              <Btn small onClick={() => dx.go("Inventory", "transfers", { sku })}>Open transfers</Btn>
            </div>
          </AiCard>
          <AiCard agent="Purchasing Agent" title="Reorder today, from EuroCable">
            {rep?.reason} Order <b>{rep?.suggest} units</b> today. Stockout {rep?.stockout} without it.
            <div style={{ marginTop: 12 }}>
              <Table dense cols={[
                { k: "s", label: "Supplier", w: "1.3fr", render: (r: any) => <RecLink kind="supplier" id={r.supplier}>{supplier(r.supplier).name}</RecLink> },
                { k: "cost", label: "Unit", align: "right", mono: true, render: (r: any) => eur(r.cost, 2) },
                { k: "lead", label: "Lead", align: "right", render: (r: any) => r.lead + "d" },
                { k: "otif", label: "OTIF", align: "right", render: (r: any) => pct(r.otif) },
                { k: "landed", label: "Landed", align: "right", mono: true, render: (r: any) => eur(r.landed, 2) },
                { k: "rec", label: "", w: "1fr", render: (r: any) => r.rec ? <Badge tone="accent">Recommended</Badge> : null },
              ]} rows={SUPPLIER_COMPARE_EL4408} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <ActBtn id="po-el4408" kind="primary" small label="Create Purchase Order" done="PO-8852 drafted" toast="PO-8852 drafted: 160 × EL-4408 from EuroCable BV, €3,552. Waiting on Emma's approval." />
            </div>
          </AiCard>
          <AiCard agent="Inventory Agent" title="Substitute for Murphy's cable line">
            {SUBSTITUTE.unavailable} units of EL-4408 are unavailable on <RecLink kind="order" id="SO-10482" />. <RecLink kind="sku" id={SUBSTITUTE.sub}>{product(SUBSTITUTE.sub).name}</RecLink> ({SUBSTITUTE.sub}) has {SUBSTITUTE.available} available in Dublin.
            {" "}Price difference +{eur(SUBSTITUTE.priceDiff, 2)}/unit · {SUBSTITUTE.compat} · margin {pct(SUBSTITUTE.margin)}. {SUBSTITUTE.note}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <ActBtn id="sub-el4412" small label="Offer Substitute" done="Substitute offered to Murphy" toast="Substitute offer sent to Gerry Murphy: 28 × EL-4412 at +€8.40/unit, held for 24 hours." />
            </div>
          </AiCard>
        </>
      )}
      {cost && (
        <Card title="Cost change" sub={supplier(cost.supplier).name + " · effective " + cost.effective} onClick={() => dx.go("Pricing", "costs")}>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--body)" }}>
            Cost moved {eur(cost.prev, 2)} → {eur(cost.now, 2)} (+{pct(((cost.now - cost.prev) / cost.prev) * 100)}). {cost.customers} customers still on old pricing, {num(cost.volume)} units a month, <b style={{ color: "var(--bad)" }}>{eur(cost.impact)}/month</b> margin impact.
          </div>
        </Card>
      )}
      {prices.length > 0 && (
        <Card title="Customer pricing on this line" pad={false}>
          <Table dense cols={[
            { k: "c", label: "Customer", w: "1.5fr", render: (r: any) => <RecLink kind="cust" id={r.cust} plain>{customer(r.cust).name}</RecLink> },
            { k: "type", label: "Type", w: "1fr" },
            { k: "price", label: "Price", align: "right", mono: true, render: (r: any) => eur(r.price, 2) },
            { k: "m", label: "Margin", align: "right", render: (r: any) => <span style={{ color: r.margin < r.target ? "var(--bad)" : "var(--ok)" }}>{pct(r.margin)}</span> },
          ]} rows={prices} />
        </Card>
      )}
      <Facts cols={3} items={[
        ["Stock value", eur(stockValue(p))],
        ["12-month revenue", eur(p.revenue12)],
        ["Last movement", p.lastMove ? p.lastMove + " days ago" : "Today", p.lastMove > 180 ? "bad" : undefined],
      ]} />
    </>
  );
}

function PoBody({ id }: { id: string }) {
  const dx = useDx();
  const x = po(id);
  const s = supplier(x.supplier);
  const deps = ORDERS.filter(o => o.depPO === id);
  return (
    <>
      <Facts cols={3} items={[
        ["Supplier", <RecLink kind="supplier" id={s.id}>{s.name}</RecLink>],
        ["Value", eur(x.value)],
        ["Items", x.items + " SKUs · " + (x.pallets || 0) + " pallets"],
        ["Ordered", x.ordered],
        ["Promised", x.promised, x.status === "Late" ? "bad" : undefined],
        ["Expected", x.eta || x.expected, x.status === "Late" ? "warn" : undefined],
        ["Warehouse", WAREHOUSES[x.wh].short],
        ["Buyer", who(x.buyer).name],
        ["Supplier OTIF", pct(s.otif), s.otif < 90 ? "bad" : undefined],
      ]} />
      {x.note && <div className="dx-note" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)" }}>{x.note}</div>}
      {deps.length > 0 && (
        <>
          <Card title="What this delay touches" sub={deps.length + " customer orders depend on it · " + eur(x.depValue) + " revenue exposed"}>
            <Ripple source={{ k: "Supplier delay", v: x.id + " · " + x.daysLate + " days late", tone: "bad" }} targets={[
              { k: "Purchase order", v: x.items + " SKUs, " + eur(x.value) },
              { k: "Inventory availability", v: "EL-4408, EL-4521, IC-2290 at or near zero in Dublin", tone: "bad", onClick: () => dx.open("sku", "EL-4408") },
              { k: "Backorders", v: deps.length + " orders, " + deps.reduce((a, o) => a + o.short, 0) + " lines short", onClick: () => dx.go("Orders", "backorders") },
              { k: "Customers", v: deps.map(o => customer(o.cust).name.split(" ")[0]).join(", ") },
              { k: "Warehouse", v: "D14 waiting on SO-10482 · cutoff 13:30", onClick: () => dx.go("Warehouse", "board") },
              { k: "Delivery", v: "D14 and D04 carrying part loads", onClick: () => dx.open("route", "D14") },
              { k: "Revenue at risk", v: eur(x.depValue), tone: "bad", onClick: () => dx.go("Orders", "risk") },
            ]} />
          </Card>
          <Card title="Dependent customer orders" pad={false}>
            <Table dense onRow={(r: any) => dx.go("Orders", "detail", { order: r.id })} cols={[
              { k: "id", label: "Order", w: "96px", render: (r: any) => <RecLink kind="order" id={r.id} /> },
              { k: "c", label: "Customer", w: "1.7fr", render: (r: any) => customer(r.cust).name },
              { k: "v", label: "Value", align: "right", mono: true, render: (r: any) => eur(r.value) },
              { k: "req", label: "Required", w: "0.8fr", render: (r: any) => r.required },
              { k: "risk", label: "Risk", w: "0.9fr", render: (r: any) => <Risk r={r.risk} /> },
            ]} rows={deps} />
          </Card>
        </>
      )}
      {x.lines && (
        <Card title="Lines" sub={x.lines.length + " of " + x.items + " SKUs shown · the constrained ones"} pad={false}>
          <Table dense cols={[
            { k: "sku", label: "SKU", w: "0.9fr", render: (r: any) => <RecLink kind="sku" id={r.sku} /> },
            { k: "n", label: "Product", w: "2fr", render: (r: any) => product(r.sku).name },
            { k: "qty", label: "Qty", align: "right", mono: true, render: (r: any) => num(r.qty) },
            { k: "c", label: "Cost", align: "right", mono: true, render: (r: any) => eur(r.qty * r.cost) },
          ]} rows={x.lines} />
        </Card>
      )}
      {id === "PO-8821" && (
        <AiCard agent="Purchasing Agent" title="Recommended action">
          Atlas can put all 14 SKUs on a dedicated van tonight for <b>€420</b>. It lands at 06:30, before tomorrow's first wave, and protects {eur(x.depValue)} across {deps.length} orders.
          {" "}Account managers have a customer update drafted for each affected order.
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <ActBtn id="d-expedite" kind="primary" small label="Expedite · €420" done="Expedited · lands 06:30" toast="PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow. Six account managers notified." />
            <ActBtn id="po8821-notify" small label="Notify account managers" done="Sarah, David, Mark and Michael notified" toast="Four account managers notified with the six affected orders." />
            <ActBtn id="po8821-drafts" small label="Draft customer updates" done="6 updates drafted" toast="Six customer updates drafted in Outlook, one per order, waiting to send." />
          </div>
        </AiCard>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => dx.go("Purchasing", "orders", { po: id })}>Open in Purchase Orders</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Purchasing", "performance", { supplier: s.id })}>Supplier performance</Btn>
      </div>
    </>
  );
}

function SupplierBody({ id }: { id: string }) {
  const dx = useDx();
  const s = supplier(id);
  const pos = POS.filter(p => p.supplier === id);
  const skus = PRODUCTS.filter(p => p.supplier === id);
  return (
    <>
      <Facts cols={3} items={[
        ["Annual spend", eur(s.spend)], ["OTIF", pct(s.otif), s.otif < 90 ? "bad" : s.otif < 95 ? "warn" : "ok"], ["Fill rate", pct(s.fill)],
        ["Average delay", s.delay + " days", s.delay > 2 ? "bad" : undefined], ["Lead-time accuracy", s.leadAcc + "%"], ["Quality issues", String(s.quality), s.quality > 4 ? "warn" : undefined],
        ["Orders affected YTD", String(s.affected), s.affected > 50 ? "bad" : undefined], ["Open claims", String(s.claims)], ["Terms · currency", s.terms + " · " + s.currency],
      ]} />
      {id === "atlas" && (
        <AiCard agent="Purchasing Agent" title="Needs review">
          Atlas is the single biggest cause of late customer orders: 126 this year, and 31% of all OTIF failures trace back to supplier delay. Price is 3.6% below EuroCable on cable, but the landed gap is only €0.45 and EuroCable is 19 days quicker.
          {" "}Dual-source EL-4408 and EL-4521 with EuroCable and move Atlas to 60-day terms with a service credit clause.
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <ActBtn id="atlas-review" kind="primary" small label="Schedule supplier review" done="Review booked · 2 Oct" toast="Supplier review with Atlas booked for 2 Oct. Scorecard attached." />
            <ActBtn id="atlas-dual" small label="Dual-source cable" done="EuroCable set as second source" toast="EuroCable BV added as approved second source for EL-4408 and EL-4521." />
          </div>
        </AiCard>
      )}
      <Card title="Open purchase orders" pad={false}>
        <Table dense onRow={(r: any) => dx.open("po", r.id)} cols={[
          { k: "id", label: "PO", w: "0.9fr", render: (r: any) => <RecLink kind="po" id={r.id} /> },
          { k: "v", label: "Value", align: "right", mono: true, render: (r: any) => eur(r.value) },
          { k: "e", label: "Expected", render: (r: any) => r.expected },
          { k: "st", label: "Status", w: "1.1fr", render: (r: any) => <Risk r={r.status === "Late" ? "LATE " + r.daysLate + "D" : r.status} /> },
          { k: "d", label: "Orders waiting", align: "right", render: (r: any) => r.deps || "—" },
        ]} rows={pos} empty="No open purchase orders listed." />
      </Card>
      <Card title="Products supplied" sub={s.cats.join(" · ")} pad={false}>
        <Table dense onRow={(r: any) => dx.open("sku", r.sku)} cols={[
          { k: "sku", label: "SKU", w: "0.8fr", render: (r: any) => <RecLink kind="sku" id={r.sku} /> },
          { k: "name", label: "Product", w: "2fr" },
          { k: "cost", label: "Cost", align: "right", mono: true, render: (r: any) => eur(r.cost, 2) },
          { k: "h", label: "Stock", w: "0.9fr", render: (r: any) => <Risk r={r.health.toUpperCase()} /> },
        ]} rows={skus} />
      </Card>
    </>
  );
}

function RouteBody({ id }: { id: string }) {
  const dx = useDx();
  const r = route(id);
  const stopTone = (s: string) => s === "Delivered" ? "ok" : s === "Next" ? "accent" : s === "At risk" || s === "Failed" ? "bad" : "neutral";
  return (
    <>
      <Facts cols={3} items={[
        ["Driver", who(r.driver).name], ["Vehicle", r.vehicle], ["Type", r.type],
        ["Stops", String(r.stops)], ["Order value", eur(r.value)], ["Distance", r.km + " km"],
        ["Departure", r.depart], ["Expected completion", r.complete], ["Route OTIF (30d)", pct(r.otif), r.otif < 94 ? "warn" : undefined],
      ]} />
      {r.risk && <div className="dx-note" style={{ borderColor: "var(--bad)", background: "var(--bad-soft)" }}>{r.risk}</div>}
      <Card title="Stops" sub={r.done + " of " + r.stops + " delivered"} pad={false}>
        {(r.list || []).map(s => (
          <div key={s.n} className="dx-li dx-click" onClick={() => dx.go("Orders", "detail", { order: s.so })}>
            <span className="dx-chain-node" style={{ borderColor: "var(--border-strong)", color: "var(--dim)", background: "var(--surface-2)" }}>{s.n}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{customer(s.cust).name} <span className="dx-faint">· {s.site}</span></div>
              <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3 }}><RecLink kind="order" id={s.so} /> · ETA {s.eta}{s.note ? " · " + s.note : ""}</div>
            </div>
            <Badge tone={stopTone(s.status) as any}>{s.status}</Badge>
          </div>
        ))}
        {!r.list && <div className="dx-empty">{r.stops} stops planned. Stop detail syncs from the route planner at departure.</div>}
      </Card>
      {id === "D14" && (
        <AiCard agent="Dispatch Agent" title="Keep D14 on time">
          Load the 15 available lines of SO-10482 by 13:30 and D14 leaves on schedule. The remaining 3 lines go on tomorrow's D14 PM run after PO-8821 lands. Tallaght Trade Centre (SO-10533) drops off unless credit releases it by 13:00.
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <ActBtn id="d14-plan" kind="primary" small label="Confirm load plan" done="Load plan confirmed" toast="D14 load plan confirmed: 11 stops, departs 13:45. James Nolan notified." />
          </div>
        </AiCard>
      )}
      {id === "D11" && (
        <AiCard agent="Dispatch Agent" title="Fix the weight">
          D11 is 340kg over its plated weight. Move SO-10528 (Clondalkin Plant Hire, 380kg) to D09's second drop. Both orders still arrive before their slot.
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <ActBtn id="d11-move" kind="primary" small label="Move SO-10528 to D09" done="Moved to D09" toast="SO-10528 moved to D09. D11 now 7,460kg, cleared to depart." />
          </div>
        </AiCard>
      )}
      <Btn onClick={() => dx.go("Delivery", "routes", { route: id })}>Open in Routes</Btn>
    </>
  );
}

function QuoteBody({ id }: { id: string }) {
  const dx = useDx();
  const q = quote(id);
  const c = customer(q.cust);
  const da = DISCOUNTS.find(d => d.ref === id);
  const below = q.margin < q.target;
  const gap = Math.round(q.value * (q.target - q.margin) / 100);
  return (
    <>
      <Facts cols={3} items={[
        ["Customer", <RecLink kind="cust" id={c.id}>{c.name}</RecLink>], ["Value", eur(q.value)], ["Lines", String(q.lines)],
        ["Projected margin", pct(q.margin), below ? "bad" : "ok"], ["Target", pct(q.target)], ["Gap on this quote", below ? eur(-gap) : "Above target", below ? "bad" : "ok"],
        ["Rep", who(q.rep).name], ["Reason", q.reason || "—"], ["Expires", q.expires],
      ]} />
      {id === "QT-2841" && (
        <>
          <Card title="Why the margin is low" sub="Line groups on the quote">
            <Table dense cols={[
              { k: "g", label: "Group", w: "1.6fr" }, { k: "v", label: "Value", align: "right", mono: true }, { k: "m", label: "Margin", align: "right" }, { k: "why", label: "Driver", w: "2.2fr" },
            ]} rows={[
              { g: "PPE (gloves, glasses, hi-vis)", v: eur(7240), m: <span style={{ color: "var(--warn)" }}>19.8%</span>, why: "Strategic discount, 14.5% off list" },
              { g: "Fixings (M10 bolts, nuts)", v: eur(6180), m: <span style={{ color: "var(--bad)" }}>11.6%</span>, why: <span>Contract price, cost up 10.4% on <RecLink kind="sku" id="FIX-2201" /></span> },
              { g: "Janitorial", v: eur(5000), m: <span>20.4%</span>, why: "Tier price" },
            ]} />
          </Card>
          <AiCard agent="Margin Agent" title="Counter at 21.5%">
            Keep the strategic discount on PPE, where O'Brien is comparing us with a national supplier. Restore list on fixings: the EuroFix increase on 1 Sep was never passed through to O'Brien's 2025 contract.
            {" "}That takes the quote to <b>21.5%</b> (€3,960 GP instead of €3,168) and recovers €3,170 a year on the repeat volume.
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <ActBtn id="d-quote" kind="primary" small label="Counter at 21.5%" done="Countered at 21.5%" toast="QT-2841 revised to 21.5% and sent to David Kelly to present. Michael Doyle's approval recorded." />
              <ActBtn id="quote-approve" small label="Approve at 17.2%" done="Approved at 17.2%" toast="QT-2841 approved at 17.2% by Michael Doyle. Exception logged." />
              <Btn small kind="quiet" onClick={() => dx.go("Pricing", "costs")}>See the cost change</Btn>
            </div>
          </AiCard>
        </>
      )}
      {da && (
        <Card title="Discount approval" sub={da.id + " · raised " + da.raised} onClick={() => dx.go("Pricing", "discounts")}>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {pct(da.discount)} discount against a {pct(da.tierLimit, 0)} tier limit. {da.reason}. <Badge tone={/Pending/.test(da.status) ? "warn" : "ok"}>{da.status}</Badge>
          </div>
        </Card>
      )}
      <Card title="Account context" onClick={() => dx.go("Customers", "detail", { cust: c.id })}>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", fontSize: 13 }}>
          <span><span className="dx-faint">Revenue YTD </span>{eur(c.revYTD)}</span>
          <span><span className="dx-faint">Margin YTD </span>{pct(c.margin)}</span>
          <span><span className="dx-faint">Price list </span>{c.priceList}</span>
        </div>
        <div style={{ marginTop: 10 }}><Meter value={c.balance} max={c.limit} tone={c.balance / c.limit > 0.85 ? "bad" : "accent"} /></div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 6 }}>{eur(c.balance)} of {eur(c.limit)} credit used</div>
      </Card>
    </>
  );
}

