import React, { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

/* ── Brand mark ──────────────────────────────────────────── */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--color-ink-800)" stroke="var(--color-line-strong)" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="var(--color-brass-500)" strokeWidth="1.8" opacity="0.9" />
      <circle cx="16" cy="16" r="5.5" fill="none" stroke="var(--color-brass-500)" strokeWidth="1.2" opacity="0.5" />
      <circle cx="16" cy="16" r="2.1" fill="var(--color-brass-400)" />
      <line x1="16" y1="16" x2="23.4" y2="8.6" stroke="var(--color-bone-100)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={compact ? 26 : 30} />
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-[17px] font-medium tracking-tight text-bone-100">
          RetailRadar
        </span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brass-400">AI</span>
      </span>
    </span>
  );
}

/* ── Motion helpers ──────────────────────────────────────── */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn("reveal", className)} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}

export function CountUp({
  to,
  duration = 1400,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: {
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && (setStarted(true), io.disconnect())),
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!started || !ref.current) return;
    if (reduced) {
      ref.current.textContent = prefix + to.toFixed(decimals) + suffix;
      return;
    }
    const el = ref.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + (to * eased).toFixed(decimals) + suffix;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, duration, decimals, suffix, prefix, reduced]);
  return (
    <span ref={ref} className={cn("tnum", className)}>
      {prefix}0{suffix}
    </span>
  );
}

/* ── Score ring ──────────────────────────────────────────── */
export function ScoreRing({
  score,
  size = 108,
  stroke = 7,
  tone = "brass",
  label,
  showSublabel,
}: {
  score: number;
  size?: number;
  stroke?: number;
  tone?: "brass" | "sage" | "ember";
  label?: string;
  showSublabel?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const colors = { brass: "var(--color-brass-500)", sage: "var(--color-sage-400)", ember: "var(--color-ember-400)" };
  const isCompact = size < 70;
  const shouldShowSublabel = showSublabel ?? !isCompact;
  const fontSize = isCompact ? Math.max(14, Math.round(size * 0.32)) : 24;

  return (
    <div className="relative inline-grid place-items-center select-none shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-700)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, score)) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center justify-center">
        <div className="tnum font-mono font-bold leading-none text-bone-100" style={{ fontSize: `${fontSize}px` }}>
          {score}
        </div>
        {shouldShowSublabel && (
          <div className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.14em] text-bone-500">
            {label ?? "/ 100"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section heading (marketing) ─────────────────────────── */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-8 bg-brass-500/60" />
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-brass-400">{children}</span>
    </div>
  );
}
