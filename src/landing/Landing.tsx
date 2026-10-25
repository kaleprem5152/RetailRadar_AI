import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Banknote, CircleHelp, ClipboardCheck, Footprints,
  Landmark, Layers, MapPin, Play, Radar as RadarIcon, Scale, ShieldAlert, Store, TrendingUp,
} from "lucide-react";
import CityScene from "./CityScene";
import { Badge, Button, Panel, StatusBadge, Meter } from "../components/ui";
import { CountUp, Eyebrow, Reveal, ScoreRing } from "../components/chrome";
import MapView from "../components/MapView";
import { seedAnalyses } from "../data/seed";
import { computeFeasibility } from "../lib/finance";
import { scoreAnalysis } from "../lib/scoring";
import { fmtINR, fmtINRCompact, fmtNum, DEMO_TAG, cn } from "../lib/utils";
import { useApp } from "../store/AppStore";

const DEMO = seedAnalyses()[0];

const TICKER = [
  ["Footfall index", "71 / 100"],
  ["Quoting rent", "₹71 / sqft"],
  ["Break-even", "47 sales/day"],
  ["Competitors in radius", "4 mapped"],
  ["Records verified", "56%"],
  ["Startup cash", "₹28.1L"],
  ["Rent-to-revenue", "11.4%"],
  ["Open questions", "1 pending"],
];

export default function Landing() {
  const { session, isAuthReady } = useApp();

  // If user is logged in, redirect directly to workspace
  if (isAuthReady && session) {
    return <Navigate to="/app" replace />;
  }

  return (
    <main className="overflow-hidden">
      <Hero />
      <TickerStrip />
      <Problem />
      <HowItWorks />
      <MarketShowcase />
      <FinanceShowcase />
      <DecisionShowcase />
      <TruthShowcase />
      <SampleComparison />
      <FinalCTA />
    </main>
  );
}

/* ── 1 · Hero ────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden">
      <div className="grid-paper absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(1100px 620px at 72% 30%, rgba(217,164,65,0.07), transparent 60%), radial-gradient(900px 500px at 20% 80%, rgba(127,161,196,0.05), transparent 65%), linear-gradient(180deg, rgba(10,11,14,0) 55%, #0a0b0e 96%)",
        }}
      />
      {/* 3D diorama */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[62%] overflow-hidden pointer-events-none">
        <CityScene className="h-full w-full opacity-70 lg:opacity-100" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/35 to-transparent lg:via-ink-900/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-900 to-transparent" />
        {/* radar annotation chips */}
        <div className="pointer-events-none absolute right-[14%] top-[22%] hidden animate-[drift_7s_ease-in-out_infinite] xl:block">
          <Annotation label="Subject site" value="45-seat specialty coffee" tone="brass" />
        </div>
        <div className="pointer-events-none absolute right-[36%] top-[58%] hidden animate-[drift_8s_ease-in-out_infinite] xl:block" style={{ animationDelay: "-2.4s" }}>
          <Annotation label="Competitor" value="240 m · verified" tone="ember" />
        </div>
        <div className="pointer-events-none absolute right-[8%] top-[64%] hidden animate-[drift_9s_ease-in-out_infinite] xl:block" style={{ animationDelay: "-4.1s" }}>
          <Annotation label="Trade area" value="500 m survey radius" tone="steel" />
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1440px] flex-col justify-center px-6 pb-28 pt-32 lg:px-12">
        <Reveal>
          <div className="flex items-center gap-2.5">
            <Badge tone="brass" className="rounded-full px-3 py-1">
              <RadarIcon size={12} /> Commercial location intelligence
            </Badge>
            <Badge tone="outline" className="hidden rounded-full px-3 py-1 sm:inline-flex">Triwizathon · Round 2</Badge>
          </div>
        </Reveal>
        <Reveal delay={90}>
          <h1 className="font-display mt-7 max-w-[13ch] text-[clamp(2.6rem,6.4vw,5rem)] font-light leading-[1.04] tracking-[-0.015em] text-bone-100">
            Find the right location.{" "}
            <em className="font-normal not-italic text-bone-100">
              Before you make the <span className="italic text-brass-300">investment.</span>
            </em>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p className="mt-6 max-w-xl text-[15.5px] leading-[1.75] text-bone-300">
            RetailRadar AI helps founders and operators compare candidate sites, read the competition
            around them, prove the financial feasibility on paper — and flag exactly what still needs
            to be verified on the ground.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <Button size="lg" to="/app/analyses/new">
              Analyze a location <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="outline" to="/sample-analysis">
              <Play size={14} className="text-brass-400" /> Explore the demo
            </Button>
          </div>
        </Reveal>
        <Reveal delay={340}>
          <dl className="mt-14 flex max-w-2xl flex-wrap gap-x-10 gap-y-5">
            {[
              { v: 3, s: "", l: "candidate sites scored head-to-head" },
              { v: 5, s: "", l: "weighted components in every decision score" },
              { v: 100, s: "%", l: "of records labelled verified — or not" },
            ].map(({ v, s, l }) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="tnum font-mono text-2xl font-medium text-bone-100">
                  <CountUp to={v} suffix={s} />
                </dd>
                <dd className="mt-1 max-w-[180px] text-[12.5px] leading-snug text-bone-400">{l}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <div className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-bone-500 lg:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-bone-500/60 to-transparent" />
      </div>
    </section>
  );
}

function Annotation({ label, value, tone }: { label: string; value: string; tone: "brass" | "ember" | "steel" }) {
  const colors = { brass: "border-brass-500/40 text-brass-300", ember: "border-ember-500/40 text-ember-300", steel: "border-steel-500/40 text-steel-300" };
  return (
    <div className={cn("rounded-lg border bg-ink-950/70 px-3 py-2 backdrop-blur-md", colors[tone])}>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] opacity-80">{label}</div>
      <div className="mt-0.5 text-[12px] font-medium text-bone-100">{value}</div>
    </div>
  );
}

/* ── Ticker ──────────────────────────────────────────────── */
function TickerStrip() {
  const row = [...TICKER, ...TICKER];
  return (
    <div className="relative border-y border-line bg-ink-950 py-3.5">
      <div className="flex overflow-hidden" aria-hidden>
        <div className="flex shrink-0 items-center gap-10 pr-10 animate-[ticker_30s_linear_infinite]">
          {row.map(([k, v], i) => (
            <div key={i} className="flex items-center gap-3 whitespace-nowrap">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-bone-500">{k}</span>
              <span className="tnum font-mono text-[13px] font-medium text-brass-300">{v}</span>
              <span className="ml-7 size-1 rounded-full bg-line-strong" />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink-950 to-transparent" />
    </div>
  );
}

/* ── 2 · Problem ─────────────────────────────────────────── */
function Problem() {
  return (
    <section className="relative mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div>
          <Reveal><Eyebrow>The problem</Eyebrow></Reveal>
          <Reveal delay={80}>
            <h2 className="font-display mt-6 text-[clamp(1.9rem,3.6vw,2.9rem)] font-light leading-[1.15] tracking-tight text-bone-100">
              A lease is the one business decision
              you <span className="italic text-brass-300">cannot A/B test.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-6 max-w-lg text-[15px] leading-[1.8] text-bone-300">
              Retailers still choose sites on broker promises, a hunch and an afternoon of footfall-watching.
              The numbers arrive after the deposit is paid. RetailRadar AI moves the discipline to
              before the commitment: comparable evidence, honest math, and a record of what you
              actually verified versus what you merely assumed.
            </p>
          </Reveal>
        </div>
        <div className="flex flex-col justify-center gap-px overflow-hidden rounded-xl border border-line">
          {[
            {
              n: "₹28–45L", t: "Committed before day one",
              d: "Fit-out, equipment, deposits and opening stock are sunk before the first sale proves the street.",
              icon: <Banknote size={17} />,
            },
            {
              n: "68%", t: "Of failed stores misread the trade area",
              d: "Directional traffic, day-part swings and anchor closures quietly redraw demand — intuition rarely catches it.",
              icon: <Footprints size={17} />,
            },
            {
              n: "3–5 yrs", t: "Locked into the wrong micro-market",
              d: "Lock-in clauses and escalation schedules turn an early mistake into half a decade of drag.",
              icon: <ShieldAlert size={17} />,
            },
          ].map((s, i) => (
            <Reveal key={s.t} delay={i * 90}>
              <div className="group flex gap-5 bg-ink-850 p-6 transition-colors duration-300 hover:bg-ink-800">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-800 text-brass-400 transition-colors group-hover:border-brass-500/30">{s.icon}</div>
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="tnum font-mono text-xl font-medium text-bone-100">{s.n}</span>
                    <span className="text-[13.5px] font-medium text-bone-200">{s.t}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-bone-400">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <p className="mt-10 text-[12px] italic text-bone-500">Illustrative figures for this prototype, drawn from the demo dataset — {DEMO_TAG}.</p>
    </section>
  );
}

/* ── 3 · How it works ────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { icon: <Store size={17} />, t: "Define the format", d: "Business category, concept, target ticket and the daily sales you believe the concept can do." },
    { icon: <MapPin size={17} />, t: "Shortlist candidates", d: "Up to three locations per analysis, each with rent, size and surrounding-business context." },
    { icon: <Scale size={17} />, t: "Model feasibility", d: "Contribution per sale, break-even volumes and startup cash — recomputed live as you edit." },
    { icon: <BadgeCheck size={17} />, t: "Verify, then decide", d: "A field checklist and Local Truth Map separate verified evidence from assumption — then score, compare and report." },
  ];
  return (
    <section className="border-y border-line bg-ink-950/60">
      <div className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal><Eyebrow>Method</Eyebrow></Reveal>
            <Reveal delay={80}>
              <h2 className="font-display mt-6 text-[clamp(1.9rem,3.6vw,2.9rem)] font-light leading-[1.15] tracking-tight text-bone-100">
                From street corner to <span className="italic text-brass-300">decision report</span>
                <br className="hidden md:block" /> in four deliberate moves.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={150}>
            <Button variant="outline" to="/how-it-works">
              Full workflow <ArrowUpRight size={14} />
            </Button>
          </Reveal>
        </div>
        <ol className="mt-16 grid gap-10 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 100} className="relative">
              <div className="flex items-center gap-4">
                <span className="font-display text-[44px] font-light leading-none text-ink-500">{String(i + 1).padStart(2, "0")}</span>
                <span className="h-px flex-1 bg-line" />
                <span className="flex size-10 items-center justify-center rounded-lg border border-line bg-ink-850 text-brass-400">{s.icon}</span>
              </div>
              <h3 className="mt-5 text-[16px] font-semibold tracking-tight text-bone-100">{s.t}</h3>
              <p className="mt-2 text-[13.5px] leading-[1.7] text-bone-400">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── 4 · Market explorer showcase ────────────────────────── */
function MarketShowcase() {
  const [selected, setSelected] = useState(DEMO.locations[1].id);
  const loc = DEMO.locations.find((l) => l.id === selected)!;
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
        <div>
          <Reveal><Eyebrow>Market explorer</Eyebrow></Reveal>
          <Reveal delay={80}>
            <h2 className="font-display mt-6 text-[clamp(1.8rem,3.4vw,2.7rem)] font-light leading-[1.18] tracking-tight text-bone-100">
              Read the street before
              <br />you <span className="italic text-brass-300">walk it.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-5 max-w-md text-[15px] leading-[1.8] text-bone-300">
              Each candidate anchors a survey radius. Competitors, anchors and neighbours appear in
              context — filter by category, adjust the radius, and see precisely how much of the
              picture is verified evidence.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <ul className="mt-8 space-y-3.5">
              {[
                "1–3 subject candidates with a live 500 m trade-area ring",
                "Every POI tagged by source: open data, field survey, or added by your team",
                "Distance from subject computed for every surrounding business",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-bone-300">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brass-500" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-8 flex flex-wrap gap-2">
              {DEMO.locations.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelected(l.id)}
                  className={cn(
                    "rounded-lg border px-3.5 py-2 text-[12.5px] font-medium transition-all",
                    l.id === selected
                      ? "border-brass-500/50 bg-brass-500/10 text-brass-300"
                      : "border-line bg-ink-850 text-bone-400 hover:border-line-strong hover:text-bone-100"
                  )}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={140}>
          <div className="relative">
            <MapView
              center={[loc.lat, loc.lng]}
              zoom={15}
              locations={DEMO.locations.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, name: l.name }))}
              selectedId={selected}
              onSelect={setSelected}
              nearby={loc.nearby}
              radiusM={500}
              radiusCenter={[loc.lat, loc.lng]}
              height={460}
              fitKey={selected}
            />
            <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-line bg-ink-950/85 px-3.5 py-2.5 backdrop-blur">
              <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-bone-500">Trade area</div>
              <div className="mt-0.5 text-[13px] font-semibold text-bone-100">{loc.name}</div>
              <div className="mt-1 flex items-center gap-2 text-[11.5px] text-bone-400">
                <span className="size-1.5 rounded-full bg-ember-400" /> competitor
                <span className="size-1.5 rounded-full bg-steel-400" /> neighbour
                <span className="size-1.5 rounded-full border border-dashed border-bone-400" /> unverified
              </div>
            </div>
            <p className="mt-3 text-[12px] text-bone-500">Interactive preview · {DEMO_TAG}. Titles require a network connection.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 5 · Financial feasibility showcase (live math) ──────── */
function FinanceShowcase() {
  const base = DEMO.locations[1].financials;
  const [rent, setRent] = useState(base.rentMonthly);
  const [price, setPrice] = useState(base.avgPrice);
  const [volume, setVolume] = useState(DEMO.profile.targetDailySales);

  const feas = useMemo(
    () => computeFeasibility({ ...base, rentMonthly: rent, avgPrice: price }, volume),
    [base, rent, price, volume]
  );

  const sliders: { label: string; value: number; set: (v: number) => void; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
    { label: "Monthly rent", value: rent, set: setRent, min: 40000, max: 160000, step: 2500, fmt: (v) => fmtINR(v) },
    { label: "Average price / sale", value: price, set: setPrice, min: 150, max: 320, step: 5, fmt: (v) => fmtINR(v) },
    { label: "Expected daily sales", value: volume, set: setVolume, min: 40, max: 160, step: 2, fmt: (v) => `${v}/day` },
  ];

  return (
    <section className="relative border-y border-line bg-ink-950/60">
      <div className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <Reveal>
            <Panel className="relative overflow-hidden p-0">
              <div className="border-b border-line px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-bone-500">Live feasibility engine</div>
                    <div className="mt-1 text-[15px] font-semibold text-bone-100">Nanthoor Junction · Kadri — candidate model</div>
                  </div>
                  <Badge tone="outline">{DEMO_TAG}</Badge>
                </div>
              </div>
              <div className="grid gap-8 px-6 py-7 sm:grid-cols-2">
                <div className="space-y-6">
                  {sliders.map((s) => (
                    <div key={s.label}>
                      <div className="flex items-baseline justify-between">
                        <label className="text-[12.5px] font-medium text-bone-300">{s.label}</label>
                        <span className="tnum font-mono text-[13.5px] text-brass-300">{s.fmt(s.value)}</span>
                      </div>
                      <input
                        type="range"
                        min={s.min}
                        max={s.max}
                        step={s.step}
                        value={s.value}
                        onChange={(e) => s.set(parseFloat(e.target.value))}
                        className="mt-2.5 w-full accent-brass-500"
                        aria-label={s.label}
                      />
                    </div>
                  ))}
                  <p className="text-[12px] leading-relaxed text-bone-500">
                    Drag the levers — every output recomputes instantly, exactly as it does inside the workspace.
                  </p>
                </div>
                <div className="grid content-start gap-4">
                  <MiniStat label="Contribution / sale" value={fmtINR(feas.contribution)} sub={`${(feas.margin * 100).toFixed(0)}% contribution margin`} />
                  <MiniStat
                    label="Break-even volume"
                    value={`${isFinite(feas.breakEvenDaily) ? feas.breakEvenDaily : "—"} sales/day`}
                    sub={`${fmtNum(feas.breakEvenMonthly)} sales / month against ${fmtINR(feas.fixedMonthly)} fixed costs`}
                  />
                  <MiniStat label="Startup cash required" value={fmtINRCompact(feas.startupCash)} sub="Fit-out, equipment, deposit, licences, 3-month buffer" />
                  <div className="rounded-lg border border-line bg-ink-800/70 p-4">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-bone-400">Target headroom over break-even</span>
                      <span className={cn("tnum font-mono font-medium", feas.targetHeadroomPct >= 25 ? "text-sage-300" : feas.targetHeadroomPct >= 0 ? "text-brass-300" : "text-ember-300")}>
                        {feas.targetHeadroomPct.toFixed(0)}%
                      </span>
                    </div>
                    <Meter value={Math.min(100, Math.max(0, feas.targetHeadroomPct))} className="mt-2.5" tone={feas.targetHeadroomPct >= 25 ? "sage" : "brass"} />
                  </div>
                </div>
              </div>
            </Panel>
          </Reveal>
          <div>
            <Eyebrow>Financial feasibility</Eyebrow>
            <h2 className="font-display mt-6 text-[clamp(1.8rem,3.4vw,2.7rem)] font-light leading-[1.18] tracking-tight text-bone-100">
              The math is <span className="italic text-brass-300">honest,</span>
              <br />or it isn’t in the room.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-[1.8] text-bone-300">
              RetailRadar AI derives contribution per sale, monthly and daily break-even, and total
              startup cash from fourteen transparent assumptions — never a black-box score. Change the
              rent, and the decision changes in front of you.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line">
              {[
                { icon: <Landmark size={15} />, t: "Startup cash", d: "One-time setup + deposit + working buffer" },
                { icon: <TrendingUp size={15} />, t: "Break-even", d: "Daily and monthly sales needed to survive" },
                { icon: <Scale size={15} />, t: "Rent-to-revenue", d: "Affordability tested against your own target" },
                { icon: <Layers size={15} />, t: "What-if scenarios", d: "Saved alternates beside the baseline" },
              ].map((f) => (
                <div key={f.t} className="bg-ink-850 p-5">
                  <span className="flex size-8 items-center justify-center rounded-md border border-line bg-ink-800 text-brass-400">{f.icon}</span>
                  <div className="mt-3 text-[13.5px] font-semibold text-bone-100">{f.t}</div>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-bone-400">{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-800/70 p-4">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-bone-500">{label}</div>
      <div className="tnum mt-1.5 font-mono text-[19px] font-medium text-bone-100">{value}</div>
      <div className="mt-1 text-[12px] leading-snug text-bone-400">{sub}</div>
    </div>
  );
}

/* ── 6 · Decision intelligence showcase ──────────────────── */
function DecisionShowcase() {
  const scores = scoreAnalysis(DEMO);
  const lead = scores[1]; // Nanthoor — strongest
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <Reveal><Eyebrow>Decision intelligence</Eyebrow></Reveal>
          <Reveal delay={80}>
            <h2 className="font-display mt-6 text-[clamp(1.8rem,3.4vw,2.7rem)] font-light leading-[1.18] tracking-tight text-bone-100">
              A score you can
              <br /><span className="italic text-brass-300">cross-examine.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-5 max-w-md text-[15px] leading-[1.8] text-bone-300">
              Every candidate earns a weighted decision score from five declared components — demand,
              competition context, affordability, access, and evidence confidence. Missing information
              lowers the evidence component; it is never silently assumed away.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-8 space-y-3">
              {lead.components.map((c) => (
                <div key={c.key}>
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="text-bone-300">{c.label} <span className="text-bone-500">· w{c.weight}%</span></span>
                    <span className="tnum font-mono text-bone-200">{c.score}/100</span>
                  </div>
                  <Meter value={c.score} className="mt-1.5" tone={c.score >= 70 ? "sage" : c.score >= 45 ? "brass" : "ember"} />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={140}>
          <div className="grid gap-4 sm:grid-cols-3">
            {scores.map((s, i) => {
              const loc = DEMO.locations.find((l) => l.id === s.locationId)!;
              return (
                <Panel key={s.locationId} className={cn("flex flex-col items-center text-center", i === 1 && "border-brass-500/30 bg-brass-500/[0.04]")}>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-bone-500">Candidate {String.fromCharCode(65 + i)}</span>
                  <div className="mt-1.5 text-[13.5px] font-semibold leading-snug text-bone-100">{loc.name}</div>
                  <div className="mt-4">
                    <ScoreRing score={s.total} size={96} tone={s.total >= 65 ? "sage" : s.total >= 50 ? "brass" : "ember"} />
                  </div>
                  <div className="mt-3 text-[12px] font-medium text-bone-300">{s.verdict.label}</div>
                  <div className="tnum mt-1 font-mono text-[11px] text-bone-500">
                    BE {isFinite(scoreFeasible(loc.id)) ? scoreFeasible(loc.id) : "—"}/day · {s.competitorCount} competitors
                  </div>
                </Panel>
              );
            })}
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="outline" size="sm" to="/sample-analysis">
              Open the full comparison <ArrowRight size={13} />
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function scoreFeasible(locId: string): number {
  const loc = DEMO.locations.find((l) => l.id === locId)!;
  return computeFeasibility(loc.financials, DEMO.profile.targetDailySales).breakEvenDaily;
}

/* ── 7 · Local truth map / evidence transparency ─────────── */
function TruthShowcase() {
  const records = DEMO.locations[0].nearby.slice(0, 5);
  return (
    <section className="relative border-y border-line bg-ink-950/60">
      <div className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
        <div className="grid items-center gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <Reveal>
            <Panel pad={false} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div>
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-bone-500">Local truth map</div>
                  <div className="mt-1 text-[15px] font-semibold text-bone-100">Balmatta High Street — surrounding records</div>
                </div>
                <Badge tone="outline">{DEMO_TAG}</Badge>
              </div>
              <ul className="divide-y divide-line-soft">
                {records.map((r) => (
                  <li key={r.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-ink-800/50">
                    <span className={cn("size-2 shrink-0 rounded-full", r.competitor ? "bg-ember-400" : "bg-steel-400")} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-bone-100">{r.name}</div>
                      <div className="mt-0.5 text-[12px] text-bone-500">{r.category} · {r.distanceM} m</div>
                    </div>
                    {r.note && <span className="hidden max-w-[220px] truncate text-[12px] italic text-bone-400 md:block">“{r.note}”</span>}
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
              <div className="border-t border-line bg-ink-800/40 px-6 py-3.5 text-[12px] text-bone-400">
                Dashed, unverified records lower the evidence score until someone walks the street.
              </div>
            </Panel>
          </Reveal>
          <div>
            <Reveal><Eyebrow>Evidence transparency</Eyebrow></Reveal>
            <Reveal delay={80}>
              <h2 className="font-display mt-6 text-[clamp(1.8rem,3.4vw,2.7rem)] font-light leading-[1.18] tracking-tight text-bone-100">
                Know what you know —
                <br />and what you <span className="italic text-brass-300">don’t.</span>
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-5 max-w-md text-[15px] leading-[1.8] text-bone-300">
                Open map data is a starting point, not a conclusion. The Local Truth Map lets your team
                add what the databases miss and upgrade records from <em>unverified</em> to
                <em> field-observed</em> to <em>verified</em> — with the difference visible everywhere,
                including the final report.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <div className="mt-8 space-y-4">
                {[
                  { icon: <ClipboardCheck size={16} />, t: "Field verification checklist", d: "Accessibility, visibility, competitors, surroundings and lease checks — with issues raised inline." },
                  { icon: <CircleHelp size={16} />, t: "Missing-information register", d: "Open questions attach to each candidate and echo into the decision score's evidence component." },
                ].map((f) => (
                  <div key={f.t} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-850 text-brass-400">{f.icon}</span>
                    <div>
                      <div className="text-[14px] font-semibold text-bone-100">{f.t}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-bone-400">{f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 8 · Interactive sample comparison ───────────────────── */
function SampleComparison() {
  const [idx, setIdx] = useState(1);
  const loc = DEMO.locations[idx];
  const score = scoreAnalysis(DEMO).find((s) => s.locationId === loc.id)!;
  const feas = computeFeasibility(loc.financials, DEMO.profile.targetDailySales);
  const cells: [string, string][] = [
    ["Quoting rent", `${fmtINR(loc.financials.rentMonthly)}/mo`],
    ["Break-even", `${isFinite(feas.breakEvenDaily) ? feas.breakEvenDaily + "/day" : "—"}`],
    ["Startup cash", fmtINRCompact(feas.startupCash)],
    ["Competitors mapped", String(score.competitorCount)],
    ["Evidence verified", `${Math.round(score.verifiedShare * 100)}%`],
    ["Open questions", String(score.missing.length)],
  ];
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
      <Reveal className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-brass-500/60" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-brass-400">Try it</span>
          <span className="h-px w-8 bg-brass-500/60" />
        </div>
        <h2 className="font-display mx-auto mt-6 max-w-2xl text-[clamp(1.9rem,3.6vw,2.9rem)] font-light leading-[1.15] tracking-tight text-bone-100">
          Three corners. One decision.
          <span className="italic text-brass-300"> Compare them yourself.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[14.5px] leading-[1.75] text-bone-400">
          A working slice of the comparison engine, computed live from the demo analysis
          “Ka'sara Brew Co. — Second outlet”.
        </p>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {DEMO.locations.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setIdx(i)}
              className={cn(
                "rounded-full border px-5 py-2.5 text-[13px] font-medium transition-all duration-300",
                i === idx ? "border-brass-500/60 bg-brass-500/12 text-brass-300" : "border-line bg-ink-850 text-bone-400 hover:border-line-strong hover:text-bone-100"
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={200}>
        <Panel className="mx-auto mt-8 max-w-4xl overflow-hidden" pad={false}>
          <div className="grid md:grid-cols-[240px_1fr]">
            <div className="flex flex-col items-center justify-center border-b border-line p-8 md:border-b-0 md:border-r">
              <ScoreRing score={score.total} size={132} tone={score.total >= 65 ? "sage" : score.total >= 50 ? "brass" : "ember"} label="decision score" />
              <div className="mt-4 text-[13px] font-semibold text-bone-100">{score.verdict.label}</div>
              <div className="mt-1 text-center text-[11.5px] text-bone-500">Weighted across 5 components</div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line-soft sm:grid-cols-3">
              {cells.map(([k, v]) => (
                <div key={k} className="bg-ink-850 p-5">
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-bone-500">{k}</div>
                  <div className="tnum mt-1.5 font-mono text-[17px] font-medium text-bone-100">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-ink-800/40 px-6 py-4">
            <span className="text-[12px] text-bone-500">{loc.address} · demo data, fictional records</span>
            <Button variant="outline" size="sm" to="/sample-analysis">
              Inspect the full analysis <ArrowRight size={13} />
            </Button>
          </div>
        </Panel>
      </Reveal>
    </section>
  );
}

/* ── 9 · Final CTA ───────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-line">
      <div className="grid-paper absolute inset-0 opacity-60" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(700px 320px at 50% 110%, rgba(217,164,65,0.12), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-4xl px-5 py-28 text-center lg:py-36">
        <Reveal>
          <h2 className="font-display text-[clamp(2.1rem,5vw,3.6rem)] font-light leading-[1.1] tracking-tight text-bone-100">
            The street will not wait.
            <br />
            <span className="italic text-brass-300">Decide with evidence.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-[1.8] text-bone-300">
            Run your first analysis in minutes. Bring one to three candidate addresses —
            leave with a defensible, printable decision report.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap justify-center gap-3.5">
            <Button size="lg" to="/app/analyses/new">
              Analyze a location <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="outline" to="/sample-report">
              View a sample report <ArrowUpRight size={15} />
            </Button>
          </div>
        </Reveal>
        <Reveal delay={260}>
          <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.2em] text-bone-500">
            Free to explore · demo data · no sign-up required for the walkthrough
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function DemoDataStrip() {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-line bg-ink-950 px-5 py-2.5 text-center font-mono text-[10.5px] uppercase tracking-[0.16em] text-bone-500">
      <Store size={11} className="text-brass-500" /> {DEMO_TAG} — do not treat as live market information
    </div>
  );
}
