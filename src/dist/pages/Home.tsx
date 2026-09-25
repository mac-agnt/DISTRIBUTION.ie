import type { ComponentType, ReactNode } from "react";
import { ACTIVITY, ALERTS, DECISIONS, KPI, SYSTEMS, TODAY, ORDERS, AT_RISK_TODAY, customer, eur, eurK, pct, who } from "../db";
import { ActBtn, AiCard, Avatar, Badge, Btn, Card, Grid, Icon, IC, Kpi, KpiRow, Page, RecLink, Ripple, useDx, type Tone } from "../ui";

const sevTone = (s: string): Tone => (s === "CRITICAL" ? "bad" : s === "HIGH" ? "warn" : "accent");

/* Turns record ids inside briefing text into links. */
function Linked({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(SO-\d{5}|PO-\d{4}|QT-\d{4}|EL-\d{4}|FIX-\d{4})/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    parts.push(text.slice(last, m.index));
    const id = m[0];
    const kind = id.startsWith("SO") ? "order" : id.startsWith("PO") ? "po" : id.startsWith("QT") ? "quote" : "sku";
    parts.push(<RecLink key={m.index} kind={kind as any} id={id} />);
    last = m.index + id.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

function CommandCentre() {
  const dx = useDx();
  const decided = DECISIONS.filter(d => dx.acted[d.id]).length;
  const handled = ACTIVITY.filter(a => a.kind === "agent");
  return (
    <Page
      eyebrow={TODAY.long + " · " + TODAY.time}
      title="Good morning, Patrick."
      sub="Here's what needs your attention across the distribution network today."
      right={<>
        <Btn kind="ghost" icon={IC.chat} onClick={() => dx.ask("What do I need to fix today?")}>Ask Briefing Agent</Btn>
        <Btn kind="quiet" onClick={() => dx.go("Home", "exec")}>Executive Dashboard</Btn>
      </>}>
      <KpiRow n={6}>
        <Kpi label="Revenue MTD" value={eur(KPI.revenueMTD)} sub={KPI.revenueDelta + " vs same period last month"} subTone="ok" onClick={() => dx.go("Finance", "revenue")} />
        <Kpi label="Gross Margin" value={pct(KPI.grossMargin)} sub={"Target " + pct(KPI.marginTarget)} subTone="warn" onClick={() => dx.go("Pricing", "margin")} />
        <Kpi label="Orders Today" value={String(KPI.ordersToday)} sub={eur(KPI.ordersTodayValue) + " value"} onClick={() => dx.go("Orders", "live")} />
        <Kpi label="OTIF" value={pct(KPI.otif)} sub={"Target " + pct(KPI.otifTarget)} subTone="warn" onClick={() => dx.go("Delivery", "otif")} />
        <Kpi label="Inventory" value={eurK(KPI.inventory)} sub={eurK(KPI.slowStock) + " slow-moving"} subTone="warn" onClick={() => dx.go("Inventory", "overview")} />
        <Kpi label="Backorders" value={String(KPI.backorders)} sub={eur(KPI.backorderValue) + " revenue affected"} subTone="bad" onClick={() => dx.go("Orders", "backorders")} />
      </KpiRow>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14}>
        <div className="dx-ai dx-brief" style={{ animation: "riseIn .5s var(--ease) both" }}>
          <div className="dx-ai-head" style={{ padding: "18px 22px 0" }}>
            <span className="dx-ai-mark"><Icon d={IC.spark} s={13} w={2} /></span>
            <span className="dx-ai-title" style={{ fontSize: 15 }}>Morning briefing</span>
            <span className="dx-ai-agent">Briefing Agent · 08:03</span>
          </div>
          <div style={{ padding: "12px 22px 6px", display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              "94 orders worth €176,420 are scheduled today. There are 7 orders at risk, representing €46,280 revenue.",
              "The largest issue is Murphy Building Supplies order SO-10482 (€27,640). Three items are short because PO-8821 from Atlas Industrial Supplies is five days late. A partial delivery can be made today. The remaining products are expected tomorrow at 10:30.",
              "Gross margin is currently 23.8%, 1.2 points below target. Most of the gap comes from the Industrial Consumables category and three customer-specific price agreements that have not been updated following supplier cost increases. I've identified €18,600 annualised margin recovery opportunity across these accounts.",
              "Inventory contains approximately €286,000 in slow-moving stock. €74,200 has had no movement in more than 180 days.",
            ].map((t, i) => (
              <p key={i} style={{ margin: 0, fontSize: i === 0 ? 17 : 14.5, lineHeight: 1.6, color: i === 0 ? "var(--ink)" : "var(--body)", fontWeight: i === 0 ? 500 : 400, letterSpacing: i === 0 ? "-.2px" : 0 }}>
                <Linked text={t} />
              </p>
            ))}
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink)", fontWeight: 500 }}>
              {3 - Math.min(3, decided)} decision{3 - Math.min(3, decided) === 1 ? "" : "s"} require approval.
            </p>
          </div>
          <div className="dx-ai-actions" style={{ padding: "10px 22px 20px" }}>
            <Btn kind="primary" onClick={() => dx.go("Orders", "risk")}>Review At-Risk Orders</Btn>
            <Btn onClick={() => dx.go("Pricing", "margin")}>Review Margin</Btn>
            <Btn onClick={() => document.getElementById("dx-decisions")?.scrollIntoView({ behavior: "smooth", block: "start" })}>View Decisions</Btn>
          </div>
        </div>

        <Card title="Today's operation" sub="Live across Dublin and Naas" pad={false}>
          <div className="dx-list">
            {[
              { k: "Orders to pick", v: "94 · 1,284 lines", s: "48 done · 26 picking · 14 waiting · 6 urgent", tone: "accent" as Tone, go: () => dx.go("Warehouse", "board") },
              { k: "Deliveries", v: "34 of 76 delivered", s: "28 in transit · 14 awaiting dispatch · 7 at risk", tone: "warn" as Tone, go: () => dx.go("Delivery", "today") },
              { k: "Goods in", v: "7 deliveries · 246 pallets", s: "€148,000 of stock · PO-8821 is not among them", tone: "neutral" as Tone, go: () => dx.go("Warehouse", "goodsin") },
              { k: "At risk on today's dispatch", v: AT_RISK_TODAY.length + " orders · " + eur(KPI.atRiskTodayValue), s: AT_RISK_TODAY.slice(0, 3).map(id => customer(ORDERS.find(o => o.id === id)!.cust).name.split(" ")[0]).join(", ") + " and 4 more", tone: "bad" as Tone, go: () => dx.go("Orders", "risk") },
              { k: "Credit holds", v: KPI.creditHolds + " orders held", s: "Doyle Construction is the largest at €16,240", tone: "warn" as Tone, go: () => dx.go("Finance", "credit") },
            ].map((r, i) => (
              <div key={i} className="dx-li dx-click" onClick={r.go} style={{ borderTop: i ? undefined : 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, marginTop: 6, flex: "none", background: r.tone === "neutral" ? "var(--neutral)" : `var(--${r.tone === "accent" ? "accent" : r.tone})` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--faint)" }}>{r.k}</div>
                  <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>{r.v}</div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3 }}>{r.s}</div>
                </div>
                <span style={{ color: "var(--faint)", marginTop: 12 }}><Icon d={IC.chev} s={14} /></span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <div className="dx-section">
        <div className="dx-section-head"><div className="dx-section-title">Attention required</div><span className="dx-faint" style={{ fontSize: 12.5 }}>Sorted by revenue at stake</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 12 }} className="dx-alerts">
          {ALERTS.map((a, i) => (
            <div key={i} className={"dx-card dx-click dx-tone-" + sevTone(a.sev)} onClick={() => dx.go(a.go[0], a.go[1], a.go[2])} style={{ padding: "15px 16px 14px", display: "flex", flexDirection: "column", animationDelay: i * 50 + "ms" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone={sevTone(a.sev)} dot>{a.sev}</Badge>
                <span style={{ fontSize: 11.5, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.kind}</span>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 12, letterSpacing: "-.2px" }}>{a.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--accent)", marginTop: 2, fontWeight: 500 }}>{a.ref}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 10, flex: 1 }}>
                {a.lines.map((l, j) => <div key={j} style={{ fontSize: 12.5, color: j === 0 ? "var(--ink)" : "var(--dim)" }}>{l}</div>)}
              </div>
              <div style={{ marginTop: 14 }}><Btn small kind={a.sev === "CRITICAL" ? "primary" : "ghost"} onClick={() => dx.go(a.go[0], a.go[1], a.go[2])}>{a.cta}</Btn></div>
            </div>
          ))}
        </div>
      </div>

      <div className="dx-section" id="dx-decisions" style={{ scrollMarginTop: 20 }}>
        <div className="dx-section-head">
          <div className="dx-section-title">Decisions</div>
          <span className="dx-faint" style={{ fontSize: 12.5 }}>{DECISIONS.filter(d => d.needsYou && !dx.acted[d.id]).length} waiting on you · {decided} decided today</span>
          <Btn small kind="quiet" onClick={() => dx.go("Work", "approvals")}>All approvals</Btn>
        </div>
        <Grid cols="repeat(2,minmax(0,1fr))" gap={12}>
          {DECISIONS.map(d => (
            <Card key={d.id} tone={dx.acted[d.id] ? undefined : d.needsYou ? "accent" : undefined} pad={false}>
              <div style={{ padding: "16px 18px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge tone="neutral">{d.area}</Badge>
                    <span style={{ fontSize: 12, color: d.deadline.includes("09:30") || d.deadline.includes("10:00") ? "var(--warn)" : "var(--dim)", display: "inline-flex", gap: 5, alignItems: "center" }}><Icon d={IC.clock} s={12} />{d.deadline}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 10, letterSpacing: "-.2px", lineHeight: 1.35 }}>{d.title}</div>
                  <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 3 }}>{d.who}</div>
                </div>
                <Avatar id={d.owner} size={28} />
              </div>
              <div style={{ padding: "12px 18px 0", display: "grid", gridTemplateColumns: "88px 1fr", gap: "7px 12px", fontSize: 13, lineHeight: 1.5 }}>
                <span className="dx-faint">Impact</span><span style={{ color: "var(--ink)" }}>{d.impact}</span>
                <span className="dx-faint">Why</span><span style={{ color: "var(--body)" }}>{d.reason}</span>
                <span className="dx-faint">Pulse says</span><span style={{ color: "var(--accent)" }}>{d.rec}</span>
                <span className="dx-faint">Owner</span><span style={{ color: "var(--body)" }}>{who(d.owner).name}{d.needsYou ? "" : " · within their authority"}</span>
              </div>
              <div style={{ display: "flex", gap: 8, padding: "14px 18px 16px", flexWrap: "wrap" }}>
                <ActBtn id={d.id} kind="primary" small label={d.id === "d-credit" ? "Release €7,320" : d.id === "d-quote" ? "Counter at 21.5%" : "Approve"}
                  done={d.id === "d-credit" ? "€7,320 released" : d.id === "d-quote" ? "Countered at 21.5%" : "Approved"}
                  toast={d.id === "d-credit" ? "SO-10503 part-released: €7,320 against available credit. Payment request for INV-28482 sent to Kieran Doyle."
                    : d.id === "d-quote" ? "QT-2841 revised to 21.5% and sent to David Kelly to present."
                    : d.id === "d-expedite" ? "PO-8821 expedited: Atlas dedicated van, €420, lands 06:30 tomorrow."
                    : "TR-2291 approved: 40 × EL-4408 on the 11:00 Naas van."} />
                <Btn small kind="quiet" onClick={() => dx.go(d.go[0], d.go[1], d.go[2])}>Open</Btn>
              </div>
            </Card>
          ))}
        </Grid>
      </div>

      <div className="dx-section">
        <div className="dx-section-head"><div className="dx-section-title">One late supplier, followed all the way through</div></div>
        <Card>
          <Ripple source={{ k: "Atlas Industrial Supplies · 09:04", v: "PO-8821 moved to 26 Sep 10:30", tone: "bad" }} targets={[
            { k: "Purchase order", v: "PO-8821 · €38,640 · 14 SKUs · 5 days late", onClick: () => dx.open("po", "PO-8821") },
            { k: "Inventory", v: "EL-4408 at 12 free in Dublin · 2.6 days cover", tone: "bad", onClick: () => dx.open("sku", "EL-4408") },
            { k: "Backorders", v: "6 customer orders · 8 lines waiting", onClick: () => dx.go("Orders", "backorders") },
            { k: "Customers", v: "Murphy, Horizon, Quinlan, Leinster, Grange, Kildare", onClick: () => dx.go("Customers", "detail", { cust: "murphy" }) },
            { k: "Warehouse", v: "D14 held for SO-10482 · cutoff 13:30", onClick: () => dx.go("Warehouse", "board") },
            { k: "Revenue at risk", v: "€41,880 across the six orders", tone: "bad", onClick: () => dx.go("Orders", "risk") },
          ]} />
        </Card>
      </div>

      <Grid cols="minmax(0,7fr) minmax(0,5fr)" gap={14} style={{ marginTop: 26 }}>
        <Card title="What changed this morning" sub="People, agents and systems, newest first" right={<Btn small kind="quiet" onClick={() => dx.go("Activity", "all")}>Everything</Btn>} pad={false}>
          <div className="dx-list">
            {ACTIVITY.slice(0, 10).map((a, i) => (
              <div key={i} className={"dx-li" + (a.go ? " dx-click" : "")} onClick={a.go ? () => dx.go(a.go![0], a.go![1], a.go![2]) : undefined}>
                <span className="dx-num" style={{ fontSize: 12, color: "var(--faint)", width: 38, flex: "none", paddingTop: 1 }}>{a.t}</span>
                <span style={{ flex: "none", marginTop: 2 }}><Badge tone={a.kind === "agent" ? "accent" : a.kind === "person" ? "ok" : "neutral"}>{a.kind === "agent" ? "Agent" : a.kind === "person" ? "Person" : "System"}</Badge></span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{a.actor}</span> <span style={{ color: "var(--body)" }}>{a.text.charAt(0).toLowerCase() + a.text.slice(1)}</span>
                </div>
                {a.attention && <Badge tone="warn">Needs attention</Badge>}
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AiCard agent={handled.length + " agent actions since 07:00"} title="Already handled for you">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5 }}>
              {[
                ["Credit Agent", "held SO-10503 before it reached the pick queue"],
                ["Dispatch Agent", "caught D11 340kg over weight before it left the yard"],
                ["Margin Agent", "matched 428 supplier price changes to 37 customer agreements"],
                ["Purchasing Agent", "flagged Atlas's second missed date and told Emma at 07:30"],
                ["Inventory Agent", "found 64 units of EL-4408 sitting in Naas"],
              ].map(([a, t], i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--ok)", marginTop: 2 }}><Icon d={IC.check} s={13} w={2.2} /></span><span><b style={{ fontWeight: 600 }}>{a}</b> {t}</span></div>
              ))}
            </div>
          </AiCard>
          <Card title="Connected systems" sub="Pulse reads these. It doesn't replace them." right={<Btn small kind="quiet" onClick={() => dx.go("Activity", "systems")}>Events</Btn>} pad={false}>
            <div className="dx-list">
              {SYSTEMS.slice(0, 6).map((s, i) => (
                <div key={i} className="dx-li" style={{ padding: "10px 20px", borderTop: i ? undefined : 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: s.status === "Connected" ? "var(--ok)" : "var(--warn)", marginTop: 6, flex: "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name} <span className="dx-faint" style={{ fontWeight: 400 }}>· {s.kind}</span></div>
                    <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{s.last}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

export const PAGES: Record<string, ComponentType> = { command: CommandCentre };
