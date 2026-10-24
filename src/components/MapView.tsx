import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { NearbyBusiness } from "../lib/types";

/* ── CARTO Basemap Tile Endpoints (Authenticated) ── */
const mapsApiKey =
  import.meta.env.VITE_MAPS_API_KEY ||
  import.meta.env.VITE_CARTO_API_KEY ||
  "cb1_4twj_1_0b4244f0717161156a2b678e";

export type BasemapStyle = "voyager" | "positron" | "dark" | "osm";

const TILE_STYLES: Record<BasemapStyle, string> = {
  voyager: mapsApiKey
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${mapsApiKey}`
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  positron: mapsApiKey
    ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${mapsApiKey}`
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: mapsApiKey
    ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${mapsApiKey}`
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};

const TILE_ATTR = '© OpenStreetMap contributors · © CARTO';

/**
 * Subject candidate location pin with illuminated gold badge, teardrop pointer,
 * and high-contrast name callout pill.
 */
const candidateSiteIcon = (index: number, active: boolean, name?: string) => {
  const num = index + 1;
  const shortName = name ? (name.length > 22 ? name.slice(0, 20) + "…" : name) : `Site ${num}`;

  return L.divIcon({
    className: "leaflet-candidate-pin",
    iconSize: [200, 72],
    iconAnchor: [100, 70],
    popupAnchor: [0, -70],
    html: `
      <div style="width: 200px; display: flex; flex-direction: column; align-items: center; pointer-events: auto; user-select: none;">
        <!-- Top Callout Banner -->
        <div style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 11.5px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.6); margin-bottom: 3px; ${
          active
            ? 'background: #0f172a; color: #fbbf24; border: 1.5px solid #f59e0b; box-shadow: 0 0 16px rgba(245,158,11,0.6);'
            : 'background: #0f172a; color: #f8fafc; border: 1px solid #475569;'
        }">
          <span style="width: 6px; height: 6px; border-radius: 9999px; background: ${active ? '#fbbf24' : '#94a3b8'};"></span>
          <span>${shortName}</span>
        </div>

        <!-- Teardrop Location Pin -->
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          ${active ? '<div style="position: absolute; inset: -4px; border-radius: 9999px; background: #f59e0b; opacity: 0.55; animation: ping-soft 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
          <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: 800; font-size: 14px; border: 2.5px solid #ffffff; box-shadow: 0 6px 18px rgba(0,0,0,0.65); ${
            active
              ? 'background: #f59e0b; color: #090d16; transform: scale(1.1);'
              : 'background: #d97706; color: #090d16;'
          }">
            ${num}
          </div>
          <!-- Pointer tip pointing directly onto the street coordinate -->
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${active ? '#f59e0b' : '#d97706'}; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.4));"></div>
        </div>
      </div>
    `,
  });
};

/**
 * Nearby business pin with high-contrast color badge and crisp floating name tag.
 */
const poiMarkerIcon = (b: NearbyBusiness, isSelected: boolean, showLabels: boolean = false) => {
  const isComp = b.competitor;
  const isTransit =
    b.category.toLowerCase().includes("transit") ||
    b.category.toLowerCase().includes("bus") ||
    b.category.toLowerCase().includes("metro");

  let mainColor = "#2563eb"; // Sapphire Blue for anchors
  let border = "#60a5fa";
  let textColor = "#93c5fd";

  if (isComp) {
    mainColor = "#dc2626"; // Crimson for competitors
    border = "#f87171";
    textColor = "#fca5a5";
  } else if (isTransit) {
    mainColor = "#059669"; // Emerald for transit
    border = "#34d399";
    textColor = "#86efac";
  }

  const isUnverified = b.status === "unverified";
  const shortName = b.name.length > 20 ? b.name.slice(0, 18) + "…" : b.name;
  const pinSize = isSelected ? 18 : 12;
  const showPillAlways = showLabels || isSelected;

  return L.divIcon({
    className: `rr-poi-wrapper ${isSelected ? "is-selected" : ""}`,
    iconSize: [220, 28],
    iconAnchor: [10, 14],
    popupAnchor: [0, -14],
    html: `
      <div style="width: 220px; display: flex; align-items: center; gap: 6px; pointer-events: auto; user-select: none;">
        <!-- Pin Dot centered at x=10, y=14 -->
        <div style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            ${isSelected ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: ${mainColor}; opacity: 0.7; animation: ping-soft 1.5s infinite;"></div>` : ''}
            <div class="rr-poi-dot" style="width: ${pinSize}px; height: ${pinSize}px; border-radius: 9999px; background: ${isUnverified ? 'transparent' : mainColor}; border: 2px solid ${isUnverified ? mainColor : '#ffffff'}; box-shadow: 0 2px 8px rgba(0,0,0,0.65); ${
              isSelected ? 'box-shadow: 0 0 12px ' + mainColor + ';' : ''
            }"></div>
          </div>
        </div>

        <!-- Floating High-Contrast Name Pill -->
        <div class="rr-poi-pill ${showPillAlways ? 'is-visible' : ''}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; background: rgba(11, 15, 23, 0.94); color: #f8fafc; border: 1px solid ${border}99; box-shadow: 0 4px 12px rgba(0,0,0,0.6); backdrop-filter: blur(4px);">
          <span style="color: ${textColor};">${shortName}</span>
          <span style="font-family: monospace; font-size: 9.5px; opacity: 0.8; color: #94a3b8;">· ${b.distanceM}m</span>
        </div>
      </div>
    `,
  });
};

/** Floating Catchment Distance Label Tag */
const catchmentLabelIcon = (text: string, color: string) => {
  return L.divIcon({
    className: "leaflet-catchment-label",
    iconSize: [140, 22],
    iconAnchor: [70, 11],
    html: `
      <div style="width: 140px; display: flex; justify-content: center;">
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-family: monospace; font-weight: 700; background: rgba(11, 15, 23, 0.92); color: ${color}; border: 1px solid ${color}88; box-shadow: 0 2px 8px rgba(0,0,0,0.5); white-space: nowrap;">
          ${text}
        </span>
      </div>
    `,
  });
};

function AutoFlyTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  const prevCenterRef = useRef<string>("");

  useEffect(() => {
    const key = `${center[0].toFixed(5)},${center[1].toFixed(5)},${zoom}`;
    if (prevCenterRef.current !== key) {
      prevCenterRef.current = key;
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8, easeLinearity: 0.25 });
    }
  }, [center, zoom, map]);

  return null;
}

function BoundsFitter({ locations, triggerKey }: { locations: { lat: number; lng: number }[]; triggerKey?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!locations || locations.length === 0) return;
    if (locations.length === 1) {
      map.flyTo([locations[0].lat, locations[0].lng], 15, { duration: 0.8 });
      return;
    }
    const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
  }, [triggerKey, locations, map]);

  return null;
}

function MapControls({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-[400] flex flex-col gap-1.5 shadow-2xl">
      <div className="flex flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900/95 shadow-xl backdrop-blur">
        <button
          onClick={() => map.zoomIn()}
          aria-label="Zoom in"
          className="flex size-8 items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => map.zoomOut()}
          aria-label="Zoom out"
          className="flex size-8 items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
      </div>

      <button
        onClick={() => map.flyTo(center, zoom, { duration: 0.8 })}
        aria-label="Recenter Map on Subject Location"
        className="flex size-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/95 text-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-colors shadow-xl backdrop-blur"
        title="Recenter on Subject"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

export interface MapLayerState {
  showCandidates: boolean;
  showCompetitors: boolean;
  showComplementary: boolean;
  showTransit: boolean;
  showCatchments: boolean;
  showUnverified: boolean;
}

export const DEFAULT_MAP_LAYERS: MapLayerState = {
  showCandidates: true,
  showCompetitors: true,
  showComplementary: true,
  showTransit: true,
  showCatchments: true,
  showUnverified: true,
};

export default function MapView({
  center,
  zoom = 15,
  locations = [],
  selectedId,
  onSelect,
  nearby = [],
  selectedNearbyId,
  onSelectNearby,
  radiusM = 500,
  radiusCenter,
  height = 480,
  className,
  fitKey,
  fitAllTrigger,
  layers = DEFAULT_MAP_LAYERS,
  onToggleLayer,
}: {
  center: [number, number];
  zoom?: number;
  locations?: { id: string; lat: number; lng: number; name: string; address?: string }[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  nearby?: NearbyBusiness[];
  selectedNearbyId?: string;
  onSelectNearby?: (id: string) => void;
  radiusM?: number;
  radiusCenter?: [number, number];
  height?: number | string;
  className?: string;
  fitKey?: string;
  fitAllTrigger?: string;
  layers?: MapLayerState;
  onToggleLayer?: (layerKey: keyof MapLayerState) => void;
}) {
  const [basemap, setBasemap] = useState<BasemapStyle>("voyager");
  const [showLabels, setShowLabels] = useState<boolean>(false);

  const activeLoc = locations.find((l) => l.id === selectedId) || locations[0];
  const cCenter: [number, number] = radiusCenter || (activeLoc ? [activeLoc.lat, activeLoc.lng] : center);

  // Filter POIs by layers
  const visibleNearby = nearby.filter((b) => {
    const isComp = b.competitor;
    const isTransit =
      b.category.toLowerCase().includes("transit") ||
      b.category.toLowerCase().includes("bus") ||
      b.category.toLowerCase().includes("metro");
    if (!layers.showUnverified && b.status === "unverified") return false;
    if (isComp && !layers.showCompetitors) return false;
    if (isTransit && !layers.showTransit) return false;
    if (!isComp && !isTransit && !layers.showComplementary) return false;
    return true;
  });

  // Calculate latitude offset for radius boundary tags (~111,320m per degree lat)
  const tagLat400 = cCenter[0] + 400 / 111320;
  const tagLatRadius = cCenter[0] + radiusM / 111320;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-line bg-ink-950 ${className ?? ""}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="z-0 h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          key={basemap}
          url={TILE_STYLES[basemap]}
          attribution={TILE_ATTR}
          subdomains="abcd"
          maxZoom={19}
        />

        {fitKey && <AutoFlyTo center={center} zoom={zoom} />}
        {fitAllTrigger && <BoundsFitter locations={locations} triggerKey={fitAllTrigger} />}
        <MapControls center={center} zoom={zoom} />

        {/* Concentric Walking Catchments (400m ~ 5 min, 800m+ ~ 10-15 min) */}
        {layers.showCatchments && cCenter && (
          <>
            {/* Primary Modeled Catchment Circle */}
            <Circle
              center={cCenter}
              radius={radiusM}
              pathOptions={{
                color: "#f59e0b",
                weight: 2.5,
                opacity: 0.95,
                dashArray: "8 6",
                fillColor: "#f59e0b",
                fillOpacity: 0.08,
              }}
            />
            {/* 400m Walk Circle */}
            {radiusM >= 700 && (
              <Circle
                center={cCenter}
                radius={400}
                pathOptions={{
                  color: "#10b981",
                  weight: 2,
                  opacity: 0.9,
                  dashArray: "6 6",
                  fillColor: "#10b981",
                  fillOpacity: 0.07,
                }}
              />
            )}

            {/* Boundary Distance Floating Labels */}
            {radiusM >= 700 && (
              <Marker
                position={[tagLat400, cCenter[1]]}
                icon={catchmentLabelIcon("400m · 5m Walk", "#10b981")}
                interactive={false}
              />
            )}
            <Marker
              position={[tagLatRadius, cCenter[1]]}
              icon={catchmentLabelIcon(`${radiusM}m · Trade Zone`, "#f59e0b")}
              interactive={false}
            />
          </>
        )}

        {/* Candidate Locations */}
        {layers.showCandidates &&
          locations.map((loc, idx) => (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={candidateSiteIcon(idx, loc.id === selectedId, loc.name)}
              eventHandlers={{ click: () => onSelect?.(loc.id) }}
            >
              <Popup className="rr-map-popup">
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-amber-500 font-mono text-[12px] font-bold text-ink-950">
                      {idx + 1}
                    </span>
                    <strong className="text-[13.5px] font-semibold text-bone-100">{loc.name}</strong>
                  </div>
                  <div className="text-[11.5px] text-bone-400 mb-2.5 leading-relaxed">{loc.address}</div>
                  <button
                    onClick={() => onSelect?.(loc.id)}
                    className="w-full rounded-md bg-amber-500 px-3 py-1.5 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-ink-950 hover:bg-amber-400 transition-colors shadow-sm"
                  >
                    Focus Location
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Nearby POIs */}
        {visibleNearby.map((b) => (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={poiMarkerIcon(b, b.id === selectedNearbyId, showLabels)}
            eventHandlers={{ click: () => onSelectNearby?.(b.id) }}
          >
            <Popup className="rr-map-popup">
              <div className="p-1 min-w-[220px]">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="font-semibold text-[13.5px] text-bone-100">{b.name}</div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9.5px] font-mono font-medium ${
                      b.competitor
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {b.competitor ? "Competitor" : "Neighbor"}
                  </span>
                </div>
                <div className="text-[11.5px] text-bone-400 mb-1.5">
                  {b.category} · <span className="font-mono text-bone-200 font-semibold">{b.distanceM} m</span> from site
                </div>
                {b.note && (
                  <div className="text-[11px] italic text-bone-300 mb-2 border-l border-line pl-2 leading-relaxed">
                    “{b.note}”
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-bone-400 border-t border-line/60 pt-1.5">
                  <span className="capitalize">{b.source}</span>
                  <span
                    className={`font-medium ${
                      b.status === "verified"
                        ? "text-emerald-400"
                        : b.status === "field-observed"
                        ? "text-blue-400"
                        : "text-amber-400"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map HUD Top Bar */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-[400] flex flex-wrap items-center justify-between gap-2">
        {/* Status pill */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-1.5 backdrop-blur shadow-2xl text-[11px]">
          <Compass size={14} className="text-amber-400 shrink-0" />
          <span className="font-bold text-slate-100">
            {basemap === "voyager"
              ? "Voyager (High Legibility)"
              : basemap === "positron"
              ? "Positron (Light GIS)"
              : basemap === "dark"
              ? "Dark Matter"
              : "OpenStreetMap"}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 font-mono font-medium">{locations.length} Sites</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 font-mono font-medium">{visibleNearby.length} POIs Visible</span>
        </div>

        {/* Map View & Layer Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/95 p-1 backdrop-blur shadow-2xl text-[11px]">
          {/* Basemap style switcher */}
          <div className="flex items-center rounded-md bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setBasemap("voyager")}
              className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all ${
                basemap === "voyager"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="CARTO Voyager: Clean High-Contrast Commercial Map"
            >
              Voyager (Clear)
            </button>
            <button
              onClick={() => setBasemap("positron")}
              className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all ${
                basemap === "positron"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="CARTO Positron: Crisp Clean White Minimalist Map"
            >
              Light
            </button>
            <button
              onClick={() => setBasemap("dark")}
              className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all ${
                basemap === "dark"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="CARTO Dark Matter: Dark Theme"
            >
              Dark
            </button>
            <button
              onClick={() => setBasemap("osm")}
              className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all ${
                basemap === "osm"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="OpenStreetMap Standard Tiles"
            >
              OSM
            </button>
          </div>

          {/* Label Toggle */}
          <button
            onClick={() => setShowLabels((v) => !v)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-all ${
              showLabels
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
            title="Toggle POI Business Name Labels on Map"
          >
            {showLabels ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Labels</span>
          </button>

          {/* Quick Layer Controls */}
          {onToggleLayer && (
            <>
              <button
                onClick={() => onToggleLayer("showCompetitors")}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-semibold transition-all ${
                  layers.showCompetitors
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "text-slate-400 hover:text-slate-200 opacity-60"
                }`}
                title="Toggle Competitors"
              >
                <span className="size-2 rounded-full bg-rose-500" />
                <span className="hidden md:inline">Competitors</span>
              </button>

              <button
                onClick={() => onToggleLayer("showComplementary")}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-semibold transition-all ${
                  layers.showComplementary
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "text-slate-400 hover:text-slate-200 opacity-60"
                }`}
                title="Toggle Anchors & Neighbors"
              >
                <span className="size-2 rounded-full bg-blue-500" />
                <span className="hidden md:inline">Anchors</span>
              </button>

              <button
                onClick={() => onToggleLayer("showTransit")}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-semibold transition-all ${
                  layers.showTransit
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200 opacity-60"
                }`}
                title="Toggle Transit Stations"
              >
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="hidden md:inline">Transit</span>
              </button>

              <button
                onClick={() => onToggleLayer("showCatchments")}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-semibold transition-all ${
                  layers.showCatchments
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-slate-200 opacity-60"
                }`}
                title="Toggle Walking Catchment Rings"
              >
                <span className="hidden sm:inline">{radiusM}m Walk</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating Bottom Legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-3.5 rounded-lg border border-slate-700 bg-slate-900/95 px-3.5 py-1.5 backdrop-blur text-[11px] text-slate-300 shadow-2xl">
        <span className="flex items-center gap-1.5 font-semibold text-amber-300">
          <span className="size-2.5 rounded-full bg-amber-400 border border-white" /> Candidate Site
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-rose-300">
          <span className="size-2.5 rounded-full bg-rose-500 border border-white" /> Competitor
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-blue-300">
          <span className="size-2.5 rounded-full bg-blue-500 border border-white" /> Anchor / Neighbor
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
          <span className="size-2.5 rounded-full bg-emerald-500 border border-white" /> Transit Station
        </span>
        <span className="flex items-center gap-1.5 font-medium text-slate-400">
          <span className="size-2.5 rounded-full border-2 border-dashed border-amber-400" /> Unverified
        </span>
      </div>
    </div>
  );
}
