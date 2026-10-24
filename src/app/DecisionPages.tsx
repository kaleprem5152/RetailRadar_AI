import { useState, useMemo } from "react";
import {
  Download, FileCheck2, FileSpreadsheet, Scale, ShieldAlert, Sliders, Sparkles,
} from "lucide-react";
import { Badge, Button, Meter, Panel, PanelHeader } from "../components/ui";
import { ScoreRing } from "../components/chrome";
import { AnalysisFrame } from "./AnalysisPages";
import { useApp } from "../store/AppStore";
import { rankLocations, scoreAnalysis, type LocationScore } from "../lib/scoring";
import { computeFeasibility } from "../lib/finance";
import { cn, fmtDate, fmtINR, uid } from "../lib/utils";
import type { Analysis, ScoringWeights } from "../lib/types";
import { generateAnalysisPDF, exportAnalysisCSV } from "../lib/pdf";
import { evaluateComparisonWithAI } from "../lib/ai";

/* ── Comparison Workspace ──────────────────────────────────────────── */
export function ComparisonPage() {
  return (
    <AnalysisFrame
      title="Candidate Site Comparison & Explainable Scoring"
      desc="Side-by-side evaluation of up to three candidate sites. Transparent 5-factor scoring model: Site Score = 0.30D + 0.20C + 0.20A + 0.20R + 0.10P."
    >
      {(a) => <CompareBody a={a} />}
    </AnalysisFrame>
  );
}

function CompareBody({ a }: { a: Analysis }) {
  const { updateScoringWeights, toast } = useApp();
  const [weights, setWeights] = useState<ScoringWeights>(
    a.scoringWeights ?? { D: 0.30, C: 0.20, A: 0.20, R: 0.20, P: 0.10 }
  );
  const [showWeightSliders, setShowWeightSliders] = useState(false);

  // Compute live scores with custom weights if adjusted
  const customAnalysis = useMemo(() => ({
    ...a,
    scoringWeights: weights,
  }), [a, weights]);

  const scores = scoreAnalysis(customAnalysis);
  const ranked = rankLocations(customAnalysis);
  const best = ranked[0];

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (a.locations.length === 0) {
    return (
      <Panel className="py-14 text-center">
        <Scale size={24} className="mx-auto text-brass-400" />
        <h3 className="mt-3 text-[15px] font-semibold text-bone-100">Add candidate locations to compare them</h3>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-bone-400">Comparison evaluates up to 3 candidate sites side-by-side.</p>
      </Panel>
    );
  }

  const runAiEvaluation = async () => {
    setAiLoading(true);
    try {
      const summary = await evaluateComparisonWithAI(a);
      setAiAnalysis(summary);
    } catch {
      setAiAnalysis("AI synthesis currently unavailable. Please check API configuration or inspect local scores below.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleWeightChange = (key: keyof ScoringWeights, val: number) => {
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    updateScoringWeights(updated);
  };

  const resetWeights = () => {
    const def: ScoringWeights = { D: 0.30, C: 0.20, A: 0.20, R: 0.20, P: 0.10 };
    setWeights(def);
    updateScoringWeights(def);
    toast("Scoring weights reset to PRD baseline", { tone: "info" });
  };

  return (
    <div className="space-y-6">
      {/* ── Executive Verdict Header Strip ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brass-500/30 bg-brass-500/[0.05] p-4 backdrop-blur">
        <div className="flex items-center gap-3.5">
          <Scale size={24} className="text-brass-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-brass-400 font-semibold">
                Decision Recommendation
              </span>
              <Badge tone="brass">{best.verdict.label}</Badge>
            </div>
            <h3 className="text-[16px] font-semibold text-bone-100 mt-0.5">
              {a.locations.find((l) => l.id === best.locationId)?.name} is the strongest candidate at {best.total}/100.
            </h3>
            <p className="text-[12px] text-bone-400 mt-0.5">
              Evaluated across {a.locations.length} candidate location(s) using disclosed business assumptions and mapped empirical evidence.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowWeightSliders((v: boolean) => !v)}
            className="text-[12px]"
          >
            <Sliders size={13} className="text-brass-300" />
            <span>{showWeightSliders ? "Hide Weight Tuning" : "Tune Weights"}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            loading={aiLoading}
            onClick={runAiEvaluation}
            className="text-[12px]"
          >
            <Sparkles size={13} className="text-brass-300" />
            <span>AI Synthesis</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            to={`/app/analyses/${a.id}/report`}
            className="text-[12px]"
          >
            <FileCheck2 size={13} />
            <span>Decision Report</span>
          </Button>
        </div>
      </div>

      {/* ── Interactive Weight Sensitivity Slider Drawer ──────────────── */}
      {showWeightSliders && (
        <Panel className="border-brass-500/30 bg-ink-850 p-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
            <div>
              <h4 className="text-[13px] font-semibold text-bone-100">Explainable Model Weight Calibration</h4>
              <p className="text-[11.5px] text-bone-400">
                Adjust factor weights to model your strategy (e.g. prioritize Rent Affordability if capital is tight).
              </p>
            </div>
            <button
              onClick={resetWeights}
              className="text-[11px] text-brass-400 hover:text-brass-300 font-mono underline"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            {[
              { key: "D" as const, label: "Demand [D]", desc: "Footfall & customer volume" },
              { key: "C" as const, label: "Competition [C]", desc: "Saturation & agglomeration" },
              { key: "A" as const, label: "Accessibility [A]", desc: "Transit, frontage & parking" },
              { key: "R" as const, label: "Rent [R]", desc: "Break-even sales & rent/sqft" },
              { key: "P" as const, label: "Proximity [P]", desc: "Distance to key anchors" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="rounded-lg border border-line bg-ink-900 p-2.5">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="font-medium text-bone-200">{label}</span>
                  <span className="font-mono font-bold text-brass-400">{Math.round(weights[key] * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={Math.round(weights[key] * 100)}
                  onChange={(e) => handleWeightChange(key, parseInt(e.target.value) / 100)}
                  className="w-full mt-2 accent-brass-500 cursor-pointer"
                  aria-label={label}
                />
                <span className="block mt-1 text-[10px] text-bone-500 truncate">{desc}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── AI Evidence Synthesis Box ───────────────────────────── */}
      {aiAnalysis && (
        <Panel className="border-brass-500/30 bg-brass-500/[0.03]">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-brass-300">
            <Sparkles size={15} />
            <span>AI Comparative Trade-Off Synthesis</span>
          </div>
          <div className="mt-2.5 whitespace-pre-line text-[12.5px] leading-relaxed text-bone-200">
            {aiAnalysis}
          </div>
          <div className="mt-3 text-[11px] text-bone-500 border-t border-line/60 pt-2 flex items-center justify-between">
            <span>Grounding: Synthesized from {a.locations.length} candidate sites and financial model parameters.</span>
            <span className="italic text-bone-400">Distinguishes empirical evidence from operational inference.</span>
          </div>
        </Panel>
      )}

      {/* ── Side-by-Side Detailed Candidate Comparison Matrix ────── */}
      <div className="overflow-x-auto rounded-xl border border-line bg-ink-850">
        <table className="w-full border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line bg-ink-900/90 text-[11px] font-mono uppercase tracking-wider text-bone-500">
              <th className="p-4 w-52">Evaluation Factor</th>
              {scores.map((s, idx) => {
                const loc = a.locations.find((l) => l.id === s.locationId)!;
                const isLead = s.locationId === best.locationId;
                return (
                  <th key={s.locationId} className={cn("p-4 border-l border-line", isLead && "bg-brass-500/[0.04]")}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-bone-100 text-[13px]">
                        <span className="flex size-5 items-center justify-center rounded-full bg-brass-500 font-mono text-[10px] text-ink-950 font-bold">
                          {idx + 1}
                        </span>
                        {loc.name}
                      </span>
                      {isLead && <Badge tone="brass">Recommended</Badge>}
                    </div>
                    <div className="text-[11px] text-bone-400 font-normal lowercase tracking-normal mt-0.5 truncate max-w-xs">
                      {loc.address}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-line/60 text-bone-300">
            {/* Row 1: Overall Score & Verdict */}
            <tr className="bg-ink-800/40">
              <td className="p-4 font-semibold text-bone-100">
                Composite Score
                <span className="block text-[10.5px] font-normal text-bone-500">100-point scale</span>
              </td>
              {scores.map((s) => {
                const isLead = s.locationId === best.locationId;
                return (
                  <td key={s.locationId} className={cn("p-4 border-l border-line", isLead && "bg-brass-500/[0.04]")}>
                    <div className="flex items-center gap-3">
                      <ScoreRing score={s.total} size={50} stroke={4.5} tone={s.total >= 65 ? "sage" : s.total >= 50 ? "brass" : "ember"} />
                      <div className="min-w-0">
                        <div className="font-mono text-[15px] font-bold text-bone-100 flex items-baseline gap-1">
                          <span>{s.total}</span>
                          <span className="text-[11px] font-normal text-bone-500">/ 100</span>
                        </div>
                        <div className="text-[11px] text-bone-300 font-medium leading-tight mt-0.5 truncate">{s.verdict.label}</div>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 2: Factor D - Demand (30%) */}
            <tr>
              <td className="p-4 font-medium text-bone-200">
                Demand Proxy [D]
                <span className="block text-[10.5px] text-bone-500">Weight: {Math.round(weights.D * 100)}%</span>
              </td>
              {scores.map((s) => {
                const comp = s.components.find((c) => c.key === "demand")!;
                return (
                  <td key={s.locationId} className="p-4 border-l border-line">
                    <div className="flex items-center justify-between font-mono text-[12px]">
                      <span className="text-bone-100 font-bold">{comp.score}/100</span>
                      <span className="text-[10px] text-bone-500">Score</span>
                    </div>
                    <Meter value={comp.score} tone={comp.score >= 65 ? "sage" : "brass"} className="mt-1" />
                    <p className="mt-1 text-[11px] text-bone-400">{comp.detail}</p>
                  </td>
                );
              })}
            </tr>

            {/* Row 3: Factor C - Competition (20%) */}
            <tr>
              <td className="p-4 font-medium text-bone-200">
                Competition [C]
                <span className="block text-[10.5px] text-bone-500">Weight: {Math.round(weights.C * 100)}%</span>
              </td>
              {scores.map((s) => {
                const comp = s.components.find((c) => c.key === "competition")!;
                const loc = a.locations.find((l) => l.id === s.locationId)!;
                const totalComp = loc.nearby.filter((b) => b.competitor).length;
                return (
                  <td key={s.locationId} className="p-4 border-l border-line">
                    <div className="flex items-center justify-between font-mono text-[12px]">
                      <span className="text-bone-100 font-bold">{comp.score}/100</span>
                      <span className="text-[10px] text-bone-400">{totalComp} nearby competitor(s)</span>
                    </div>
                    <Meter value={comp.score} tone={comp.score >= 65 ? "sage" : comp.score >= 45 ? "brass" : "ember"} className="mt-1" />
                    <p className="mt-1 text-[11px] text-bone-400">{comp.detail}</p>
                  </td>
                );
              })}
            </tr>

            {/* Row 4: Factor A - Accessibility (20%) */}
            <tr>
              <td className="p-4 font-medium text-bone-200">
                Accessibility [A]
                <span className="block text-[10.5px] text-bone-500">Weight: {Math.round(weights.A * 100)}%</span>
              </td>
              {scores.map((s) => {
                const comp = s.components.find((c) => c.code === "A")!;
                const loc = a.locations.find((l) => l.id === s.locationId)!;
                return (
                  <td key={s.locationId} className="p-4 border-l border-line">
                    <div className="flex items-center justify-between font-mono text-[12px]">
                      <span className="text-bone-100 font-bold">{comp.score}/100</span>
                      <span className="text-[10.5px] text-bone-400">{loc.metrics.frontage} · {loc.metrics.parking}</span>
                    </div>
                    <Meter value={comp.score} tone={comp.score >= 65 ? "sage" : "brass"} className="mt-1" />
                    <p className="mt-1 text-[11px] text-bone-400">{comp.detail}</p>
                  </td>
                );
              })}
            </tr>

            {/* Row 5: Factor R - Rent Affordability (20%) */}
            <tr>
              <td className="p-4 font-medium text-bone-200">
                Rent Affordability [R]
                <span className="block text-[10.5px] text-bone-500">Weight: {Math.round(weights.R * 100)}%</span>
              </td>
              {scores.map((s) => {
                const comp = s.components.find((c) => c.code === "R")!;
                const loc = a.locations.find((l) => l.id === s.locationId)!;
                return (
                  <td key={s.locationId} className="p-4 border-l border-line">
                    <div className="flex items-center justify-between font-mono text-[12px]">
                      <span className="text-bone-100 font-bold">{comp.score}/100</span>
                      <span className="text-[10.5px] text-bone-400">{fmtINR(loc.financials.rentMonthly)}/mo</span>
                    </div>
                    <Meter value={comp.score} tone={comp.score >= 65 ? "sage" : comp.score >= 45 ? "brass" : "ember"} className="mt-1" />
                    <p className="mt-1 text-[11px] text-bone-400">{comp.detail}</p>
                  </td>
                );
              })}
            </tr>

            {/* Row 6: Factor P - Anchor Proximity (10%) */}
            <tr>
              <td className="p-4 font-medium text-bone-200">
                Anchor Proximity [P]
                <span className="block text-[10.5px] text-bone-500">Weight: {Math.round(weights.P * 100)}%</span>
              </td>
              {scores.map((s) => {
                const comp = s.components.find((c) => c.code === "P")!;
                return (
                  <td key={s.locationId} className="p-4 border-l border-line">
                    <div className="flex items-center justify-between font-mono text-[12px]">
                      <span className="text-bone-100 font-bold">{comp.score}/100</span>
                      <span className="text-[10px] text-bone-500">Anchors</span>
                    </div>
                    <Meter value={comp.score} tone={comp.score >= 65 ? "sage" : "brass"} className="mt-1" />
                    <p className="mt-1 text-[11px] text-bone-400">{comp.detail}</p>
                  </td>
                );
              })}
            </tr>

            {/* Row 7: Financial Break-Even Metrics */}
            <tr className="bg-ink-900/60 font-medium">
              <td className="p-4 text-bone-100">
                Break-Even Threshold
                <span className="block text-[10.5px] font-normal text-bone-500">Units required daily</span>
              </td>
              {scores.map((s) => {
                const loc = a.locations.find((l) => l.id === s.locationId)!;
                const feas = computeFeasibility(loc.financials, a.profile.targetDailySales);
                const feasible = feas.marginOfSafetyPct > 0;
                return (
                  <td key={s.locationId} className="p-4 border-l border-line font-mono">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[15px] font-bold", feasible ? "text-sage-300" : "text-ember-300")}>
                        {isFinite(feas.breakEvenDaily) ? `${feas.breakEvenDaily} orders/day` : "Negative margin"}
                      </span>
                    </div>
                    <div className="text-[11px] text-bone-400 mt-0.5">
                      Target: {a.profile.targetDailySales}/day · Safety margin: {feas.marginOfSafetyPct.toFixed(1)}%
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 8: Capital Required */}
            <tr>
              <td className="p-4 text-bone-200">
                Total Startup Outlay
                <span className="block text-[10.5px] text-bone-500">Fit-out + Deposit + Capital</span>
              </td>
              {scores.map((s) => {
                const loc = a.locations.find((l) => l.id === s.locationId)!;
                const feas = computeFeasibility(loc.financials, a.profile.targetDailySales);
                return (
                  <td key={s.locationId} className="p-4 border-l border-line font-mono text-[13px] text-bone-200">
                    <div>{fmtINR(feas.startupCash)}</div>
                    <div className="text-[10.5px] text-bone-500">Rent deposit: {fmtINR(loc.financials.rentMonthly * loc.financials.depositMonths)}</div>
                  </td>
                );
              })}
            </tr>

            {/* Row 9: Evidence Integrity & Verification */}
            <tr>
              <td className="p-4 text-bone-200">
                Evidence Completeness
                <span className="block text-[10.5px] text-bone-500">Verified ground truth ratio</span>
              </td>
              {scores.map((s) => {
                const loc = a.locations.find((l) => l.id === s.locationId)!;
                const total = loc.nearby.length;
                const verified = loc.nearby.filter((b) => b.status === "verified").length;
                const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
                return (
                  <td key={s.locationId} className="p-4 border-l border-line">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-mono text-[12.5px] font-bold", pct >= 60 ? "text-sage-300" : "text-brass-300")}>
                        {verified}/{total} verified ({pct}%)
                      </span>
                    </div>
                    {s.missing.length > 0 && (
                      <div className="mt-1 text-[10.5px] text-ember-300">
                        {s.missing.length} unverified gap(s) penalizing score
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Row 10: Identified Key Risks */}
            <tr>
              <td className="p-4 text-bone-200">
                Key Identified Risks
                <span className="block text-[10.5px] text-bone-500">Trade-offs & vulnerabilities</span>
              </td>
              {scores.map((s) => {
                const loc = a.locations.find((l) => l.id === s.locationId)!;
                return (
                  <td key={s.locationId} className="p-4 border-l border-line space-y-1.5">
                    {loc.risks.length > 0 ? (
                      loc.risks.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11.5px] text-bone-300">
                          <ShieldAlert size={12} className={cn("shrink-0 mt-0.5", r.severity === "high" ? "text-ember-400" : "text-brass-400")} />
                          <span>{r.label}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11.5px] text-bone-500 italic">No critical risks recorded.</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Model Methodology & Limitations ─────────────────────── */}
      <Panel>
        <PanelHeader
          title="Explainable Scoring Formulation & Non-Validation Disclosure"
          desc="Site Score = 0.30D + 0.20C + 0.20A + 0.20R + 0.10P"
        />
        <div className="grid gap-3 text-[12px] leading-relaxed text-bone-400 sm:grid-cols-2 lg:grid-cols-5 mt-2">
          <div>
            <strong className="text-bone-200 block mb-1">Demand [D] (30%)</strong>
            Micro-market footfall proxy index and verified retail customer activity.
          </div>
          <div>
            <strong className="text-bone-200 block mb-1">Competition [C] (20%)</strong>
            Direct competitor density; non-linear curve balancing agglomeration vs over-saturation.
          </div>
          <div>
            <strong className="text-bone-200 block mb-1">Accessibility [A] (20%)</strong>
            Physical frontage visibility (corner vs interior), parking supply, and transit proximity.
          </div>
          <div>
            <strong className="text-bone-200 block mb-1">Rent [R] (20%)</strong>
            Affordability measured by break-even volume vs declared target daily transactions.
          </div>
          <div>
            <strong className="text-bone-200 block mb-1">Proximity [P] (10%)</strong>
            Distance to transit hubs, metro stations, and non-competing anchor destinations.
          </div>
        </div>
        <div className="mt-4 border-t border-line/60 pt-3 text-[11px] text-bone-500">
          <strong className="text-bone-300">Regulatory & Decision Disclosure:</strong> The composite score is a structured decision-support indicator derived from transparent, disclosed assumptions and mapped evidence. It does not constitute a certified guarantee of commercial solvency or revenue prediction.
        </div>
      </Panel>
    </div>
  );
}

/* ── Decision Report Workspace ─────────────────────────────────────── */
export function ReportPage() {
  return (
    <AnalysisFrame
      title="Defensible Decision Report & Exports"
      desc="Board-ready memorandum: scores, unit economics, evidence ledger, field audits, and vector PDF / CSV export."
    >
      {(a) => <ReportSheet a={a} />}
    </AnalysisFrame>
  );
}

export function ReportSheet({ a }: { a: Analysis }) {
  const { saveReport, toast, logActivity, user } = useApp();
  const scores = useMemo(() => rankLocations(a), [a]);
  const best = scores[0];
  const confirmed = a.checklist.filter((c) => c.state === "confirmed").length;
  const issues = a.checklist.filter((c) => c.state === "issue");

  if (!best) {
    return (
      <Panel className="py-14 text-center text-[13px] text-bone-400">
        Add candidate locations to generate the decision report.
      </Panel>
    );
  }

  const bestLoc = a.locations.find((l) => l.id === best.locationId)!;
  const bestFeas = computeFeasibility(bestLoc.financials, a.profile.targetDailySales);

  const handleDownloadPDF = () => {
    generateAnalysisPDF(a, user.name, user.org);
    logActivity(a.id, `Exported print-ready PDF decision report.`, "report");
    toast("Generated PDF report", { body: `${a.title}.pdf downloaded`, tone: "success" });
  };

  const handleDownloadCSV = () => {
    exportAnalysisCSV(a);
    logActivity(a.id, `Exported analysis tabular CSV ledger.`, "report");
    toast("Generated CSV export", { body: `${a.title}.csv downloaded`, tone: "success" });
  };

  const handleSaveToWorkspace = () => {
    saveReport({
      id: uid("rep"),
      analysisId: a.id,
      title: `${a.title} — Location Selection Memo`,
      createdAt: new Date().toISOString(),
      verdict: best.verdict.label,
      recommendation: bestLoc.name,
      score: best.total,
    });
    logActivity(a.id, `Archived formal decision report to workspace.`, "report");
    toast("Saved to Reports archive", { body: `${bestLoc.name} · Score ${best.total}/100`, tone: "success" });
  };

  return (
    <div className="space-y-6">
      {/* ── Actions Bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-850 p-4">
        <div>
          <h3 className="text-[14px] font-semibold text-bone-100">Executive Investment Memorandum</h3>
          <p className="text-[12px] text-bone-400">Prepared for: {user.org || "Investment Committee"} · {fmtDate(a.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleDownloadCSV}>
            <FileSpreadsheet size={13} />
            <span>Export CSV</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
            <Download size={13} />
            <span>Download Vector PDF</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveToWorkspace}>
            <FileCheck2 size={13} />
            <span>Archive Report</span>
          </Button>
        </div>
      </div>

      {/* ── Formal Memorandum Document Sheet ─────────────────────── */}
      <div className="rounded-xl border border-line-strong bg-ink-950 p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Memo Header */}
        <div className="flex items-start justify-between border-b border-line pb-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-brass-400">Commercial Investment Decision Memo</div>
            <h1 className="text-[26px] font-display font-light text-bone-100 mt-1">{a.title}</h1>
            <p className="text-[13px] text-bone-400 mt-1">Concept: {a.profile.concept} · Target daily volume: {a.profile.targetDailySales} transactions</p>
          </div>
          <div className="text-right font-mono text-[11px] text-bone-500">
            <div>Auth: {user.name}</div>
            <div>Date: {fmtDate(a.updatedAt)}</div>
            <div className="text-brass-400 mt-1">Status: Concluded & Verified</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
          <div className="rounded-lg border border-line bg-ink-900 p-4 space-y-2">
            <h4 className="text-[13px] font-mono uppercase text-brass-400 tracking-wider font-semibold">1. Executive Selection</h4>
            <p className="text-[14px] font-medium text-bone-100">
              Primary Site Recommendation: <strong className="text-brass-300 font-bold">{bestLoc.name}</strong> ({best.total}/100)
            </p>
            <p className="text-[12.5px] text-bone-300 leading-relaxed">
              Based on empirical site analysis, {bestLoc.name} demonstrates superior overall viability, requiring {bestFeas.breakEvenDaily} daily transactions to cover ₹{fmtINR(bestLoc.financials.rentMonthly)}/month rent. It provides a safety margin of {bestFeas.marginOfSafetyPct.toFixed(1)}% above break-even at modeled volume.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-ink-900 p-4 space-y-2 font-mono text-[12px]">
            <h4 className="text-[13px] uppercase text-brass-400 tracking-wider font-semibold">Key Financials</h4>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-bone-400">Total Capital Outlay:</span>
              <span className="text-bone-100 font-bold">{fmtINR(bestFeas.startupCash)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/50">
              <span className="text-bone-400">Daily Break-Even:</span>
              <span className="text-bone-100 font-bold">{bestFeas.breakEvenDaily} orders/day</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-bone-400">Contribution Margin:</span>
              <span className="text-sage-300 font-bold">{bestFeas.contributionMarginPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Comparative Candidate Ranking Summary */}
        <div>
          <h4 className="text-[13px] font-mono uppercase text-brass-400 tracking-wider font-semibold mb-3">2. Comparative Ranking</h4>
          <div className="divide-y divide-line rounded-lg border border-line bg-ink-900">
            {scores.map((s: LocationScore, idx: number) => {
              const loc = a.locations.find((l) => l.id === s.locationId)!;
              const feas = computeFeasibility(loc.financials, a.profile.targetDailySales);
              return (
                <div key={s.locationId} className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-brass-500/20 font-mono text-[11px] font-bold text-brass-300">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-bone-100 text-[13px]">{loc.name}</div>
                      <div className="text-[11px] text-bone-400">{loc.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-[12px]">
                    <div className="text-right">
                      <div className="text-bone-100 font-bold">{s.total}/100</div>
                      <div className="text-[10px] text-bone-500">{s.verdict.label}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-bone-200">{fmtINR(loc.financials.rentMonthly)}/mo</div>
                      <div className="text-[10px] text-bone-500">{feas.breakEvenDaily} orders B/E</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification & Risk Audit Status */}
        <div className="border-t border-line pt-4 flex flex-wrap items-center justify-between text-[11.5px] text-bone-400 font-mono">
          <div>Audited Checklist: {confirmed}/{a.checklist.length} verified ({issues.length} flagged issues)</div>
          <div>All figures modeled with deterministic calculations.</div>
        </div>
      </div>
    </div>
  );
}
