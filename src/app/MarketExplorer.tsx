import { useMemo, useState } from "react";
import {
  CheckCircle2, Loader2, MapPin, Maximize2, Navigation, Radar, RotateCcw, Search,
} from "lucide-react";
import { Badge, Button, Panel, StatusBadge } from "../components/ui";
import MapView, { DEFAULT_MAP_LAYERS, type MapLayerState } from "../components/MapView";
import { AnalysisFrame } from "./AnalysisPages";
import { cn } from "../lib/utils";
import type { Analysis, NearbyBusiness } from "../lib/types";
import { searchPlaces, fetchNearbyBusinesses, type GeocodedPlace } from "../lib/places";
import { useApp } from "../store/AppStore";

const CATCHMENT_OPTIONS = [
  { label: "400 m (5-min walk)", value: 400 },
  { label: "800 m (10-min walk)", value: 800 },
  { label: "1200 m (15-min walk)", value: 1200 },
];

export default function MarketExplorer() {
  return (
    <AnalysisFrame
      title="Location Intelligence & Map Explorer"
      desc="Explore micro-market geography, competitor clusters, and transit anchors. Live discovery scans OpenStreetMap and Overpass Turbo POIs in real-time."
    >
      {(a) => <ExplorerBody analysis={a} />}
    </AnalysisFrame>
  );
}

function ExplorerBody({ analysis }: { analysis: Analysis }) {
  const { addNearbyBusiness, updateNearbyBusiness, toast, logActivity } = useApp();
  const [locId, setLocId] = useState(analysis.locations[0]?.id ?? "");
  const [category, setCategory] = useState<string>("All");
  const [radius, setRadius] = useState<number>(800);
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"inspector" | "ledger" | "catchment">("ledger");

  // Geocoding search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScanningOsm, setIsScanningOsm] = useState(false);

  // Map Controls & Layer Toggles
  const [mapLayers, setMapLayers] = useState<MapLayerState>(DEFAULT_MAP_LAYERS);
  const [fitAllKey, setFitAllKey] = useState<string>("");

  const loc = analysis.locations.find((l) => l.id === locId) ?? analysis.locations[0];

  const handleToggleLayer = (layerKey: keyof MapLayerState) => {
    setMapLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const categories = useMemo(() => {
    if (!loc) return [];
    return ["All", ...Array.from(new Set(loc.nearby.map((b) => b.category.split(" (")[0]))).sort()];
  }, [loc]);

  const filtered = useMemo(() => {
    if (!loc) return [];
    return loc.nearby
      .filter((b) => b.distanceM <= radius)
      .filter((b) => category === "All" || b.category.split(" (")[0] === category)
      .sort((x, y) => x.distanceM - y.distanceM);
  }, [loc, radius, category]);

  const selectedBiz = loc?.nearby.find((b) => b.id === selectedBizId) ?? null;

  // Catchment Stats
  const compCount = filtered.filter((b) => b.competitor).length;
  const anchorCount = filtered.filter((b) => !b.competitor).length;
  const verifiedCount = filtered.filter((b) => b.status === "verified").length;
  const verifiedPct = filtered.length > 0 ? Math.round((verifiedCount / filtered.length) * 100) : 0;

  const handlePlaceSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const places = await searchPlaces(q);
      setSearchResults(places);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const scanLiveArea = async () => {
    if (!loc) return;
    setIsScanningOsm(true);
    try {
      const discovered = await fetchNearbyBusinesses(loc.lat, loc.lng, analysis.profile.category, radius);
      let added = 0;
      for (const b of discovered) {
        if (!loc.nearby.some((existing) => existing.name.toLowerCase() === b.name.toLowerCase())) {
          addNearbyBusiness(analysis.id, loc.id, b);
          added++;
        }
      }
      logActivity(analysis.id, `Discovered ${discovered.length} establishments (${added} new) around ${loc.name} via OpenStreetMap.`, "edit");
      toast(`Trade scan complete`, {
        body: `Discovered ${discovered.length} establishments around ${loc.name} (${added} new saved).`,
        tone: "success",
      });
    } catch {
      toast("Trade scan failed", { body: "Network request timed out or Overpass API busy.", tone: "error" });
    } finally {
      setIsScanningOsm(false);
    }
  };

  const verifyRecord = (b: NearbyBusiness) => {
    updateNearbyBusiness(analysis.id, loc.id, { ...b, status: "verified" });
    logActivity(analysis.id, `Verified field accuracy of “${b.name}”.`, "verify");
    toast(`Verified record`, { body: b.name, tone: "success" });
  };

  if (!loc) {
    return (
      <Panel className="py-14 text-center">
        <MapPin size={24} className="mx-auto text-brass-400" />
        <h3 className="mt-3 text-[15px] font-semibold text-bone-100">Add a candidate location first</h3>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-bone-400">The spatial explorer anchors the map on your candidate sites.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Top Analytical Toolbar ─────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-ink-850/90 p-3.5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        {/* Candidate Site Selector Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="mr-1 text-[11px] font-mono uppercase tracking-wider text-bone-500">Subject:</span>
          {analysis.locations.map((l, idx) => (
            <button
              key={l.id}
              onClick={() => {
                setLocId(l.id);
                setSelectedBizId(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-all whitespace-nowrap",
                l.id === loc.id
                  ? "border-brass-500/60 bg-brass-500/15 text-brass-300 shadow-sm"
                  : "border-line bg-ink-800/80 text-bone-400 hover:border-line-strong hover:text-bone-200"
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-brass-500/30 font-mono text-[9.5px] font-bold text-brass-300">
                {idx + 1}
              </span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setFitAllKey(String(Date.now()))}
            className="text-[12px]"
          >
            <Maximize2 size={13} />
            <span>Fit All Sites</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            loading={isScanningOsm}
            onClick={scanLiveArea}
            className="text-[12px]"
          >
            <Radar size={13} />
            <span>Scan OpenStreetMap</span>
          </Button>
        </div>
      </div>

      {/* ── Geocoding Search & Filters Bar ─────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        {/* Real-time OpenStreetMap Address Search */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-bone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handlePlaceSearch(e.target.value)}
              placeholder="Search real Indian retail hubs, streets, or landmarks (e.g. Indiranagar 100ft road, Koramangala 4th block)..."
              className="h-9.5 w-full rounded-lg border border-line bg-ink-800 pl-9 pr-9 text-[12.5px] text-bone-100 placeholder:text-bone-500 focus:border-brass-400 focus:outline-none"
            />
            {isSearching && <Loader2 size={14} className="absolute right-3 animate-spin text-brass-400" />}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 z-50 max-h-56 overflow-y-auto rounded-lg border border-line-strong bg-ink-850 p-1.5 shadow-2xl">
              {searchResults.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(p.name);
                    setSearchResults([]);
                    toast(`Place found`, { body: `${p.name} · Coordinates: ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`, tone: "info" });
                  }}
                  className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left text-[12px] text-bone-200 hover:bg-bone-100/5"
                >
                  <MapPin size={13} className="mt-0.5 shrink-0 text-brass-400" />
                  <div className="min-w-0">
                    <div className="font-medium text-bone-100">{p.name}</div>
                    <div className="truncate text-[10.5px] text-bone-400">{p.displayName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Catchment & Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="h-9.5 rounded-lg border border-line bg-ink-800 px-3 text-[12px] text-bone-200 focus:outline-none"
          >
            {categories.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
          </select>

          <select
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            aria-label="Catchment radius"
            className="h-9.5 rounded-lg border border-line bg-ink-800 px-3 text-[12px] text-bone-200 focus:outline-none font-mono"
          >
            {CATCHMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => { setCategory("All"); setRadius(800); setSelectedBizId(null); }}
            className="flex h-9.5 items-center gap-1 rounded-lg border border-line px-2.5 text-[12px] text-bone-400 hover:text-bone-100 hover:border-line-strong transition-colors"
            title="Reset filters"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Main Geographic Workspace (Split Map + Inspector) ─────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        {/* Left: GIS Map Surface */}
        <div className="flex flex-col">
          <MapView
            center={[loc.lat, loc.lng]}
            zoom={15}
            locations={analysis.locations.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, name: l.name, address: l.address }))}
            selectedId={loc.id}
            onSelect={(id) => { setLocId(id); setSelectedBizId(null); }}
            nearby={filtered}
            selectedNearbyId={selectedBizId ?? undefined}
            onSelectNearby={(id) => { setSelectedBizId(id); setActiveTab("inspector"); }}
            radiusM={radius}
            radiusCenter={[loc.lat, loc.lng]}
            height={560}
            fitKey={loc.id}
            fitAllTrigger={fitAllKey}
            layers={mapLayers}
            onToggleLayer={handleToggleLayer}
          />
        </div>

        {/* Right: Inspector & Evidence Panel */}
        <div className="flex flex-col space-y-3">
          {/* Tabs bar */}
          <div className="flex rounded-lg border border-line bg-ink-850 p-1">
            <button
              onClick={() => setActiveTab("ledger")}
              className={cn(
                "flex-1 rounded-md py-1.5 text-center text-[12px] font-medium transition-colors",
                activeTab === "ledger" ? "bg-brass-500/15 text-brass-300" : "text-bone-400 hover:text-bone-200"
              )}
            >
              Evidence Ledger ({filtered.length})
            </button>
            <button
              onClick={() => setActiveTab("inspector")}
              className={cn(
                "flex-1 rounded-md py-1.5 text-center text-[12px] font-medium transition-colors",
                activeTab === "inspector" ? "bg-brass-500/15 text-brass-300" : "text-bone-400 hover:text-bone-200"
              )}
            >
              POI Inspector {selectedBiz ? "•" : ""}
            </button>
            <button
              onClick={() => setActiveTab("catchment")}
              className={cn(
                "flex-1 rounded-md py-1.5 text-center text-[12px] font-medium transition-colors",
                activeTab === "catchment" ? "bg-brass-500/15 text-brass-300" : "text-bone-400 hover:text-bone-200"
              )}
            >
              Catchment Analytics
            </button>
          </div>

          {/* Tab 1: Filterable Evidence Ledger Table */}
          {activeTab === "ledger" && (
            <Panel pad={false} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="text-[12px] font-semibold text-bone-200">
                  Surrounding Establishments ({filtered.length})
                </span>
                <span className="font-mono text-[11px] text-bone-400">
                  {verifiedCount} verified ({verifiedPct}%)
                </span>
              </div>
              <div className="max-h-[480px] overflow-y-auto divide-y divide-line/60">
                {filtered.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => { setSelectedBizId(b.id); }}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-2.5 transition-colors cursor-pointer",
                      selectedBizId === b.id ? "bg-brass-500/10 border-l-2 border-brass-400 pl-3.5" : "hover:bg-ink-800/60"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 shrink-0 rounded-full", b.competitor ? "bg-ember-400" : "bg-steel-400")} />
                        <span className="truncate text-[12.5px] font-medium text-bone-100">{b.name}</span>
                        {b.competitor && <span className="rounded bg-ember-500/15 px-1 py-0.2 text-[9px] text-ember-300 font-mono">COMP</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-bone-500">
                        <span>{b.category}</span>
                        <span>·</span>
                        <span className="font-mono text-bone-400">{b.distanceM} m</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="px-4 py-12 text-center text-[12px] text-bone-500">
                    No establishments match the current {radius}m filter. Click "Scan OpenStreetMap" to retrieve live POIs.
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Tab 2: POI Detail Inspector */}
          {activeTab === "inspector" && (
            <Panel className="flex-1 space-y-4">
              {selectedBiz ? (
                <>
                  <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-full", selectedBiz.competitor ? "bg-ember-400" : "bg-steel-400")} />
                        <h4 className="text-[15px] font-semibold text-bone-100">{selectedBiz.name}</h4>
                      </div>
                      <p className="mt-1 text-[12px] text-bone-400">{selectedBiz.category}</p>
                    </div>
                    <Badge tone={selectedBiz.competitor ? "ember" : "steel"}>
                      {selectedBiz.competitor ? "Direct Competitor" : "Neighbor Anchor"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div className="rounded-lg border border-line bg-ink-850 p-2.5">
                      <span className="block text-[10px] uppercase font-mono tracking-wider text-bone-500">Distance from site</span>
                      <span className="mt-0.5 font-mono text-[14px] font-semibold text-bone-100">{selectedBiz.distanceM} meters</span>
                    </div>
                    <div className="rounded-lg border border-line bg-ink-850 p-2.5">
                      <span className="block text-[10px] uppercase font-mono tracking-wider text-bone-500">Data Source</span>
                      <span className="mt-0.5 font-mono text-[13px] text-bone-200 capitalize">{selectedBiz.source}</span>
                    </div>
                  </div>

                  {selectedBiz.note && (
                    <div className="rounded-lg border border-line bg-ink-800/80 p-3 text-[12px] italic text-bone-300">
                      “{selectedBiz.note}”
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-line pt-3 text-[11.5px]">
                    <span className="text-bone-400">Verification Status:</span>
                    <StatusBadge status={selectedBiz.status} />
                  </div>

                  {selectedBiz.status !== "verified" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => verifyRecord(selectedBiz)}
                      className="w-full text-sage-300 border-sage-500/30 hover:bg-sage-500/10"
                    >
                      <CheckCircle2 size={13} />
                      <span>Confirm & Verify Record in Field</span>
                    </Button>
                  )}
                </>
              ) : (
                <div className="py-14 text-center text-[12.5px] text-bone-500">
                  <Navigation size={22} className="mx-auto mb-2 text-bone-600" />
                  Select any marker on the map or row in the Evidence Ledger to inspect its spatial dossier.
                </div>
              )}
            </Panel>
          )}

          {/* Tab 3: Catchment Analytics */}
          {activeTab === "catchment" && (
            <Panel className="flex-1 space-y-4">
              <div className="border-b border-line pb-3">
                <h4 className="text-[13.5px] font-semibold text-bone-100">Trade Area Catchment Summary</h4>
                <p className="mt-0.5 text-[11.5px] text-bone-400">Calculated within {radius}m walking boundary of {loc.name}.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-line bg-ink-850 p-3">
                  <span className="block text-[10px] uppercase font-mono tracking-wider text-bone-500">Direct Competitors</span>
                  <span className="mt-1 font-mono text-[20px] font-bold text-ember-300">{compCount}</span>
                  <span className="block mt-0.5 text-[10.5px] text-bone-500">within {radius}m buffer</span>
                </div>

                <div className="rounded-lg border border-line bg-ink-850 p-3">
                  <span className="block text-[10px] uppercase font-mono tracking-wider text-bone-500">Neighbor Anchors</span>
                  <span className="mt-1 font-mono text-[20px] font-bold text-steel-300">{anchorCount}</span>
                  <span className="block mt-0.5 text-[10.5px] text-bone-500">footfall drivers</span>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-ink-850 p-3 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-bone-300">Ground Truth Audit Level</span>
                  <span className="font-mono text-bone-100 font-semibold">{verifiedPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      verifiedPct >= 70 ? "bg-sage-400" : verifiedPct >= 40 ? "bg-brass-400" : "bg-ember-400"
                    )}
                    style={{ width: `${verifiedPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-bone-500">
                  {verifiedCount} of {filtered.length} surrounding businesses verified by field observation.
                </p>
              </div>

              <div className="border-t border-line pt-3 text-[11px] text-bone-500 leading-relaxed">
                <strong className="text-bone-300">Methodology Note:</strong> Isochrone walking buffers (400m / 800m / 1200m) approximate 5, 10, and 15-minute walking radii based on standardized 4.8 km/h pedestrian velocity.
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
