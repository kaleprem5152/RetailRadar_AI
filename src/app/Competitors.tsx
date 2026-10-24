import { useMemo, useState } from "react";
import {
  Search, Sparkles,
} from "lucide-react";
import { Button, Panel, SourceBadge, StatusBadge } from "../components/ui";
import { AnalysisFrame } from "./AnalysisPages";
import { cn } from "../lib/utils";
import type { Analysis, NearbyBusiness } from "../lib/types";
import { evaluateLocationWithAI, type AIAnalysisResult } from "../lib/ai";
import { useApp } from "../store/AppStore";

export default function CompetitorsPage() {
  return (
    <AnalysisFrame
      title="Competitor Intelligence & Cluster Saturation"
      desc="Search, filter, and audit competitors within trade area boundaries. Classify direct competitors from complementary anchors with transparent attribution."
    >
      {(a) => <CompetitorBody a={a} />}
    </AnalysisFrame>
  );
}

function CompetitorBody({ a }: { a: Analysis }) {
  const { updateNearbyBusiness, toast, logActivity } = useApp();
  const [locId, setLocId] = useState(a.locations[0]?.id ?? "");
  const [searchQ, setSearchQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [maxDistance, setMaxDistance] = useState(1200);
  const [sortBy, setSortBy] = useState<"distance" | "name">("distance");

  const loc = a.locations.find((l) => l.id === locId) ?? a.locations[0];

  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!loc) {
    return <Panel className="py-14 text-center text-[13px] text-bone-400">Add a candidate location to inspect competition.</Panel>;
  }

  // All competitors around this candidate
  const allCompetitors = useMemo(() => {
    return loc.nearby.filter((b) => b.competitor);
  }, [loc.nearby]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(allCompetitors.map((b) => b.category)))].sort();
  }, [allCompetitors]);

  const filteredCompetitors = useMemo(() => {
    return allCompetitors
      .filter((b) => b.distanceM <= maxDistance)
      .filter((b) => categoryFilter === "All" || b.category === categoryFilter)
      .filter((b) => b.name.toLowerCase().includes(searchQ.toLowerCase()) || b.category.toLowerCase().includes(searchQ.toLowerCase()))
      .sort((x, y) => {
        if (sortBy === "distance") return x.distanceM - y.distanceM;
        return x.name.localeCompare(y.name);
      });
  }, [allCompetitors, maxDistance, categoryFilter, searchQ, sortBy]);

  const nearest = allCompetitors.slice().sort((x, y) => x.distanceM - y.distanceM)[0];
  const verifiedCount = allCompetitors.filter((b) => b.status === "verified").length;

  const runAiCompetitiveAssessment = async () => {
    setAiLoading(true);
    try {
      const res = await evaluateLocationWithAI(a, loc);
      setAiResult(res);
    } catch {
      toast("AI appraisal unavailable", { tone: "error" });
    } finally {
      setAiLoading(false);
    }
  };

  const toggleCompetitorClassification = (b: NearbyBusiness) => {
    const updated = !b.competitor;
    updateNearbyBusiness(a.id, loc.id, { ...b, competitor: updated });
    logActivity(a.id, `Reclassified “${b.name}” as ${updated ? "direct competitor" : "complementary anchor"}.`, "edit");
    toast(`Reclassified record`, { body: `${b.name} marked as ${updated ? "competitor" : "neighbor"}` });
  };

  return (
    <div className="space-y-6">
      {/* ── Candidate Site Selector ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-bone-500 mr-1">Subject Site:</span>
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

        <Button
          size="sm"
          variant="secondary"
          loading={aiLoading}
          onClick={runAiCompetitiveAssessment}
          className="text-[12px]"
        >
          <Sparkles size={13} className="text-brass-300" />
          <span>AI Competitive Saturation Analysis</span>
        </Button>
      </div>

      {/* ── Key Competitive Metrics Strip ───────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel className="p-4 border-ember-500/30 bg-ember-500/[0.04]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ember-400 font-semibold">Total Direct Competitors</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-ember-300">{allCompetitors.length}</span>
            <span className="text-[11px] text-bone-400">within 1.2 km</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">In {a.profile.category} segment</span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500">Nearest Direct Competitor</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-bone-100">
              {nearest ? `${nearest.distanceM} m` : "None"}
            </span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1 truncate">
            {nearest ? nearest.name : "Isolated location"}
          </span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500">Immediate Cluster (within 400m)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-bone-100">
              {allCompetitors.filter((b) => b.distanceM <= 400).length}
            </span>
            <span className="text-[11px] text-bone-400">competitors</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">5-minute walking catchment</span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-bone-500">Field-Audited Records</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-bone-100">
              {verifiedCount} / {allCompetitors.length}
            </span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">Verified on ground</span>
        </Panel>
      </div>

      {/* ── AI Competitive Assessment Results ───────────────────── */}
      {aiResult && (
        <Panel className="border-brass-500/30 bg-brass-500/[0.03] space-y-2">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-brass-300">
            <Sparkles size={14} />
            <span>AI Competitive Threat Assessment</span>
          </div>
          <p className="text-[12.5px] leading-relaxed text-bone-200">{aiResult.summary}</p>
          <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-line/60">
            <div>
              <span className="text-[11px] font-mono uppercase text-brass-400 font-semibold">Competitive Verdict:</span>
              <p className="mt-1 text-[12px] text-bone-300 leading-relaxed">{aiResult.competitiveVerdict}</p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-ember-400 font-semibold">Key Competitive Risks:</span>
              <ul className="mt-1 text-[12px] text-bone-300 space-y-1">
                {aiResult.keyRisks.slice(0, 3).map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          </div>
        </Panel>
      )}

      {/* ── Search & Filter Controls ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-850 p-3.5">
        <div className="relative min-w-[240px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-400" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search competitor name or sub-category..."
            className="h-9 w-full rounded-lg border border-line bg-ink-800 pl-9 pr-3 text-[12.5px] text-bone-100 placeholder:text-bone-500 focus:border-brass-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-line bg-ink-800 px-3 text-bone-200 focus:outline-none"
          >
            {categories.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
          </select>

          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
            className="h-9 rounded-lg border border-line bg-ink-800 px-3 text-bone-200 focus:outline-none font-mono"
          >
            <option value={400}>Within 400m</option>
            <option value={800}>Within 800m</option>
            <option value={1200}>Within 1200m</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "distance" | "name")}
            className="h-9 rounded-lg border border-line bg-ink-800 px-3 text-bone-200 focus:outline-none"
          >
            <option value="distance">Sort by Distance</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* ── Competitor Intelligence Ledger Table ─────────────────── */}
      <Panel pad={false} className="overflow-hidden">
        <div className="border-b border-line px-5 py-3 flex items-center justify-between bg-ink-900">
          <span className="text-[13px] font-semibold text-bone-100">
            Competitor Directory ({filteredCompetitors.length})
          </span>
          <span className="text-[11px] text-bone-500 font-mono">
            Source: OpenStreetMap Live & Field Audits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-ink-850 text-[10.5px] font-mono uppercase tracking-wider text-bone-500">
                <th className="p-3 pl-5">Business Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Distance from Site</th>
                <th className="p-3">Data Source</th>
                <th className="p-3">Verification</th>
                <th className="p-3 text-right pr-5">Reclassify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-bone-300">
              {filteredCompetitors.map((b) => (
                <tr key={b.id} className="hover:bg-ink-800/50 transition-colors">
                  <td className="p-3 pl-5 font-medium text-bone-100">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-ember-400 shrink-0" />
                      <span>{b.name}</span>
                    </div>
                    {b.note && <div className="text-[11px] text-bone-400 italic mt-0.5 ml-4">“{b.note}”</div>}
                  </td>
                  <td className="p-3 text-bone-400">{b.category}</td>
                  <td className="p-3 font-mono text-bone-200 font-semibold">{b.distanceM} m</td>
                  <td className="p-3"><SourceBadge source={b.source} /></td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                  <td className="p-3 text-right pr-5">
                    <button
                      onClick={() => toggleCompetitorClassification(b)}
                      className="rounded border border-line bg-ink-800 px-2 py-1 text-[11px] text-bone-400 hover:text-bone-100 hover:border-line-strong transition-colors"
                    >
                      Move to Neighbors
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCompetitors.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-bone-500 text-[12px]">
                    No competitors match the active search and distance criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
