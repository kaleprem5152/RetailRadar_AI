import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, ChevronDown, Database, Download, FileText, Landmark,
  LifeBuoy, Printer, RefreshCcw, Save, ShieldCheck, Store, Trash2, User, Wand2,
} from "lucide-react";
import { Badge, Button, ConfirmDialog, Field, IconButton, Input, Panel, PanelHeader, Switch } from "../components/ui";
import { useApp } from "../store/AppStore";
import { cn, timeAgo } from "../lib/utils";

function PageHead({ eyebrow, title, desc, action }: { eyebrow: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-brass-400">{eyebrow}</p>
        <h1 className="font-display mt-2 text-[26px] font-light tracking-tight text-bone-100">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-bone-400">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Reports ─────────────────────────────────────────────── */
export function ReportsPage() {
  const { reports, getAnalysis, deleteReport, toast } = useApp();
  const [toDelete, setToDelete] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHead eyebrow="Reports" title="Saved decision reports" desc="Snapshots you chose to keep. Open any to reprint or export to PDF." />
      <div className="space-y-3">
        {reports.map((r) => {
          const a = getAnalysis(r.analysisId);
          return (
            <Panel key={r.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-800 text-brass-400">
                <FileText size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14.5px] font-semibold text-bone-100">{r.title}</h3>
                <p className="mt-0.5 text-[12.5px] text-bone-400">{r.verdict}</p>
                <p className="mt-0.5 text-[11.5px] text-bone-500">Saved {timeAgo(r.createdAt)}{a ? ` · from “${a.title}”` : " · analysis removed"}</p>
              </div>
              {a && (
                <Button variant="outline" size="sm" to={`/app/analyses/${a.id}/report`}>
                  <Printer size={13} /> Open & print
                </Button>
              )}
              <IconButton label="Delete report" onClick={() => setToDelete(r.id)} className="hover:text-ember-300"><Trash2 size={14} /></IconButton>
            </Panel>
          );
        })}
        {reports.length === 0 && (
          <Panel className="py-14 text-center">
            <FileText size={22} className="mx-auto text-bone-500" />
            <h3 className="mt-3 text-[15px] font-semibold text-bone-100">No reports saved yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-bone-400">Open any analysis, review the decision report and save it to keep a snapshot here.</p>
            <Button className="mt-4" size="sm" to="/app/analyses">Browse analyses</Button>
          </Panel>
        )}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) { deleteReport(toDelete); toast("Report deleted", { tone: "info" }); } }}
        title="Delete saved report?"
        body="The report snapshot will be removed. The underlying analysis is unaffected."
      />
    </div>
  );
}

/* ── Settings hub ────────────────────────────────────────── */
export function SettingsPage() {
  const { analyses, reports, isCloudConnected } = useApp();
  const [resetOpen, setResetOpen] = useState(false);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHead eyebrow="Settings" title="Workspace settings" desc="Profile, preferences and data controls for this demo workspace." />
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { to: "/app/settings/profile", icon: <User size={17} />, t: "Profile", d: "Name, organisation and the identity signed onto reports." },
          { to: "/app/settings/preferences", icon: <Wand2 size={17} />, t: "Preferences", d: "Interface defaults and workspace behaviour." },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="group">
            <Panel className="h-full transition-colors group-hover:border-line-strong">
              <span className="flex size-10 items-center justify-center rounded-lg border border-line bg-ink-800 text-brass-400">{c.icon}</span>
              <h3 className="mt-4 flex items-center gap-2 text-[15px] font-semibold text-bone-100">{c.t} <ArrowUpRight size={14} className="text-bone-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-bone-400">{c.d}</p>
            </Panel>
          </Link>
        ))}
      </div>

      <Panel className="mt-5">
        <PanelHeader
          title="Database & Storage Architecture"
          desc={
            isCloudConnected
              ? "Connected to Supabase PostgreSQL with real Row Level Security and authenticated user isolation."
              : "Running in persistent local database mode. Connect Supabase in .env to sync with cloud PostgreSQL."
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={isCloudConnected ? "sage" : "steel"}>
            <Database size={11} /> {isCloudConnected ? "Supabase Cloud Active" : "Local PostgreSQL Persistence"}
          </Badge>
          <Badge tone="steel">{analyses.length} analyses recorded</Badge>
          <Badge tone="steel">{reports.length} reports</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const blob = new Blob([localStorage.getItem("retailradar-state-v3") ?? "{}"], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const el = document.createElement("a");
              el.href = url;
              el.download = "retailradar-workspace.json";
              el.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={13} /> Export workspace JSON
          </Button>
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            <RefreshCcw size={13} /> Reset local state
          </Button>
        </div>
        <div className="mt-4 rounded-lg border border-line bg-ink-800/60 p-3.5 text-[12px] text-bone-400">
          <span className="font-semibold text-bone-200">Database Schema: </span>
          Full PostgreSQL migrations available in <code className="text-brass-300">supabase/schema.sql</code> (Tables: profiles, analyses, candidate_locations, nearby_businesses, scenarios, checklist_items, activity_logs, saved_reports with RLS policies).
        </div>
      </Panel>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          localStorage.removeItem("retailradar-state-v3");
          window.location.reload();
        }}
        title="Reset the workspace?"
        body="All local analyses, scenarios, verification progress and reports stored on this device will be reset."
        confirmLabel="Reset local state"
      />
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────── */
export function ProfilePage() {
  const { user, updateUser, toast } = useApp();
  const [form, setForm] = useState(user);
  const dirty = JSON.stringify(form) !== JSON.stringify(user);
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHead eyebrow="Settings" title="Profile" desc="Appears on generated reports and activity records." />
      <Panel>
        <div className="mb-6 flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-xl bg-brass-500/15 font-mono text-lg font-semibold text-brass-300">
            {form.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?"}
          </span>
          <div>
            <div className="text-[15px] font-semibold text-bone-100">{form.name || "Unnamed"}</div>
            <div className="text-[12.5px] text-bone-400">{form.role} · {form.org}</div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Role"><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
          <Field label="Organisation"><Input value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} /></Field>
        </div>
        <div className="mt-6 flex items-center gap-2.5">
          <Button disabled={!dirty} onClick={() => { updateUser(form); toast("Profile saved"); }}>
            <Save size={14} /> Save profile
          </Button>
          <Button variant="ghost" disabled={!dirty} onClick={() => setForm(user)}>Discard</Button>
          {dirty && <span className="text-[12px] text-brass-300">Unsaved changes</span>}
        </div>
      </Panel>
    </div>
  );
}

/* ── Preferences ─────────────────────────────────────────── */
const PREF_KEY = "rrai-prefs";
function loadPrefs() {
  try { return { reminders: true, banners: true, autosave: true, ...(JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}")) }; }
  catch { return { reminders: true, banners: true, autosave: true }; }
}

export function PreferencesPage() {
  const { toast, scoringWeights, updateScoringWeights } = useApp();
  const [prefs, setPrefs] = useState(loadPrefs);
  const [weights, setWeights] = useState(scoringWeights);
  const totalWeightPct = Math.round(
    (weights.D + weights.C + weights.A + weights.R + weights.P) * 100
  );

  const set = (k: keyof typeof prefs, v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
    toast("Preference saved", { tone: "info" });
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHead eyebrow="Settings" title="Preferences" desc="Stored on this device; they shape the demo workspace experience." />
      <Panel className="divide-y divide-line-soft" pad={false}>
        {[
          { k: "autosave" as const, t: "Auto-save edits", d: "Financials, checklist and truth-map edits persist immediately to this browser." },
          { k: "reminders" as const, t: "Verification reminders", d: "Surface open field checks on the dashboard until they are resolved." },
          { k: "banners" as const, t: "Demo-data ribbons", d: "Keep the “fictional data” labelling visible across analytical surfaces." },
        ].map((r) => (
          <div key={r.k} className="flex items-center justify-between gap-5 px-5 py-4">
            <div>
              <div className="text-[13.5px] font-medium text-bone-100">{r.t}</div>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-bone-400">{r.d}</p>
            </div>
            <Switch checked={prefs[r.k]} onChange={(v) => set(r.k, v)} label={r.t} />
          </div>
        ))}
      </Panel>

      {/* Configurable PRD Scoring Weights */}
      <Panel className="mt-5">
        <PanelHeader
          title="PRD Location Scoring Weights"
          desc="Site Score = D + C + A + R + P. Customize the component weights for your retail format. Total must sum to 100%."
        />
        <div className="space-y-3.5 pt-2">
          {[
            { key: "D" as const, label: "Demand Indicators [D]", desc: "Footfall proxy index, pedestrian volume, density" },
            { key: "C" as const, label: "Competition Context [C]", desc: "Healthy agglomeration vs excessive competitor saturation" },
            { key: "A" as const, label: "Accessibility & Visibility [A]", desc: "Frontage, parking ease, and transit proximity" },
            { key: "R" as const, label: "Rent Affordability [R]", desc: "Break-even target feasibility and rent-to-revenue ratio" },
            { key: "P" as const, label: "Proximity to Anchors [P]", desc: "Distance to transit hubs, office clusters, colleges, and draw anchors" },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-bone-200">{item.label}</span>
                <span className="font-mono text-bone-100">{Math.round(weights[item.key] * 100)}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={Math.round(weights[item.key] * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value) / 100;
                  setWeights((prev) => ({ ...prev, [item.key]: val }));
                }}
                className="w-full accent-brass-500"
              />
              <p className="text-[11px] text-bone-500">{item.desc}</p>
            </div>
          ))}

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <div className="text-[12px]">
              <span className="text-bone-400">Total weight: </span>
              <span className={`font-mono font-semibold ${totalWeightPct === 100 ? "text-sage-300" : "text-ember-300"}`}>
                {totalWeightPct}%
              </span>
              {totalWeightPct !== 100 && (
                <span className="ml-2 text-ember-400 text-[11px]">(Must sum to 100%)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const def = { D: 0.30, C: 0.20, A: 0.20, R: 0.20, P: 0.10 };
                  setWeights(def);
                  updateScoringWeights(def);
                }}
              >
                Reset Default
              </Button>
              <Button
                size="sm"
                disabled={totalWeightPct !== 100}
                onClick={() => updateScoringWeights(weights)}
              >
                Save Weights
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ── Help ────────────────────────────────────────────────── */
export function HelpPage() {
  const faqs = [
    { q: "Is the data persistent?", a: "Yes. RetailRadar AI connects to Supabase PostgreSQL with real Row-Level Security for cloud accounts, and maintains full local database persistence across browser sessions when running in local workspace mode." },
    { q: "How is the decision score computed?", a: "Using the PRD formula: Site Score = 0.30D + 0.20C + 0.20A + 0.20R + 0.10P (Demand 30%, Competition 20%, Accessibility 20%, Rent Affordability 20%, Proximity to Anchors 10%). Weights are fully configurable in Preferences. Missing information explicitly penalizes confidence." },
    { q: "What is the difference between verified and field-observed?", a: "Field-observed means a team member saw it on the street once. Verified means it survived an independent confirmation — a second visit, an official listing, or a landlord document. Only verified records fully count toward evidence confidence." },
    { q: "How does break-even work?", a: "Break-even sales per month = total monthly fixed costs ÷ contribution per sale (price − direct cost). Divide by operating days for the daily figure. All inputs are editable per location and recompute deterministically in code." },
    { q: "Can I damage the baseline with a scenario?", a: "No. What-if scenarios store only the deltas you choose; the baseline assumptions are preserved and shown side-by-side in the comparison table and the decision report." },
    { q: "How do I produce a PDF report?", a: "Open any analysis → Decision report → click 'Download PDF report'. A clean, board-ready vector PDF document will be generated from your actual saved analysis data." },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHead eyebrow="Support" title="Help & guidance" desc="How RetailRadar AI thinks, what the labels mean, and how to run the workflow." />
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: <ShieldCheck size={16} />, t: "Honest evidence", d: "Unverified never counts as verified." },
          { icon: <Landmark size={16} />, t: "Transparent math", d: "Every number traces to a declared assumption." },
          { icon: <BadgeCheck size={16} />, t: "Verify before sign-off", d: "The checklist gates the final decision." },
        ].map((c) => (
          <Panel key={c.t} className="p-4">
            <span className="flex size-8 items-center justify-center rounded-md border border-line bg-ink-800 text-brass-400">{c.icon}</span>
            <div className="mt-3 text-[13px] font-semibold text-bone-100">{c.t}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-bone-400">{c.d}</p>
          </Panel>
        ))}
      </div>
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {faqs.map((f, i) => <Faq key={i} q={f.q} a={f.a} defaultOpen={i === 0} />)}
      </div>
      <Panel className="mt-6 flex items-center gap-4">
        <LifeBuoy size={18} className="shrink-0 text-brass-400" />
        <p className="flex-1 text-[13px] leading-relaxed text-bone-300">
          Stuck on a real deployment? This prototype keeps all state client-side; the service layer in
          <code className="mx-1 rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[11px] text-brass-300">src/store/AppStore.tsx</code>
          is the integration point for a backend.
        </p>
        <Button variant="outline" size="sm" to="/how-it-works">Workflow guide <ArrowRight size={13} /></Button>
      </Panel>
    </div>
  );
}

function Faq({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="bg-ink-850">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-ink-800/60"
        aria-expanded={open}
      >
        <span className="text-[14px] font-medium text-bone-100">{q}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-bone-500 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[13px] leading-[1.75] text-bone-400">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Onboarding ──────────────────────────────────────────── */
export function OnboardingPage() {
  const nav = useNavigate();
  const { completeOnboarding, toast } = useApp();
  const [step, setStep] = useState(0);
  const steps = [
    { icon: <Store size={20} />, t: "Describe the concept", d: "Category, target ticket and an honest daily-sales goal. The affordability score is measured against that goal — optimism here costs you later." },
    { icon: <MapIconPlaceholder />, t: "Compare candidates honestly", d: "Add up to three sites, model finances per-site and explore the trade area. Records you can't verify stay visibly unverified and lower the confidence score." },
    { icon: <FileText size={20} />, t: "Verify on foot, then decide", d: "Run the field checklist, promote records on the Local Truth Map, and produce a printable decision report that defends itself in front of partners." },
  ];
  return (
    <div className="grid min-h-[calc(100vh-8rem)] place-items-center px-4 py-10">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-72 items-center justify-center">
          <div className="grid-paper relative size-64 overflow-hidden rounded-2xl border border-line bg-ink-850">
            <div className="absolute inset-0 grid place-items-center text-brass-400">{steps[step].icon}</div>
            <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-bone-500">Step {step + 1}/3</span>
            <span className="absolute bottom-3 right-4 size-2 rounded-full bg-brass-500 animate-[blink_2.4s_ease-in-out_infinite]" />
          </div>
        </div>
        <h2 className="font-display text-[24px] font-light tracking-tight text-bone-100">{steps[step].t}</h2>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-[1.75] text-bone-400">{steps[step].d}</p>
        <div className="mt-6 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <span key={i} className={cn("h-1 rounded-full transition-all duration-300", i === step ? "w-8 bg-brass-500" : "w-3 bg-ink-600")} />
          ))}
        </div>
        <div className="mt-7 flex justify-center gap-3">
          {step < 2 ? (
            <>
              <Button variant="ghost" onClick={() => { completeOnboarding(); nav("/app"); }}>Skip tour</Button>
              <Button onClick={() => setStep(step + 1)}>Next <ArrowRight size={15} /></Button>
            </>
          ) : (
            <Button size="lg" onClick={() => { completeOnboarding(); toast("Welcome to RetailRadar AI"); nav("/app/analyses/new"); }}>
              Start my first analysis <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MapIconPlaceholder() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 3 1.6V5.5L15 7m0 0L9 4m6 3v10" />
    </svg>
  );
}
