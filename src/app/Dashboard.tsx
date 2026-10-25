import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, ArrowUpRight, CheckCircle2,
  Compass, FileText, Plus, Scale,
} from "lucide-react";
import { useMemo } from "react";
import { Button, Panel } from "../components/ui";
import { useApp } from "../store/AppStore";
import { rankLocations } from "../lib/scoring";
import { cn, timeAgo } from "../lib/utils";

export function Dashboard() {
  const { analyses, reports, user, isCloudConnected, loadStarterSample } = useApp();

  // Aggregate stats across real saved analyses
  const activeAnalyses = useMemo(() => analyses.filter((a) => a.status === "active"), [analyses]);
  const totalSites = useMemo(() => analyses.reduce((n, a) => n + a.locations.length, 0), [analyses]);
  
  // Pending verification tasks across all projects
  const pendingChecks = useMemo(() => {
    return analyses.flatMap((a) =>
      a.checklist
        .filter((c) => c.state !== "confirmed")
        .map((c) => ({ analysis: a, check: c }))
    );
  }, [analyses]);

  // Total verified evidence records across all projects
  const totalRecords = useMemo(() => analyses.reduce((n, a) => n + a.locations.reduce((acc, l) => acc + l.nearby.length, 0), 0), [analyses]);
  const verifiedRecords = useMemo(() => analyses.reduce((n, a) => n + a.locations.reduce((acc, l) => acc + l.nearby.filter((b) => b.status === "verified").length, 0), 0), [analyses]);
  const auditLevelPct = totalRecords > 0 ? Math.round((verifiedRecords / totalRecords) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10 space-y-8">
      {/* ── Executive Header Strip ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-brass-400 font-semibold">
              Location Intelligence Operations
            </span>
            <span className="rounded bg-ink-800 px-2 py-0.5 text-[10px] font-mono text-bone-400 border border-line">
              {isCloudConnected ? "Supabase PostgreSQL Active" : "Local Workspace"}
            </span>
          </div>
          <h1 className="font-display mt-2 text-[28px] font-light tracking-tight text-bone-100">
            Welcome back, {user.name ? user.name.split(" ")[0] : "Explorer"}.
          </h1>
          <p className="mt-1 text-[13px] text-bone-400">
            {analyses.length} active location {analyses.length === 1 ? "project" : "projects"} under commercial evaluation. {pendingChecks.length} pre-investment audit tasks pending.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" to="/app/reports">
            <FileText size={13} /> Saved Reports ({reports.length})
          </Button>
          <Button to="/app/analyses/new" size="sm">
            <Plus size={14} /> New Site Analysis
          </Button>
        </div>
      </div>

      {/* ── Key Operational Metrics ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel className="p-4 border-brass-500/20">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-bone-500">Active Analyses</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[26px] font-bold font-mono text-bone-100">{analyses.length}</span>
            <span className="text-[11px] text-bone-400">projects</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">
            {activeAnalyses.length} in active evaluation
          </span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-bone-500">Candidate Sites</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[26px] font-bold font-mono text-bone-100">{totalSites}</span>
            <span className="text-[11px] text-bone-400">surveyed sites</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">Across commercial micro-markets</span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-bone-500">Pending Field Audits</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-[26px] font-bold font-mono", pendingChecks.length > 5 ? "text-ember-300" : "text-brass-300")}>
              {pendingChecks.length}
            </span>
            <span className="text-[11px] text-bone-400">tasks</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">Pre-lease physical audits</span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-bone-500">Ground Truth Level</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-[26px] font-bold font-mono", auditLevelPct >= 60 ? "text-sage-300" : "text-brass-300")}>
              {auditLevelPct}%
            </span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">{verifiedRecords} of {totalRecords} records verified</span>
        </Panel>
      </div>

      {/* ── Active Analyses Workspace Table ────────────────────────── */}
      <Panel pad={false} className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-ink-900/90">
          <div>
            <h3 className="text-[14px] font-semibold text-bone-100">Location Projects Portfolio</h3>
            <p className="text-[11.5px] text-bone-500">Track candidates, leading locations, and decision readiness.</p>
          </div>
          <Button variant="ghost" size="xs" to="/app/analyses">
            View All Projects <ArrowRight size={12} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-ink-850 text-[10.5px] font-mono uppercase tracking-wider text-bone-500">
                <th className="p-3.5 pl-5">Project Name & Sector</th>
                <th className="p-3.5">Candidate Sites</th>
                <th className="p-3.5">Leading Location</th>
                <th className="p-3.5">Decision Score</th>
                <th className="p-3.5">Audit Integrity</th>
                <th className="p-3.5">Last Updated</th>
                <th className="p-3.5 text-right pr-5">Quick Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-bone-300">
              {analyses.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-bone-400">
                    <Compass size={28} className="mx-auto text-brass-400 opacity-60 mb-2" />
                    <p className="text-[14px] font-medium text-bone-200">No location projects in your account yet</p>
                    <p className="text-[12px] text-bone-500 mt-1 max-w-sm mx-auto">
                      Start evaluating your first retail candidate site, or load the Indiranagar starter scenario to see the scoring engine in action.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <Button to="/app/analyses/new" size="sm">
                        <Plus size={14} /> Start New Analysis
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => loadStarterSample()}>
                        Load Starter Sample
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {analyses.map((a) => {
                const ranked = rankLocations(a);
                const lead = ranked[0];
                const leadLoc = lead ? a.locations.find((l) => l.id === lead.locationId) : null;
                const unverifiedCount = a.checklist.filter((c) => c.state !== "confirmed").length;

                return (
                  <tr key={a.id} className="hover:bg-ink-800/50 transition-colors">
                    <td className="p-3.5 pl-5 font-medium text-bone-100">
                      <Link to={`/app/analyses/${a.id}`} className="hover:text-brass-300 transition-colors block">
                        <div className="font-semibold text-[13.5px]">{a.title}</div>
                        <div className="text-[11px] text-bone-500 mt-0.5">{a.profile.category} · {a.profile.concept}</div>
                      </Link>
                    </td>

                    <td className="p-3.5 font-mono text-bone-200">
                      <span className="font-bold">{a.locations.length}</span> sites
                    </td>

                    <td className="p-3.5 text-bone-200">
                      {leadLoc ? (
                        <div>
                          <div className="font-medium text-bone-100">{leadLoc.name}</div>
                          <div className="text-[10.5px] text-bone-500 truncate max-w-[180px]">{leadLoc.address}</div>
                        </div>
                      ) : (
                        <span className="text-bone-500 italic">No sites added</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {lead ? (
                        <div className="flex items-center gap-2 font-mono">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-bold font-mono",
                            lead.total >= 65 ? "bg-sage-500/20 text-sage-300" : lead.total >= 50 ? "bg-brass-500/20 text-brass-300" : "bg-ember-500/20 text-ember-300"
                          )}>
                            {lead.total}/100
                          </span>
                          <span className="text-[11px] text-bone-400">{lead.verdict.label}</span>
                        </div>
                      ) : (
                        <span className="text-bone-500 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {unverifiedCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-brass-400 font-mono">
                          <AlertTriangle size={11} /> {unverifiedCount} pending checks
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-sage-400 font-mono">
                          <CheckCircle2 size={11} /> Fully audited
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-bone-500">
                      {timeAgo(a.updatedAt)}
                    </td>

                    <td className="p-3.5 text-right pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/app/analyses/${a.id}/market-explorer`}
                          className="rounded border border-line bg-ink-800 p-1.5 text-bone-400 hover:text-bone-100 hover:border-line-strong transition-colors"
                          title="Open Map Explorer"
                        >
                          <Compass size={13} />
                        </Link>
                        <Link
                          to={`/app/analyses/${a.id}/comparison`}
                          className="rounded border border-line bg-ink-800 p-1.5 text-bone-400 hover:text-bone-100 hover:border-line-strong transition-colors"
                          title="Open Comparison Matrix"
                        >
                          <Scale size={13} />
                        </Link>
                        <Link
                          to={`/app/analyses/${a.id}/report`}
                          className="rounded border border-line bg-ink-800 p-1.5 text-bone-400 hover:text-bone-100 hover:border-line-strong transition-colors"
                          title="Decision Report"
                        >
                          <FileText size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── Two-Column Bottom Workspace (Field Verification Queue & Reports Archive) ── */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Pre-Investment Verification Queue */}
        <Panel pad={false} className="overflow-hidden flex flex-col">
          <div className="border-b border-line px-5 py-3.5 flex items-center justify-between bg-ink-900">
            <div>
              <h3 className="text-[13.5px] font-semibold text-bone-100">Pre-Investment Field Verification Queue</h3>
              <p className="text-[11px] text-bone-500">Critical empirical audits required before signing commercial leases.</p>
            </div>
            <span className="font-mono text-[11px] text-brass-400 font-bold">{pendingChecks.length} pending</span>
          </div>

          <div className="divide-y divide-line/60 max-h-[360px] overflow-y-auto">
            {pendingChecks.slice(0, 5).map(({ analysis, check }, idx) => (
              <div key={idx} className="p-4 flex items-start justify-between gap-3 hover:bg-ink-800/40 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-brass-400 shrink-0" />
                    <span className="font-medium text-[13px] text-bone-100">{check.label}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-bone-400 ml-4">
                    Project: <span className="text-bone-200">{analysis.title}</span> · {check.group}
                  </div>
                  {check.hint && <p className="mt-1 text-[11px] text-bone-500 ml-4 italic">“{check.hint}”</p>}
                </div>
                <Button size="xs" variant="outline" to={`/app/analyses/${analysis.id}/field-verification`}>
                  Verify Now <ArrowRight size={11} />
                </Button>
              </div>
            ))}

            {pendingChecks.length === 0 && (
              <div className="py-12 text-center text-[12.5px] text-bone-500">
                All pre-investment checklist items have been confirmed!
              </div>
            )}
          </div>
        </Panel>

        {/* Board-Ready Decision Reports Archive */}
        <Panel pad={false} className="overflow-hidden flex flex-col">
          <div className="border-b border-line px-5 py-3.5 flex items-center justify-between bg-ink-900">
            <div>
              <h3 className="text-[13.5px] font-semibold text-bone-100">Board-Ready Decision Reports</h3>
              <p className="text-[11px] text-bone-500">Archived investment memoranda and vector PDFs.</p>
            </div>
            <Link to="/app/reports" className="text-[11px] font-mono text-brass-400 hover:text-brass-300">
              View All
            </Link>
          </div>

          <div className="divide-y divide-line/60 max-h-[360px] overflow-y-auto">
            {reports.slice(0, 4).map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3 hover:bg-ink-800/40 transition-colors">
                <div className="min-w-0">
                  <h4 className="font-medium text-[13px] text-bone-100 truncate">{r.title}</h4>
                  <div className="mt-0.5 text-[11px] text-bone-500 font-mono">
                    Rec: <span className="text-brass-300 font-semibold">{r.recommendation}</span> · Score: {r.score}/100
                  </div>
                </div>
                <Link
                  to={`/app/analyses/${r.analysisId}/report`}
                  className="rounded border border-line bg-ink-800 p-2 text-bone-300 hover:text-bone-100 transition-colors shrink-0"
                  title="Open Report"
                >
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}

            {reports.length === 0 && (
              <div className="py-12 text-center text-[12.5px] text-bone-500">
                No formal reports archived yet. Open any analysis to generate a memorandum.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function AnalysesList() {
  return <Dashboard />;
}
