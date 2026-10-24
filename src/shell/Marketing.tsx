import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { Wordmark } from "../components/chrome";
import { Button } from "../components/ui";
import { cn } from "../lib/utils";
import { useApp } from "../store/AppStore";

const NAV = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/sample-analysis", label: "Sample analysis" },
  { to: "/about", label: "About" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { session } = useApp();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[70] transition-all duration-500",
        scrolled ? "border-b border-line bg-ink-950/85 backdrop-blur-xl" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" aria-label="RetailRadar AI home" className="transition-opacity hover:opacity-85">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3.5 py-2 text-[13.5px] transition-colors",
                  isActive ? "text-bone-100" : "text-bone-400 hover:text-bone-100"
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {session ? (
            <Button variant="outline" size="sm" to="/app">Open workspace</Button>
          ) : (
            <Button variant="ghost" size="sm" to="/sign-in">Sign in</Button>
          )}
          <Button size="sm" to="/app/analyses/new">
            Analyze a location <ArrowRight size={14} />
          </Button>
        </div>
        <button
          className="flex size-10 items-center justify-center rounded-lg text-bone-200 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-ink-950/97 px-5 pb-6 pt-3 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="rounded-lg px-3 py-2.5 text-[15px] text-bone-200 hover:bg-bone-100/5">
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex gap-2.5">
            <Button variant="outline" className="flex-1" to={session ? "/app" : "/sign-in"}>
              {session ? "Open workspace" : "Sign in"}
            </Button>
            <Button className="flex-1" to="/app/analyses/new">Analyze a location</Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-line bg-ink-950">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-bone-400">
              Commercial location intelligence for retail investment decisions. Compare candidate
              sites, model the finances, and verify the last mile — before you sign the lease.
            </p>
            <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-bone-500">
              Triwizathon Round 2 · Product prototype
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { to: "/features", label: "Feature overview" },
              { to: "/how-it-works", label: "How it works" },
              { to: "/sample-analysis", label: "Sample analysis" },
              { to: "/sample-report", label: "Sample report" },
            ]}
          />
          <FooterCol
            title="Workspace"
            links={[
              { to: "/app", label: "Dashboard" },
              { to: "/app/analyses/new", label: "New analysis" },
              { to: "/app/reports", label: "Reports" },
              { to: "/app/help", label: "Help & guidance" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { to: "/about", label: "About the team" },
              { to: "/sign-in", label: "Sign in" },
              { to: "/create-account", label: "Create account" },
            ]}
          />
        </div>
        <div className="hairline my-8" />
        <div className="flex flex-col justify-between gap-3 text-[12px] text-bone-500 sm:flex-row">
          <span>© 2025 RetailRadar AI. All business records shown in this prototype are fictional demonstration data.</span>
          <span className="font-mono">Built for evaluation · not live market data</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-bone-500">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} className="text-[13.5px] text-bone-300 transition-colors hover:text-bone-100">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MarketingShell() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="min-h-screen bg-ink-900">
      <MarketingNav />
      <Outlet />
      <MarketingFooter />
    </div>
  );
}
