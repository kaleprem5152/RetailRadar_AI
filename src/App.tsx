import { HashRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import { AppProvider, useApp } from "./store/AppStore";
import { ToastViewport, Button } from "./components/ui";
import MarketingShell from "./shell/Marketing";
import AppShell from "./shell/AppShell";
import Landing from "./landing/Landing";
import { HowItWorksPage, FeaturesPage, AboutPage } from "./pages/marketing";
import { SampleAnalysisPage, SampleReportPage } from "./pages/samples";
import { SignInPage, CreateAccountPage, ForgotPasswordPage } from "./pages/auth";
import { RequireAuth, RedirectIfAuthenticated } from "./components/AuthGuards";
import { Dashboard, AnalysesList } from "./app/Dashboard";
import Wizard from "./app/Wizard";
import { AnalysisOverview, LocationsPage } from "./app/AnalysisPages";
import MarketExplorer from "./app/MarketExplorer";
import CompetitorsPage from "./app/Competitors";
import { FinancialsPage, ScenariosPage } from "./app/FinancePages";
import { ComparisonPage, ReportPage } from "./app/DecisionPages";
import { LocalTruthPage, FieldVerificationPage, ActivityPage } from "./app/TruthPages";
import { ReportsPage, SettingsPage, ProfilePage, PreferencesPage, HelpPage, OnboardingPage } from "./app/MiscPages";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function OAuthRedirectHandler() {
  const { session, isAuthReady } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthReady) return;

    const hasAuthParams =
      window.location.search.includes("code=") ||
      window.location.hash.includes("access_token=") ||
      window.location.hash.includes("refresh_token=");

    if (session && (hasAuthParams || location.pathname === "/sign-in" || location.pathname === "/create-account")) {
      if (window.location.search.includes("code=")) {
        window.history.replaceState({}, document.title, window.location.origin + window.location.pathname + "#/app");
      }
      navigate("/app", { replace: true });
    }
  }, [session, isAuthReady, location.pathname, navigate]);

  return null;
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-900 px-5">
      <div className="text-center">
        <Compass size={30} className="mx-auto text-brass-400" />
        <h1 className="font-display mt-6 text-[34px] font-light tracking-tight text-bone-100">Off the map.</h1>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-bone-400">
          That route doesn't exist in this prototype. Let's get you back to surveyed ground.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button to="/">Landing</Button>
          <Button variant="outline" to="/app">Workspace</Button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <OAuthRedirectHandler />
        <Routes>
          {/* Public marketing site */}
          <Route element={<MarketingShell />}>
            <Route path="/" element={<Landing />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/sample-analysis" element={<SampleAnalysisPage />} />
            <Route path="/sample-report" element={<SampleReportPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>

          {/* Auth routes */}
          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/create-account" element={<CreateAccountPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected Application */}
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="analyses" element={<AnalysesList />} />
              <Route path="analyses/new" element={<Wizard />} />
              <Route path="analyses/:id" element={<AnalysisOverview />} />
              <Route path="analyses/:id/locations" element={<LocationsPage />} />
              <Route path="analyses/:id/market-explorer" element={<MarketExplorer />} />
              <Route path="analyses/:id/competitors" element={<CompetitorsPage />} />
              <Route path="analyses/:id/financials" element={<FinancialsPage />} />
              <Route path="analyses/:id/comparison" element={<ComparisonPage />} />
              <Route path="analyses/:id/scenarios" element={<ScenariosPage />} />
              <Route path="analyses/:id/local-truth" element={<LocalTruthPage />} />
              <Route path="analyses/:id/field-verification" element={<FieldVerificationPage />} />
              <Route path="analyses/:id/report" element={<ReportPage />} />
              <Route path="analyses/:id/activity" element={<ActivityPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/profile" element={<ProfilePage />} />
              <Route path="settings/preferences" element={<PreferencesPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastViewport />
      </HashRouter>
    </AppProvider>
  );
}
