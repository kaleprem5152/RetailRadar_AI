import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Database, Info, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { Button, Field, InlineNote, Input } from "../components/ui";
import { Wordmark } from "../components/chrome";
import { useApp } from "../store/AppStore";

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
                  : "border border-brass-500/30 bg-brass-500/10 text-brass-300"
              }`}
            >
              <Database size={11} />
              {isCloudConnected ? "Supabase Cloud DB Connected" : "Local Database Mode"}
            </span>
          </div>

          <h1 className="font-display text-[26px] font-light tracking-tight text-bone-100">{title}</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-bone-400">{sub}</p>
          <div className="mt-7">{children}</div>
        </div>

        <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-bone-500">
          <Info size={13} className="mt-0.5 shrink-0" />
          {isCloudConnected
            ? "Connected to real Supabase PostgreSQL with Row Level Security. Data is authenticated and isolated by user."
            : "Running in local persistent database mode. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable cloud synchronization."}
        </p>
      </div>
    </main>
  );
}

export function SignInPage() {
  const nav = useNavigate();
  const { signIn } = useApp();
  const [email, setEmail] = useState("amara@kaasara.in");
  const [password, setPassword] = useState("password123");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    if (Object.keys(e).length) return;

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
    <AuthShell title="Welcome back" sub="Sign in to your retail location workspace.">
      <div className="space-y-4">
        {errors.general && (
          <div className="rounded-lg border border-ember-500/30 bg-ember-500/10 p-3 text-[12.5px] text-ember-300">
            {errors.general}
          </div>
        )}

        <Field label="Work email" error={errors.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!errors.email}
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
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await signIn("guest@retailradar.ai", "guest-access");
            nav("/app");
          }}
        >
          <ShieldCheck size={15} className="text-brass-400" /> Quick demo exploration
        </Button>
      </div>
    </AuthShell>
  );
}

export function CreateAccountPage() {
  const nav = useNavigate();
  const { signUp } = useApp();
  const [form, setForm] = useState({ name: "", email: "", org: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await signUp(form.email, form.password, form.name, form.org);
      nav("/app/onboarding");
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
          <div className="rounded-lg border border-ember-500/30 bg-ember-500/10 p-3 text-[12.5px] text-ember-300">
            {errors.general}
          </div>
        )}

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
  const { resetPassword, isCloudConnected } = useApp();
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
              {isCloudConnected
                ? "Check your inbox for password reset instructions from Supabase Auth."
                : "Recovery recorded in local storage mode. When Supabase is configured, a real reset email is dispatched."}
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
