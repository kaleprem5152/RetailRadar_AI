import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity, ArrowRight, Building2, CircleHelp, ClipboardCheck, FileText, Loader2, MapPin, Plus,
  Radar, Search, SearchX, Sparkles, Trash2, TrendingUp,
} from "lucide-react";
import { Badge, Button, ConfirmDialog, Field, IconButton, Input, Meter, MoneyInput, Panel, PanelHeader, Select, Stat } from "../components/ui";
import { ScoreRing } from "../components/chrome";
import { useApp } from "../store/AppStore";
import { rankLocations, scoreAnalysis } from "../lib/scoring";
import { computeFeasibility } from "../lib/finance";
import { cn, fmtINR, fmtINRCompact, timeAgo, uid, DEMO_TAG } from "../lib/utils";
import type { Analysis, CandidateLocation } from "../lib/types";
import { evaluateLocationWithAI, type AIAnalysisResult } from "../lib/ai";
import { searchPlaces, type GeocodedPlace } from "../lib/places";

/* Shared frame for every /app/analyses/:id/* page */
export function AnalysisFrame({
  title,
  desc,
  actions,
  children,
  narrow,
}: {
  title: string;
  desc?: string;
  actions?: React.ReactNode;
  children: (analysis: Analysis) => React.ReactNode;
  narrow?: boolean;
}) {
  const { id } = useParams();
  const { getAnalysis } = useApp();
  const analysis = getAnalysis(id);
  if (!analysis) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <SearchX size={28} className="mx-auto text-bone-500" />
        <h1 className="font-display mt-5 text-2xl font-light text-bone-100">Analysis not found</h1>
        <p className="mt-2 text-[13.5px] text-bone-400">
          This analysis may have been deleted from this device.
        </p>
        <Button className="mt-6" variant="outline" to="/app/analyses">Back to analyses</Button>
      </div>
    );
  }
  return (
    <div className={cn("mx-auto px-4 py-8 sm:px-6 lg:py-10", narrow ? "max-w-4xl" : "max-w-6xl")}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-brass-400">{analysis.title}</p>
          <h1 className="font-display mt-2 text-[26px] font-light tracking-tight text-bone-100">{title}</h1>
          {desc && <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-bone-400">{desc}</p>}
        </div>
        {actions}
      </div>
      {children(analysis)}
    </div>
  );
}

/* ── Overview ────────────────────────────────────────────── */
export function AnalysisOverview() {
  return (
    <AnalysisFrame
      title="Analysis overview"
      actions={
        <Button variant="outline" size="sm" to="report">
          <FileText size={14} /> Decision report
        </Button>
      }
    >
      {(a) => <OverviewBody a={a} />}
    </AnalysisFrame>
  );
}

function OverviewBody({ a }: { a: Analysis }) {
  const scores = rankLocations(a);
  const lead = scores[0];
  const leadLoc = lead ? a.locations.find((l) => l.id === lead.locationId) : undefined;
  const leadFeas = leadLoc ? computeFeasibility(leadLoc.financials, a.profile.targetDailySales) : null;
  const openChecks = a.checklist.filter((c) => c.state !== "confirmed").length;
  const totalRecords = a.locations.reduce((n, l) => n + l.nearby.length, 0);
  const verifiedRecords = a.locations.reduce((n, l) => n + l.nearby.filter((x) => x.status === "verified").length, 0);
  const startupMax = a.locations.length ? Math.max(...a.locations.map((l) => computeFeasibility(l.financials, a.profile.targetDailySales).startupCash)) : 0;

  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runAiEvaluation = async () => {
    if (!leadLoc) return;
    setAiLoading(true);
    try {
      const res = await evaluateLocationWithAI(a, leadLoc);
      setAiResult(res);
    } catch {
      // fallback handled inside
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
      <div className="space-y-5">
        {/* leading candidate */}
        {lead && leadLoc && leadFeas ? (
          <Panel className="relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-brass-500/[0.05] to-transparent" aria-hidden />
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing score={lead.total} size={104} tone={lead.total >= 65 ? "sage" : lead.total >= 50 ? "brass" : "ember"} label="lead score" />
              <div className="min-w-0 flex-1">
                <Badge tone={lead.total >= 65 ? "sage" : lead.total >= 50 ? "brass" : "ember"}>{lead.verdict.label}</Badge>
                <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-bone-100">{leadLoc.name}</h3>
                <p className="mt-1 text-[12.5px] text-bone-400">{leadLoc.address}</p>
                <div className="tnum mt-3 flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-[12.5px] text-bone-300">
                  <span>BE {isFinite(leadFeas.breakEvenDaily) ? `${leadFeas.breakEvenDaily}/day` : "—"}</span>
                  <span>Cash {fmtINRCompact(leadFeas.startupCash)}</span>
                  <span>Rent {fmtINR(leadLoc.financials.rentMonthly)}/mo</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm" loading={aiLoading} onClick={runAiEvaluation}>
                  <Sparkles size={14} className="text-brass-300" /> AI Site Insights
                </Button>
                <Button variant="outline" size="sm" to={`/app/analyses/${a.id}/comparison`}>
                  Compare all <ArrowRight size={13} />
                </Button>
              </div>
            </div>

            {aiResult && (
              <div className="mt-5 border-t border-line pt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-brass-300">
                  <Sparkles size={14} /> AI Evaluator Summary ({aiResult.isAiGenerated ? "Gemini 1.5 Flash" : "Deterministic Engine"})
                </div>
                <p className="text-[12.5px] leading-relaxed text-bone-200">{aiResult.summary}</p>
                <div className="grid gap-2 text-[12px] sm:grid-cols-2 pt-1">
                  <div className="rounded-lg bg-ink-800/60 p-2.5 border border-line">
                    <span className="font-semibold text-bone-300">Competition: </span>
                    <span className="text-bone-400">{aiResult.competitiveVerdict}</span>
                  </div>
                  <div className="rounded-lg bg-ink-800/60 p-2.5 border border-line">
                    <span className="font-semibold text-bone-300">Financials: </span>
                    <span className="text-bone-400">{aiResult.financialViability}</span>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        ) : (
          <Panel className="text-center">
            <Radar size={22} className="mx-auto text-bone-500" />
            <h3 className="mt-3 text-[15px] font-semibold text-bone-100">No candidate locations yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-bone-400">Add up to three candidates to activate scoring, comparison and financial modelling.</p>
            <Button className="mt-4" size="sm" to={`/app/analyses/${a.id}/locations`}><Plus size={14} /> Add a location</Button>
          </Panel>
        )}

        {/* per-location strip */}
        <Panel>
          <PanelHeader title="Candidates at a glance" action={<Button variant="ghost" size="xs" to={`/app/analyses/${a.id}/locations`}>Manage <ArrowRight size={12} /></Button>} />
          <div className="space-y-2.5">
            {scores.map((s) => {
              const loc = a.locations.find((l) => l.id === s.locationId)!;
              const feas = computeFeasibility(loc.financials, a.profile.targetDailySales);
              return (
                <Link
                  key={s.locationId}
                  to={`/app/analyses/${a.id}/financials?loc=${s.locationId}`}
                  className="flex items-center gap-4 rounded-lg border border-line bg-ink-800/40 px-4 py-3 transition-colors hover:border-line-strong"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[13.5px] font-medium text-bone-100">
                      <MapPin size={12} className="text-brass-400" /> {loc.name}
                    </div>
                    <div className="tnum mt-1 font-mono text-[11.5px] text-bone-500">
                      {isFinite(feas.breakEvenDaily) ? `BE ${feas.breakEvenDaily}/day` : "BE unreachable"} · {s.competitorCount} competitors · {Math.round(s.verifiedShare * 100)}% verified
                    </div>
                  </div>
                  <div className="w-28">
                    <Meter value={s.total} tone={s.total >= 65 ? "sage" : s.total >= 50 ? "brass" : "ember"} />
                    <div className="tnum mt-1 text-right font-mono text-[11.5px] text-bone-300">{s.total}/100</div>
                  </div>
                </Link>
              );
            })}
            {a.locations.length === 0 && <p className="text-[13px] text-bone-500">Nothing to compare yet.</p>}
          </div>
        </Panel>

        {/* activity */}
        <Panel>
          <PanelHeader title="Latest activity" action={<Button variant="ghost" size="xs" to={`/app/analyses/${a.id}/activity`}>All activity <ArrowRight size={12} /></Button>} />
          <ul className="space-y-3">
            {a.activity.slice(0, 4).map((e) => (
              <li key={e.id} className="flex gap-3 text-[13px]">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brass-500/70" />
                <div>
                  <span className="text-bone-200">{e.text}</span>{" "}
                  <span className="text-bone-500">— {e.actor}, {timeAgo(e.at)}</span>
                </div>
              </li>
            ))}
            {a.activity.length === 0 && <li className="text-[13px] text-bone-500">No events recorded yet.</li>}
          </ul>
        </Panel>
      </div>

      {/* right rail */}
      <div className="space-y-5">
        <Panel className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Concept" value={<span className="font-sans text-[14px] font-semibold">{a.profile.name}</span>} sub={a.profile.category} />
            <Stat label="Target" value={`${a.profile.targetDailySales}/day`} sub="declared sales goal" />
            <Stat label="Budget" value={fmtINRCompact(a.budget.maxInvestment)} sub={startupMax > a.budget.maxInvestment ? "Dearest site exceeds budget" : "Within ceiling"} tone={startupMax > a.budget.maxInvestment ? "warn" : "good"} />
            <Stat label="Updated" value={<span className="font-sans text-[14px] font-semibold">{timeAgo(a.updatedAt)}</span>} sub={(a.status as string).toUpperCase()} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Field verification" desc={`${a.checklist.length - openChecks} of ${a.checklist.length} checks confirmed`} />
          <Meter value={((a.checklist.length - openChecks) / Math.max(1, a.checklist.length)) * 100} tone={openChecks === 0 ? "sage" : "brass"} />
          <div className="mt-3 space-y-1.5">
            {a.checklist.filter((c) => c.state === "issue").slice(0, 2).map((c) => (
              <div key={c.id} className="rounded-md border border-ember-500/25 bg-ember-500/[0.06] px-3 py-2 text-[12px] text-ember-300">
                Issue: {c.label}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full" to={`/app/analyses/${a.id}/field-verification`}>
            <ClipboardCheck size={14} /> Open checklist
          </Button>
        </Panel>

        <Panel>
          <PanelHeader title="Evidence coverage" desc="Nearby records, verified share" />
          <div className="tnum font-mono text-2xl font-medium text-bone-100">
            {totalRecords ? Math.round((verifiedRecords / totalRecords) * 100) : 0}%
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-bone-400">
            {verifiedRecords} of {totalRecords} records verified. Dashed-open records drag the evidence
            component of every decision score.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" to={`/app/analyses/${a.id}/local-truth`}>
              <Building2 size={13} /> Truth map
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" to={`/app/analyses/${a.id}/market-explorer`}>
              Explorer
            </Button>
          </div>
        </Panel>

        {a.locations.some((l) => l.missingInfo.length > 0) && (
          <Panel className="border-brass-500/25 bg-brass-500/[0.04]">
            <div className="flex items-start gap-2.5">
              <CircleHelp size={16} className="mt-0.5 shrink-0 text-brass-300" />
              <div>
                <h4 className="text-[13.5px] font-semibold text-bone-100">Open questions</h4>
                <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-bone-300">
                  {a.locations.flatMap((l) => l.missingInfo.slice(0, 2).map((m) => `${l.name}: ${m}`)).slice(0, 4).map((m) => (
                    <li key={m} className="flex gap-2"><span className="text-brass-400">·</span>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ── Locations manager ───────────────────────────────────── */
export function LocationsPage() {
  return (
    <AnalysisFrame
      title="Candidate locations"
      desc="Manage up to three candidates. Metrics here feed the decision score — keep footfall honest and rents current."
    >
      {(a) => <LocationsBody a={a} />}
    </AnalysisFrame>
  );
}

function LocationsBody({ a }: { a: Analysis }) {
  const { updateLocation, removeLocation, addLocation, toast, logActivity } = useApp();
  const scores = scoreAnalysis(a);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<CandidateLocation | null>(null);
  const [draft, setDraft] = useState({ name: "", address: "", rent: 80000, sizeSqft: 900, lat: 12.8698, lng: 74.8686 });
  const [searchQ, setSearchQ] = useState("");
  const [places, setPlaces] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setSearchQ(val);
    if (val.trim().length < 2) {
      setPlaces([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchPlaces(val);
      setPlaces(res);
    } catch {
      setPlaces([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {a.locations.map((loc) => {
          const s = scores.find((x) => x.locationId === loc.id)!;
          return (
            <Panel key={loc.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold text-bone-100">{loc.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-bone-500"><MapPin size={11} /> {loc.address}</p>
                </div>
                <IconButton label={`Remove ${loc.name}`} onClick={() => setToDelete(loc)} className="border-transparent text-bone-500 hover:text-ember-300">
                  <Trash2 size={14} />
                </IconButton>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-ink-800/50 px-3 py-2">
                <span className="text-[11.5px] text-bone-400">Decision score</span>
                <span className="tnum font-mono text-[13.5px] font-medium text-bone-100">{s.total}/100 · {s.verdict.label}</span>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rent (₹/month)">
                    <MoneyInput value={loc.financials.rentMonthly} onCommit={(v) => { updateLocation(a.id, loc.id, { financials: { ...loc.financials, rentMonthly: v } }); }} step={5000} />
                  </Field>
                  <Field label="Size (sqft)">
                    <MoneyInput prefix="" value={loc.metrics.sizeSqft} onCommit={(v) => updateLocation(a.id, loc.id, { metrics: { ...loc.metrics, sizeSqft: Math.max(100, Math.round(v)), rentPerSqft: Math.round(loc.financials.rentMonthly / Math.max(100, v)) } })} step={50} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Parking">
                    <Select value={loc.metrics.parking} onChange={(e) => updateLocation(a.id, loc.id, { metrics: { ...loc.metrics, parking: e.target.value as typeof loc.metrics.parking } })}>
                      {["Excellent", "Good", "Limited", "Poor"].map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                  <Field label="Frontage">
                    <Select value={loc.metrics.frontage} onChange={(e) => updateLocation(a.id, loc.id, { metrics: { ...loc.metrics, frontage: e.target.value as typeof loc.metrics.frontage } })}>
                      {["Corner", "Primary", "Secondary", "Interior"].map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                  <Field label="Transit">
                    <Select value={loc.metrics.transit} onChange={(e) => updateLocation(a.id, loc.id, { metrics: { ...loc.metrics, transit: e.target.value as typeof loc.metrics.transit } })}>
                      {["High", "Medium", "Low"].map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                </div>
                <Field label={`Footfall index — ${loc.metrics.footfallIndex}/100`} hint="Composite proxy indicator; replace with counted observations after field work.">
                  <input
                    type="range" min={5} max={100} value={loc.metrics.footfallIndex}
                    onChange={(e) => updateLocation(a.id, loc.id, { metrics: { ...loc.metrics, footfallIndex: parseInt(e.target.value) } })}
                    className="mt-1 w-full accent-brass-500"
                    aria-label={`Footfall index for ${loc.name}`}
                  />
                </Field>
                <Field label="Display name">
                  <Input value={loc.name} onChange={(e) => updateLocation(a.id, loc.id, { name: e.target.value })} />
                </Field>
              </div>
            </Panel>
          );
        })}
        {a.locations.length < 3 && (
          <button
            onClick={() => setAdding(true)}
            className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong text-bone-400 transition-colors hover:border-brass-500/40 hover:text-bone-200"
          >
            <Plus size={20} />
            <span className="text-[13.5px] font-medium">Add candidate {a.locations.length + 1} of 3</span>
          </button>
        )}
      </div>
      <p className="text-[12px] text-bone-500">{DEMO_TAG}. Edits recompute scores immediately and are saved on this device.</p>

      {adding && (
        <Panel className="border-brass-500/25">
          <PanelHeader title="New candidate" desc="A fresh candidate starts with no surrounding-business records — build the truth map as you verify." />
          
          {/* Quick Place Search */}
          <div className="relative mb-4">
            <Field label="Search Indian retail hubs / landmarks (OpenStreetMap)">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-bone-400" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="e.g. Indiranagar 100ft road, Koramangala 4th block, Bandra Linking road..."
                  className="h-9.5 w-full rounded-lg border border-line bg-ink-800 pl-9 pr-9 text-[13px] text-bone-100 placeholder:text-bone-500 focus:border-brass-400 focus:outline-none"
                />
                {isSearching && <Loader2 size={14} className="absolute right-3 animate-spin text-brass-400" />}
              </div>
            </Field>
            {places.length > 0 && (
              <div className="absolute left-0 right-0 top-[68px] z-50 max-h-48 overflow-y-auto rounded-lg border border-line-strong bg-ink-800 p-1.5 shadow-xl">
                {places.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDraft((prev) => ({
                        ...prev,
                        name: p.name,
                        address: p.displayName.slice(0, 70),
                        lat: p.lat,
                        lng: p.lng,
                      }));
                      setSearchQ(p.name);
                      setPlaces([]);
                      toast(`Selected ${p.name}`, { body: "Coordinates and address populated", tone: "info" });
                    }}
                    className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left text-[12.5px] text-bone-200 hover:bg-bone-100/5"
                  >
                    <MapPin size={13} className="mt-0.5 shrink-0 text-brass-400" />
                    <div className="min-w-0">
                      <div className="font-medium text-bone-100">{p.name}</div>
                      <div className="truncate text-[11px] text-bone-400">{p.displayName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Hampankatta Square" /></Field>
            <Field label="Address"><Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Street + landmark" /></Field>
            <Field label="Rent (₹/month)"><MoneyInput value={draft.rent} onCommit={(v) => setDraft({ ...draft, rent: v })} step={5000} /></Field>
            <Field label="Size (sqft)"><MoneyInput prefix="" value={draft.sizeSqft} onCommit={(v) => setDraft({ ...draft, sizeSqft: Math.max(100, Math.round(v)) })} step={50} /></Field>
          </div>
          <div className="mt-5 flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (draft.name.trim().length < 2) { toast("Name the candidate first", { tone: "error" }); return; }
                const base = a.locations[0];
                const centerLat = draft.lat ?? (base ? base.lat + 0.006 : 12.8698);
                const centerLng = draft.lng ?? (base ? base.lng + 0.006 : 74.8686);
                addLocation(a.id, {
                  id: uid("loc"),
                  name: draft.name.trim(),
                  address: draft.address || "Address to be confirmed",
                  micro: "Surveyed candidate site.",
                  lat: centerLat, lng: centerLng,
                  metrics: { sizeSqft: draft.sizeSqft, rentPerSqft: Math.round(draft.rent / draft.sizeSqft), footfallIndex: 55, parking: "Good", frontage: "Primary", transit: "Medium" },
                  financials: base ? { ...base.financials, rentMonthly: draft.rent } : {
                    avgPrice: 230, variableCost: 92, rentMonthly: draft.rent, salariesMonthly: 72000, utilitiesMonthly: 14000,
                    marketingMonthly: 8000, otherFixedMonthly: 7000, fitOutCost: 850000, equipmentCost: 540000,
                    depositMonths: 6, licencesCost: 50000, preOpeningCost: 90000, workingCapitalMonths: 3, operatingDays: 30,
                  },
                  nearby: [], risks: [], missingInfo: ["Footfall count pending on-site observation", "Lease terms tentative"],
                });
                logActivity(a.id, `Added candidate location “${draft.name.trim()}”.`, "edit");
                toast("Candidate added", { body: "Records ready for surveying on Market Explorer." });
                setAdding(false);
                setDraft({ name: "", address: "", rent: 80000, sizeSqft: 900, lat: 12.8698, lng: 74.8686 });
                setSearchQ("");
              }}
            >
              <Plus size={14} /> Add candidate
            </Button>
          </div>
        </Panel>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            removeLocation(a.id, toDelete.id);
            logActivity(a.id, `Removed candidate “${toDelete.name}”.`, "edit");
            toast("Candidate removed", { tone: "info" });
          }
        }}
        title="Remove candidate?"
        body={<>“{toDelete?.name}”, its records and any scenarios anchored to it will be removed from this analysis.</>}
        confirmLabel="Remove"
      />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" to={`/app/analyses/${a.id}/market-explorer`}>
          <TrendingUp size={14} /> Explore the market map <ArrowRight size={13} />
        </Button>
      </div>
      <span className="sr-only"><Activity /></span>
    </div>
  );
}
