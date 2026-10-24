import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity, BarChart3, Bookmark, ChevronRight, ClipboardCheck, Cog, FileText, LayoutDashboard,
  LifeBuoy, ListChecks, LogOut, Map as MapIcon, PanelLeftClose, PanelLeftOpen, Plus, Radar,
  ScrollText, Settings, Store, Users, Wallet, X, Building2, Menu,
} from "lucide-react";
import { LogoMark, Wordmark } from "../components/chrome";
import { cn, timeAgo } from "../lib/utils";
import { useApp } from "../store/AppStore";

function analysisNav(id: string) {
  const base = `/app/analyses/${id}`;
  return [
    { to: base, label: "Overview", icon: LayoutDashboard, end: true },
    { to: `${base}/locations`, label: "Locations", icon: Building2 },
    { to: `${base}/market-explorer`, label: "Market Explorer", icon: MapIcon },
    { to: `${base}/competitors`, label: "Competitors", icon: Users },
    { to: `${base}/financials`, label: "Financials", icon: Wallet },
    { to: `${base}/comparison`, label: "Comparison", icon: BarChart3 },
    { to: `${base}/scenarios`, label: "What-if scenarios", icon: Radar },
    { to: `${base}/local-truth`, label: "Local Truth Map", icon: Store },
    { to: `${base}/field-verification`, label: "Field verification", icon: ClipboardCheck },
    { to: `${base}/report`, label: "Decision report", icon: FileText },
    { to: `${base}/activity`, label: "Activity", icon: Activity },
  ];
}

const CRUMB_LABELS: Record<string, string> = {
  app: "Workspace",
  analyses: "Analyses",
  new: "New analysis",
  locations: "Locations",
  "market-explorer": "Market Explorer",
  competitors: "Competitors",
  financials: "Financials",
  comparison: "Comparison",
  scenarios: "Scenarios",
  "local-truth": "Local Truth Map",
  "field-verification": "Field verification",
  report: "Decision report",
  activity: "Activity",
  reports: "Reports",
  settings: "Settings",
  profile: "Profile",
  preferences: "Preferences",
  help: "Help",
  onboarding: "Onboarding",
};

function Breadcrumbs() {
  const { pathname } = useLocation();
  const { analyses } = useApp();
  const segs = pathname.split("/").filter(Boolean);

  const items = useMemo(() => {
    // Inside an analysis: /app/analyses/:id/:subPage?
    if (segs.length >= 3 && segs[0] === "app" && segs[1] === "analyses") {
      const anId = segs[2];
      const pageSeg = segs[3];
      const an = analyses.find((a) => a.id === anId);
      const out = [
        { to: "/app", label: "Workspace", isProject: false },
        { to: `/app/analyses/${anId}`, label: an ? an.title : "Project", isProject: true },
      ];
      if (pageSeg && CRUMB_LABELS[pageSeg]) {
        out.push({ to: `/app/analyses/${anId}/${pageSeg}`, label: CRUMB_LABELS[pageSeg], isProject: false });
      }
      return out;
    }

    // Outside analysis
    const out: { to: string; label: string; isProject?: boolean }[] = [];
    let acc = "";
    for (const s of segs) {
      acc += `/${s}`;
      let label = CRUMB_LABELS[s] ?? s;
      if (s === "app") label = "Workspace";
      if (s !== "analyses") {
        out.push({ to: acc, label, isProject: false });
      }
    }
    return out;
  }, [segs.join("/"), analyses]);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12.5px] whitespace-nowrap overflow-hidden">
      {items.map((it, i) => (
        <span key={it.to} className="flex min-w-0 items-center gap-1.5 shrink-0 last:shrink last:min-w-0">
          {i > 0 && <ChevronRight size={12} className="shrink-0 text-bone-600" />}
          {i === items.length - 1 ? (
            <span className="truncate font-semibold text-bone-100 max-w-[180px] sm:max-w-[240px]" aria-current="page">
              {it.label}
            </span>
          ) : (
            <Link
              to={it.to}
              className={cn(
                "transition-colors hover:text-bone-200 truncate",
                it.isProject ? "max-w-[130px] sm:max-w-[180px] text-bone-300 font-medium" : "text-bone-400 shrink-0"
              )}
              title={it.label}
            >
              {it.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function UserChip() {
  const { user, signOut, isCloudConnected } = useApp();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "RR";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg border border-line bg-ink-800/60 py-1.5 pl-1.5 pr-3 transition-colors hover:border-line-strong"
        aria-expanded={open}
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-brass-500/15 font-mono text-[10.5px] font-semibold text-brass-300">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[12px] font-medium leading-tight text-bone-100">{user.name}</span>
          <span className="block text-[10.5px] leading-tight text-bone-500">
            {isCloudConnected ? "Supabase Cloud" : "Local DB"}
          </span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 rounded-xl border border-line-strong bg-ink-800 p-2 shadow-[var(--shadow-pop)]">
            <div className="px-3 py-2 border-b border-line mb-1">
              <div className="text-[12px] font-medium text-bone-100 truncate">{user.name}</div>
              <div className="text-[11px] text-bone-400 truncate">{user.email}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-brass-300">
                <span className="size-1.5 rounded-full bg-brass-400" />
                {isCloudConnected ? "PostgreSQL RLS Active" : "Local Workspace Mode"}
              </div>
            </div>
            <Link to="/app/settings/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-bone-200 hover:bg-bone-100/5">
              <Settings size={14} className="text-bone-400" /> Profile & Account
            </Link>
            <Link to="/app/settings/preferences" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-bone-200 hover:bg-bone-100/5">
              <Cog size={14} className="text-bone-400" /> Scoring Weights
            </Link>
            <Link to="/app/help" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-bone-200 hover:bg-bone-100/5">
              <LifeBuoy size={14} className="text-bone-400" /> Help & methodology
            </Link>
            <div className="mx-2 my-1.5 h-px bg-line" />
            <button
              onClick={() => { signOut(); setOpen(false); nav("/sign-in"); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-ember-300 hover:bg-ember-500/10"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SideLink({ item, collapsed, onNavigate }: { item: { to: string; label: string; icon: React.ElementType; end?: boolean }; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-brass-500/10 text-brass-300"
            : "text-bone-400 hover:bg-bone-100/[0.04] hover:text-bone-100"
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={16} className={cn("shrink-0 transition-colors", isActive ? "text-brass-400" : "text-bone-500 group-hover:text-bone-300")} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const { pathname } = useLocation();
  const params = useParams();
  const { getAnalysis, analyses, isCloudConnected } = useApp();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("rrai-sidebar") === "1");
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    localStorage.setItem("rrai-sidebar", collapsed ? "1" : "0");
  }, [collapsed]);
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const analysisId = params.id;
  const analysis = analysisId ? getAnalysis(analysisId) : undefined;
  const inAnalysis = Boolean(analysisId && analysis);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
      <NavSection label={collapsed ? "" : "Workspace"} collapsed={collapsed} />
      <SideLink collapsed={collapsed} onNavigate={() => setDrawer(false)} item={{ to: "/app", label: "Overview", icon: LayoutDashboard, end: true }} />
      <SideLink collapsed={collapsed} onNavigate={() => setDrawer(false)} item={{ to: "/app/analyses", label: "Analyses", icon: ListChecks }} />
      <SideLink collapsed={collapsed} onNavigate={() => setDrawer(false)} item={{ to: "/app/reports", label: "Reports", icon: ScrollText }} />

      {inAnalysis && (
        <>
          <div className={cn(collapsed ? "mx-2 my-4 h-px bg-line" : "mb-1 mt-5 px-3")}>
            {!collapsed && <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-bone-500">Current analysis</span>}
          </div>
          {!collapsed && (
            <div className="mx-1 mb-2 rounded-lg border border-line bg-ink-800/70 px-3 py-2.5">
              <div className="truncate text-[12.5px] font-semibold text-bone-100">{analysis!.title}</div>
              <div className="mt-1 flex items-center justify-between text-[10.5px] text-bone-500">
                <span className="capitalize">{analysis!.status}</span>
                <span>{timeAgo(analysis!.updatedAt)}</span>
              </div>
            </div>
          )}
          {analysisNav(analysis!.id).map((item) => (
            <SideLink key={item.to} collapsed={collapsed} onNavigate={() => setDrawer(false)} item={item} />
          ))}
        </>
      )}

      <div className={cn(collapsed ? "mx-2 my-4 h-px bg-line" : "mb-1 mt-5 px-3")}>
        {!collapsed && <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-bone-500">System</span>}
      </div>
      <SideLink collapsed={collapsed} onNavigate={() => setDrawer(false)} item={{ to: "/app/settings", label: "Settings", icon: Cog, end: true }} />
      <SideLink collapsed={collapsed} onNavigate={() => setDrawer(false)} item={{ to: "/app/help", label: "Help & guidance", icon: LifeBuoy }} />
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-ink-900">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "no-print sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-line bg-ink-950/80 backdrop-blur transition-[width] duration-300 lg:flex",
          collapsed ? "w-[68px]" : "w-[248px]"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-line px-4", collapsed ? "justify-center" : "justify-between")}>
          <Link to="/app" aria-label="RetailRadar workspace">
            {collapsed ? <LogoMark size={30} /> : <Wordmark compact />}
          </Link>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" className="rounded-md p-1.5 text-bone-500 transition-colors hover:bg-bone-100/5 hover:text-bone-200">
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
        {nav}
        <div className={cn("border-t border-line p-3", collapsed && "flex justify-center")}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} aria-label="Expand sidebar" className="rounded-md p-1.5 text-bone-500 hover:text-bone-200">
              <PanelLeftOpen size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-850 px-3 py-2">
              <Bookmark size={12} className="shrink-0 text-brass-400" />
              <span className="text-[10.5px] leading-snug text-bone-500">
                {isCloudConnected ? "Supabase PostgreSQL · Cloud Active" : "Local Database · Persistent Session"}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-line bg-ink-950" style={{ animation: "rise .25s ease both" }}>
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Wordmark compact />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="p-1.5 text-bone-400 hover:text-bone-100">
                <X size={18} />
              </button>
            </div>
            {nav}
            <div className="border-t border-line p-4">
              <Link
                to="/app/analyses/new"
                onClick={() => setDrawer(false)}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brass-500 text-[13.5px] font-medium text-ink-950 transition-colors hover:bg-brass-400"
              >
                <Plus size={15} /> New analysis
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-ink-950/90 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setDrawer(true)} aria-label="Open menu" className="rounded-md p-2 text-bone-300 hover:bg-bone-100/5 lg:hidden">
            <Menu size={18} />
          </button>
          
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <Breadcrumbs />
            {analyses.length > 1 && !inAnalysis && (
              <select
                value={analysisId || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.hash = `#/app/analyses/${e.target.value}`;
                  }
                }}
                className="hidden xl:inline-block h-7 rounded border border-line bg-ink-850 px-2 text-[11px] text-bone-300 focus:outline-none font-mono"
                aria-label="Switch active project"
              >
                <option value="" disabled>Switch Project...</option>
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>{a.title} ({a.locations.length} sites)</option>
                ))}
              </select>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-bone-400">
            <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 bg-ink-900" title="CARTO Basemaps API Key Active">
              <span className="size-1.5 rounded-full bg-sage-400 animate-pulse" />
              CARTO Maps Live
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 bg-ink-900">
              {isCloudConnected ? "Supabase RLS" : "Local Workspace"}
            </span>
          </div>

          <Link
            to="/app/analyses/new"
            className="hidden h-8.5 shrink-0 items-center gap-2 rounded-lg bg-brass-500 px-3.5 text-[13px] font-medium text-ink-950 transition-all hover:bg-brass-400 sm:inline-flex"
          >
            <Plus size={14} /> New analysis
          </Link>
          <UserChip />
        </header>

        {/* Persistent Candidate Site Context Sub-Bar (when inside an analysis) */}
        {inAnalysis && (
          <div className="no-print border-b border-line bg-ink-900/90 px-4 py-2 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-[12px]">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-bone-500 mr-1">Candidate Sites:</span>
              {analysis!.locations.map((loc, idx) => (
                <Link
                  key={loc.id}
                  to={`/app/analyses/${analysis!.id}/market-explorer`}
                  className="flex items-center gap-1.5 rounded-md border border-line bg-ink-850 px-2.5 py-1 text-bone-300 hover:border-brass-500/40 hover:text-bone-100 transition-colors whitespace-nowrap"
                >
                  <span className="flex size-4 items-center justify-center rounded-full bg-brass-500/20 font-mono text-[9px] font-bold text-brass-400">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-[12px]">{loc.name}</span>
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] text-bone-400">
              <Link to={`/app/analyses/${analysis!.id}`} className="hover:text-brass-300 px-2 py-0.5 rounded hover:bg-ink-800">Overview</Link>
              <span>·</span>
              <Link to={`/app/analyses/${analysis!.id}/market-explorer`} className="hover:text-brass-300 px-2 py-0.5 rounded hover:bg-ink-800">Map</Link>
              <span>·</span>
              <Link to={`/app/analyses/${analysis!.id}/comparison`} className="hover:text-brass-300 px-2 py-0.5 rounded hover:bg-ink-800">Compare</Link>
              <span>·</span>
              <Link to={`/app/analyses/${analysis!.id}/financials`} className="hover:text-brass-300 px-2 py-0.5 rounded hover:bg-ink-800">Finance</Link>
              <span>·</span>
              <Link to={`/app/analyses/${analysis!.id}/local-truth`} className="hover:text-brass-300 px-2 py-0.5 rounded hover:bg-ink-800">Truth Map</Link>
              <span>·</span>
              <Link to={`/app/analyses/${analysis!.id}/report`} className="hover:text-brass-300 px-2 py-0.5 rounded hover:bg-ink-800">Report</Link>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <footer className="no-print border-t border-line px-6 py-4 text-[11.5px] text-bone-500 flex flex-wrap items-center justify-between gap-2">
          <span>RetailRadar AI · Commercial Location Intelligence Workspace</span>
          <span className="font-mono text-[10.5px]">OpenStreetMap contributors · CARTO basemaps · Empirical field verification</span>
        </footer>
      </div>
    </div>
  );
}

function NavSection({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="mb-1 mt-3 px-3 first:mt-3">
      <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-bone-500">{label}</span>
    </div>
  );
}
