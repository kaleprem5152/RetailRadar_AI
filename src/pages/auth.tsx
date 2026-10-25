import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Database, Info, KeyRound, MailCheck, ShieldAlert } from "lucide-react";
import { Button, Field, InlineNote, Input } from "../components/ui";
import { Wordmark } from "../components/chrome";
import { useApp } from "../store/AppStore";

export function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.36 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.05 0 12c0 1.95.46 3.8 1.27 5.42l4.01-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  const { isCloudConnected } = useApp();

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-20">
      <div className="grid-paper absolute inset-0 opacity-60" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(700px 420px at 50% 0%, rgba(217,164,65,0.08), transparent 65%)" }}
      />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex transition-opacity hover:opacity-85">
          <Wordmark />
        </Link>
        <div
          className="rounded-2xl border border-line-strong bg-ink-850/90 p-7 shadow-[var(--shadow-pop)] backdrop-blur sm:p-9"
          style={{ animation: "rise .5s cubic-bezier(.22,1,.36,1) both" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                isCloudConnected
                  ? "border border-sage-500/30 bg-sage-500/10 text-sage-300"
                  : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              <Database size={11} />
              {isCloudConnected ? "Supabase PostgreSQL Connected" : "Supabase Keys Required"}
            </span>
          </div>

          <h1 className="font-display text-[26px] font-light tracking-tight text-bone-100">{title}</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-bone-400">{sub}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-bone-500">
          <Info size={13} className="mt-0.5 shrink-0" />
          {isCloudConnected
            ? "Protected by Supabase Auth and Row Level Security. User identities and workspaces are persisted in PostgreSQL."
            : "Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your deployment environment variables to activate cloud authentication."}
        </p>
      </div>
    </main>
  );
}

export function SignInPage() {
  const nav = useNavigate();
  const { signIn, signInWithGoogle, isCloudConnected } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrors({});
    if (!isCloudConnected) {
      setErrors({
        general: "Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      });
      return;
    }
    setBusyGoogle(true);
    try {
      await signInWithGoogle();
      // Supabase redirects to Google OAuth
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to initiate Google Sign-in. Please try again." });
      setBusyGoogle(false);
    }
  };

  const submit = async () => {
    const e: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid work email address";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    if (Object.keys(e).length) return;

    if (!isCloudConnected) {
      setErrors({
        general: "Supabase credentials are required. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to sign in.",
      });
      return;
    }

    setBusy(true);
    try {
      await signIn(email, password);
      nav("/app");
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to sign in. Please verify your credentials." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Sign in" sub="Access your secure retail location intelligence workspace.">
      <div className="space-y-4">
        {errors.general && (
          <div className="flex items-start gap-2.5 rounded-lg border border-ember-500/30 bg-ember-500/10 p-3 text-[12.5px] text-ember-300">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={busyGoogle || busy}
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-line-strong bg-ink-800/90 px-4 py-3 text-[13.5px] font-medium text-bone-100 shadow-sm transition-all hover:border-bone-400 hover:bg-ink-750 active:scale-[0.99] disabled:opacity-60"
        >
          {busyGoogle ? (
            <span className="size-4 animate-spin rounded-full border-2 border-bone-100 border-t-transparent" />
          ) : (
            <GoogleIcon className="size-4" />
          )}
          <span>{busyGoogle ? "Redirecting to Google..." : "Continue with Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-line-subtle" />
          <span className="bg-ink-850 px-3 text-[10.5px] font-mono uppercase tracking-wider text-bone-500">
            Or sign in with email
          </span>
        </div>

        <Field label="Work email" error={errors.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!errors.email}
            placeholder="you@retailbrand.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!errors.password}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </Field>
        <div className="flex items-center justify-between text-[12.5px]">
          <Link to="/forgot-password" className="text-brass-300 hover:text-brass-400">
            Forgot password?
          </Link>
          <Link to="/create-account" className="text-bone-400 hover:text-bone-100">
            Create account
          </Link>
        </div>
        <Button className="w-full" size="lg" loading={busy} onClick={submit}>
          Sign in <ArrowRight size={15} />
        </Button>
      </div>
    </AuthShell>
  );
}

export function CreateAccountPage() {
  const nav = useNavigate();
  const { signUp, signInWithGoogle, isCloudConnected } = useApp();
  const [form, setForm] = useState({ name: "", email: "", org: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);

  const handleGoogleSignUp = async () => {
    setErrors({});
    if (!isCloudConnected) {
      setErrors({
        general: "Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      });
      return;
    }
    setBusyGoogle(true);
    try {
      await signInWithGoogle();
      // Supabase redirects to Google OAuth
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to initiate Google sign up." });
      setBusyGoogle(false);
    }
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    if (Object.keys(e).length) return;

    if (!isCloudConnected) {
      setErrors({
        general: "Supabase credentials are required. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to register.",
      });
      return;
    }

    setBusy(true);
    try {
      const res = await signUp(form.email, form.password, form.name, form.org);
      if (res?.session) {
        nav("/app/onboarding");
      } else {
        // Email verification needed
        nav("/sign-in");
      }
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to create account. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" sub="Set up your profile and start evaluating prime retail locations.">
      <div className="space-y-4">
        {errors.general && (
          <div className="flex items-start gap-2.5 rounded-lg border border-ember-500/30 bg-ember-500/10 p-3 text-[12.5px] text-ember-300">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={busyGoogle || busy}
          onClick={handleGoogleSignUp}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-line-strong bg-ink-800/90 px-4 py-3 text-[13.5px] font-medium text-bone-100 shadow-sm transition-all hover:border-bone-400 hover:bg-ink-750 active:scale-[0.99] disabled:opacity-60"
        >
          {busyGoogle ? (
            <span className="size-4 animate-spin rounded-full border-2 border-bone-100 border-t-transparent" />
          ) : (
            <GoogleIcon className="size-4" />
          )}
          <span>{busyGoogle ? "Redirecting to Google..." : "Sign up with Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-line-subtle" />
          <span className="bg-ink-850 px-3 text-[10.5px] font-mono uppercase tracking-wider text-bone-500">
            Or register with email
          </span>
        </div>

        <Field label="Full name" error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            invalid={!!errors.name}
            placeholder="e.g. Vikram Rao"
            autoComplete="name"
          />
        </Field>
        <Field label="Work email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            invalid={!!errors.email}
            placeholder="you@retailbrand.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Organisation or Brand (optional)">
          <Input
            value={form.org}
            onChange={(e) => setForm({ ...form, org: e.target.value })}
            placeholder="e.g. Kaasara Hospitality"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            invalid={!!errors.password}
            placeholder="Minimum 6 characters"
          />
        </Field>
        <Button className="w-full" size="lg" loading={busy} onClick={submit}>
          Create account <ArrowRight size={15} />
        </Button>
        <p className="text-center text-[12.5px] text-bone-500">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-brass-300 hover:text-brass-400">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const { resetPassword } = useApp();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch recovery link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset access"
      sub="Enter your account email to receive a secure password recovery link."
    >
      {!sent ? (
        <div className="space-y-4">
          <Field label="Account email" error={error}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={!!error}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </Field>
          <Button className="w-full" size="lg" loading={busy} onClick={submit}>
            <KeyRound size={15} /> Send recovery link
          </Button>
          <Link
            to="/sign-in"
            className="flex items-center justify-center gap-1.5 text-[12.5px] text-bone-400 hover:text-bone-100"
          >
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </div>
      ) : (
        <div className="space-y-5 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-sage-500/40 bg-sage-500/10 text-sage-300">
            <MailCheck size={20} />
          </span>
          <div>
            <p className="text-[14px] font-medium text-bone-100">Recovery link sent to {email}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-bone-400">
              Check your inbox for password reset instructions from Supabase Auth.
            </p>
          </div>
          <InlineNote tone="info">
            Follow the instructions in the email to set a new password.
          </InlineNote>
          <Button className="w-full" variant="outline" to="/sign-in">
            Return to sign in
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
