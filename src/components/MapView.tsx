import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass } from "lucide-react";
import type { NearbyBusiness } from "../lib/types";

/* ── CARTO Dark Basemap Tiles (Authenticated with API Key) ── */
const mapsApiKey =
  import.meta.env.VITE_MAPS_API_KEY ||
  import.meta.env.VITE_CARTO_API_KEY ||
  "cb1_4twj_1_0b4244f0717161156a2b678e";

const TILE_URL = mapsApiKey
  ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${mapsApiKey}`
  : "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";

const TILE_ATTR = '© OpenStreetMap contributors · © CARTO';

function createDivIcon(html: string, width: number, height: number, anchorX?: number, anchorY?: number) {
  return L.divIcon({
    className: "leaflet-custom-div-icon",
    html,
    iconSize: [width, height],
    iconAnchor: [anchorX ?? width / 2, anchorY ?? height / 2],
    popupAnchor: [0, -(anchorY ?? height / 2) - 4],
  });
}

/** Subject candidate location pin with clear numbered badge & glowing ring */
const candidateSiteIcon = (index: number, active: boolean) => {
  const size = active ? 36 : 28;
  const num = index + 1;
  return createDivIcon(
    `<div class="relative flex items-center justify-center select-none cursor-pointer group" style="width:${size}px;height:${size}px">
      ${active ? `<div class="absolute inset-0 rounded-full animate-ping opacity-35 bg-brass-500" style="background:#d9a441"></div>` : ""}
      <div class="relative flex items-center justify-center rounded-full border font-mono font-bold text-ink-950 shadow-lg transition-transform ${
        active
          ? "border-bone-100 bg-brass-400 text-[13px] scale-110 shadow-[0_0_18px_rgba(217,164,65,0.85)]"
          : "border-brass-400 bg-brass-500 text-[11px] hover:scale-105"
      }" style="width:${size}px;height:${size}px;background:${active ? "#f2c165" : "#d9a441"};border-color:${active ? "#ffffff" : "#dfa94b"}">
        ${num}
      </div>
    </div>`,
    size,
    size
  );
};

/** Nearby business pin with semantic color and status styling */
const poiMarkerIcon = (b: NearbyBusiness, isSelected: boolean) => {
  const isComp = b.competitor;
  const isTransit = b.category.toLowerCase().includes("transit") || b.category.toLowerCase().includes("bus") || b.category.toLowerCase().includes("metro");
  
  let bg = "#7fa1c4"; // default complementary
  let border = "rgba(255,255,255,0.7)";
  if (isComp) {
    bg = "#d96a5f"; // competitor coral
  } else if (isTransit) {
    bg = "#4da577"; // transit emerald
  }

  const isUnverified = b.status === "unverified";
  const size = isSelected ? 18 : 12;
  const borderWidth = isSelected ? 2.5 : 1.5;
  const borderStyle = isUnverified ? "dashed" : "solid";

  return createDivIcon(
    `<div class="relative flex items-center justify-center cursor-pointer transition-transform" style="width:${size}px;height:${size}px">
      ${isSelected ? `<div class="absolute inset-[-4px] rounded-full border-2 border-bone-100 animate-pulse"></div>` : ""}
      <div class="rounded-full shadow-md" style="width:${size}px;height:${size}px;background:${isUnverified ? "transparent" : bg};border:${borderWidth}px ${borderStyle} ${isUnverified ? bg : border};box-shadow:0 1px 4px rgba(0,0,0,0.6)"></div>
    </div>`,
    size,
    size
  );
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
  const activeLoc = locations.find((l) => l.id === selectedId) || locations[0];
  const cCenter: [number, number] = radiusCenter || (activeLoc ? [activeLoc.lat, activeLoc.lng] : center);

  // Filter POIs by layers
  const visibleNearby = nearby.filter((b) => {
    const isComp = b.competitor;
    const isTransit = b.category.toLowerCase().includes("transit") || b.category.toLowerCase().includes("bus") || b.category.toLowerCase().includes("metro");
    if (!layers.showUnverified && b.status === "unverified") return false;
    if (isComp && !layers.showCompetitors) return false;
    if (isTransit && !layers.showTransit) return false;
    if (!isComp && !isTransit && !layers.showComplementary) return false;
    return true;
  });

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
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} subdomains="abcd" maxZoom={19} />
        
        {fitKey && <AutoFlyTo center={center} zoom={zoom} />}
        {fitAllTrigger && <BoundsFitter locations={locations} triggerKey={fitAllTrigger} />}

        {/* Concentric Walking Catchments (400m ~ 5 min, 800m ~ 10 min, 1200m ~ 15 min) */}
        {layers.showCatchments && cCenter && (
          <>
            <Circle
              center={cCenter}
              radius={radiusM}
              pathOptions={{
                color: "#d9a441",
                weight: 1.5,
                opacity: 0.6,
                fillColor: "#d9a441",
                fillOpacity: 0.05,
                dashArray: "4 6",
              }}
            />
            {radiusM >= 800 && (
              <Circle
                center={cCenter}
                radius={400}
                pathOptions={{
                  color: "#d9a441",
                  weight: 1,
                  opacity: 0.4,
                  fillOpacity: 0.02,
                  dashArray: "3 6",
                }}
              />
            )}
            {radiusM > 1000 && (
              <Circle
                center={cCenter}
                radius={800}
                pathOptions={{
                  color: "#d9a441",
                  weight: 1,
                  opacity: 0.3,
                  fillOpacity: 0.015,
                  dashArray: "3 8",
                }}
              />
            )}
          </>
        )}

        {/* Candidate Locations */}
        {layers.showCandidates &&
          locations.map((loc, idx) => (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={candidateSiteIcon(idx, loc.id === selectedId)}
              eventHandlers={{ click: () => onSelect?.(loc.id) }}
            >
              <Popup className="rr-map-popup">
                <div className="p-1 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex size-5 items-center justify-center rounded-full bg-brass-500 font-mono text-[10px] font-bold text-ink-950">
                      {idx + 1}
                    </span>
                    <strong className="text-[13px] font-semibold text-bone-100">{loc.name}</strong>
                  </div>
                  <div className="text-[11px] text-bone-400 mb-2">{loc.address}</div>
                  <button
                    onClick={() => onSelect?.(loc.id)}
                    className="w-full rounded bg-brass-500 px-2.5 py-1 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-ink-950 hover:bg-brass-400"
                  >
                    Select Location
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
            icon={poiMarkerIcon(b, b.id === selectedNearbyId)}
            eventHandlers={{ click: () => onSelectNearby?.(b.id) }}
          >
            <Popup className="rr-map-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-semibold text-[13px] text-bone-100">{b.name}</div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9.5px] font-mono font-medium ${
                      b.competitor ? "bg-ember-500/20 text-ember-300 border border-ember-500/30" : "bg-steel-500/20 text-steel-300 border border-steel-500/30"
                    }`}
                  >
                    {b.competitor ? "Competitor" : "Neighbor"}
                  </span>
                </div>
                <div className="text-[11px] text-bone-400 mb-1.5">
                  {b.category} · <span className="font-mono text-bone-300">{b.distanceM} m</span> from site
                </div>
                {b.note && <div className="text-[10.5px] italic text-bone-300 mb-2 border-l border-line pl-2">“{b.note}”</div>}
                <div className="flex items-center justify-between text-[9.5px] text-bone-500 border-t border-line/60 pt-1.5">
                  <span className="capitalize">{b.source}</span>
                  <span className={`font-medium ${b.status === "verified" ? "text-sage-400" : b.status === "field-observed" ? "text-steel-400" : "text-bone-500"}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map HUD Top Bar */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-line-strong bg-ink-900/90 px-3 py-1.5 backdrop-blur-md shadow-lg text-[11px]">
          <Compass size={13} className="text-brass-400" />
          <span className="font-medium text-bone-200">
            {mapsApiKey ? "CARTO Basemaps (Key Active)" : "OpenStreetMap Live"}
          </span>
          <span className="text-bone-500">·</span>
          <span className="text-bone-400 font-mono">{locations.length} Sites</span>
          <span className="text-bone-500">·</span>
          <span className="text-bone-400 font-mono">{visibleNearby.length} POIs Visible</span>
        </div>

        {/* Quick Layer Pill Controls */}
        {onToggleLayer && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-1 rounded-lg border border-line-strong bg-ink-900/90 p-1 backdrop-blur-md shadow-lg text-[11px]">
            <button
              onClick={() => onToggleLayer("showCompetitors")}
              className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors ${
                layers.showCompetitors ? "bg-ember-500/15 text-ember-300 border border-ember-500/30" : "text-bone-500 hover:text-bone-300"
              }`}
              title="Toggle Competitors"
            >
              <span className="size-2 rounded-full bg-ember-400" />
              <span>Competitors</span>
            </button>

            <button
              onClick={() => onToggleLayer("showComplementary")}
              className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors ${
                layers.showComplementary ? "bg-steel-500/15 text-steel-300 border border-steel-500/30" : "text-bone-500 hover:text-bone-300"
              }`}
              title="Toggle Complementary"
            >
              <span className="size-2 rounded-full bg-steel-400" />
              <span>Anchors</span>
            </button>

            <button
              onClick={() => onToggleLayer("showTransit")}
              className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors ${
                layers.showTransit ? "bg-sage-500/15 text-sage-300 border border-sage-500/30" : "text-bone-500 hover:text-bone-300"
              }`}
              title="Toggle Transit Hubs"
            >
              <span className="size-2 rounded-full bg-sage-400" />
              <span>Transit</span>
            </button>

            <button
              onClick={() => onToggleLayer("showCatchments")}
              className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors ${
                layers.showCatchments ? "bg-brass-500/15 text-brass-300 border border-brass-500/30" : "text-bone-500 hover:text-bone-300"
              }`}
              title="Toggle Walking Catchments"
            >
              <span>{radiusM}m Walk</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-3 rounded-lg border border-line-strong bg-ink-900/85 px-3 py-1.5 backdrop-blur-md text-[10.5px] text-bone-400 shadow-md">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brass-400" /> Candidate</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ember-400" /> Competitor</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-steel-400" /> Neighbor / Anchor</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-sage-400" /> Transit Station</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-dashed border-bone-400" /> Unverified Record</span>
      </div>
    </div>
  );
}
