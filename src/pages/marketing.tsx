import {
  ArrowRight, BadgeCheck, BarChart3, Building2, ClipboardCheck, FileText, Footprints, Layers,
  MapPin, Printer, Radar, Scale, ShieldCheck, Store, Users, Wallet,
} from "lucide-react";
import { Badge, Button, Panel } from "../components/ui";
import { Eyebrow, Reveal } from "../components/chrome";

function MarketingHero({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub: string }) {
  return (
    <section className="relative overflow-hidden border-b border-line px-5 pb-20 pt-36 lg:px-8 lg:pb-24 lg:pt-44">
      <div className="grid-paper absolute inset-0 opacity-50" aria-hidden />
      <div className="absolute inset-0" aria-hidden style={{ background: "radial-gradient(800px 380px at 60% 0%, rgba(217,164,65,0.07), transparent 65%)" }} />
      <div className="relative mx-auto max-w-7xl">
        <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
        <Reveal delay={70}>
          <h1 className="font-display mt-6 max-w-3xl text-[clamp(2rem,4.6vw,3.4rem)] font-light leading-[1.1] tracking-tight text-bone-100">{title}</h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.8] text-bone-300">{sub}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────── */
export function HowItWorksPage() {
  const stages = [
    {
      n: "01", icon: <Store size={18} />, t: "Profile the concept",
      d: "Define the business category, average ticket, and an honest daily-sales target. The entire decision framework measures itself against these declared numbers — no hidden levers.",
      points: ["Category & concept statement", "Target daily sales (orders)", "Investment budget & rent ceiling"],
    },
    {
      n: "02", icon: <MapPin size={18} />, t: "Shortlist up to three candidates",
      d: "Each candidate gets its own financial sheet, micro-market metrics — footfall index, frontage, parking, transit — and a survey radius in the Market Explorer.",
      points: ["Per-location rent and size", "Trade-area survey radius", "Micro-market notes"],
    },
    {
      n: "03", icon: <Users size={18} />, t: "Map the competition",
      d: "Nearby businesses are listed with distance, category and source. Competitor mix drives the context component of the score and suggests differentiation openings.",
      points: ["Distance from subject", "Category distribution", "Source-tagged records"],
    },
    {
      n: "04", icon: <Wallet size={18} />, t: "Prove the financial feasibility",
      d: "Fourteen assumptions in; contribution, break-even volumes, startup cash and payback out — instantly. What-if stacks let you negotiate on paper before you negotiate in person.",
      points: ["Break-even sales / day & month", "Startup cash incl. deposit & buffer", "Saved what-if scenarios"],
    },
    {
      n: "05", icon: <ShieldCheck size={18} />, t: "Verify the last mile",
      d: "The Local Truth Map records what databases miss, the field checklist captures issues on foot, and evidence confidence visibly shapes the final score.",
      points: ["Unverified → observed → verified", "Accessibility, signage & lease checks", "Missing-information register"],
    },
    {
      n: "06", icon: <FileText size={18} />, t: "Decide with a defensible report",
      d: "One board-ready document: scores with methodology, finances per candidate, risks, alternatives considered, verification status and open questions — printed straight from the browser.",
      points: ["Weighted decision scores", "Evidence & risk disclosures", "Print-to-PDF layout"],
    },
  ];

  return (
    <main>
      <MarketingHero
        eyebrow="The workflow"
        title={<>Six moves from a shiny listing to a <span className="italic text-brass-300">defensible decision.</span></>}
        sub="RetailRadar AI is deliberately procedural. The process is the product: declare, compare, model, verify, decide."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <ol className="relative space-y-14 before:absolute before:bottom-8 before:left-[22px] before:top-2 before:w-px before:bg-line lg:space-y-20">
          {stages.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 40} className="relative grid gap-6 pl-14 lg:grid-cols-[280px_1fr] lg:gap-16 lg:pl-20">
              <span className="absolute left-0 top-0 flex size-11 items-center justify-center rounded-xl border border-line bg-ink-850 font-display text-[15px] text-brass-300">{s.n}</span>
              <div>
                <div className="flex items-center gap-3 text-brass-400">{s.icon}<h2 className="text-[19px] font-semibold tracking-tight text-bone-100">{s.t}</h2></div>
                <p className="mt-3 max-w-md text-[14px] leading-[1.75] text-bone-300">{s.d}</p>
              </div>
              <Panel className="flex flex-wrap content-start gap-2.5 lg:translate-y-6">
                {s.points.map((p) => <Badge key={p} tone="outline" className="px-3 py-1.5 text-[12px]">{p}</Badge>)}
              </Panel>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-20 text-center">
          <Button size="lg" to="/app/analyses/new">Run the workflow <ArrowRight size={16} /></Button>
        </Reveal>
      </section>
    </main>
  );
}

/* ── Features ────────────────────────────────────────────── */
export function FeaturesPage() {
  const features = [
    { icon: <Radar size={17} />, t: "Market Explorer", d: "Interactive trade-area map per candidate with subject markers, a live survey radius and source-tagged surrounding businesses." },
    { icon: <Users size={17} />, t: "Competitor intelligence", d: "Distances, category mix and observed notes — with differentiation opportunities derived from what is actually mapped." },
    { icon: <Wallet size={17} />, t: "Feasibility engine", d: "Contribution, break-even per day and month, startup cash, payback — recomputed as you type, per location." },
    { icon: <Layers size={17} />, t: "What-if scenarios", d: "Delta-only stacks you can save, compare and reset — the baseline is never mutated." },
    { icon: <Scale size={17} />, t: "Explainable scoring", d: "Five weighted components with visible inputs. Missing evidence reduces confidence; nothing is assumed silently." },
    { icon: <Building2 size={17} />, t: "Local Truth Map", d: "Add records databases miss and walk every entry from unverified to verified." },
    { icon: <ClipboardCheck size={17} />, t: "Field verification", d: "A practical on-foot checklist — access, visibility, competition, surroundings, lease — with inline issues and notes." },
    { icon: <Printer size={17} />, t: "Board-ready reports", d: "A composed paper report with methodology, finances, risks and open questions; prints cleanly to PDF." },
    { icon: <BarChart3 size={17} />, t: "Portfolio overview", d: "Every analysis on record with status, leading candidate and outstanding verification at a glance." },
  ];
  return (
    <main>
      <MarketingHero
        eyebrow="Capabilities"
        title={<>Everything a site decision needs. <span className="italic text-brass-300">Nothing it doesn't.</span></>}
        sub="Nine focused capabilities, one connected flow — from first shortlist to final report."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.t} delay={(i % 3) * 80}>
              <Panel className="group h-full transition-all duration-300 hover:-translate-y-1 hover:border-line-strong">
                <span className="flex size-10 items-center justify-center rounded-lg border border-line bg-ink-800 text-brass-400 transition-colors group-hover:border-brass-500/30">{f.icon}</span>
                <h3 className="mt-4 text-[15.5px] font-semibold tracking-tight text-bone-100">{f.t}</h3>
                <p className="mt-2 text-[13px] leading-[1.7] text-bone-400">{f.d}</p>
              </Panel>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-16">
          <Panel className="flex flex-wrap items-center justify-between gap-5 border-brass-500/25 bg-brass-500/[0.04]">
            <div>
              <h3 className="font-display text-[20px] font-light text-bone-100">See them working together.</h3>
              <p className="mt-1 text-[13.5px] text-bone-400">The sample analysis exercises every capability end-to-end.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" to="/sample-analysis"><Footprints size={14} className="text-brass-400" /> Sample analysis</Button>
              <Button to="/app/analyses/new">Analyze a location <ArrowRight size={15} /></Button>
            </div>
          </Panel>
        </Reveal>
      </section>
    </main>
  );
}

/* ── About ───────────────────────────────────────────────── */
export function AboutPage() {
  const team = [
    { n: "Amara Shetty", r: "Product & strategy", b: "Second-generation retail operator; signed two bad leases before building the checklist she wished she'd had." },
    { n: "Rohan Karkera", r: "Engineering & field systems", b: "Geospatial engineer. Believes every number on a map needs a source, a timestamp and a way to be wrong." },
    { n: "Devika Pai", r: "Design & research", b: "Spent three months shadowing store scouts across two cities before drawing a single screen." },
  ];
  return (
    <main>
      <MarketingHero
        eyebrow="About"
        title={<>Built by people who have <span className="italic text-brass-300">lost money on a lease.</span></>}
        sub="RetailRadar AI is a Triwizathon Round 2 project: a working prototype of the tool a small retailer deserves before signing a multi-year commitment."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <Reveal><Eyebrow>Principles</Eyebrow></Reveal>
            <div className="mt-8 space-y-8">
              {[
                ["Evidence over optimism", "Unverified records never count as verified. Missing information lowers confidence scores, visibly."],
                ["Math you can audit", "Break-even, startup cash and payback derive from fourteen declared inputs — every number traces to an assumption you can change."],
                ["The street is the database", "Open data is a sketch. The Local Truth Map and field checklist exist because the last mile of truth is walked, not queried."],
                ["Decisions, not dashboards", "The product ends in a printable, defensible report — not an infinite analytics surface."],
              ].map(([t, d], i) => (
                <Reveal key={t} delay={i * 70}>
                  <div className="flex gap-4">
                    <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-850 text-brass-400"><BadgeCheck size={15} /></span>
                    <div>
                      <h3 className="text-[15.5px] font-semibold text-bone-100">{t}</h3>
                      <p className="mt-1.5 text-[13.5px] leading-[1.75] text-bone-400">{d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <div>
            <Reveal><Eyebrow>The team</Eyebrow></Reveal>
            <div className="mt-8 space-y-4">
              {team.map((m, i) => (
                <Reveal key={m.n} delay={i * 80}>
                  <Panel className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brass-500/12 font-mono text-[13px] font-semibold text-brass-300">
                      {m.n.split(" ").map((p) => p[0]).join("")}
                    </span>
                    <div>
                      <div className="text-[14.5px] font-semibold text-bone-100">{m.n}</div>
                      <div className="text-[11.5px] uppercase tracking-[0.14em] text-bone-500">{m.r}</div>
                      <p className="mt-2 text-[13px] leading-relaxed text-bone-400">{m.b}</p>
                    </div>
                  </Panel>
                </Reveal>
              ))}
            </div>
            <Reveal delay={200}>
              <Panel className="mt-6 border-steel-500/20 bg-steel-500/[0.04]">
                <h3 className="text-[14px] font-semibold text-bone-100">Prototype disclosure</h3>
                <p className="mt-2 text-[12.5px] leading-[1.75] text-bone-400">
                  All business names, locations, rents and footfall figures in this build are fictional
                  demonstration data, labelled as such on every surface. Authentication is simulated
                  locally; no credentials leave (or enter) a server. The service layer is structured so a
                  real backend, live POI providers and payment-led demand data can replace demo content
                  without redesigning the product.
                </p>
                <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-bone-500">Triwizathon · Round 2 · 2025</p>
              </Panel>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-6 flex gap-3">
                <Button to="/app/analyses/new">Try the workspace <ArrowRight size={15} /></Button>
                <Button variant="outline" to="/sample-report"><FileText size={14} /> Sample report</Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
