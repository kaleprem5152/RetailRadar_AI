import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, Loader2, MapPin, Minus, Plus, Rocket, Search } from "lucide-react";
import { Badge, Button, Field, Input, MoneyInput, Panel, Select, Textarea } from "../components/ui";
import { defaultChecklist } from "../data/seed";
import { CATEGORY_OPTIONS, type CandidateLocation, type FinancialAssumptions } from "../lib/types";
import { FINANCE_FIELDS, computeFeasibility } from "../lib/finance";
import { cn, fmtINR, fmtINRCompact, uid } from "../lib/utils";
import { useApp } from "../store/AppStore";
import { searchPlaces, type GeocodedPlace } from "../lib/places";

const STEPS = ["Business profile", "Budget", "Candidate locations", "Financial assumptions", "Review & create"];

const SUGGESTED_SITES = [
  { name: "Pumpwell Circle", address: "Ground floor, Meridian Tower, Pumpwell", lat: 12.8853, lng: 74.8637, sizeSqft: 950, rentPerSqft: 92, micro: "Southern arterial junction; strong two-wheeler commuter flow.", footfallIndex: 68 },
  { name: "Bejai Main Road", address: "Shop 1, Capitol Crest, Bejai", lat: 12.8789, lng: 74.8472, sizeSqft: 1100, rentPerSqft: 84, micro: "Residential-commercial spine between two malls.", footfallIndex: 62 },
  { name: "Attavar Hospital Lane", address: "12-B, Attavar Service Road", lat: 12.8696, lng: 74.8501, sizeSqft: 760, rentPerSqft: 68, micro: "Hospital-district all-day demand; value-led pricing.", footfallIndex: 55 },
  { name: "Surathkal Highwayfront", address: "Unit G2, NH-66 Service Lane, Surathkal", lat: 12.9831, lng: 74.7948, sizeSqft: 1300, rentPerSqft: 55, micro: "Highway-facing format near the university belt.", footfallIndex: 49 },
  { name: "Falnir Terrace Row", address: "7, Falnir Heights, Falnir Road", lat: 12.8661, lng: 74.8579, sizeSqft: 880, rentPerSqft: 102, micro: "Upmarket residential terraces; evening café culture.", footfallIndex: 66 },
];

function defaultFinancials(rentMonthly: number): FinancialAssumptions {
  return {
    avgPrice: 230, variableCost: 92,
    rentMonthly, salariesMonthly: 72000, utilitiesMonthly: 14000, marketingMonthly: 8000, otherFixedMonthly: 7000,
    fitOutCost: 850000, equipmentCost: 540000, depositMonths: 6, licencesCost: 50000, preOpeningCost: 90000,
    workingCapitalMonths: 3, operatingDays: 30,
  };
}

interface LocDraft {
  selected: boolean;
  name: string;
  address: string;
  micro: string;
  lat: number;
  lng: number;
  sizeSqft: number;
  rentMonthly: number;
  footfallIndex: number;
}

export default function Wizard() {
  const nav = useNavigate();
  const { createAnalysis, toast, logActivity } = useApp();
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);

  const [profile, setProfile] = useState({ name: "", category: CATEGORY_OPTIONS[0], concept: "", targetDailySales: 80 });
  const [budget, setBudget] = useState({ maxInvestment: 3500000, monthlyRentCeiling: 120000 });
  const [locs, setLocs] = useState<LocDraft[]>(
    SUGGESTED_SITES.map((s) => ({
      selected: false,
      name: s.name, address: s.address, micro: s.micro, lat: s.lat, lng: s.lng,
      sizeSqft: s.sizeSqft, rentMonthly: s.rentPerSqft * s.sizeSqft, footfallIndex: s.footfallIndex,
    }))
  );
  const [fin, setFin] = useState<FinancialAssumptions>(defaultFinancials(0));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchPlaces(val);
      setSearchResults(res);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selected = locs.filter((l) => l.selected);
  const errors = {
    name: profile.name.trim().length < 2 ? "Enter a business name" : undefined,
    target: profile.targetDailySales < 1 ? "Set a daily sales target" : undefined,
    budget: budget.maxInvestment < 100000 ? "Investment ceiling looks too low" : undefined,
    locs: selected.length === 0 ? "Select at least one candidate location" : undefined,
    fin: fin.avgPrice <= fin.variableCost ? "Price must exceed direct cost per sale" : undefined,
  };
  const stepValid = [
    !errors.name && !errors.target,
    !errors.budget,
    !errors.locs,
    !errors.fin,
    true,
  ][step];

  const feasPreview = useMemo(() => {
    if (!selected.length) return null;
    const f = { ...fin, rentMonthly: Math.max(...selected.map((l) => l.rentMonthly)) };
    return computeFeasibility(f, profile.targetDailySales);
  }, [selected, fin, profile.targetDailySales]);

  const overBudget = feasPreview ? feasPreview.startupCash > budget.maxInvestment : false;

  function create() {
    const id = uid("an");
    const locations: CandidateLocation[] = selected.map((l, i) => ({
      id: uid("loc"),
      name: l.name, address: l.address, micro: l.micro, lat: l.lat, lng: l.lng,
      metrics: {
        sizeSqft: l.sizeSqft,
        rentPerSqft: Math.round(l.rentMonthly / Math.max(1, l.sizeSqft)),
        footfallIndex: l.footfallIndex,
        parking: i % 3 === 0 ? "Good" : "Limited",
        frontage: i % 2 === 0 ? "Primary" : "Secondary",
        transit: i % 2 === 0 ? "High" : "Medium",
      },
      financials: { ...fin, rentMonthly: l.rentMonthly },
      nearby: [],
      risks: [],
      missingInfo: ["No footfall data collected yet", "Competitor scan requires a field walk"],
    }));
    createAnalysis({
      id,
      title: `${profile.name.trim()} — ${selected.length === 1 ? "Single site" : `${selected.length} site shortlist`}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile,
      budget,
      locations,
      scenarios: [],
      checklist: defaultChecklist(),
      activity: [
        { id: uid("ev"), at: new Date().toISOString(), actor: "You", text: "Analysis created from the guided wizard.", kind: "create" },
      ],
    });
    logActivity(id, "Initial financial assumptions recorded.", "finance");
    toast("Analysis created", { body: "Add surrounding businesses from Market Explorer or the Local Truth Map." });
    nav(`/app/analyses/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-brass-400">New analysis</p>
      <h1 className="font-display mt-2 text-[28px] font-light tracking-tight text-bone-100">{STEPS[step]}</h1>

      {/* progress */}
      <ol className="mt-7 flex items-center gap-2" aria-label="Wizard progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-all",
                i < step
                  ? "border-sage-500/50 bg-sage-500/15 text-sage-300 hover:bg-sage-500/25"
                  : i === step
                  ? "border-brass-500/60 bg-brass-500/15 text-brass-300"
                  : "border-line bg-ink-850 text-bone-500"
              )}
              aria-label={`Step ${i + 1}: ${s}`}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </button>
            {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-sage-500/40" : "bg-line")} />}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[12.5px] text-bone-500">
        Step {step + 1} of {STEPS.length} — progress is kept if you go back.
      </p>

      <Panel className="mt-6">
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Business / brand name" error={touched ? errors.name : undefined}>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="e.g. Ka'sara Brew Co." invalid={touched && !!errors.name} />
            </Field>
            <Field label="Category">
              <Select value={profile.category} onChange={(e) => setProfile({ ...profile, category: e.target.value })}>
                {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Concept in one line" hint="What the format is, and who it serves.">
              <Textarea value={profile.concept} onChange={(e) => setProfile({ ...profile, concept: e.target.value })} placeholder="45-seat specialty coffee bar aimed at office crowds…" />
            </Field>
            <Field
              label="Target daily sales (orders/day)"
              hint="Be honest — affordability scores are measured against this number."
              error={touched ? errors.target : undefined}
            >
              <MoneyInput prefix="#" value={profile.targetDailySales} onCommit={(v) => setProfile({ ...profile, targetDailySales: Math.round(v) })} step={5} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Field label="Maximum total investment" hint="Setup cash you can commit, including deposit and buffer." error={touched ? errors.budget : undefined}>
              <MoneyInput value={budget.maxInvestment} onCommit={(v) => setBudget({ ...budget, maxInvestment: v })} step={50000} />
            </Field>
            <Field label="Monthly rent ceiling" hint="The maximum rent you would accept for any candidate.">
              <MoneyInput value={budget.monthlyRentCeiling} onCommit={(v) => setBudget({ ...budget, monthlyRentCeiling: v })} step={5000} />
            </Field>
            <div className="rounded-lg border border-line bg-ink-800/50 px-4 py-3 text-[12.5px] leading-relaxed text-bone-400">
              Candidates whose projected startup cash exceeds your ceiling are flagged, not hidden —
              sometimes the right street is worth re-negotiating the budget for.
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-[13.5px] leading-relaxed text-bone-400">
              Select or search <strong className="text-bone-100">1–3 candidate locations</strong>. Pick from curated commercial hubs or search any street, landmark, or commercial district in India.
            </p>

            {/* Real OpenStreetMap Place Search */}
            <div className="relative mt-4">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-bone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search real locations (e.g. Indiranagar, Koramangala, Bandra West, Connaught Place)..."
                  className="h-10 w-full rounded-lg border border-line bg-ink-800 pl-9 pr-9 text-[13px] text-bone-100 placeholder:text-bone-500 focus:border-brass-400 focus:outline-none"
                />
                {isSearching && <Loader2 size={14} className="absolute right-3 animate-spin text-brass-400" />}
              </div>
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-11 z-50 max-h-56 overflow-y-auto rounded-lg border border-line-strong bg-ink-800 p-1.5 shadow-2xl">
                  {searchResults.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (selected.length >= 3) {
                          toast("Maximum 3 locations allowed for direct comparison", { tone: "error" });
                          return;
                        }
                        const newSite: LocDraft = {
                          selected: true,
                          name: p.name,
                          address: p.displayName.slice(0, 80),
                          micro: `Surveyed area around ${p.name}.`,
                          lat: p.lat,
                          lng: p.lng,
                          sizeSqft: 1000,
                          rentMonthly: 90000,
                          footfallIndex: 65,
                        };
                        setLocs([newSite, ...locs]);
                        setSearchQuery("");
                        setSearchResults([]);
                        toast(`Added ${p.name}`, { body: "Selected as candidate location", tone: "success" });
                      }}
                      className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left text-[12.5px] text-bone-200 hover:bg-bone-100/5"
                    >
                      <MapPin size={14} className="mt-0.5 shrink-0 text-brass-400" />
                      <div className="min-w-0">
                        <div className="font-medium text-bone-100">{p.name}</div>
                        <div className="truncate text-[11px] text-bone-400">{p.displayName}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {locs.map((l, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    l.selected ? "border-brass-500/45 bg-brass-500/[0.05]" : "border-line bg-ink-800/40 hover:border-line-strong"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => {
                        const next = [...locs];
                        if (!l.selected && selected.length >= 3) return;
                        next[i] = { ...l, selected: !l.selected };
                        setLocs(next);
                      }}
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        l.selected ? "border-brass-500 bg-brass-500 text-ink-950" : "border-line-strong text-transparent hover:border-bone-400"
                      )}
                      aria-pressed={l.selected}
                      aria-label={`Select ${l.name}`}
                      disabled={!l.selected && selected.length >= 3}
                    >
                      <Check size={13} strokeWidth={3} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold text-bone-100">{l.name}</span>
                        <Badge tone="outline">fictional site</Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-bone-500">
                        <MapPin size={11} /> {l.address}
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-bone-400">{l.micro}</p>
                      {l.selected && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <Field label="Display name">
                            <Input value={l.name} onChange={(e) => { const n = [...locs]; n[i] = { ...l, name: e.target.value }; setLocs(n); }} />
                          </Field>
                          <Field label="Rent (₹/month)">
                            <MoneyInput value={l.rentMonthly} onCommit={(v) => { const n = [...locs]; n[i] = { ...l, rentMonthly: v }; setLocs(n); }} step={5000} />
                          </Field>
                          <Field label="Size (sqft)">
                            <MoneyInput prefix="" value={l.sizeSqft} onCommit={(v) => { const n = [...locs]; n[i] = { ...l, sizeSqft: Math.max(100, Math.round(v)) }; setLocs(n); }} step={50} />
                          </Field>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {selected.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLocs([...locs, { selected: true, name: "Custom site", address: "Enter address", micro: "Self-sourced candidate.", lat: 12.87 + Math.random() * 0.02, lng: 74.85 + Math.random() * 0.02, sizeSqft: 900, rentMonthly: 80000, footfallIndex: 50 }])
                  }
                >
                  <Plus size={14} /> Add custom candidate
                </Button>
              )}
              {selected.length > 1 && (
                <Button variant="quiet" size="sm" onClick={() => setLocs(locs.filter((l) => SUGGESTED_SITES.some((s) => s.name === l.name)).map((l) => ({ ...l, selected: false })))}>
                  <Minus size={13} /> Clear selection
                </Button>
              )}
              <span className={cn("text-[12.5px]", selected.length ? "text-brass-300" : "text-bone-500")}>
                {selected.length} of up to 3 selected
              </span>
            </div>
            {touched && errors.locs && <p className="mt-3 text-[12.5px] text-ember-300">{errors.locs}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-7">
            {(["Revenue model", "Monthly fixed costs", "One-time setup"] as const).map((g) => (
              <div key={g}>
                <h3 className="mb-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-bone-500">{g}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {FINANCE_FIELDS.filter((f) => f.group === g && f.key !== "rentMonthly").map((f) => (
                    <Field key={f.key} label={f.label} hint={f.hint}>
                      <MoneyInput
                        prefix={f.key === "depositMonths" || f.key === "workingCapitalMonths" || f.key === "operatingDays" ? "#" : "₹"}
                        value={fin[f.key]}
                        onCommit={(v) => setFin({ ...fin, [f.key]: f.key === "depositMonths" || f.key === "workingCapitalMonths" || f.key === "operatingDays" ? Math.round(v) : v })}
                        step={f.key === "depositMonths" || f.key === "workingCapitalMonths" || f.key === "operatingDays" ? 1 : 1000}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            ))}
            {touched && errors.fin && <p className="text-[12.5px] text-ember-300">{errors.fin}</p>}
          </div>
        )}

        {step === 4 && feasPreview && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line sm:grid-cols-3">
              {[
                ["Contribution / sale", fmtINR(feasPreview.contribution)],
                ["Break-even", `${isFinite(feasPreview.breakEvenDaily) ? feasPreview.breakEvenDaily : "—"} sales/day`],
                ["Startup cash (dearest site)", fmtINRCompact(feasPreview.startupCash)],
                ["Target sales", `${profile.targetDailySales}/day`],
                ["Budget ceiling", fmtINRCompact(budget.maxInvestment)],
                ["Candidates", `${selected.length}`],
              ].map(([k, v]) => (
                <div key={k as string} className="bg-ink-800/60 p-4">
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-bone-500">{k}</div>
                  <div className="tnum mt-1 font-mono text-[15px] font-medium text-bone-100">{v}</div>
                </div>
              ))}
            </div>
            {overBudget && (
              <p className="rounded-lg border border-ember-500/30 bg-ember-500/[0.08] px-4 py-3 text-[13px] leading-relaxed text-ember-300">
                Projected startup cash exceeds your stated investment ceiling. You can still create the
                analysis — adjust rents or setup costs later — but reconsider the dearest candidate.
              </p>
            )}
            <ul className="space-y-2">
              {selected.map((l) => (
                <li key={l.name} className="flex items-center gap-3 rounded-lg border border-line bg-ink-800/50 px-4 py-3">
                  <Building2 size={15} className="text-brass-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-bone-100">{l.name}</div>
                    <div className="text-[12px] text-bone-500">{l.address} · {fmtINR(l.rentMonthly)}/mo · {l.sizeSqft} sqft</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[12.5px] leading-relaxed text-bone-500">
              Additional fields — surrounding businesses, risks and missing information — are collected
              inside the analysis as you work. Every record starts <em>unverified</em>.
            </p>
          </div>
        )}
      </Panel>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => (step === 0 ? nav(-1) : setStep(step - 1))}>
          <ArrowLeft size={15} /> {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => {
              if (!stepValid) { setTouched(true); return; }
              setTouched(false);
              setStep(step + 1);
            }}
          >
            Continue <ArrowRight size={15} />
          </Button>
        ) : (
          <Button onClick={create}>
            <Rocket size={15} /> Create analysis
          </Button>
        )}
      </div>
    </div>
  );
}
