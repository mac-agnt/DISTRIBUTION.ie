import { useEffect, type ComponentType, type ReactNode } from "react";
import {
  CASH, COMPANY, FORECAST_EL4408, FORECAST_TABLE, INVENTORY_AGEING, INVENTORY_BY_CAT, INVENTORY_SPLIT, KPI, ORDERS, POS, PRODUCTS, QUOTES, SKU_DEMAND,
  SLOW_ACTIONS, SLOW_BANDS, SLOW_LINES, STOCK_HEALTH, SUBSTITUTE, SUPPLIER_COMPARE_EL4408, TODAY, TRANSFERS, TRANSFER_EL4408, WAREHOUSES, REPLEN,
  customer, eur, eurK, num, order, pct, po, product, supplier,
  type Health2, type Product, type Replen, type SlowLine, type Transfer,
} from "../db";
import {
  ActBtn, AiCard, Badge, Btn, Card, Chain, Columns, Facts, Grid, HBars, IC, Icon, Kpi, KpiRow, Lines, Meter, Note, Page, Person, RecLink, Risk,
  Seg, Strip, Table, useDx, useLocal, type Col, type Tone,
} from "../ui";

/* Inventory: what we hold, where it sits, what we can promise, what to buy, what to move, and what is costing us money. */

/* ---------- shared helpers (Purchasing imports some of these) ---------- */
export const SUP_SHORT: Record<string, string> = {
  atlas: "Atlas Industrial", eurofix: "EuroFix GmbH", safepro: "SafePro", eurocable: "EuroCable BV", toolcraft: "Toolcraft", hansen: "Hansen Adhesives",
  kingfield: "Kingfield", lumos: "Lumos Lighting", bristol: "Bristol Abrasives", ifc: "Irish Fastener Co", midpack: "Midland Packaging", celtic: "Celtic Tools",
};
const k1 = (n: number) => (n < 0 ? "−€" : "€") + (Math.abs(n) / 1000).toFixed(1) + "k";
const plural = (uom: string, n: number) => (n === 1 ? uom : uom === "box" ? "boxes" : uom === "each" ? "units" : uom + "s");
const WH = (w: "DUB" | "NAS") => WAREHOUSES[w].short;

/* A transfer id is not a drawer record: it opens the Transfers page. */
export function TrLink({ id }: { id: string }) {
  const dx = useDx();
  return <button className="dx-link" onClick={e => { e.stopPropagation(); dx.go("Inventory", "transfers"); }}>{id}</button>;
}

/* Turns known record ids inside a sentence into links. Unknown ids (drafts not yet raised) stay as text. */
export function Linked({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /(SO-\d{5}|PO-\d{4}|TR-\d{4}|QT-\d{4}|(?:EL|FIX|IC|SAF|TL|JAN|PK)-\d{4})/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const id = m[0];
    out.push(text.slice(last, m.index));
    let node: ReactNode = id;
    if (id.startsWith("SO-") && ORDERS.some(o => o.id === id)) node = <RecLink kind="order" id={id} />;
    else if (id.startsWith("PO-") && POS.some(p => p.id === id)) node = <RecLink kind="po" id={id} />;
    else if (id.startsWith("TR-")) node = <TrLink id={id} />;
    else if (id.startsWith("QT-") && QUOTES.some(q => q.id === id)) node = <RecLink kind="quote" id={id} />;
    else if (PRODUCTS.some(p => p.sku === id)) node = <RecLink kind="sku" id={id} />;
    out.push(<span key={m.index}>{node}</span>);
    last = m.index + id.length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

/* Table cell helpers: a wrapping cell and a two-line cell. */
export const Wrap = ({ children, dim }: { children: ReactNode; dim?: boolean }) => (
  <span style={{ whiteSpace: "normal", lineHeight: 1.45, padding: "2px 0", color: dim ? "var(--dim)" : undefined, fontSize: dim ? 12.5 : undefined }}>{children}</span>
);
export const TwoLine = ({ top, bottom }: { top: ReactNode; bottom: ReactNode }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{top}</div>
    <div className="dx-faint" style={{ fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>{bottom}</div>
  </div>
);

/* §62 Procurement decision view for EL-4408. Used here and in Purchasing. */
export function ProcurementDecision() {
  const dx = useDx();
  const a = SUPPLIER_COMPARE_EL4408.find(s => s.supplier === "atlas")!;
  const e = SUPPLIER_COMPARE_EL4408.find(s => s.supplier === "eurocable")!;
  const qty = 160;
  const premium = Math.round((e.landed - a.landed) * qty);
  type Row = (typeof SUPPLIER_COMPARE_EL4408)[number];
  const cols: Col<Row>[] = [
    { k: "s", label: "Supplier", w: "1.6fr", render: r => <RecLink kind="supplier" id={r.supplier} plain>{supplier(r.supplier).name}</RecLink> },
    { k: "cost", label: "Unit cost", w: "0.75fr", align: "right", mono: true, render: r => eur(r.cost, 2) },
    { k: "lead", label: "Lead time", w: "0.75fr", align: "right", render: r => r.lead + " days" },
    { k: "moq", label: "MOQ", w: "0.5fr", align: "right", mono: true, render: r => num(r.moq) },
    { k: "otif", label: "OTIF", w: "0.6fr", align: "right", render: r => <span style={{ color: r.otif < 90 ? "var(--bad)" : "var(--ok)" }}>{pct(r.otif)}</span> },
    { k: "avail", label: "Supplier stock", w: "0.85fr", align: "right", mono: true, render: r => num(r.avail) },
    { k: "cur", label: "Currency", w: "0.65fr", render: r => r.currency },
    { k: "landed", label: "Landed cost", w: "0.8fr", align: "right", mono: true, render: r => eur(r.landed, 2) },
    { k: "rec", label: "Recommended", w: "1.1fr", render: r => (r.rec ? <Badge tone="accent">Recommended</Badge> : <span className="dx-faint">Cheapest landed</span>) },
  ];
  return (
    <Card title={<>Procurement decision · <RecLink kind="sku" id="EL-4408" /> Industrial Cable 100m</>} sub="Two approved suppliers for the same drum. Pulse compares what each one costs to land and whether it lands in time."
      right={<Btn small kind="quiet" onClick={() => dx.go("Purchasing", "performance", { supplier: "atlas" })}>Supplier performance</Btn>} pad={false}>
      <Table cols={cols} rows={SUPPLIER_COMPARE_EL4408} rowTone={r => (r.rec ? "accent" : undefined)} />
      <div style={{ padding: "16px 20px 18px", borderTop: "1px solid var(--border)" }}>
        <Grid cols="repeat(3,minmax(0,1fr))" gap={12}>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
            <div className="dx-faint" style={{ fontSize: 11.5, marginBottom: 4 }}>Cheapest on paper</div>
            Atlas is {eur(e.cost - a.cost, 2)} a drum cheaper and {eur(e.landed - a.landed, 2)} cheaper landed: <b>{eur(premium)}</b> on {qty} drums.
            Landed cost is unit cost plus freight and customs. Atlas ships from Manchester, so that adds {eur(a.landed - a.cost, 2)} a drum; EuroCable adds {eur(e.landed - e.cost, 2)}.
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
            <div className="dx-faint" style={{ fontSize: 11.5, marginBottom: 4 }}>When it would land</div>
            Ordered today, Atlas's {a.lead} days lands <b style={{ color: "var(--bad)" }}>23 Oct</b>, two days after the projected 21 Oct stockout, before any delay. Atlas averages {supplier("atlas").delay} days late and hits its lead time {supplier("atlas").leadAcc}% of the time.
            EuroCable's {e.lead} days lands <b style={{ color: "var(--ok)" }}>4 Oct</b> at {pct(e.otif)} OTIF.
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
            <div className="dx-faint" style={{ fontSize: 11.5, marginBottom: 4 }}>The rule Pulse applies</div>
            When the projected stockout falls inside the cheaper supplier's lead time, recommend the faster, more reliable supplier and show the premium. Otherwise the lowest landed cost wins. Here the premium is {eur(premium)} against four orders already waiting on this drum.
          </div>
        </Grid>
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <ActBtn id="po-el4408" kind="primary" small label="Create Purchase Order" done="PO-8852 drafted" toast="PO-8852 drafted: 160 × EL-4408 from EuroCable BV, €3,552. Waiting on Emma's approval." />
          <Btn small kind="quiet" onClick={() => dx.open("sku", "EL-4408")}>Open EL-4408</Btn>
        </div>
      </div>
    </Card>
  );
}

/* ---------- stock rows: one per SKU per warehouse that holds it ---------- */
type WhId = "DUB" | "NAS";
type StockRow = { p: Product; wh: WhId; onHand: number; avail: number; alloc: number; incoming: number; wk: number; cover: string; rop: number; health: Health2 };
/* A product's headline cover and health belong to the warehouse that carries most of its demand. */
const primaryWh = (p: Product): WhId => (p.sku === "SAF-1892" ? "NAS" : "DUB");
const coverText = (avail: number, wk: number) => {
  if (wk <= 0) return "No demand";
  const w = avail / wk;
  if (w < 2) return (w * 7).toFixed(1) + " days";
  return (w >= 10 ? String(Math.round(w)) : w.toFixed(1)) + " weeks";
};
const rowHealth = (p: Product, avail: number, wk: number): Health2 => {
  if (p.health === "Dead") return "Dead";
  if (wk <= 0) return avail > 0 ? "Excess" : "Healthy";
  if (avail <= 0) return "Stockout";
  const w = avail / wk;
  return w < 1 ? "Critical" : w < 2 ? "Low" : w > 12 ? "Excess" : "Healthy";
};
const RANK: Record<Health2, number> = { Stockout: 0, Critical: 1, Low: 2, Excess: 3, Dead: 4, Healthy: 5 };
const STOCK_ROWS: StockRow[] = PRODUCTS.flatMap(p => (["DUB", "NAS"] as WhId[]).flatMap(wh => {
  const s = wh === "DUB" ? p.dub : p.nas;
  if (!s.onHand) return [];
  const prim = wh === primaryWh(p);
  const wk = wh === "DUB" ? p.wkDemand : p.wkDemandNas;
  const wkP = primaryWh(p) === "DUB" ? p.wkDemand : p.wkDemandNas;
  const rop = prim || p.health === "Dead" || !wkP ? p.reorder : Math.max(5, Math.round((p.reorder * wk) / wkP / 5) * 5);
  return [{
    p, wh, onHand: s.onHand, avail: s.avail, alloc: s.alloc, incoming: p.po && po(p.po).wh === wh ? p.incoming : 0, wk,
    cover: prim || p.health === "Dead" ? p.cover : coverText(s.avail, wk), rop, health: prim ? p.health : rowHealth(p, s.avail, wk),
  }];
})).sort((a, b) => RANK[a.health] - RANK[b.health] || PRODUCTS.indexOf(a.p) - PRODUCTS.indexOf(b.p) || (a.wh === "DUB" ? -1 : 1));

const SH = Object.fromEntries(STOCK_HEALTH) as Record<string, number>;
/* Lets another page open the stock list already filtered. */
const preset: { health?: string } = {};

/* ---------- Overview ---------- */
const URGENT: { sku: string; next: string }[] = [
  { sku: "EL-4408", next: "Approve TR-2291 (40 from Naas) and order 160 from EuroCable today." },
  { sku: "EL-4521", next: "PO-8821 lands 26 Sep with 300. TR-2294 moves 30 from Naas for the AM routes." },
  { sku: "IC-2290", next: "TR-2288 is on the road with 120 and lands at 14:00." },
  { sku: "FIX-1180", next: "No PO open. Order 200 from EuroFix today: stockout 5 Oct, lead time 14 days." },
];

function Overview() {
  const dx = useDx();
  const total = INVENTORY_BY_CAT.reduce((a, b) => a + b[1], 0);
  const openStock = (h: string) => { preset.health = h; dx.go("Inventory", "stock"); };
  const recTransfers = TRANSFERS.filter(t => t.status === "Recommended").length;
  const healthTone: Record<string, Tone | string> = {
    Healthy: "ok", Low: "warn", Critical: "bad", Stockout: "color-mix(in srgb,var(--bad) 55%,var(--surface))", Excess: "accent", Dead: "var(--chart-muted)",
  };
  return (
    <Page eyebrow={"Inventory · " + TODAY.long + " · " + TODAY.time} title="What we hold, and whether it's working"
      sub="€2.46m of stock across Dublin and Naas. 28 SKUs are out, 64 are critical, and €286,420 has not sold in over 90 days."
      right={<>
        <Btn icon={IC.chat} onClick={() => dx.ask("What should we reorder this week?")}>Ask Inventory Agent</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Inventory", "stock")}>Stock list</Btn>
      </>}>
      <KpiRow n={4}>
        <Kpi label="Inventory value" value={eurK(KPI.inventory)} sub={"Dublin " + eurK(WAREHOUSES.DUB.value) + " · Naas " + eurK(WAREHOUSES.NAS.value)} onClick={() => openStock("all")} />
        <Kpi label="Active SKUs" value={num(COMPANY.skus)} sub={num(WAREHOUSES.DUB.skus) + " held in Dublin · " + num(WAREHOUSES.NAS.skus) + " in Naas"} onClick={() => openStock("all")} />
        <Kpi label="Available" value={eurK(INVENTORY_SPLIT.available)} sub="Free to sell today" subTone="ok" onClick={() => dx.go("Inventory", "availability")} />
        <Kpi label="Allocated" value={eurK(INVENTORY_SPLIT.allocated)} sub="Committed to open orders" onClick={() => dx.go("Inventory", "availability")} />
      </KpiRow>
      <KpiRow n={4}>
        <Kpi label="Slow moving" value={eurK(KPI.slowStock)} sub="Older than 90 days" subTone="warn" onClick={() => dx.go("Inventory", "slow")} />
        <Kpi label="Dead stock" value={k1(KPI.deadStock)} sub="No movement in 180+ days" subTone="bad" onClick={() => dx.go("Inventory", "slow")} />
        <Kpi label="Stockouts" value={String(SH.Stockout)} tone="bad" sub={SH.Critical + " more SKUs critical"} subTone="bad" onClick={() => openStock("crit")} />
        <Kpi label="Reorder recommendations" value={String(KPI.reorderRecs)} sub={eurK(KPI.recommendedBuy) + " suggested spend"} onClick={() => dx.go("Inventory", "replenishment")} />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14}>
        <Card title="Needs action now" sub="Four lines where customer orders are waiting, or stock runs out before a new order could land" pad={false}
          right={<Btn small kind="quiet" onClick={() => openStock("crit")}>All {SH.Critical + SH.Stockout} critical and out</Btn>}>
          <div className="dx-list">
            {URGENT.map((u, i) => {
              const p = product(u.sku);
              const short = (SKU_DEMAND[u.sku] || []).filter(d => d.status === "Short");
              const units = short.reduce((a, b) => a + b.qty, 0);
              return (
                <div key={u.sku} className="dx-li dx-click" onClick={() => dx.open("sku", u.sku)} style={{ borderTop: i ? undefined : 0 }}>
                  <div style={{ width: 84, flex: "none", paddingTop: 1 }}><Risk r={p.health.toUpperCase()} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}><RecLink kind="sku" id={p.sku} /><span style={{ marginLeft: 8 }}>{p.name}</span></div>
                    <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3 }}>
                      Dublin {num(p.dub.avail)} free · Naas {num(p.nas.avail)} free · {short.length ? short.length + " order" + (short.length > 1 ? "s" : "") + " waiting on " + num(units) + " " + plural(p.uom, units) : "no orders waiting yet"} · cover {p.cover}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--accent)", marginTop: 4 }}><Linked text={u.next} /></div>
                  </div>
                  <span className="dx-faint" style={{ marginTop: 10 }}><Icon d={IC.chev} s={14} /></span>
                </div>
              );
            })}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent="Inventory Agent · 09:14" title="Where the money is, both ways"
            actions={<>
              <Btn small kind="primary" onClick={() => dx.go("Inventory", "replenishment")}>Open Replenishment</Btn>
              <Btn small onClick={() => dx.go("Inventory", "slow")}>Open Slow & Dead</Btn>
            </>}>
            {KPI.reorderRecs} replenishment recommendations are ready, {eurK(KPI.recommendedBuy)} of buying, 23 of them to order now. The sharpest is <RecLink kind="sku" id="EL-4408" />: 12 free in Dublin against 58 needed this week, while Naas holds 64.
            {" "}At the other end, {eur(KPI.slowStock)} is sitting in slow stock and {eur(KPI.slowRelease)} of it can be released with seven actions.
          </AiCard>
          <Card title="Dublin and Naas" sub="Where the €2.46m sits">
            <Strip parts={[{ label: "Dublin", value: WAREHOUSES.DUB.value, tone: "accent" }, { label: "Naas", value: WAREHOUSES.NAS.value, tone: "var(--chart-muted)" }]} fmt={eurK} />
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 12.5, marginTop: 14, color: "var(--body)" }}>
              {(["DUB", "NAS"] as WhId[]).map(w => (
                <div key={w} style={{ display: "contents" }}>
                  <span className="dx-faint">{WAREHOUSES[w].short}</span>
                  <span>{num(WAREHOUSES[w].skus)} SKUs · {WAREHOUSES[w].docks} docks · {WAREHOUSES[w].pickers} pickers · <Person id={WAREHOUSES[w].manager} /></span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", marginTop: 12 }}>
              Three lines short in Dublin have free stock in Naas: <Linked text="EL-4408 (64), EL-4521 (34) and IC-2290 (180)" />. Naas also holds 22 weeks of safety glasses.
            </div>
            <div style={{ marginTop: 12 }}><Btn small onClick={() => dx.go("Inventory", "transfers")}>{recTransfers} transfers recommended</Btn></div>
          </Card>
        </div>
      </Grid>

      <Grid cols="repeat(2,minmax(0,1fr))" gap={14} style={{ marginTop: 14 }}>
        <Card title="Inventory by category" sub={eurK(total) + " at cost across seven categories"}>
          <HBars items={INVENTORY_BY_CAT.map(([c, v]) => ({ label: c, value: v, note: Math.round((v / total) * 100) + "%" }))} fmt={eurK} onClick={() => openStock("all")} />
        </Card>
        <Card title="Inventory ageing" sub="Days since receipt. €286,420 is older than 90 days.">
          <Columns h={170} fmt={eurK} data={INVENTORY_AGEING.map(([l, v], i) => ({ label: l.replace(" days", ""), value: v, tone: i === 3 ? "warn" : i === 4 ? "bad" : undefined }))} />
          <div className="dx-legend">
            {INVENTORY_AGEING.map(([l, v]) => <span key={l}>{l}<b className="dx-num">{eurK(v)}</b></span>)}
          </div>
        </Card>
      </Grid>

      <Card title="Stock health" sub={num(COMPANY.skus) + " active SKUs by cover against demand"} style={{ marginTop: 14 }}
        right={<Btn small kind="quiet" onClick={() => openStock("all")}>Stock list</Btn>}>
        <Strip h={14} fmt={num} parts={STOCK_HEALTH.map(([l, v]) => ({ label: l, value: v, tone: healthTone[l] }))} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
          <span style={{ fontSize: 13, color: "var(--body)", marginRight: 6 }}>
            {num(SH.Critical + SH.Stockout)} SKUs can't cover demand. Another {num(SH.Excess + SH.Dead)} are excess or dead: cash on a shelf.
          </span>
          <Btn small onClick={() => openStock("crit")}>Critical & stockout</Btn>
          <Btn small onClick={() => openStock("excess")}>Excess</Btn>
          <Btn small onClick={() => openStock("dead")}>Dead</Btn>
        </div>
      </Card>
    </Page>
  );
}

/* ---------- Stock ---------- */
const HEALTH_FILTERS: [string, string][] = [
  ["all", "All · " + num(COMPANY.skus)], ["crit", "Critical & stockout · " + (SH.Critical + SH.Stockout)], ["low", "Low · " + SH.Low],
  ["excess", "Excess · " + SH.Excess], ["dead", "Dead · " + SH.Dead],
];
const FILTER_TOTAL: Record<string, [number, string]> = {
  all: [COMPANY.skus, "SKUs"], crit: [SH.Critical + SH.Stockout, "critical and stocked-out SKUs"], low: [SH.Low, "low-stock SKUs"],
  excess: [SH.Excess, "excess SKUs"], dead: [SH.Dead, "dead SKUs"],
};

function Stock() {
  const dx = useDx();
  const [health, setHealth] = useLocal("inv.stock.health", "all");
  const [wh, setWh] = useLocal("inv.stock.wh", "all");
  useEffect(() => { if (preset.health) { setHealth(preset.health); preset.health = undefined; } }, []);
  const match = (h: Health2) => health === "all" || (health === "crit" ? h === "Critical" || h === "Stockout" : health === "low" ? h === "Low" : health === "excess" ? h === "Excess" : h === "Dead");
  const rows = STOCK_ROWS.filter(r => match(r.health) && (wh === "all" || r.wh === wh));
  const skus = new Set(rows.map(r => r.p.sku)).size;
  const [tot, label] = FILTER_TOTAL[health] || FILTER_TOTAL.all;
  /* 14 fields in 11 columns: SKU and category sit under the product name, lead time under the supplier. */
  const cols: Col<StockRow>[] = [
    { k: "p", label: "Product", w: "1.46fr", render: r => <TwoLine top={<span title={r.p.name}>{r.p.name}</span>} bottom={<><RecLink kind="sku" id={r.p.sku} /> · {r.p.cat}</>} /> },
    { k: "wh", label: "Warehouse", w: "0.81fr", render: r => WH(r.wh) },
    { k: "on", label: "On hand", w: "0.66fr", align: "right", mono: true, render: r => num(r.onHand) },
    { k: "av", label: "Avail.", w: "0.62fr", align: "right", mono: true, render: r => <span style={{ color: r.avail === 0 && r.wk > 0 ? "var(--bad)" : undefined }}>{num(r.avail)}</span> },
    { k: "al", label: "Alloc.", w: "0.6fr", align: "right", mono: true, render: r => num(r.alloc) },
    { k: "inc", label: "Incoming", w: "0.72fr", align: "right", mono: true, render: r => (r.incoming ? num(r.incoming) : "—") },
    { k: "wk", label: "Wk demand", w: "0.81fr", align: "right", mono: true, render: r => num(r.wk) },
    { k: "cv", label: "Cover", w: "0.9fr", align: "right", render: r => <span style={{ color: r.health === "Critical" || r.health === "Stockout" ? "var(--bad)" : undefined }}>{r.cover}</span> },
    { k: "rop", label: "Reorder", w: "0.66fr", align: "right", mono: true, render: r => num(r.rop) },
    { k: "sup", label: "Supplier", w: "1.24fr", render: r => <TwoLine top={<RecLink kind="supplier" id={r.p.supplier} plain>{SUP_SHORT[r.p.supplier] || supplier(r.p.supplier).name}</RecLink>} bottom={r.p.lead + " days lead"} /> },
    { k: "h", label: "Health", w: "1.07fr", render: r => <Risk r={r.health.toUpperCase()} /> },
  ];
  return (
    <Page eyebrow="Inventory" title="Stock"
      sub="Every SKU in every warehouse that holds it: on hand, free to sell, committed to orders and on the way in. Sorted so the problems come first.">
      <Note tone="warn">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ flex: 1, minWidth: 260 }}>
            Dublin is short on three lines that Naas has free. <Linked text="EL-4408: 12 free in Dublin against 58 needed this week, 64 in Naas. EL-4521: none in Dublin, 34 in Naas. IC-2290: none in Dublin, 180 in Naas, 120 already on TR-2288." />
          </span>
          <Btn small onClick={() => dx.go("Inventory", "transfers")}>See transfers</Btn>
        </div>
      </Note>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "14px 0 12px" }}>
        <Seg items={HEALTH_FILTERS} value={health} onChange={setHealth} />
        <Seg items={[["all", "Both warehouses"], ["DUB", "Dublin"], ["NAS", "Naas"]]} value={wh} onChange={setWh} />
      </div>
      <Card pad={false}>
        <Table cols={cols} rows={rows} onRow={r => dx.open("sku", r.p.sku)} rowTone={r => (r.p.sku === dx.rec.sku && r.wh === primaryWh(r.p) ? "accent" : undefined)}
          empty="No SKUs in this view match the filter." />
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>Showing {skus} of {num(tot)} {label}</span>
          <span className="dx-faint">{rows.length} warehouse rows · Sage 200 and warehouse system, last movement 08:52</span>
        </div>
      </Card>
    </Page>
  );
}

/* ---------- Availability ---------- */
type Receipt = { ref: string; qty: number; when: string };
const ATP: { sku: string; rcpt: Receipt[]; into: WhId; note?: string }[] = [
  { sku: "EL-4408", rcpt: [{ ref: "PO-8821", qty: 120, when: "26 Sep 10:30" }], into: "DUB" },
  { sku: "EL-4521", rcpt: [{ ref: "PO-8821", qty: 300, when: "26 Sep 10:30" }], into: "DUB" },
  { sku: "IC-2290", rcpt: [{ ref: "TR-2288", qty: 120, when: "Today 14:00" }, { ref: "PO-8821", qty: 600, when: "26 Sep 10:30" }], into: "DUB" },
  { sku: "IC-4470", rcpt: [{ ref: "PO-8821", qty: 800, when: "26 Sep 10:30" }], into: "DUB", note: "200 cross-docked to Naas" },
  { sku: "EL-5530", rcpt: [{ ref: "PO-8821", qty: 600, when: "26 Sep 10:30" }], into: "DUB" },
  { sku: "SAF-3310", rcpt: [{ ref: "PO-8826", qty: 760, when: "Landed 08:40" }], into: "NAS", note: "760 of 800, in put-away" },
  { sku: "FIX-1180", rcpt: [], into: "DUB", note: "No PO open" },
];
type AtpRow = { sku: string; p: Product; dubFree: number; held: number; nasFree: number; alloc: number; waitQty: number; waitOrders: number; rcpt: Receipt[]; after: number | null; note?: string };
const ATP_ROWS: AtpRow[] = ATP.map(a => {
  const p = product(a.sku);
  const short = (SKU_DEMAND[a.sku] || []).filter(d => d.status === "Short");
  const waitQty = short.reduce((s, d) => s + d.qty, 0);
  const inQty = a.rcpt.reduce((s, r) => s + r.qty, 0);
  const base = a.into === "DUB" ? p.dub.avail : p.nas.avail;
  return {
    sku: a.sku, p, dubFree: p.dub.avail, held: Math.min(p.dub.avail, p.safety), nasFree: p.nas.avail, alloc: p.dub.alloc + p.nas.alloc,
    waitQty, waitOrders: short.length, rcpt: a.rcpt, after: a.rcpt.length ? base + inQty - waitQty : null, note: a.note,
  };
});

/* Where a new promise can come from, in the order Pulse would use it. */
type Tier = { src: string; ref?: { kind: "po" | "supplier" | "tr"; id: string }; from: string; qty: number; date: string; note: string; needs?: string };
const PROMISE: Record<string, Tier[]> = {
  "EL-4408": [
    { src: "Dublin free stock", from: "Dublin", qty: 0, date: "26 Sep", note: "12 free, all held as trade-counter safety stock." },
    { src: "Naas free stock", from: "Naas, on the 11:00 shuttle", qty: 24, date: "26 Sep", note: "64 free, 40 earmarked for TR-2291." },
    { src: "Receipt", ref: { kind: "po", id: "PO-8821" }, from: "Dublin", qty: 92, date: "27 Sep", note: "120 land 26 Sep 10:30 and 28 go to SO-10482 first. Promised a day later because Atlas has moved this date twice." },
    { src: "New order", ref: { kind: "supplier", id: "eurocable" }, from: "Dublin", qty: 160, date: "5 Oct", note: "The recommended EuroCable PO, 9-day lead time, if it is raised today.", needs: "po-el4408" },
  ],
  "EL-4521": [
    { src: "Dublin free stock", from: "Dublin", qty: 0, date: "26 Sep", note: "Stocked out in Dublin. 22 allocated to SO-10499." },
    { src: "Naas free stock", from: "Naas, on the 11:00 shuttle", qty: 4, date: "26 Sep", note: "34 free, 30 earmarked for TR-2294." },
    { src: "Receipt", ref: { kind: "po", id: "PO-8821" }, from: "Dublin", qty: 240, date: "27 Sep", note: "300 land 26 Sep 10:30 and 60 go to SO-10482 first." },
    { src: "New order", ref: { kind: "supplier", id: "atlas" }, from: "Dublin", qty: 200, date: "24 Oct", note: "The recommended Atlas PO, 28-day lead time, if it is raised today.", needs: "po-8853" },
  ],
  "IC-2290": [
    { src: "Dublin free stock", from: "Dublin", qty: 0, date: "26 Sep", note: "Stocked out. TR-2288's 120 land at 14:00 and are all owed to SO-10482 and SO-10515." },
    { src: "Naas free stock", from: "Naas, on the 11:00 shuttle", qty: 180, date: "26 Sep", note: "180 free." },
    { src: "Receipt", ref: { kind: "po", id: "PO-8821" }, from: "Dublin", qty: 600, date: "27 Sep", note: "600 land 26 Sep 10:30, none owed to waiting orders." },
  ],
  "FIX-1180": [
    { src: "Dublin free stock", from: "Dublin", qty: 46, date: "26 Sep", note: "96 free, 50 held as safety stock." },
    { src: "Naas free stock", from: "Naas, on the 11:00 shuttle", qty: 62, date: "26 Sep", note: "62 free." },
    { src: "New order", ref: { kind: "supplier", id: "eurofix" }, from: "Dublin", qty: 200, date: "10 Oct", note: "No PO is open. The recommended EuroFix PO, 14-day lead time, if it is raised today.", needs: "po-8854" },
  ],
  "SAF-3310": [
    { src: "Dublin free stock", from: "Dublin", qty: 0, date: "26 Sep", note: "150 free, all below the 200 safety stock." },
    { src: "Naas free stock", from: "Naas, on the 11:00 shuttle", qty: 120, date: "26 Sep", note: "120 free." },
    { src: "Receipt", ref: { kind: "po", id: "PO-8826" }, from: "Naas, on the 11:00 shuttle", qty: 760, date: "26 Sep", note: "760 of 800 landed in Naas at 08:40 and are being put away. 40 short, claim drafted." },
    { src: "New order", ref: { kind: "supplier", id: "safepro" }, from: "Dublin", qty: 400, date: "6 Oct", note: "The recommended SafePro PO, 10-day lead time, if it is raised today.", needs: "po-8855" },
  ],
};
const QTYS: [string, string][] = [["10", "10"], ["25", "25"], ["50", "50"], ["100", "100"], ["250", "250"]];

function RefLink({ r }: { r: NonNullable<Tier["ref"]> }) {
  if (r.kind === "tr") return <TrLink id={r.id} />;
  if (r.kind === "supplier") return <RecLink kind="supplier" id={r.id}>{supplier(r.id).name}</RecLink>;
  return <RecLink kind="po" id={r.id} />;
}

function Availability() {
  const dx = useDx();
  const [sku, setSku] = useLocal("inv.atp.sku", PROMISE[dx.rec.sku] ? dx.rec.sku : "EL-4408");
  const [qs, setQs] = useLocal("inv.atp.qty", "25");
  const q = Number(qs);
  const p = product(sku);
  const tiers = PROMISE[sku] || PROMISE["EL-4408"];
  let left = q, lastI = -1;
  const used = tiers.map((t, i) => {
    if (left <= 0 || t.qty <= 0) return 0;
    const u = Math.min(t.qty, left);
    left -= u; lastI = i;
    return u;
  });
  const prevI = lastI > 0 ? used.slice(0, lastI).map((u, i) => (u > 0 ? i : -1)).filter(i => i >= 0).pop() ?? -1 : -1;
  const before = used.slice(0, lastI < 0 ? 0 : lastI).reduce((a, b) => a + b, 0);
  const full = left <= 0;
  const last = lastI >= 0 ? tiers[lastI] : null;
  const needsPO = last?.needs && !dx.acted[last.needs];
  const naasShort = ATP_ROWS.filter(r => r.dubFree - r.held <= 0 && r.waitQty > 0 && r.nasFree > 0 && r.p.nas.onHand > 0);
  const inbound = (po("PO-8821").lines || []).reduce((a, l) => a + l.qty, 0);

  const atpCols: Col<AtpRow>[] = [
    { k: "sku", label: "Product", w: "1.6fr", render: r => <TwoLine top={<RecLink kind="sku" id={r.sku} />} bottom={r.p.name} /> },
    { k: "df", label: "Dublin free", w: "0.8fr", align: "right", mono: true, render: r => num(r.dubFree) },
    { k: "held", label: "Held back", w: "0.78fr", align: "right", mono: true, render: r => <span style={{ color: r.held > 0 && r.waitQty > 0 ? "var(--warn)" : r.held ? undefined : "var(--faint)" }}>{r.held ? num(r.held) : "—"}</span> },
    { k: "nf", label: "Naas free", w: "0.74fr", align: "right", mono: true, render: r => <span style={{ color: r.nasFree > 0 && r.dubFree - r.held <= 0 && r.waitQty > 0 ? "var(--accent)" : undefined }}>{num(r.nasFree)}</span> },
    { k: "al", label: "Allocated", w: "0.76fr", align: "right", mono: true, render: r => num(r.alloc) },
    { k: "wait", label: "Waiting", w: "1.05fr", align: "right", render: r => (r.waitQty ? <span style={{ color: "var(--bad)" }}>{num(r.waitQty)} · {r.waitOrders} order{r.waitOrders > 1 ? "s" : ""}</span> : <span className="dx-faint">—</span>) },
    { k: "rc", label: "Next receipt", w: "2fr", render: r => (r.rcpt.length
      ? <TwoLine top={<>{r.rcpt.map((x, i) => <span key={i}>{i ? " + " : ""}{num(x.qty)} on {x.ref.startsWith("TR") ? <TrLink id={x.ref} /> : <RecLink kind="po" id={x.ref} />}</span>)}</>}
          bottom={r.rcpt.map(x => x.when).join(" · ") + (r.note ? " · " + r.note : "")} />
      : <TwoLine top={<span className="dx-faint">None open</span>} bottom="200 recommended today" />) },
    { k: "after", label: "After receipt", w: "1.05fr", align: "right", mono: true, render: r => (r.after === null ? "—" : num(r.after)) },
  ];

  const tierCols: Col<Tier & { used: number; i: number }>[] = [
    { k: "src", label: "Source", w: "1.45fr", render: t => <TwoLine top={t.ref ? <RefLink r={t.ref} /> : t.src} bottom={t.ref ? t.src : t.from} /> },
    { k: "qty", label: "Free", w: "0.6fr", align: "right", mono: true, render: t => <span style={{ color: t.qty ? undefined : "var(--faint)" }}>{num(t.qty)}</span> },
    { k: "date", label: "Earliest", w: "0.72fr", render: t => (t.qty ? t.date : <span className="dx-faint">—</span>) },
    { k: "used", label: "Used", w: "0.6fr", align: "right", mono: true, render: t => (t.used ? <b style={{ color: "var(--accent)" }}>{num(t.used)}</b> : <span className="dx-faint">—</span>) },
    { k: "note", label: "Why", w: "2.6fr", render: t => <Wrap dim><Linked text={t.note} /></Wrap> },
  ];

  const t2 = TRANSFER_EL4408;
  return (
    <Page eyebrow="Inventory" title="Can we promise it?"
      sub="Available-to-promise for the constrained lines: what is free now, what is held back, what is owed to waiting orders and when the next stock lands.">
      <KpiRow n={4}>
        <Kpi label="Orders waiting on stock" value={String(KPI.backorders)} sub={eur(KPI.backorderValue) + " of order value"} tone="warn" onClick={() => dx.go("Orders", "backorders")} />
        <Kpi label="Free in Naas, short in Dublin" value={naasShort.length + " lines"} sub={naasShort.map(r => r.sku + " " + r.nasFree).join(" · ")} subTone="warn" onClick={() => dx.go("Inventory", "transfers")} />
        <Kpi label="Held as safety stock" value={t2.dubAvail + " drums"} sub="EL-4408 in Dublin, while 4 orders wait on 68" subTone="bad" />
        <Kpi label="Next big receipt" value="PO-8821" sub={"26 Sep 10:30 · " + num(inbound) + " units on the constrained lines"} onClick={() => dx.open("po", "PO-8821")} />
      </KpiRow>

      <Card title="Available to promise" sub="Constrained lines, Dublin and Naas. Held back is safety stock Pulse won't promise. After receipt is what's free once waiting orders take their share." pad={false}>
        <Table cols={atpCols} rows={ATP_ROWS} onRow={r => dx.open("sku", r.sku)} rowTone={r => (r.waitQty ? "bad" : undefined)} />
      </Card>

      <Card title="Promise checker" sub="What a rep sees before confirming a date. Pulse uses free stock first, then Naas, then the next receipt, then a new order." style={{ marginTop: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <Seg items={Object.keys(PROMISE).map(k => [k, k] as [string, string])} value={sku} onChange={setSku} />
          <Seg items={QTYS} value={qs} onChange={setQs} />
          <span className="dx-faint" style={{ fontSize: 12.5 }}>{plural(p.uom, 2)} of {p.name}</span>
        </div>
        <Grid cols="minmax(0,4fr) minmax(0,8fr)" gap={16}>
          <div className="dx-fact" style={{ padding: "16px 18px" }}>
            <div className="dx-fact-k">Earliest date you can promise {num(q)} {plural(p.uom, q)}</div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-1px", marginTop: 6, color: full ? (needsPO ? "var(--warn)" : "var(--ink)") : "var(--bad)" }}>
              {full && last ? last.date : "Not in full"}
            </div>
            <div style={{ fontSize: 13, color: "var(--body)", marginTop: 6, lineHeight: 1.55 }}>
              {full && last
                ? <>From {last.from}{last.ref ? <>, using {last.ref.kind === "supplier" ? "a new order from " : ""}<RefLink r={last.ref} /></> : null}.</>
                : <>{num(q - left)} can be promised by {last ? last.date : "—"}. The other {num(left)} need a new purchase order.</>}
            </div>
            {full && prevI >= 0 && (
              <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 8, lineHeight: 1.5 }}>
                Or split it: {num(before)} by {tiers[prevI].date}, the other {num(used[lastI])} on {last!.date}.
              </div>
            )}
            {needsPO && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                <Badge tone="warn">Depends on a PO not yet raised</Badge>
                {last!.needs === "po-el4408"
                  ? <ActBtn id="po-el4408" small kind="primary" label="Create Purchase Order" done="PO-8852 drafted" toast="PO-8852 drafted: 160 × EL-4408 from EuroCable BV, €3,552. Waiting on Emma's approval." />
                  : <Btn small onClick={() => dx.go("Purchasing", "recommendations")}>Open purchase recommendations</Btn>}
              </div>
            )}
            {full && !needsPO && (
              <div style={{ marginTop: 12 }}>
                <ActBtn id={"atp-hold-" + sku + "-" + q} small label="Hold for 24 hours" done="Held until 26 Sep 09:16" toast={num(q) + " × " + sku + " held for 24 hours against the promise date " + last!.date + "."} />
              </div>
            )}
          </div>
          <Card pad={false}>
            <Table dense cols={tierCols} rows={tiers.map((t, i) => ({ ...t, used: used[i], i }))} rowTone={t => (t.used ? "accent" : undefined)} />
          </Card>
        </Grid>
      </Card>

      <div className="dx-section">
        <div className="dx-section-head"><div className="dx-section-title">Why promises break here</div><span className="dx-faint" style={{ fontSize: 12.5 }}>Three cases from this week</span></div>
        <Grid cols="repeat(3,minmax(0,1fr))" gap={12}>
          <Card tone="bad" title="Stock in Naas, orders waiting in Dublin" sub={<><RecLink kind="sku" id="EL-4408" /> · {product("EL-4408").name}</>}>
            <Facts cols={2} items={[
              ["Dublin free", String(t2.dubAvail), "bad"], ["Dublin need, 7 days", String(t2.dubDemand7)],
              ["Naas free", String(t2.nasAvail), "ok"], ["Naas need, 7 days", String(t2.nasDemand7)],
            ]} />
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", marginTop: 12 }}>
              Three Dublin orders are short while the drums sit in Naas: {t2.orders.map((o, i) => <span key={o}>{i ? ", " : ""}<RecLink kind="order" id={o} /> ({customer(order(o).cust).name.split(" ")[0]})</span>)}.
              {" "}{t2.freeNote} {t2.murphyNote}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <ActBtn id="d-transfer" kind="primary" small label="Approve Transfer" done="Transfer TR-2291 approved" toast="TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van. Liam and Aoife notified." />
              <Btn small kind="quiet" onClick={() => dx.go("Inventory", "transfers")}>Transfers</Btn>
            </div>
          </Card>
          <Card tone="warn" title="A promise made without checking" sub={<>Liffey Mechanical & Electrical · <RecLink kind="order" id="SO-10526" /></>}>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
              David Kelly keyed <RecLink kind="order" id="SO-10526" /> as a rep order on 24 Sep at 10:44 and told Rory Byrne his 18 drums of <RecLink kind="sku" id="EL-4408" /> would arrive on 26 Sep.
              Dublin had no drums free outside safety stock, so the order was short the moment it was placed.
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", marginTop: 8 }}>
              Liffey's spend is down 9.4% and <RecLink kind="quote" id="QT-2839" /> ({eur(14620)}) expires 28 Sep. TR-2291 saves this one if it is approved by 10:30.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <ActBtn id="atp-rep-check" small kind="primary" label="Check stock at order entry" done="Promise check on for rep orders"
                toast="Rep orders now show the earliest promise date before they're confirmed. Sarah, David, Mark and Michael notified." />
              <Btn small kind="quiet" onClick={() => dx.go("Customers", "detail", { cust: "liffey" })}>Liffey account</Btn>
            </div>
          </Card>
          <Card title="Safety stock held back while orders wait" sub={<><RecLink kind="sku" id="EL-4408" /> · Dublin trade counter</>}>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
              The 12 free drums in Dublin are below the 40 safety stock, so Pulse won't promise them. Releasing them would complete Horizon's <RecLink kind="order" id="SO-10497" /> now, but leaves the trade counter with no cable until the shuttle lands at 11:45.
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--accent)", marginTop: 8 }}>
              <Linked text="TR-2291 covers SO-10497 in time for D14 at 13:45, so keep the hold." />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 8, lineHeight: 1.5 }}>
              Also held in Dublin: <Linked text="SAF-3310 150 (below 200), IC-4470 90 (below 150), FIX-1180 50." />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <ActBtn id="atp-release-12" small kind="quiet" label="Release 12 to SO-10497 anyway" done="12 released to SO-10497"
                toast="12 × EL-4408 released from safety stock to SO-10497. Trade counter at zero until 11:45." />
            </div>
          </Card>
        </Grid>
      </div>
    </Page>
  );
}

/* ---------- Replenishment ---------- */
/* How the 147 recommendations break down. Sums to 147 lines and €184,000. */
const REPLEN_MIX = [
  { k: "Order now", lines: 23, value: 41200, sub: "Stockout inside lead time" },
  { k: "Order this week", lines: 52, value: 78600, sub: "Below reorder point within 7 days" },
  { k: "Order by 16 Oct", lines: 58, value: 69800, sub: "Planned, no risk yet" },
  { k: "Reduce or cancel", lines: 14, value: -5600, sub: "Buy less, transfer instead" },
];
/* The table shows the supplier and value Pulse recommends, which for EL-4408 is EuroCable, not the usual Atlas. */
const REC_BUY: Record<string, { supplier: string; value: number }> = { "EL-4408": { supplier: "eurocable", value: 3552 } };

function Replenishment() {
  const dx = useDx();
  const r0 = REPLEN.find(r => r.sku === "EL-4408")!;
  const p0 = product("EL-4408");
  const today = ["po-el4408", "po-8853", "po-8854"];
  const allDone = today.every(id => dx.acted[id]);
  const draftAll = () => {
    if (!dx.acted["po-el4408"]) dx.act("po-el4408", "PO-8852 drafted", "PO-8852 drafted: 160 × EL-4408 from EuroCable BV, €3,552. Waiting on Emma's approval.");
    if (!dx.acted["po-8853"]) dx.act("po-8853", "PO-8853 drafted", "PO-8853 drafted: 200 × EL-4521 from Atlas, €3,420.");
    dx.act("po-8854", "PO-8854 drafted", "Three draft POs waiting on Emma: PO-8852 EuroCable €3,552, PO-8853 Atlas €3,420, PO-8854 EuroFix €9,145 (FIX-1180 with FIX-2201 to clear free carriage).");
  };
  const existing = (s: string) => {
    const [a, ...rest] = s.split(" · ");
    return a.startsWith("PO-") ? <TwoLine top={<RecLink kind="po" id={a} />} bottom={rest.join(" · ")} /> : <Wrap dim>{s}</Wrap>;
  };
  /* All eleven §15 fields in eight columns: paired figures share a two-line cell. */
  const cols: Col<Replen>[] = [
    { k: "p", label: "Product", w: "1.6fr", render: r => <TwoLine top={<RecLink kind="sku" id={r.sku} />} bottom={product(r.sku).name} /> },
    { k: "st", label: "Available / stock", w: "0.95fr", align: "right", render: r => (
      <div style={{ textAlign: "right" }}><div className="dx-num" style={{ fontWeight: 500, color: r.avail === 0 ? "var(--bad)" : undefined }}>{num(r.avail)}</div>
        <div className="dx-faint" style={{ fontSize: 12, marginTop: 2 }}>of {num(r.current)} on hand</div></div>
    ) },
    { k: "fc", label: "Forecast 4 wks", w: "0.9fr", align: "right", render: r => (
      <div style={{ textAlign: "right" }}><div className="dx-num" style={{ fontWeight: 500 }}>{num(r.forecast4w)}</div>
        <div className="dx-faint" style={{ fontSize: 12, marginTop: 2 }}>lead {r.lead} days</div></div>
    ) },
    { k: "po", label: "Existing PO", w: "1.25fr", render: r => existing(r.existingPO) },
    { k: "sug", label: "Suggested order", w: "1.1fr", align: "right", render: r => {
      const b = REC_BUY[r.sku] || { supplier: r.supplier, value: r.value };
      return r.suggest === 0 ? <span className="dx-faint">—</span>
        : <div style={{ textAlign: "right" }}><div className="dx-num" style={{ color: r.suggest < 0 ? "var(--warn)" : undefined, fontWeight: 500 }}>{r.suggest > 0 ? num(r.suggest) : "−" + num(-r.suggest)}</div>
          <div className="dx-faint" style={{ fontSize: 12, marginTop: 2 }}>{SUP_SHORT[b.supplier]} · {eur(b.value)}</div></div>;
    } },
    { k: "when", label: "Order by / stockout", w: "1.05fr", render: r => (
      <div>
        <div>{r.when === "TODAY" ? <Badge tone="bad">TODAY</Badge> : r.when === "No action" ? <span className="dx-faint">No action</span> : r.when.startsWith("Cancel") ? <Badge tone="warn">Cancel PO</Badge> : r.when}</div>
        <div style={{ fontSize: 12, marginTop: 3, color: r.stockout === "Now" || r.stockout === "28 Sep" ? "var(--bad)" : "var(--faint)" }}>{r.stockout === "—" ? "No stockout" : r.stockout === "Now" ? "Stocked out now" : "Stockout " + r.stockout}</div>
      </div>
    ) },
    { k: "conf", label: "Confidence", w: "0.9fr", render: r => <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}><Meter value={r.confidence} w={30} tone={r.confidence >= 85 ? "ok" : "warn"} /><span className="dx-num">{r.confidence}%</span></span> },
    { k: "why", label: "Reason", w: "2.35fr", render: r => <Wrap dim><Linked text={r.reason} /></Wrap> },
  ];
  const covered = REPLEN.filter(r => r.suggest === 0);
  return (
    <Page eyebrow="Inventory · Replenishment" title={<>{KPI.reorderRecs} recommendations · {eurK(KPI.recommendedBuy)}</>}
      sub={<Linked text="What to buy, how much, from whom and by when. The Inventory Agent re-ran at 09:14 after Atlas moved PO-8821. Confidence is the model's estimate, not a promise." />}
      right={<Btn icon={IC.chat} onClick={() => dx.ask("What should we reorder this week?")}>Ask Inventory Agent</Btn>}>
      <KpiRow n={4}>
        {REPLEN_MIX.map(m => (
          <Kpi key={m.k} label={m.k} value={m.lines + " lines"} sub={k1(m.value) + " · " + m.sub} tone={m.k === "Order now" ? "bad" : undefined}
            subTone={m.value < 0 ? "ok" : undefined} />
        ))}
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14}>
        <Card tone="bad" title={<><RecLink kind="sku" id="EL-4408" /> <span style={{ marginLeft: 6 }}>{p0.name}</span></>} sub={"Dublin · " + supplier(p0.supplier).name + " is the usual supplier · CRITICAL"}
          right={<Badge tone="bad" dot>ORDER TODAY</Badge>}>
          <Facts cols={4} items={[
            ["Available", String(r0.avail), "bad"], ["Avg weekly demand", String(p0.wkDemand)], ["Forecast next 4 weeks", String(r0.forecast4w)], ["Lead time", r0.lead + " days (Atlas)"],
            ["Incoming", <>{p0.incoming} on <RecLink kind="po" id="PO-8821" /></>], ["Recommended", r0.suggest + " units", "accent"], ["Order", "Today", "bad"], ["Expected stockout", r0.stockout, "bad"],
          ]} />
          <div style={{ marginTop: 12 }}><Note tone="warn">“{r0.reason}”</Note></div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--body)", marginTop: 12 }}>
            At 12 available, Dublin runs out on {r0.stockout} ({p0.cover} of cover). If Atlas lands <RecLink kind="po" id="PO-8821" /> tomorrow the first stockout moves to 21 Oct, but 68 of its 120 drums are already owed to waiting orders and the next four weeks need {r0.forecast4w}.
            {" "}160 from EuroCable lands 4 Oct and keeps Dublin in stock until the late-November reorder.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <ActBtn id="po-el4408" kind="primary" label="Create Purchase Order" done="PO-8852 drafted" toast="PO-8852 drafted: 160 × EL-4408 from EuroCable BV, €3,552. Waiting on Emma's approval." />
            <Btn onClick={() => dx.go("Inventory", "forecast")}>See the forecast</Btn>
            <Btn kind="quiet" onClick={() => dx.go("Inventory", "transfers")}>Transfer 40 first</Btn>
          </div>
        </Card>
        <Card title="Not every recommendation is a buy" sub="Before spending, Pulse checks transfers and open POs" pad={false}>
          <div className="dx-list">
            <div className="dx-li" style={{ borderTop: 0 }}>
              <span style={{ color: "var(--ok)", marginTop: 2 }}><Icon d={IC.swap} s={15} /></span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.55 }}>
                <b style={{ fontWeight: 600 }}>Cancel the planned SafePro PO.</b> <Linked text="SAF-1892 has 22 weeks' cover in Naas. Transfer 600 to Dublin on TR-2292 instead of buying 500 more (−€1,050)." />
                <div style={{ marginTop: 8 }}><ActBtn id="po-saf-cancel" small label="Cancel planned PO" done="Planned PO cancelled" toast="SafePro's 3 Oct PO for 500 × SAF-1892 cancelled. TR-2292 raised for 600 from Naas." /></div>
              </div>
            </div>
            <div className="dx-li">
              <span style={{ color: "var(--accent)", marginTop: 2 }}><Icon d={IC.truck} s={15} /></span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.55 }}>
                <b style={{ fontWeight: 600 }}>Move before you buy.</b> <Linked text="TR-2291 protects today's three EL-4408 orders. The PO protects October." />
              </div>
            </div>
            <div className="dx-li">
              <span style={{ color: "var(--dim)", marginTop: 2 }}><Icon d={IC.check} s={15} /></span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.55 }}>
                <b style={{ fontWeight: 600 }}>{covered.length} lines need nothing.</b> {covered.map((r, i) => <span key={r.sku}>{i ? ", " : ""}<RecLink kind="sku" id={r.sku} /></span>)} are covered by open POs or a short supplier lead time.
              </div>
            </div>
          </div>
        </Card>
      </Grid>

      <Card title="AI replenishment recommendations" sub="The lines that matter this week, from 147. Click a row for the product." style={{ marginTop: 14 }} pad={false}
        right={<Btn small kind="primary" done={allDone ? "3 draft POs raised" : undefined} onClick={draftAll}>Draft today's 3 POs</Btn>}>
        <Table cols={cols} rows={REPLEN} onRow={r => dx.open("sku", r.sku)} rowTone={r => (r.when === "TODAY" ? "bad" : r.sku === dx.rec.sku ? "accent" : undefined)} />
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}>
          Confidence is the model's estimate that the stockout date holds, based on how far its forecast for this SKU has been out over the last 52 weeks. It is a guide for the buyer, not a guarantee, and Pulse does not raise orders on its own.
        </div>
      </Card>

      <div style={{ marginTop: 14 }}><ProcurementDecision /></div>
    </Page>
  );
}

/* ---------- Slow & dead ---------- */
const SLOW_DO: Record<string, { id: string; label: string; done: string; toast: string }> = {
  "TL-3321": { id: "slow-TL-3321", label: "Request return", done: "Return requested", toast: "Return request sent to Toolcraft Europe: 180 × TL-3321 at 15% restocking. €12,090 back if accepted." },
  "EL-6120": { id: "slow-EL-6120", label: "Assign to reps", done: "Assigned to reps", toast: "Cable tray offer added to Sarah Byrne's call list for Horizon and David Kelly's for Liffey. €18,390 of Naas stock." },
  "SAF-4020": { id: "slow-SAF-4020", label: "Create bundle", done: "Bundle created", toast: "Site-starter bundle created: SAF-4020 with SAF-2204 hi-vis, added to the contractor price list." },
  "IC-7715": { id: "slow-IC-7715", label: "Add to flyer", done: "In October flyer", toast: "IC-7715 added to the October flyer for facilities accounts." },
  "PK-2240": { id: "slow-PK-2240", label: "Stop reorder", done: "Replenishment stopped", toast: "Replenishment stopped on PK-2240. Reorder point set to 0." },
  "SAF-1892": { id: "tr-TR-2292", label: "Approve TR-2292", done: "TR-2292 approved", toast: "TR-2292 approved: 600 × SAF-1892 Naas → Dublin. SafePro's October PO flagged for cancellation." },
  "EL-3102": { id: "tr-TR-2293", label: "Approve TR-2293", done: "TR-2293 approved", toast: "TR-2293 approved: 80 × EL-3102 Naas → Dublin." },
  "FIX-3105": { id: "slow-FIX-3105", label: "Reduce order qty", done: "Buying for Dublin only", toast: "FIX-3105 set to Dublin-only buying. Naas fed by shuttle, next Hansen PO cut to one MOQ." },
};
const actionTone = (a: string): Tone => (/Stop|Reduce/.test(a) ? "warn" : /Transfer/.test(a) ? "accent" : /return/i.test(a) ? "neutral" : "ok");

function SlowDead() {
  const dx = useDx();
  const lineValue = SLOW_LINES.reduce((a, b) => a + b.value, 0);
  const lineRelease = SLOW_LINES.reduce((a, b) => a + b.release, 0);
  const release = SLOW_ACTIONS.reduce((a, b) => a + b[2], 0);
  const lines = SLOW_ACTIONS.reduce((a, b) => a + b[1], 0);
  const carrying = Math.round(KPI.slowStock * 0.2);
  const right = (top: ReactNode, bottom: ReactNode, tone?: string) => (
    <div style={{ textAlign: "right" }}><div className="dx-num" style={{ fontWeight: 500, color: tone }}>{top}</div><div className="dx-faint" style={{ fontSize: 12, marginTop: 2 }}>{bottom}</div></div>
  );
  const cols: Col<SlowLine>[] = [
    { k: "p", label: "Product, and why it isn't selling", w: "3.2fr", render: r => (
      <div style={{ minWidth: 0, padding: "2px 0" }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}><RecLink kind="sku" id={r.sku} /><span style={{ marginLeft: 8 }}>{r.name}</span></div>
        <div className="dx-faint" style={{ whiteSpace: "normal", fontSize: 12, lineHeight: 1.45, marginTop: 3 }}><Linked text={r.why} /></div>
      </div>
    ) },
    { k: "qty", label: "Qty · where", w: "0.95fr", align: "right", render: r => right(num(r.qty), r.wh) },
    { k: "v", label: "Value · release", w: "1fr", align: "right", render: r => right(eur(r.value), <span style={{ color: "var(--ok)" }}>release {eur(r.release)}</span>) },
    { k: "d", label: "Age", w: "0.9fr", align: "right", render: r => right(r.days + " days", "sold " + r.lastSale, r.days > 180 ? "var(--bad)" : r.days > 120 ? "var(--warn)" : undefined) },
    { k: "a", label: "Suggested action", w: "1.95fr", render: r => {
      const a = SLOW_DO[r.sku];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", padding: "2px 0" }}>
          <Badge tone={actionTone(r.action)}>{r.action}</Badge>
          {a && <ActBtn id={a.id} small label={a.label} done={a.done} toast={a.toast} />}
        </div>
      );
    } },
  ];
  return (
    <Page eyebrow="Inventory · Slow & dead stock" title={<><span style={{ color: "var(--warn)" }}>{eur(KPI.slowStock)}</span> tied up in slow-moving stock</>}
      sub={pct((KPI.slowStock / KPI.inventory) * 100) + " of the €2.46m on the shelves. " + eur(KPI.deadStock) + " has not moved in 180 days. Seven actions release " + eur(release) + " of it, most without a discount."}
      right={<Btn onClick={() => dx.go("Finance", "wc")}>Working capital</Btn>}>
      <KpiRow n={4}>
        {SLOW_BANDS.map((b, i) => (
          <Kpi key={b.band} label={b.band} value={eur(b.value)} sub={num(b.skus) + " SKUs" + (i === 2 ? " · dead stock" : "")} tone={i === 2 ? "bad" : undefined} subTone={i === 2 ? "bad" : "warn"} />
        ))}
        <Kpi label="Potential working-capital release" value={eur(release)} sub={num(lines) + " lines · 7 actions"} tone="ok" subTone="ok" hero />
      </KpiRow>

      <Card title="The biggest lines in each band" sub={eur(lineValue) + " of stock across these eight, " + eur(lineRelease) + " releasable. Each has an action the owner can take today."} pad={false}>
        <Table cols={cols} rows={SLOW_LINES} onRow={r => dx.open("sku", r.sku)} rowTone={r => (r.days > 180 ? "bad" : undefined)} />
      </Card>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title={"Where the " + eur(release) + " comes from"} sub={num(lines) + " slow lines, each with one recommended action"}>
          <HBars items={SLOW_ACTIONS.map(([a, n, v]) => ({ label: a, value: v, note: n + " lines" }))} fmt={eur} />
          <div style={{ marginTop: 14 }}>
            <Strip fmt={eur} parts={SLOW_BANDS.map((b, i) => ({ label: b.band, value: b.value, tone: i === 0 ? "warn" : i === 1 ? "color-mix(in srgb,var(--warn) 50%,var(--bad))" : "bad" }))} />
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="What it costs to keep" sub="For the finance director">
            <Facts cols={2} items={[
              ["Share of inventory", pct((KPI.slowStock / KPI.inventory) * 100)],
              ["Carrying cost at 20% a year", eur(carrying) + " / yr", "warn"],
              ["Older than 120 days", eur(KPI.inventory120), "bad"],
              ["Release vs facility drawn", pct((release / CASH.facilityUsed) * 100, 0) + " of " + eurK(CASH.facilityUsed)],
            ]} />
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", marginTop: 12 }}>
              Carrying cost covers storage, insurance, capital and write-down risk: about {eur(Math.round(carrying / 12))} a month for stock that is barely selling.
              {" "}The {eur(release)} release is {pct((release / KPI.wcRelease) * 100, 0)} of the {eur(KPI.wcRelease)} working-capital plan.
            </div>
          </Card>
          <AiCard agent="Inventory Agent" title="Start with the three that need no discount"
            actions={<>
              <ActBtn id="slow-stop96" small kind="primary" label="Stop replenishment on 96 lines" done="Stopped on 96 lines" toast="Reorder points set to 0 on 96 lines with no demand in 180 days. Emma and Ciarán notified." />
              <Btn small onClick={() => dx.go("Finance", "wc")}>Working capital</Btn>
            </>}>
            Return the superseded impact drivers to Toolcraft ({eur(12090)}), offer the Naas cable tray to Horizon and Liffey ({eur(11030)}), and stop replenishing 96 lines with no demand ({eur(22400)}).
            {" "}That is {eur(12090 + 11030 + 22400)} of the {eur(release)} this week, before any promotion.
          </AiCard>
        </div>
      </Grid>
    </Page>
  );
}

/* ---------- Forecast ---------- */
const MON: Record<string, number> = { Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const daysAway = (d: string) => { const [dd, mm] = d.split(" "); return Math.round((Date.UTC(2026, MON[mm], Number(dd)) - Date.UTC(2026, 8, 25)) / 864e5); };
const HORIZON_END: Record<string, string> = { "7": "2 Oct", "30": "25 Oct", "60": "24 Nov", "90": "24 Dec" };
type FRow = (typeof FORECAST_TABLE)[number];
/* The EL-4408 7-day figure is read from the weekly series so the chart and the table agree. */
const F_ROWS: FRow[] = FORECAST_TABLE.map(r => (r.sku === "EL-4408" ? { ...r, d7: FORECAST_EL4408.projected[1] } : r));
const F_NOTE: Record<string, string> = {
  "SAF-3310": "Dublin runs out first, on 14 Oct. The 800 on PO-8826 landed in Naas, so the combined figure stays positive for longer.",
};

function Forecast() {
  const dx = useDx();
  const [h, setH] = useLocal("inv.fc.h", "30");
  const key = ("d" + h) as "d7" | "d30" | "d60" | "d90";
  const within = F_ROWS.filter(r => daysAway(r.stockout) <= Number(h));
  const shortUnits = F_ROWS.reduce((a, r) => a + Math.min(0, r[key]), 0);
  const first = F_ROWS.slice().sort((a, b) => daysAway(a.stockout) - daysAway(b.stockout))[0];
  const el = F_ROWS.find(r => r.sku === "EL-4408")!;
  const F = FORECAST_EL4408;
  const cols: Col<FRow>[] = [
    { k: "p", label: "Product", w: "1.8fr", render: r => <TwoLine top={<RecLink kind="sku" id={r.sku} />} bottom={product(r.sku).name} /> },
    { k: "now", label: "Free now", w: "0.75fr", align: "right", mono: true, render: r => num(product(r.sku).dub.avail) },
    { k: "proj", label: "At " + h + " days", w: "0.85fr", align: "right", mono: true, render: r => <b style={{ fontWeight: 600, color: r[key] < 0 ? "var(--bad)" : "var(--ink)" }}>{r[key] < 0 ? "−" + num(-r[key]) : num(r[key])}</b> },
    { k: "st", label: "In window", w: "1.05fr", render: r => (daysAway(r.stockout) <= Number(h) ? <Badge tone="bad">Stocks out</Badge> : <Badge tone="ok">Covered</Badge>) },
    { k: "so", label: "First stockout", w: "0.95fr", render: r => <TwoLine top={<span style={{ color: daysAway(r.stockout) <= 14 ? "var(--bad)" : undefined }}>{r.stockout}</span>} bottom={"in " + daysAway(r.stockout) + " days"} /> },
    { k: "n", label: "Driver", w: "2.8fr", render: r => <Wrap dim><Linked text={F_NOTE[r.sku] || r.note} /></Wrap> },
  ];
  const inputs: [string, string][] = [
    ["52-week sales history", "Weekly buckets per SKU and warehouse. EL-4408 sold 1,920 drums in the last 12 months; one-off project orders are taken out so they don't inflate the run rate."],
    ["Open orders", "Committed demand comes off first: for EL-4408, 68 drums short on 4 orders and 34 allocated."],
    ["Seasonality", "Last year's shape by category. Electrical rises through October; nitrile gloves rose 22% in the first three weeks of winter."],
    ["Open quotes", "Weighted by each rep's win rate on similar quotes. Three open quotes include FIX-1180 (€9,420)."],
    ["Supplier lead times", "Actual receipt dates, not catalogue lead times. Atlas quotes 28 days and hits it 71% of the time, so its dates carry a buffer."],
    ["When it re-runs", "Nightly after the 02:00 Sage sync, and whenever a PO date changes. Last run 09:14, after Atlas moved PO-8821."],
  ];
  return (
    <Page eyebrow="Inventory · Forecast" title="See the stockout before it happens"
      sub="Projected available stock against forecast demand, for the lines Pulse is watching. Change the window to see what runs out in 7, 30, 60 or 90 days."
      right={<Seg items={[["7", "7 days"], ["30", "30 days"], ["60", "60 days"], ["90", "90 days"]]} value={h} onChange={setH} />}>
      <KpiRow n={4}>
        <Kpi label={"Stocking out within " + h + " days"} value={within.length + " of " + F_ROWS.length} sub={"Window ends " + HORIZON_END[h]} tone={within.length ? "bad" : "ok"} />
        <Kpi label="First projected stockout" value={first.stockout} sub={first.sku + " · " + product(first.sku).name} subTone="bad" onClick={() => dx.open("sku", first.sku)} />
        <Kpi label={"EL-4408 at " + h + " days"} value={el[key] < 0 ? "−" + num(-el[key]) : num(el[key])} sub="Dublin, without a new PO" tone={el[key] < 0 ? "bad" : undefined} onClick={() => dx.open("sku", "EL-4408")} />
        <Kpi label={"Short at " + h + " days"} value={num(Math.abs(shortUnits)) + " units"} sub="Across the watched lines, if nothing is ordered" subTone={shortUnits < 0 ? "bad" : "ok"} />
      </KpiRow>

      <Card title={<><RecLink kind="sku" id="EL-4408" /> <span style={{ marginLeft: 6 }}>Industrial Cable 100m · Dublin</span></>}
        sub={<Linked text="Projected available, week by week for 13 weeks. PO-8821's 120 are counted on 26 Sep. Without a new PO Dublin goes negative in the week of 23 Oct." />}
        right={<Btn small onClick={() => dx.go("Inventory", "replenishment", { sku: "EL-4408" })}>Replenishment</Btn>}>
        <div style={{ paddingTop: 22 }}>
          <Lines h={240} zero labels={F.weeks} fmt={v => num(Math.round(v))} series={[
            { name: "With the recommended 160", data: F.withPO, tone: "accent", wash: true },
            { name: "Without a new PO", data: F.projected, tone: "bad" },
            { name: "Forecast demand per week", data: F.demand, muted: true },
          ]} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Facts cols={4} items={[
            ["Stockout without a PO", el.stockout, "bad"],
            ["Lowest point with the PO", Math.min(...F.withPO.slice(1)) + " on 20 Nov"],
            ["Forecast demand, 13 weeks", num(F.demand.reduce((a, b) => a + b, 0)) + " drums"],
            ["Short by 18 Dec without it", num(-F.projected[F.projected.length - 1]) + " drums", "bad"],
          ]} />
        </div>
      </Card>

      <Card title={"Projected position at " + h + " days"} sub="Watched lines, soonest stockout first. Free now is Dublin; first stockout is the date the first warehouse runs out." style={{ marginTop: 14 }} pad={false}
        right={<Btn small kind="quiet" onClick={() => dx.go("Inventory", "replenishment")}>Replenishment</Btn>}>
        <Table cols={cols} rows={F_ROWS.slice().sort((a, b) => daysAway(a.stockout) - daysAway(b.stockout))} onRow={r => dx.open("sku", r.sku)}
          rowTone={r => (daysAway(r.stockout) <= Number(h) ? "bad" : undefined)} />
      </Card>

      <Card title="How this forecast is built" sub="A statistical model with its inputs on show, so a buyer can see why and overrule it" style={{ marginTop: 14 }}>
        <Grid cols="repeat(3,minmax(0,1fr))" gap={12}>
          {inputs.map(([k, v]) => (
            <div key={k} className="dx-fact" style={{ padding: "13px 15px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{k}</div>
              <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 5, lineHeight: 1.55 }}><Linked text={v} /></div>
            </div>
          ))}
        </Grid>
        <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 14, lineHeight: 1.55 }}>
          It will be out by some margin every week. The job is to flag the lines where being out matters, early enough to do something. It never places an order on its own.
        </div>
      </Card>
    </Page>
  );
}

/* ---------- Transfers ---------- */
const coverD = (free: number, d7: number) => {
  if (d7 <= 0) return "No demand";
  const days = (free * 7) / d7;
  if (days === 0) return "0 days";
  return days < 14 ? days.toFixed(1) + " days" : (days / 7).toFixed(1) + " weeks";
};

function Transfers() {
  const dx = useDx();
  const t = TRANSFER_EL4408;
  const ok = !!dx.acted["d-transfer"];
  const trAct = (r: Transfer) => (r.id === "TR-2291" ? "d-transfer" : "tr-" + r.id);
  const trDone = (r: Transfer) => (r.id === "TR-2291" ? "Transfer TR-2291 approved" : r.id + " approved");
  const trToast: Record<string, string> = {
    "TR-2291": "TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van. Liam and Aoife notified.",
    "TR-2292": "TR-2292 approved: 600 × SAF-1892 Naas → Dublin. SafePro's October PO flagged for cancellation.",
    "TR-2293": "TR-2293 approved: 80 × EL-3102 Naas → Dublin.",
    "TR-2294": "TR-2294 approved: 30 × EL-4521 on the 11:00 Naas van for tomorrow's AM routes.",
  };
  /* Recommended rows carry the approve button; once approved (here, on Home or in the drawer) they show a short badge. */
  const statusCell = (r: Transfer) => {
    if (r.status === "Recommended") return dx.acted[trAct(r)] ? <Badge tone="ok">Approved</Badge>
      : <ActBtn id={trAct(r)} small kind={r.id === "TR-2291" ? "primary" : "ghost"} label="Approve" done={trDone(r)} toast={trToast[r.id]} />;
    const [st, ...rest] = r.status.split(/ · | (?=\d)/);
    return <TwoLine top={<Badge tone={st.startsWith("In transit") ? "warn" : "ok"}>{st}</Badge>} bottom={rest.join(" ")} />;
  };
  const cols: Col<Transfer>[] = [
    { k: "sku", label: "Transfer", w: "1.6fr", render: r => <TwoLine top={<><b style={{ fontWeight: 600 }}>{r.id}</b> · <RecLink kind="sku" id={r.sku} /></>} bottom={product(r.sku).name} /> },
    { k: "q", label: "Move", w: "0.95fr", render: r => <TwoLine top={<span className="dx-num" style={{ fontWeight: 500 }}>{num(r.qty)}</span>} bottom={r.from + " → " + r.to} /> },
    { k: "why", label: "Why", w: "2.6fr", render: r => <Wrap dim><Linked text={r.why} /></Wrap> },
    { k: "pr", label: "Protects", w: "1.3fr", render: r => <Wrap>{r.protects}</Wrap> },
    { k: "v", label: "Value", w: "0.75fr", align: "right", mono: true, render: r => eur(r.value) },
    { k: "st", label: "Status", w: "1.1fr", render: statusCell },
  ];
  type Bal = { sku: string; dFree: number; dNeed: number; nFree: number; nNeed: number; qty: number; id: string };
  const bal: Bal[] = TRANSFERS.filter(r => r.status === "Recommended").map(r => {
    const p = product(r.sku);
    const is4408 = r.sku === "EL-4408";
    return { sku: r.sku, id: r.id, qty: r.qty, dFree: is4408 ? t.dubAvail : p.dub.avail, dNeed: is4408 ? t.dubDemand7 : p.wkDemand, nFree: is4408 ? t.nasAvail : p.nas.avail, nNeed: is4408 ? t.nasDemand7 : p.wkDemandNas };
  });
  /* Cover now → after the transfer, with the free stock and 7-day need underneath. Red is under a week. */
  const coverCell = (free: number, after: number, need: number) => {
    const tone = (f: number) => ((f * 7) / Math.max(1, need) < 7 ? "var(--bad)" : undefined);
    return <TwoLine top={<><span style={{ color: tone(free) }}>{coverD(free, need)}</span><span className="dx-faint"> → </span><b style={{ fontWeight: 600, color: tone(after) }}>{coverD(after, need)}</b></>}
      bottom={num(free) + " free → " + num(after) + " · need " + num(need) + " in 7 days"} />;
  };
  const balCols: Col<Bal>[] = [
    { k: "p", label: "Product", w: "1.15fr", render: r => <TwoLine top={<RecLink kind="sku" id={r.sku} />} bottom={r.id + " · move " + num(r.qty)} /> },
    { k: "dc", label: "Dublin cover, now → after", w: "1.9fr", render: r => coverCell(r.dFree, r.dFree + r.qty, r.dNeed) },
    { k: "nc", label: "Naas cover, now → after", w: "1.9fr", render: r => coverCell(r.nFree, r.nFree - r.qty, r.nNeed) },
  ];
  const sub = product(SUBSTITUTE.sub), orig = product(SUBSTITUTE.orig);
  return (
    <Page eyebrow="Inventory · Transfers" title="Move stock before you buy more of it"
      sub="Dublin and Naas balanced against the next seven days of demand. A shuttle run costs less than a stockout, and a transfer costs less than a purchase order.">
      <Card tone={ok ? undefined : "accent"} pad={false}>
        <div style={{ padding: "18px 20px 0", display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone={ok ? "ok" : "accent"} dot>{ok ? "APPROVED" : "RECOMMENDED"}</Badge>
              <span className="dx-faint" style={{ fontSize: 12 }}>TR-2291 · Inventory Agent · decide by 10:30</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.6px", marginTop: 10 }}>Transfer {t.qty} units Naas → Dublin</div>
            <div style={{ fontSize: 13.5, color: "var(--dim)", marginTop: 4 }}><RecLink kind="sku" id={t.sku} /> {product(t.sku).name} · {t.shuttle}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActBtn id="d-transfer" kind="primary" label="Approve Transfer" done="Transfer TR-2291 approved" toast="TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van. Liam and Aoife notified." />
            <Btn kind="quiet" onClick={() => dx.open("sku", t.sku)}>Open EL-4408</Btn>
          </div>
        </div>
        <div style={{ padding: "16px 20px 0" }}>
          <Facts cols={4} items={[
            ["Dublin available", String(t.dubAvail), "bad"], ["Naas available", String(t.nasAvail), "ok"],
            ["Dublin demand, next 7 days", String(t.dubDemand7)], ["Naas demand, next 7 days", String(t.nasDemand7)],
            ["Estimated stockouts avoided", String(t.stockouts), "ok"], ["Orders protected", String(t.orders.length)],
            ["Value protected", eur(t.value), "ok"], ["After transfer", "Dublin " + (t.dubAvail + t.qty) + " · Naas " + (t.nasAvail - t.qty)],
          ]} />
        </div>
        <Grid cols="minmax(0,4fr) minmax(0,8fr)" gap={16} style={{ padding: "16px 20px 18px" }}>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--body)" }}>
            <div style={{ marginBottom: 8 }}>
              Protects {t.orders.map((o, i) => {
                const so = order(o);
                const q = (SKU_DEMAND[t.sku] || []).find(d => d.so === o)?.qty;
                return <span key={o}>{i ? ", " : ""}<RecLink kind="order" id={o} /> {customer(so.cust).name} ({q})</span>;
              })}.
            </div>
            <div className="dx-muted">{t.freeNote}</div>
            <div className="dx-muted" style={{ marginTop: 6 }}>{t.murphyNote}</div>
          </div>
          <Chain dir="across" steps={[
            { k: "Approve by 10:30", v: ok ? "Approved" : "Liam Murphy", sub: ok ? "Naas pick released" : "Waiting", tone: ok ? "ok" : "warn", icon: ok ? IC.check : IC.clock },
            { k: "Naas pick", v: "40 drums", sub: "Aoife Brennan's team, by 10:45", tone: ok ? "accent" : undefined },
            { k: "Shuttle", v: "Naas 11:00 → Dublin 11:45", sub: "Booked in by Kevin Brady, allocated to 3 orders", icon: IC.truck },
            { k: "Out on D14", v: "13:45", sub: <Linked text="SO-10497 today. SO-10509 and SO-10526 on tomorrow's first routes." />, onClick: () => dx.open("route", "D14") },
          ]} />
        </Grid>
      </Card>

      <Card title="Transfers" sub={TRANSFERS.filter(r => r.status === "Recommended").length + " recommended, 1 in transit, 1 completed. Every one is scored against the next seven days of demand in both warehouses."} style={{ marginTop: 14 }} pad={false}>
        <Table cols={cols} rows={TRANSFERS} onRow={r => dx.open("sku", r.sku)} rowTone={r => (r.sku === dx.rec.sku && r.status === "Recommended" ? "accent" : undefined)} />
      </Card>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 14 }}>
        <Card title="Dublin and Naas, before and after" sub="Cover at next-7-day demand for each recommended transfer. Red is under a week." pad={false}>
          <Table cols={balCols} rows={bal} onRow={r => dx.open("sku", r.sku)} />
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}>
            <Linked text="EL-4521 leaves Naas thin for a day. PO-8821 lands in Dublin on 26 Sep with 300, and the next shuttle refills Naas." />
          </div>
        </Card>
        <Card title="Substitute product" sub={orig.name + " → " + sub.name}>
          <Facts cols={2} items={[
            ["Original", <RecLink kind="sku" id={SUBSTITUTE.orig} />], ["Unavailable qty", <span style={{ color: "var(--bad)" }}>{SUBSTITUTE.unavailable} on <RecLink kind="order" id="SO-10482" /></span>],
            ["Substitute", <RecLink kind="sku" id={SUBSTITUTE.sub} />], ["Available", String(SUBSTITUTE.available) + " in Dublin", "ok"],
            ["Price difference", "+" + eur(SUBSTITUTE.priceDiff, 2) + " / unit"], ["Compatibility", SUBSTITUTE.compat, "ok"],
            ["Margin on substitute", pct(SUBSTITUTE.margin), "ok"], ["Cost to Murphy", "+" + eur(SUBSTITUTE.unavailable * SUBSTITUTE.priceDiff, 2)],
          ]} />
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--body)", marginTop: 12 }}>
            {SUBSTITUTE.note} It clears one of <RecLink kind="order" id="SO-10482" />'s three short lines. <Linked text="The EL-4521 glands and IC-2290 cable ties still wait for PO-8821 and TR-2288." />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <ActBtn id="sub-el4412" kind="primary" small label="Offer Substitute" done="Substitute offered to Murphy" toast="Substitute offer sent to Gerry Murphy: 28 × EL-4412 at +€8.40/unit, held for 24 hours." />
            <Btn small kind="quiet" onClick={() => dx.go("Orders", "detail", { order: "SO-10482" })}>Open SO-10482</Btn>
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = {
  overview: Overview, stock: Stock, availability: Availability, replenishment: Replenishment, slow: SlowDead, forecast: Forecast, transfers: Transfers,
};
