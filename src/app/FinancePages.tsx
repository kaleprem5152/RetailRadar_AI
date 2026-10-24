import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  BookmarkPlus, CheckCircle2, Trash2,
} from "lucide-react";
import { Badge, Button, Field, MoneyInput, Panel, PanelHeader } from "../components/ui";
import { AnalysisFrame } from "./AnalysisPages";
import { useApp } from "../store/AppStore";
import { FINANCE_FIELDS, computeFeasibility } from "../lib/finance";
import { cn, fmtDate, fmtINR, fmtINRCompact, uid } from "../lib/utils";
import type { Analysis, FinancialAssumptions, Scenario } from "../lib/types";

/* ── Financial Feasibility Workspace ───────────────────────── */
export function FinancialsPage() {
  return (
    <AnalysisFrame
      title="Financial Decision Model & Feasibility"
      desc="Unit economics, contribution margins, break-even thresholds, and multi-factor rent/pricing sensitivity."
    >
      {(a) => <FinancialsBody a={a} />}
    </AnalysisFrame>
  );
}

function FinancialsBody({ a }: { a: Analysis }) {
  const [params] = useSearchParams();
  const { updateFinancials } = useApp();
  const [locId, setLocId] = useState(params.get("loc") ?? a.locations[0]?.id ?? "");
  const loc = a.locations.find((l) => l.id === locId) ?? a.locations[0];
  const [savedFlash, setSavedFlash] = useState(false);

  const feas = useMemo(
    () => (loc ? computeFeasibility(loc.financials, a.profile.targetDailySales) : null),
    [loc, a.profile.targetDailySales]
  );

  const chartData = useMemo(() => {
    if (!loc) return [];
    const max = Math.max(a.profile.targetDailySales * 1.8, isFinite(feas!.breakEvenDaily) ? feas!.breakEvenDaily * 1.5 : 120);
    const pts = [];
    const step = Math.max(2, Math.round(max / 30));
    for (let d = 0; d <= max; d += step) {
      const rev = d * loc.financials.avgPrice * loc.financials.operatingDays;
      const varCost = d * loc.financials.variableCost * loc.financials.operatingDays;
      const fixedCost = (feas?.fixedMonthly || 0);
      const totalCost = fixedCost + varCost;
      const profit = rev - totalCost;
      pts.push({
        orders: d,
        revenue: Math.round(rev),
        totalCost: Math.round(totalCost),
        fixedCost: Math.round(fixedCost),
        profit: Math.round(profit),
      });
    }
    return pts;
  }, [loc, a.profile.targetDailySales, feas]);

  // Sensitivity Matrix Calculations (-20%, -10%, Base, +10%, +20% Rent vs -15%, Base, +15% Ticket)
  const sensitivityMatrix = useMemo(() => {
    if (!loc) return [];
    const rentMultipliers = [0.8, 0.9, 1.0, 1.1, 1.2];
    const ticketMultipliers = [0.85, 1.0, 1.15];

    return rentMultipliers.map((rMul) => {
      const rent = Math.round(loc.financials.rentMonthly * rMul);
      const cols = ticketMultipliers.map((tMul) => {
        const avgPrice = Math.round(loc.financials.avgPrice * tMul);
        const cm = avgPrice - loc.financials.variableCost;
        if (cm <= 0) return { breakEvenDaily: Infinity, rent, avgPrice };
        const otherFixed =
          loc.financials.salariesMonthly +
          loc.financials.utilitiesMonthly +
          loc.financials.marketingMonthly +
          loc.financials.otherFixedMonthly;
        const totalFixed = rent + otherFixed;
        const beMonthly = totalFixed / cm;
        const beDaily = Math.ceil(beMonthly / loc.financials.operatingDays);
        return { breakEvenDaily: beDaily, rent, avgPrice };
      });
      return { rMul, rent, cols };
    });
  }, [loc]);

  if (!loc || !feas) {
    return <Panel className="py-14 text-center text-[13px] text-bone-400">Add a candidate location to model its finances.</Panel>;
  }

  const commit = (patch: Partial<FinancialAssumptions>) => {
    updateFinancials(a.id, loc.id, patch);
    setSavedFlash(true);
    window.clearTimeout((commit as { _t?: number })._t);
    (commit as { _t?: number })._t = window.setTimeout(() => setSavedFlash(false), 1200);
  };

  const isSafe = feas.marginOfSafetyPct >= 15;
  const isTight = feas.marginOfSafetyPct >= 0 && feas.marginOfSafetyPct < 15;

  return (
    <div className="space-y-6">
      {/* ── Top Location Switcher & Save Feedback ─────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-bone-500 mr-1">Active Site:</span>
          {a.locations.map((l, idx) => (
            <button
              key={l.id}
              onClick={() => setLocId(l.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-all",
                l.id === loc.id
                  ? "border-brass-500/60 bg-brass-500/15 text-brass-300 shadow-sm"
                  : "border-line bg-ink-850 text-bone-400 hover:text-bone-100"
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-brass-500/30 font-mono text-[9.5px] font-bold text-brass-300">
                {idx + 1}
              </span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>

        <span className={cn("text-[12px] font-mono transition-opacity flex items-center gap-1.5", savedFlash ? "text-sage-300 opacity-100" : "opacity-0")}>
          <CheckCircle2 size={13} />
          <span>Autosaved to database</span>
        </span>
      </div>

      {/* ── Executive Decision Metrics Strip ─────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-4 border-brass-500/25">
          <span className="text-[10px] uppercase font-mono tracking-wider text-bone-500">Daily Break-Even Requirement</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-[24px] font-bold font-mono", isSafe ? "text-sage-300" : isTight ? "text-brass-300" : "text-ember-300")}>
              {isFinite(feas.breakEvenDaily) ? `${feas.breakEvenDaily}` : "Unreachable"}
            </span>
            <span className="text-[12px] text-bone-400 font-mono">orders / day</span>
          </div>
          <span className="block mt-1 text-[11px] text-bone-500">
            Target: {a.profile.targetDailySales} orders ({loc.financials.operatingDays} days/mo)
          </span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-bone-500">Margin of Safety</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-[24px] font-bold font-mono", isSafe ? "text-sage-300" : isTight ? "text-brass-300" : "text-ember-300")}>
              {feas.marginOfSafetyPct.toFixed(1)}%
            </span>
          </div>
          <span className="block mt-1 text-[11px] text-bone-500">
            {isSafe ? "Healthy buffer above break-even" : isTight ? "Tight operating buffer" : "Deficit at declared target"}
          </span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-bone-500">Monthly Net Profit (at Target)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-[24px] font-bold font-mono", feas.monthlyProfitAtTarget > 0 ? "text-bone-100" : "text-ember-300")}>
              {fmtINR(feas.monthlyProfitAtTarget)}
            </span>
          </div>
          <span className="block mt-1 text-[11px] text-bone-500">
            Revenue: {fmtINR(feas.monthlyRevenueAtTarget)}
          </span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-bone-500">Capital Outlay & Payback</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-bone-100">
              {fmtINRCompact(feas.startupCash)}
            </span>
          </div>
          <span className="block mt-1 text-[11px] text-bone-500">
            Payback: {isFinite(feas.paybackMonths) && feas.paybackMonths > 0 ? `${feas.paybackMonths} months` : "Indeterminate"}
          </span>
        </Panel>
      </div>

      {/* ── Main Modeling Workspace: Inputs on Left, Visuals on Right ── */}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        {/* Left: Transparent Financial Assumption Inputs */}
        <Panel className="space-y-6">
          <PanelHeader
            title={`Operational Assumptions — ${loc.name}`}
            desc="Granular cost drivers. Modify any figure to immediately trigger break-even recalculation."
          />

          {(["Revenue model", "Monthly fixed costs", "One-time setup"] as const).map((groupName) => (
            <div key={groupName} className="border-b border-line/60 pb-5 last:border-0 last:pb-0">
              <h4 className="mb-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-brass-400">
                {groupName}
              </h4>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                {FINANCE_FIELDS.filter((f) => f.group === groupName).map((f) => (
                  <Field key={f.key} label={f.label} hint={f.hint}>
                    <MoneyInput
                      prefix={["depositMonths", "workingCapitalMonths", "operatingDays"].includes(f.key) ? "#" : "₹"}
                      value={loc.financials[f.key]}
                      step={
                        ["depositMonths", "workingCapitalMonths", "operatingDays"].includes(f.key)
                          ? 1
                          : f.key === "avgPrice" || f.key === "variableCost"
                          ? 10
                          : 2500
                      }
                      onCommit={(v) =>
                        commit({
                          [f.key]: ["depositMonths", "workingCapitalMonths", "operatingDays"].includes(f.key) ? Math.round(v) : v,
                        } as Partial<FinancialAssumptions>)
                      }
                    />
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </Panel>

        {/* Right: Charts and Sensitivity Analysis */}
        <div className="space-y-5 flex flex-col">
          {/* Crossover Break-Even Chart */}
          <Panel>
            <PanelHeader
              title="Break-Even Volume Curve"
              desc="Intersection of Monthly Revenue line and Total Cost curve."
            />
            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#1f2532" strokeDasharray="3 3" />
                  <XAxis dataKey="orders" stroke="#6d6d68" fontSize={11} tickFormatter={(v) => `${v}/d`} />
                  <YAxis stroke="#6d6d68" fontSize={11} tickFormatter={(v) => fmtINRCompact(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0e1014", borderColor: "#2b3341", fontSize: "12px", color: "#ece9e1" }}
                    formatter={(val: unknown) => [typeof val === "number" ? fmtINR(val) : String(val), ""]}
                    labelFormatter={(label) => `${label} orders / day`}
                  />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#d9a441" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalCost" name="Total Cost" stroke="#bf5145" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fixedCost" name="Fixed Overhead" stroke="#4d586a" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                  {isFinite(feas.breakEvenDaily) && (
                    <ReferenceLine x={feas.breakEvenDaily} stroke="#8fd3ab" strokeDasharray="3 3" label={{ value: `B/E: ${feas.breakEvenDaily}`, fill: "#8fd3ab", fontSize: 10 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 text-[11px] text-bone-400 mt-2 font-mono">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-brass-400" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-ember-500" /> Total Cost</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-bone-500 border-b border-dashed" /> Fixed Cost</span>
            </div>
          </Panel>

          {/* Multi-Factor Sensitivity Matrix */}
          <Panel>
            <PanelHeader
              title="Rent vs Ticket Sensitivity Matrix"
              desc="Daily transaction break-even requirements under rent and ticket price shifts."
            />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-center text-[11.5px] border-collapse font-mono">
                <thead>
                  <tr className="border-b border-line text-[10px] text-bone-500 uppercase tracking-wider">
                    <th className="p-2 text-left">Rent Shift</th>
                    <th className="p-2">Avg Ticket -15%</th>
                    <th className="p-2 bg-brass-500/5 text-brass-300">Base Ticket</th>
                    <th className="p-2">Avg Ticket +15%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {sensitivityMatrix.map(({ rMul, rent, cols }) => {
                    const isBaseRent = rMul === 1.0;
                    return (
                      <tr key={rMul} className={cn(isBaseRent && "bg-brass-500/5")}>
                        <td className="p-2 text-left font-medium text-bone-300">
                          {fmtINR(rent)} <span className="text-[10px] text-bone-500">({rMul > 1 ? `+${Math.round((rMul - 1) * 100)}%` : rMul < 1 ? `-${Math.round((1 - rMul) * 100)}%` : "Base"})</span>
                        </td>
                        {cols.map((c, idx) => {
                          const safe = c.breakEvenDaily <= a.profile.targetDailySales;
                          const unreachable = !isFinite(c.breakEvenDaily);
                          return (
                            <td key={idx} className={cn("p-2", unreachable ? "text-ember-400" : safe ? "text-sage-300" : "text-ember-300")}>
                              {unreachable ? "Deficit" : `${c.breakEvenDaily}/d`}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10.5px] text-bone-500 italic">
              Values denote required daily transactions. Green cells indicate volume within your declared {a.profile.targetDailySales}/day target.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ── What-If Scenarios Workspace ───────────────────────────── */
export function ScenariosPage() {
  return (
    <AnalysisFrame
      title="What-If Financial Scenarios"
      desc="Test alternative market conditions: stress test rent hikes, economic downturns, and pricing power."
    >
      {(a) => <ScenariosBody a={a} />}
    </AnalysisFrame>
  );
}

function ScenariosBody({ a }: { a: Analysis }) {
  const { saveScenario, deleteScenario, toast, logActivity } = useApp();
  const [baseLocId, setBaseLocId] = useState(a.locations[0]?.id ?? "");
  const loc = a.locations.find((l) => l.id === baseLocId) ?? a.locations[0];

  const [scenarioName, setScenarioName] = useState("");
  const [rentDeltaPct, setRentDeltaPct] = useState(0);
  const [ticketDeltaPct, setTicketDeltaPct] = useState(0);
  const [volumeDeltaPct, setVolumeDeltaPct] = useState(0);

  if (!loc) {
    return <Panel className="py-14 text-center text-[13px] text-bone-400">Add candidate locations to model alternative scenarios.</Panel>;
  }

  const baseFeas = computeFeasibility(loc.financials, a.profile.targetDailySales);

  // Apply hypothetical deltas
  const simulatedFinancials: FinancialAssumptions = useMemo(() => {
    return {
      ...loc.financials,
      rentMonthly: Math.round(loc.financials.rentMonthly * (1 + rentDeltaPct / 100)),
      avgPrice: Math.round(loc.financials.avgPrice * (1 + ticketDeltaPct / 100)),
    };
  }, [loc.financials, rentDeltaPct, ticketDeltaPct]);

  const simulatedTarget = Math.max(1, Math.round(a.profile.targetDailySales * (1 + volumeDeltaPct / 100)));
  const simulatedFeas = computeFeasibility(simulatedFinancials, simulatedTarget);

  const handleApplyPreset = (presetName: string, rentD: number, ticketD: number, volD: number) => {
    setScenarioName(presetName);
    setRentDeltaPct(rentD);
    setTicketDeltaPct(ticketD);
    setVolumeDeltaPct(volD);
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast("Please name the scenario", { tone: "error" });
      return;
    }
    const newScen: Scenario = {
      id: uid("scen"),
      name: scenarioName,
      baseLocationId: loc.id,
      patch: {
        rentMonthly: simulatedFinancials.rentMonthly,
        avgPrice: simulatedFinancials.avgPrice,
      },
      note: `Rent: ${rentDeltaPct >= 0 ? "+" : ""}${rentDeltaPct}% · Price: ${ticketDeltaPct >= 0 ? "+" : ""}${ticketDeltaPct}% · Vol: ${volumeDeltaPct >= 0 ? "+" : ""}${volumeDeltaPct}%`,
      savedAt: new Date().toISOString(),
    };
    saveScenario(a.id, newScen);
    logActivity(a.id, `Saved scenario “${scenarioName}”.`, "finance");
    toast("Saved scenario", { body: scenarioName, tone: "success" });
    setScenarioName("");
  };

  return (
    <div className="space-y-6">
      {/* Location Switcher in Scenarios */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono uppercase text-bone-500 mr-1">Base Site:</span>
        {a.locations.map((l, idx) => (
          <button
            key={l.id}
            onClick={() => setBaseLocId(l.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-all",
              l.id === loc.id
                ? "border-brass-500/60 bg-brass-500/15 text-brass-300 shadow-sm"
                : "border-line bg-ink-850 text-bone-400 hover:text-bone-100"
            )}
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-brass-500/30 font-mono text-[9.5px] font-bold text-brass-300">
              {idx + 1}
            </span>
            <span>{l.name}</span>
          </button>
        ))}
      </div>

      {/* ── Preset Scenarios Toolbar ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-850 p-4">
        <div>
          <h3 className="text-[14px] font-semibold text-bone-100">Macro Stress Presets</h3>
          <p className="text-[12px] text-bone-400">Instantly test standard retail risk and upside cases for {loc.name}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs" variant="secondary" onClick={() => handleApplyPreset("Conservative Downturn", 0, -10, -20)}>
            Conservative (-20% vol)
          </Button>
          <Button size="xs" variant="secondary" onClick={() => handleApplyPreset("Landlord Rent Spike", +25, 0, -10)}>
            Rent Spike (+25% rent)
          </Button>
          <Button size="xs" variant="secondary" onClick={() => handleApplyPreset("High Volume Upside", +10, +10, +30)}>
            Bull Case (+30% vol)
          </Button>
          <Button size="xs" variant="outline" onClick={() => handleApplyPreset("Baseline Reset", 0, 0, 0)}>
            Reset Base
          </Button>
        </div>
      </div>

      {/* ── Side-by-Side: Base vs Simulated Comparison ───────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Base Case Panel */}
        <Panel className="border-line bg-ink-900">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-bone-500">Baseline Case</span>
              <h4 className="text-[15px] font-semibold text-bone-100">{loc.name}</h4>
            </div>
            <Badge tone="neutral">Current Model</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 font-mono text-[12px]">
            <div className="p-3 rounded-lg border border-line bg-ink-850">
              <span className="text-bone-500 block text-[10px]">Monthly Rent</span>
              <span className="text-[15px] font-bold text-bone-100">{fmtINR(loc.financials.rentMonthly)}</span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-ink-850">
              <span className="text-bone-500 block text-[10px]">Daily Break-Even</span>
              <span className="text-[15px] font-bold text-bone-100">{baseFeas.breakEvenDaily} orders/d</span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-ink-850">
              <span className="text-bone-500 block text-[10px]">Safety Margin</span>
              <span className="text-[15px] font-bold text-sage-300">{baseFeas.marginOfSafetyPct.toFixed(1)}%</span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-ink-850">
              <span className="text-bone-500 block text-[10px]">Monthly Net Profit</span>
              <span className="text-[15px] font-bold text-bone-100">{fmtINR(baseFeas.monthlyProfitAtTarget)}</span>
            </div>
          </div>
        </Panel>

        {/* Simulated Scenario Panel */}
        <Panel className="border-brass-500/40 bg-brass-500/[0.03]">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-brass-400">Simulated Outcome</span>
              <h4 className="text-[15px] font-semibold text-bone-100">{scenarioName || "Custom What-If Scenario"}</h4>
            </div>
            <Badge tone={simulatedFeas.marginOfSafetyPct > 0 ? "sage" : "ember"}>
              {simulatedFeas.marginOfSafetyPct > 0 ? "Feasible" : "Unviable Deficit"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 font-mono text-[12px]">
            <div className="p-3 rounded-lg border border-line bg-ink-850">
              <span className="text-bone-500 block text-[10px]">Simulated Rent</span>
              <span className="text-[15px] font-bold text-bone-100">{fmtINR(simulatedFinancials.rentMonthly)}</span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-ink-850">
              <span className="text-bone-500 block text-[10px]">Simulated B/E</span>
              <span className="text-[15px] font-bold text-brass-300">{simulatedFeas.breakEvenDaily} orders/d</span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-ink-850">
              <span className="text-bone-500 block text-[10px]">Simulated Margin</span>
              <span className={cn("text-[15px] font-bold", simulatedFeas.marginOfSafetyPct > 0 ? "text-sage-300" : "text-ember-300")}>
                {simulatedFeas.marginOfSafetyPct.toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-lg border border-line bg-ink-850">
              <span className="text-bone-500 block text-[10px]">Net Profit / Month</span>
              <span className={cn("text-[15px] font-bold", simulatedFeas.monthlyProfitAtTarget > 0 ? "text-bone-100" : "text-ember-300")}>
                {fmtINR(simulatedFeas.monthlyProfitAtTarget)}
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Scenario Sliders & Save Drawer ───────────────────────── */}
      <Panel className="p-5">
        <h4 className="text-[13.5px] font-semibold text-bone-100 mb-4">Interactive Stress Parameters</h4>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-bone-300">Rent Variance</span>
              <span className="font-mono text-bone-100">{rentDeltaPct >= 0 ? `+${rentDeltaPct}%` : `${rentDeltaPct}%`}</span>
            </div>
            <input
              type="range"
              min={-30}
              max={50}
              step={5}
              value={rentDeltaPct}
              onChange={(e) => setRentDeltaPct(parseInt(e.target.value))}
              className="w-full accent-brass-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-bone-300">Average Ticket Price Variance</span>
              <span className="font-mono text-bone-100">{ticketDeltaPct >= 0 ? `+${ticketDeltaPct}%` : `${ticketDeltaPct}%`}</span>
            </div>
            <input
              type="range"
              min={-30}
              max={40}
              step={5}
              value={ticketDeltaPct}
              onChange={(e) => setTicketDeltaPct(parseInt(e.target.value))}
              className="w-full accent-brass-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-bone-300">Customer Volume Shift</span>
              <span className="font-mono text-bone-100">{volumeDeltaPct >= 0 ? `+${volumeDeltaPct}%` : `${volumeDeltaPct}%`}</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              step={5}
              value={volumeDeltaPct}
              onChange={(e) => setVolumeDeltaPct(parseInt(e.target.value))}
              className="w-full accent-brass-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Save Scenario to Workspace */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Name this scenario (e.g. 2027 Inflation Spike)..."
            className="h-9 w-72 rounded-lg border border-line bg-ink-800 px-3 text-[12.5px] text-bone-100 placeholder:text-bone-500 focus:border-brass-400 focus:outline-none"
          />
          <Button size="sm" onClick={handleSaveScenario}>
            <BookmarkPlus size={13} />
            <span>Save to Scenarios</span>
          </Button>
        </div>
      </Panel>

      {/* ── Saved Scenarios Archive ─────────────────────────────── */}
      {a.scenarios.length > 0 && (
        <Panel pad={false} className="overflow-hidden">
          <div className="border-b border-line px-5 py-3">
            <h4 className="text-[13px] font-semibold text-bone-100">Saved Scenarios in Analysis ({a.scenarios.length})</h4>
          </div>
          <div className="divide-y divide-line/60">
            {a.scenarios.map((scen) => (
              <div key={scen.id} className="flex items-center justify-between p-4">
                <div>
                  <h5 className="font-semibold text-[13px] text-bone-100">{scen.name}</h5>
                  <p className="text-[11.5px] text-bone-400 mt-0.5">{scen.note}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10.5px] font-mono text-bone-500">{fmtDate(scen.savedAt)}</span>
                  <button
                    onClick={() => { deleteScenario(a.id, scen.id); toast("Deleted scenario", { body: scen.name }); }}
                    className="text-bone-500 hover:text-ember-300 p-1"
                    title="Delete scenario"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
