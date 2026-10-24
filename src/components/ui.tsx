import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, AlertTriangle, CheckCircle2, Info, Loader2, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { useApp } from "../store/AppStore";
import type { EvidenceSource, EvidenceStatus } from "../lib/types";

/* ── Buttons ─────────────────────────────────────────────── */
type BtnVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "quiet";
type BtnSize = "xs" | "sm" | "md" | "lg";

const btnBase =
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-200 select-none whitespace-nowrap disabled:opacity-45 disabled:pointer-events-none active:scale-[0.985] focus-visible:outline-2";

const btnVariants: Record<BtnVariant, string> = {
  primary:
    "bg-brass-500 text-ink-950 hover:bg-brass-400 shadow-[0_10px_30px_-10px_rgba(217,164,65,0.5)] rounded-lg",
  secondary:
    "border border-line-strong bg-ink-800/80 text-bone-100 hover:border-bone-400/40 hover:bg-ink-750 rounded-lg",
  outline:
    "border border-line-strong bg-ink-800/60 text-bone-100 hover:border-bone-400/40 hover:bg-ink-750 rounded-lg",
  ghost: "text-bone-300 hover:text-bone-100 hover:bg-bone-100/[0.05] rounded-lg",
  quiet: "text-bone-400 hover:text-bone-100 rounded-lg",
  danger: "border border-ember-500/30 bg-ember-500/10 text-ember-300 hover:bg-ember-500/20 rounded-lg",
};

const btnSizes: Record<BtnSize, string> = {
  xs: "h-7 px-2.5 text-xs",
  sm: "h-8.5 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  to?: string;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", to, loading, className, children, ...rest }: BtnProps) {
  const cls = cn(btnBase, btnVariants[variant], btnSizes[size], className);
  if (to !== undefined) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({
  className,
  label,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-line bg-ink-800/60 text-bone-400 transition-colors hover:border-line-strong hover:text-bone-100",
        className
      )}
      {...rest}
    />
  );
}

/* ── Surfaces ────────────────────────────────────────────── */
export function Panel({
  className,
  children,
  pad = true,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { pad?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-ink-850 shadow-[0_1px_0_rgba(236,233,225,0.03)_inset]",
        pad && "p-5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  desc,
  action,
  className,
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-bone-100">{title}</h3>
        {desc && <p className="mt-1 text-[13px] leading-relaxed text-bone-400">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Badges ──────────────────────────────────────────────── */
type BadgeTone = "brass" | "sage" | "ember" | "steel" | "neutral" | "outline";
const badgeTones: Record<BadgeTone, string> = {
  brass: "bg-brass-500/12 text-brass-300 border-brass-500/30",
  sage: "bg-sage-500/12 text-sage-300 border-sage-500/30",
  ember: "bg-ember-500/12 text-ember-300 border-ember-500/30",
  steel: "bg-steel-500/12 text-steel-300 border-steel-500/30",
  neutral: "bg-bone-100/[0.06] text-bone-300 border-bone-100/10",
  outline: "bg-transparent text-bone-400 border-line-strong",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: EvidenceStatus }) {
  if (status === "verified")
    return (
      <Badge tone="sage">
        <CheckCircle2 size={11} /> Verified
      </Badge>
    );
  if (status === "field-observed")
    return (
      <Badge tone="steel">
        <span className="size-1.5 rounded-full bg-steel-300" /> Field-observed
      </Badge>
    );
  return (
    <Badge tone="outline">
      <span className="size-1.5 rounded-full bg-bone-500" /> Unverified
    </Badge>
  );
}

export function SourceBadge({ source }: { source: EvidenceSource }) {
  const label =
    source === "open-data" ? "Open map data (demo)" : source === "demo-survey" ? "Demo field survey" : "Added by team";
  return <span className="text-[11px] text-bone-500">{label}</span>;
}

export function VerdictBadge({ tone, label }: { tone: "prime" | "strong" | "conditional" | "caution" | "risk"; label: string }) {
  const map = { prime: "brass", strong: "sage", conditional: "steel", caution: "ember", risk: "ember" } as const;
  return <Badge tone={map[tone]}>{label}</Badge>;
}

/* ── Forms ───────────────────────────────────────────────── */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-bone-200">
        {label}
        {error && <span className="text-[12px] font-normal text-ember-300">{error}</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-[12px] leading-relaxed text-bone-500">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-ink-800/80 px-3.5 text-sm text-bone-100 placeholder:text-bone-500 transition-colors hover:border-line-strong focus:border-brass-500/50 focus:outline-none focus:ring-2 focus:ring-brass-500/15";

export function Input({ className, invalid, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(inputCls, "h-10", invalid && "border-ember-500/50", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "min-h-24 py-2.5 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(inputCls, "h-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2396948d%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat pr-9", className)}
      {...rest}
    >
      {children}
    </select>
  );
}

export function MoneyInput({
  value,
  onCommit,
  prefix = "₹",
  step = 500,
  className,
  min = 0,
  suffix,
}: {
  value: number;
  onCommit: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  className?: string;
  min?: number;
}) {
  const [raw, setRaw] = useStateSafe(String(value));
  useEffect(() => {
    setRaw(String(value));
  }, [value, setRaw]);
  const parsed = parseFloat(raw.replace(/,/g, ""));
  const invalid = raw !== "" && (isNaN(parsed) || parsed < min);
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-bone-500">{prefix}</span>
      <input
        inputMode="decimal"
        className={cn(inputCls, "tnum h-10 pl-7", suffix && "pr-12", invalid && "border-ember-500/60")}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          const n = parseFloat(e.target.value.replace(/,/g, ""));
          if (!isNaN(n)) onCommit(Math.max(min, n));
        }}
        onBlur={() => {
          if (isNaN(parsed)) setRaw(String(value));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") { e.preventDefault(); onCommit((isNaN(parsed) ? value : parsed) + step); }
          if (e.key === "ArrowDown") { e.preventDefault(); onCommit(Math.max(min, (isNaN(parsed) ? value : parsed) - step)); }
        }}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-bone-500">{suffix}</span>
      )}
    </div>
  );
}

/** useState that tolerates being driven by an external value. */
function useStateSafe(initial: string): [string, (v: string) => void] {
  const [v, setV] = React.useState(initial);
  return [v, setV];
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label ?? "toggle"}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5.5 w-10 rounded-full border transition-colors duration-200",
        checked ? "border-brass-500/60 bg-brass-500/25" : "border-line-strong bg-ink-700"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-all duration-200",
          checked ? "left-[21px] bg-brass-400" : "left-[3px] bg-bone-400"
        )}
      />
    </button>
  );
}

/* ── Progress / meters ───────────────────────────────────── */
export function Meter({ value, tone = "brass", className }: { value: number; tone?: "brass" | "sage" | "ember" | "steel"; className?: string }) {
  const tones = { brass: "bg-brass-500", sage: "bg-sage-400", ember: "bg-ember-400", steel: "bg-steel-400" };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink-700", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ── Stats ───────────────────────────────────────────────── */
export function Stat({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "good" | "bad" | "warn";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-bone-500">{label}</div>
      <div className="tnum mt-1.5 font-mono text-xl font-medium tracking-tight text-bone-100">{value}</div>
      {sub && (
        <div
          className={cn(
            "mt-1 text-[12px] leading-relaxed text-bone-400",
            tone === "good" && "text-sage-300",
            tone === "bad" && "text-ember-300",
            tone === "warn" && "text-brass-300"
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Dialog ──────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" style={{ animation: "rise .25s ease both" }} />
      <div
        ref={ref}
        className={cn(
          "relative max-h-[88vh] w-full overflow-y-auto rounded-2xl border border-line-strong bg-ink-850 p-6 shadow-[var(--shadow-pop)]",
          wide ? "max-w-2xl" : "max-w-md"
        )}
        style={{ animation: "rise .3s cubic-bezier(.22,1,.36,1) both" }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-bone-100">{title}</h2>
          <IconButton label="Close dialog" onClick={onClose} className="-mr-1.5 -mt-1.5 border-transparent bg-transparent">
            <X size={16} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3 text-[14px] leading-relaxed text-bone-300">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-ember-300" />
        <div>{body}</div>
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionTo,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-line bg-ink-800 text-bone-400">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold tracking-tight text-bone-100">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-bone-400">{body}</p>
      {actionLabel && (
        <Button variant="outline" size="sm" className="mt-5" to={actionTo} onClick={onAction}>
          <Plus size={14} /> {actionLabel}
        </Button>
      )}
    </div>
  );
}

/* ── Inline note ─────────────────────────────────────────── */
export function InlineNote({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "warn" | "good";
  children: React.ReactNode;
  className?: string;
}) {
  const map = {
    info: { icon: <Info size={14} />, cls: "border-line bg-ink-800/60 text-bone-300" },
    warn: { icon: <AlertTriangle size={14} />, cls: "border-brass-500/25 bg-brass-500/[0.07] text-brass-300" },
    good: { icon: <CheckCircle2 size={14} />, cls: "border-sage-500/25 bg-sage-500/[0.07] text-sage-300" },
  }[tone];
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[12.5px] leading-relaxed", map.cls, className)}>
      <span className="mt-px shrink-0 opacity-80">{map.icon}</span>
      <div>{children}</div>
    </div>
  );
}

/* ── Toasts ──────────────────────────────────────────────── */
export function ToastViewport() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line-strong bg-ink-800/95 px-4 py-3.5 shadow-[var(--shadow-pop)] backdrop-blur"
          style={{ animation: "rise .3s cubic-bezier(.22,1,.36,1) both" }}
        >
          <span className={cn("mt-0.5 shrink-0", t.tone === "success" && "text-sage-400", t.tone === "info" && "text-steel-300", t.tone === "error" && "text-ember-300")}>
            {t.tone === "error" ? <AlertTriangle size={16} /> : t.tone === "info" ? <Info size={16} /> : <CheckCircle2 size={16} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-medium text-bone-100">{t.title}</div>
            {t.body && <div className="mt-0.5 text-[12.5px] leading-relaxed text-bone-400">{t.body}</div>}
          </div>
          <button aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="text-bone-500 transition-colors hover:text-bone-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
