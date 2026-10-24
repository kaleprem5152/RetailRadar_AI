import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BadgeCheck, CheckCheck, CircleDot,
  Clock, PenLine, Plus, ShieldAlert, Trash2,
} from "lucide-react";
import {
  Badge, Button, Field, IconButton, Input, Modal, Panel,
  PanelHeader, Select, SourceBadge, StatusBadge, Textarea,
} from "../components/ui";
import MapView from "../components/MapView";
import { AnalysisFrame } from "./AnalysisPages";
import { useApp } from "../store/AppStore";
import { cn, fmtDateTime, uid } from "../lib/utils";
import type {
  Analysis, CandidateLocation, ChecklistItem, ChecklistState,
  EvidenceStatus, NearbyBusiness,
} from "../lib/types";

/* ── Local Truth Map Workspace ─────────────────────────────────────── */
export function LocalTruthPage() {
  return (
    <AnalysisFrame
      title="Ground Truth Intelligence Ledger"
      desc="Bridge the gap between raw open data and physical reality. Log street observations, verify unverified records, and record ground-level truth."
    >
      {(a) => <TruthBody a={a} />}
    </AnalysisFrame>
  );
}

function TruthBody({ a }: { a: Analysis }) {
  const [locId, setLocId] = useState(a.locations[0]?.id ?? "");
  const loc = a.locations.find((l) => l.id === locId) ?? a.locations[0];
  if (!loc) return <Panel className="py-14 text-center text-[13px] text-bone-400">Add a candidate location to start its truth ledger.</Panel>;

  const verifiedCount = loc.nearby.filter((b) => b.status === "verified").length;
  const observedCount = loc.nearby.filter((b) => b.status === "field-observed").length;
  const unverifiedCount = loc.nearby.filter((b) => b.status === "unverified").length;
  const total = loc.nearby.length;
  const verifiedPct = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Location Switcher ─────────────────────────────────────── */}
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

      {/* ── Ground Truth Evidence Summary Cards ─────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel className="p-4 border-sage-500/30 bg-sage-500/[0.03]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-sage-400 font-semibold">Independently Verified</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-sage-300">{verifiedCount}</span>
            <span className="text-[11px] text-bone-400">records</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">Confirmed on-site</span>
        </Panel>

        <Panel className="p-4 border-steel-500/30 bg-steel-500/[0.03]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-steel-400 font-semibold">Field Observed</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-steel-300">{observedCount}</span>
            <span className="text-[11px] text-bone-400">records</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">First-pass observation</span>
        </Panel>

        <Panel className="p-4 border-ember-500/30 bg-ember-500/[0.03]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ember-400 font-semibold">Unverified Open Data</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-ember-300">{unverifiedCount}</span>
            <span className="text-[11px] text-bone-400">records</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">Pending audit</span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-brass-400 font-semibold">Audit Confidence</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-[24px] font-bold font-mono", verifiedPct >= 60 ? "text-sage-300" : "text-brass-300")}>
              {verifiedPct}%
            </span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">{verifiedCount} of {total} verified</span>
        </Panel>
      </div>

      {/* ── Main Two-Column Layout (Ledger on Left, Map & Provenance on Right) ── */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <TruthList a={a} loc={loc} />

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              title={`Spatial Context — ${loc.name}`}
              desc="Physical trade area anchor. Observations are pinned by GPS."
            />
            <div className="mt-3">
              <MapView
                center={[loc.lat, loc.lng]}
                zoom={15}
                locations={[{ id: loc.id, lat: loc.lat, lng: loc.lng, name: loc.name }]}
                nearby={loc.nearby}
                radiusM={600}
                radiusCenter={[loc.lat, loc.lng]}
                height={260}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-bone-400 font-mono">
              <span>Center: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
              <span>Radius: 600m</span>
            </div>
          </Panel>

          <Panel className="p-4 space-y-2">
            <h4 className="text-[12.5px] font-semibold text-bone-100 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-brass-400" />
              <span>Provenance & Anti-Hallucination Policy</span>
            </h4>
            <p className="text-[11.5px] text-bone-400 leading-relaxed">
              OpenStreetMap records and user-added observations are never commingled into authoritative claims without explicit verification. Any record flagged as <em>unverified</em> penalizes the Location Decision Score until physically confirmed.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function TruthList({ a, loc }: { a: Analysis; loc: CandidateLocation }) {
  const { addNearbyBusiness, updateNearbyBusiness, removeNearbyBusiness, toast, logActivity, user } = useApp();
  const [editing, setEditing] = useState<NearbyBusiness | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | EvidenceStatus>("all");

  const rows = useMemo(
    () => loc.nearby.filter((b) => filter === "all" || b.status === filter).sort((x, y) => x.distanceM - y.distanceM),
    [loc.nearby, filter]
  );

  const promote = (b: NearbyBusiness, status: EvidenceStatus) => {
    updateNearbyBusiness(a.id, loc.id, {
      ...b,
      status,
      source: b.source === "open-data" ? "user-added" : b.source,
      addedBy: user.name,
    });
    logActivity(a.id, `Promoted “${b.name}” to ${status} status.`, "verify");
    toast(status === "verified" ? "Record verified in field" : "Marked as field-observed", { body: b.name });
  };

  return (
    <Panel pad={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h3 className="text-[14px] font-semibold text-bone-100">Trade Area Truth Ledger — {loc.name}</h3>
          <p className="text-[11.5px] text-bone-500">Every business, competitor, or destination recorded within trade boundaries.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-line text-[11.5px]">
            {(["all", "unverified", "field-observed", "verified"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2.5 py-1.5 capitalize transition-colors font-medium",
                  filter === f ? "bg-brass-500/15 text-brass-300 font-semibold" : "text-bone-400 hover:text-bone-100"
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          <Button size="xs" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add Record
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-line-soft">
        {rows.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink-800/40">
            <span className={cn("size-2 shrink-0 rounded-full", b.competitor ? "bg-ember-400" : "bg-steel-400")} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13.5px] font-medium text-bone-100">{b.name}</span>
                {b.competitor && <Badge tone="ember">Competitor</Badge>}
                {b.addedBy && <Badge tone="neutral">Audited: {b.addedBy}</Badge>}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-bone-500">
                <span>{b.category}</span>
                <span>·</span>
                <span className="tnum font-mono">{b.distanceM} m from site</span>
                <span>·</span>
                <SourceBadge source={b.source} />
              </div>
              {b.note && <p className="mt-1 max-w-lg text-[12px] italic leading-relaxed text-bone-400">“{b.note}”</p>}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={b.status} />
              {b.status === "unverified" && (
                <Button variant="outline" size="xs" onClick={() => promote(b, "field-observed")}>
                  <CircleDot size={12} /> Observed
                </Button>
              )}
              {b.status !== "verified" && (
                <Button variant="outline" size="xs" className="border-sage-500/30 text-sage-300 hover:bg-sage-500/10" onClick={() => promote(b, "verified")}>
                  <BadgeCheck size={12} /> Verify
                </Button>
              )}
              <IconButton label={`Edit ${b.name}`} onClick={() => setEditing(b)}><PenLine size={13} /></IconButton>
              <IconButton
                label={`Remove ${b.name}`}
                onClick={() => { removeNearbyBusiness(a.id, loc.id, b.id); toast("Record removed", { body: b.name, tone: "info" }); }}
                className="hover:text-ember-300"
              >
                <Trash2 size={13} />
              </IconButton>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-5 py-12 text-center text-[12.5px] text-bone-500">
            {loc.nearby.length === 0 ? "No records yet — click 'Add Record' to log the first street observation." : "No records match this filter."}
          </li>
        )}
      </ul>

      <BusinessModal
        open={adding || !!editing}
        initial={editing}
        loc={loc}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(b) => {
          if (editing) {
            updateNearbyBusiness(a.id, loc.id, b);
            toast("Record updated", { body: b.name });
          } else {
            addNearbyBusiness(a.id, loc.id, b);
            logActivity(a.id, `Logged street observation “${b.name}”.`, "verify");
            toast("Observation logged", { body: `${b.name} pinned to ground truth.` });
          }
          setAdding(false);
          setEditing(null);
        }}
      />
    </Panel>
  );
}

function BusinessModal({
  open, onClose, onSave, initial, loc,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (b: NearbyBusiness) => void;
  initial: NearbyBusiness | null;
  loc: CandidateLocation;
}) {
  const { user } = useApp();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Café / Quick Service");
  const [competitor, setCompetitor] = useState(initial?.competitor ?? true);
  const [distanceM, setDistanceM] = useState(initial?.distanceM ?? 150);
  const [status, setStatus] = useState<EvidenceStatus>(initial?.status ?? "field-observed");
  const [note, setNote] = useState(initial?.note ?? "");

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? uid("biz"),
      name: name.trim(),
      category,
      competitor,
      distanceM: Number(distanceM) || 100,
      lat: loc.lat + (Math.random() - 0.5) * 0.004,
      lng: loc.lng + (Math.random() - 0.5) * 0.004,
      source: "user-added",
      status,
      note: note.trim() || undefined,
      addedBy: user.name,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Field Record" : "Log New Street Observation"}>
      <div className="space-y-4">
        <Field label="Establishment / Landmark Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blue Tokai Coffee, HDFC Bank ATM..." autoFocus />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Specialty Café, Transit Hub" />
          </Field>
          <Field label="Distance from Candidate (m)">
            <Input type="number" value={distanceM} onChange={(e) => setDistanceM(parseInt(e.target.value))} min={10} step={25} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Verification Tier">
            <Select value={status} onChange={(e) => setStatus(e.target.value as EvidenceStatus)}>
              <option value="unverified">Unverified (Pending check)</option>
              <option value="field-observed">Field-Observed (Visited on street)</option>
              <option value="verified">Independently Verified (Documented)</option>
            </Select>
          </Field>
          <Field label="Nature of Business">
            <Select value={competitor ? "comp" : "anchor"} onChange={(e) => setCompetitor(e.target.value === "comp")}>
              <option value="comp">Direct Competitor</option>
              <option value="anchor">Complementary / Anchor</option>
            </Select>
          </Field>
        </div>

        <Field label="Observer Notes / Empirical Findings">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Observed 20+ customers at 7:30 PM; outdoor seating busy..." rows={3} />
        </Field>

        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit}>Save Observation</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Field Verification Checklist Workspace ─────────────────────────── */
export function FieldVerificationPage() {
  return (
    <AnalysisFrame
      title="Pre-Investment Field Verification Audit"
      desc="Empirical checklist of high-risk assumptions that must be physically verified before signing leases or deploying capital."
    >
      {(a) => <VerificationBody a={a} />}
    </AnalysisFrame>
  );
}

function VerificationBody({ a }: { a: Analysis }) {
  const { setChecklistItem, toast, logActivity } = useApp();
  const confirmed = a.checklist.filter((c) => c.state === "confirmed").length;
  const issues = a.checklist.filter((c) => c.state === "issue").length;
  const pending = a.checklist.length - confirmed - issues;

  const groups = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    a.checklist.forEach((item) => {
      const g = item.group || "General Site Audits";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    });
    return Array.from(map.entries());
  }, [a.checklist]);

  const updateState = (item: ChecklistItem, state: ChecklistState) => {
    setChecklistItem(a.id, item.id, { state });
    logActivity(a.id, `Audited item: “${item.label}” → ${state}.`, "verify");
    toast(`Audit updated: ${state}`, { body: item.label, tone: state === "issue" ? "error" : "success" });
  };

  const updateNote = (item: ChecklistItem, note: string) => {
    setChecklistItem(a.id, item.id, { note });
  };

  return (
    <div className="space-y-6">
      {/* ── Executive Audit Readiness Status ───────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4 border-sage-500/30 bg-sage-500/[0.04]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-sage-400 font-semibold">Confirmed / Audited</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-sage-300">{confirmed}</span>
            <span className="text-[11px] text-bone-400">of {a.checklist.length} items</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">Physically verified on site</span>
        </Panel>

        <Panel className="p-4 border-ember-500/30 bg-ember-500/[0.04]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-ember-400 font-semibold">Issues Flagged</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-ember-300">{issues}</span>
            <span className="text-[11px] text-bone-400">red flags</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">Requires negotiation or remediation</span>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono tracking-wider text-brass-400 font-semibold">Pending Verification</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-bone-100">{pending}</span>
            <span className="text-[11px] text-bone-400">unresolved</span>
          </div>
          <span className="text-[11px] text-bone-500 block mt-1">Outstanding field tasks</span>
        </Panel>
      </div>

      {/* ── Grouped Audit Checklists ─────────────────────────────── */}
      <div className="space-y-5">
        {groups.map(([groupName, items]) => (
          <Panel key={groupName} pad={false} className="overflow-hidden">
            <div className="border-b border-line px-5 py-3 bg-ink-900/80">
              <h3 className="text-[13.5px] font-semibold text-bone-100">{groupName}</h3>
            </div>
            <div className="divide-y divide-line/60">
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "size-2.5 rounded-full shrink-0",
                          item.state === "confirmed" ? "bg-sage-400" : item.state === "issue" ? "bg-ember-400" : "bg-brass-400"
                        )} />
                        <h4 className="text-[13.5px] font-medium text-bone-100">{item.label}</h4>
                      </div>
                      {item.hint && <p className="mt-1 text-[12px] text-bone-400 ml-4.5">{item.hint}</p>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateState(item, "confirmed")}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium border transition-colors",
                          item.state === "confirmed"
                            ? "bg-sage-500/20 text-sage-300 border-sage-500/40"
                            : "border-line text-bone-400 hover:text-bone-200 hover:bg-ink-800"
                        )}
                      >
                        <CheckCheck size={12} /> Confirmed
                      </button>

                      <button
                        onClick={() => updateState(item, "issue")}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium border transition-colors",
                          item.state === "issue"
                            ? "bg-ember-500/20 text-ember-300 border-ember-500/40"
                            : "border-line text-bone-400 hover:text-bone-200 hover:bg-ink-800"
                        )}
                      >
                        <AlertTriangle size={12} /> Flag Issue
                      </button>

                      <button
                        onClick={() => updateState(item, "pending")}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium border transition-colors",
                          item.state === "pending"
                            ? "bg-brass-500/20 text-brass-300 border-brass-500/40"
                            : "border-line text-bone-400 hover:text-bone-200 hover:bg-ink-800"
                        )}
                      >
                        <Clock size={12} /> Pending
                      </button>
                    </div>
                  </div>

                  {/* Audit Notes field */}
                  <div className="mt-1">
                    <input
                      type="text"
                      defaultValue={item.note}
                      onBlur={(e) => updateNote(item, e.target.value)}
                      placeholder="Add field notes (e.g. Landlord confirmed 30kW sanctioned 3-phase meter; deposit 6 months refundable)..."
                      className="w-full rounded-lg border border-line bg-ink-800/60 px-3 py-1.5 text-[12px] text-bone-200 placeholder:text-bone-500 focus:border-brass-400 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ── Activity Audit Log Page ───────────────────────────────────────── */
export function ActivityPage() {
  return (
    <AnalysisFrame
      title="Analysis Audit Trail & Activity Log"
      desc="Chronological history of location updates, financial parameter adjustments, and field verification events."
    >
      {(a) => <ActivityBody a={a} />}
    </AnalysisFrame>
  );
}

function ActivityBody({ a }: { a: Analysis }) {
  const events = a.activity.slice().reverse();

  return (
    <div className="space-y-4">
      <Panel pad={false} className="overflow-hidden">
        <div className="border-b border-line px-5 py-3.5 flex items-center justify-between">
          <h3 className="text-[13.5px] font-semibold text-bone-100">Audit History ({events.length} events)</h3>
          <span className="font-mono text-[11px] text-bone-500">Immutable ledger</span>
        </div>
        <div className="divide-y divide-line/60">
          {events.map((ev) => (
            <div key={ev.id} className="p-4 flex items-start gap-3">
              <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-brass-500/10 text-brass-400 shrink-0">
                <Activity size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[13px] text-bone-100">{ev.actor}</span>
                  <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[9.5px] font-mono text-bone-400 uppercase tracking-wide">
                    {ev.kind}
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-bone-300">{ev.text}</p>
                <span className="mt-1 block text-[10.5px] font-mono text-bone-500">{fmtDateTime(ev.at)}</span>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="py-12 text-center text-[12.5px] text-bone-500">
              No activity recorded yet.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
