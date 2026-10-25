import { useState } from "react";
import { ArrowRight, BadgeCheck, ClipboardCheck, Printer, Radar } from "lucide-react";
import { Badge, Button, Meter, Panel, PanelHeader, StatusBadge } from "../components/ui";
import { Eyebrow, Reveal, ScoreRing } from "../components/chrome";
import MapView from "../components/MapView";
import { ReportSheet } from "../app/DecisionPages";
import { useApp } from "../store/AppStore";
import { seedAnalyses } from "../data/seed";
import { rankLocations, scoreAnalysis } from "../lib/scoring";
import { computeFeasibility } from "../lib/finance";
import { cn, fmtINRCompact, DEMO_TAG } from "../lib/utils";

function useDemoAnalysis() {
  const { getAnalysis } = useApp();
  return getAnalysis("an_kaasara") ?? seedAnalyses()[0];
}

/* ── Sample analysis (guided tour of the live demo) ─────── */
export function SampleAnalysisPage() {
  const a = useDemoAnalysis();
  const scores = scoreAnalysis(a);
  const ranked = rankLocations(a);
  const [locId, setLocId] = useState(ranked[0]?.locationId ?? a.locations[0]?.id);
  const loc = a.locations.find((l) => l.id === locId) ?? a.locations[0];
  const score = scores.find((s) => s.locationId === loc.id)!;
  const confirmed = a.checklist.filter((c) => c.state === "confirmed").length;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-line px-5 pb-16 pt-32 lg:px-8 lg:pt-40">
        <div className="grid-paper absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-[1440px]">
          <Reveal><Eyebrow>Sample analysis</Eyebrow></Reveal>
          <Reveal delay={70}>
            <h1 className="font-display mt-6 max-w-3xl text-[clamp(2rem,4.6vw,3.2rem)] font-light leading-[1.12] tracking-tight text-bone-100">
              “Ka'sara Brew Co. — Second outlet”, <span className="italic text-brass-300">dissected.</span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.8] text-bone-300">
              A complete walkthrough of the demo analysis: three candidate corners in one coastal city,
              scored and stress-tested. Every figure below is computed live from the same data the
              workspace edits.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Badge tone="brass"><Radar size={11} /> Live demo dataset</Badge>
              <Badge tone="outline">{DEMO_TAG}</Badge>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
        {/* verdict cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {scores.map((s) => {
            const l = a.locations.find((x) => x.id === s.locationId)!;
            const f = computeFeasibility(l.financials, a.profile.targetDailySales);
            return (
              <Reveal key={s.locationId}>
                <Panel
                  className={cn("cursor-pointer transition-all hover:-translate-y-1", locId === s.locationId && "border-brass-500/40 bg-brass-500/[0.04]")}
                  onClick={() => setLocId(s.locationId)}
                >
                  <div className="flex items-center justify-between">
                    <ScoreRing score={s.total} size={68} tone={s.total >= 65 ? "sage" : s.total >= 50 ? "brass" : "ember"} />
                    <div className="text-right">
                      <div className="text-[14px] font-semibold text-bone-100">{l.name}</div>
                      <div className="mt-0.5 text-[11.5px] text-bone-500">{s.verdict.label}</div>
                    </div>
                  </div>
                  <div className="tnum mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 font-mono text-[11.5px] text-bone-400">
                    <span>BE {isFinite(f.breakEvenDaily) ? `${f.breakEvenDaily}/d` : "—"}</span>
                    <span>Cash {fmtINRCompact(f.startupCash)}</span>
                    <span>Rent {fmtINRCompact(l.financials.rentMonthly)}/mo</span>
                  </div>
                </Panel>
              </Reveal>
            );
          })}
        </div>

        {/* drill-in */}
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <div>
              <MapView
                center={[loc.lat, loc.lng]}
                zoom={15}
                locations={a.locations.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, name: l.name }))}
                selectedId={loc.id}
                onSelect={setLocId}
                nearby={loc.nearby}
                radiusM={500}
                radiusCenter={[loc.lat, loc.lng]}
                height={420}
                fitKey={loc.id}
              />
              <p className="mt-3 text-[12px] text-bone-500">Same map, filters and radii as the workspace Market Explorer.</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="flex h-full flex-col gap-4">
              <Panel>
                <PanelHeader title={loc.name} desc={loc.address} />
                <div className="space-y-3">
                  {score.components.map((c) => (
                    <div key={c.key}>
                      <div className="flex items-baseline justify-between text-[11.5px]">
                        <span className="text-bone-300">{c.label}</span>
                        <span className="tnum font-mono text-bone-200">{c.score}</span>
                      </div>
                      <Meter value={c.score} className="mt-1" tone={c.score >= 70 ? "sage" : c.score >= 45 ? "brass" : "ember"} />
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <div className="flex items-center justify-between text-[12.5px] text-bone-300">
                  <span className="flex items-center gap-2"><ClipboardCheck size={13} className="text-brass-400" /> Field checks confirmed</span>
                  <span className="tnum font-mono text-bone-100">{confirmed}/{a.checklist.length}</span>
                </div>
                <Meter className="mt-2" value={(confirmed / a.checklist.length) * 100} />
                <div className="mt-4 space-y-2">
                  {loc.nearby.filter((b) => b.competitor).slice(0, 3).map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                      <span className="text-bone-200">{b.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="tnum font-mono text-[11px] text-bone-500">{b.distanceM} m</span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              <div className="flex flex-wrap gap-2.5">
                <Button size="sm" to={`/app/analyses/${a.id}`}>Open in workspace <ArrowRight size={13} /></Button>
                <Button size="sm" variant="outline" to="/sample-report"><Printer size={13} /> Sample report</Button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* honesty footer */}
        <Reveal className="mt-10">
          <Panel className="flex items-start gap-3 border-steel-500/20 bg-steel-500/[0.04]">
            <BadgeCheck size={17} className="mt-0.5 shrink-0 text-steel-300" />
            <p className="text-[13px] leading-[1.75] text-bone-300">
              This walkthrough runs on the identical engine as the workspace: same scoring weights, same
              financial math, same evidence labels. Sign-up is optional — the full workspace is open for
              evaluation, and every record remains clearly fictional.
            </p>
          </Panel>
        </Reveal>
      </section>
    </main>
  );
}

/* ── Sample report ───────────────────────────────────────── */
export function SampleReportPage() {
  const a = useDemoAnalysis();
  return (
    <main className="px-5 pb-24 pt-32 lg:pt-40">
      <div className="mx-auto max-w-4xl">
        <Reveal><Eyebrow>Sample decision report</Eyebrow></Reveal>
        <Reveal delay={70}>
          <h1 className="font-display mt-6 text-[clamp(1.8rem,4vw,2.8rem)] font-light leading-[1.12] tracking-tight text-bone-100">
            The document your partner <span className="italic text-brass-300">reads before wiring money.</span>
          </h1>
        </Reveal>
        <Reveal delay={130}>
          <p className="mt-4 max-w-xl text-[14.5px] leading-[1.8] text-bone-300">
            Generated from the demo analysis below. Print it — the paper layout is composed for A4 and
            exports cleanly to PDF from any browser.
          </p>
        </Reveal>
        <div className="mt-10">
          <ReportSheet a={a} />
        </div>
      </div>
    </main>
  );
}
