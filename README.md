# Pulse · Consulting DISTRIBUTION.ie

A clickable demo of Pulse as the control tower for an Irish B2B wholesale distributor: two warehouses (Dublin, Naas), 18 vehicles, 8,426 SKUs, 437 accounts, 64 suppliers, €1.28m a month. Frontend only, mock data only.

Built on the **Pulse v5 Harbour** design from Claude Design. The shell (rail, sub-page pill, ⌘K palette, agents, chat, work, activity, settings, themes) is Pulse's own; the distribution modules are added on top of it.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## The demo journey

1. **Home → Command Centre**: morning briefing, attention queue, decisions.
2. **Murphy Building Supplies, SO-10482** (Orders → Order Detail): why it's at risk, the full customer-to-delivery chain.
3. **Atlas PO-8821** (click it anywhere): the late supplier and every order it touches.
4. **Inventory**: EL-4408's projected stockout, the Naas → Dublin transfer, the reorder.
5. **Warehouse**: the effect on picking and the D14 dispatch.
6. **Delivery**: route D14 and OTIF.
7. **Customers → Customer Detail**: the whole Murphy relationship.
8. **Pricing & Margin**: where margin leaks (O'Brien QT-2841, the EuroFix cost increase).
9. **Finance**: working capital and the Doyle Construction credit hold.
10. **Agents → Chat**: ask "What do I need to fix today?"

## Where things are

| Area | Where |
| --- | --- |
| The mock database (every number on every page) | `src/dist/db.ts` |
| Modules and their pages (the rail and the pill nav) | `src/dist/modules.ts` |
| Distribution pages | `src/dist/pages/*.tsx` |
| UI kit: cards, KPIs, tables, charts, record links, the chain | `src/dist/ui.tsx`, `src/dist/dist.css` |
| Record drawer (product, PO, supplier, route, quote) | `src/dist/Drawers.tsx` |
| Pulse's own pages: Executive Dashboard, Work, Agents, Chat, Activity, Settings | `src/views/`, state in `src/logic/PulseLogic.js`, content in `src/logic/data.js` |
| Theme tokens (Harbour carries the distribution blue) | `src/styles/pulse.css` |

## How it fits together

- **`PulseLogic`** holds all state and returns one flat object `v` from `renderVals()`. It also routes the distribution modules: `dgo(module, sub, record)`, `dopen(kind, id)` for the drawer and `dact(id, done, toast)` for decisions.
- **`src/dist/DistRoot.tsx`** renders the distribution page for the current module and sub-page; pages read `useDx()` for navigation and decision state.
- Every record id on screen is a `RecLink`, so an order opens the order, a SKU opens the product, a PO opens the purchase order, and so on in both directions.

## Updating from Claude Design

`npm run import-design` regenerates `src/views/`, `src/styles/` and `src/logic/` from the export in `design/`. That overwrites the distribution wiring and content in those folders, so commit first and re-apply afterwards. `src/dist/` is never touched by the import.
