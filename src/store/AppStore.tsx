import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  Analysis,
  CandidateLocation,
  ChecklistItem,
  FinancialAssumptions,
  NearbyBusiness,
  SavedReport,
  Scenario,
  UserProfile,
  ScoringWeights,
} from "../lib/types";
import { DEFAULT_SCORING_WEIGHTS } from "../lib/types";
import { seedAnalyses, seedReports, DEMO_USER } from "../data/seed";
import { uid } from "../lib/utils";
import {
  isSupabaseConfigured,
  supabase,
  remoteSignIn,
  remoteSignUp,
  remoteSignOut,
  remoteResetPassword,
  remoteGetSession,
  fetchRemoteAnalyses,
  upsertRemoteAnalysis,
  deleteRemoteAnalysis,
  fetchRemoteReports,
  saveRemoteReport,
  deleteRemoteReport,
  fetchRemoteProfile,
  updateRemoteProfile,
} from "../lib/supabase";

const STORAGE_KEY = "retailradar-state-v3";

interface PersistedState {
  session: boolean;
  onboarded: boolean;
  user: UserProfile;
  analyses: Analysis[];
  reports: SavedReport[];
  scoringWeights: ScoringWeights;
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: "success" | "info" | "error";
}

interface AppStore extends PersistedState {
  toasts: Toast[];
  isCloudConnected: boolean;
  isMapsConnected: boolean;
  isLoading: boolean;
  toast: (title: string, opts?: { body?: string; tone?: Toast["tone"] }) => void;
  dismissToast: (id: string) => void;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password?: string, name?: string, org?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  updateUser: (patch: Partial<UserProfile>) => void;
  updateScoringWeights: (weights: ScoringWeights) => void;
  getAnalysis: (id: string | undefined) => Analysis | undefined;
  createAnalysis: (a: Analysis) => void;
  deleteAnalysis: (id: string) => void;
  logActivity: (analysisId: string, text: string, kind: Analysis["activity"][number]["kind"]) => void;
  updateFinancials: (analysisId: string, locationId: string, patch: Partial<FinancialAssumptions>) => void;
  updateTargetDailySales: (analysisId: string, target: number) => void;
  addLocation: (analysisId: string, loc: CandidateLocation) => void;
  removeLocation: (analysisId: string, locationId: string) => void;
  updateLocation: (analysisId: string, locationId: string, patch: Partial<CandidateLocation>) => void;
  saveScenario: (analysisId: string, scenario: Scenario) => void;
  deleteScenario: (analysisId: string, scenarioId: string) => void;
  addNearbyBusiness: (analysisId: string, locationId: string, b: NearbyBusiness) => void;
  updateNearbyBusiness: (analysisId: string, locationId: string, b: NearbyBusiness) => void;
  removeNearbyBusiness: (analysisId: string, locationId: string, businessId: string) => void;
  setChecklistItem: (analysisId: string, itemId: string, patch: Partial<ChecklistItem>) => void;
  saveReport: (report: SavedReport) => void;
  deleteReport: (id: string) => void;
}

const Ctx = createContext<AppStore | null>(null);

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed && Array.isArray(parsed.analyses)) {
        return {
          session: parsed.session ?? false,
          onboarded: parsed.onboarded ?? false,
          user: parsed.user ?? DEMO_USER,
          analyses: parsed.analyses,
          reports: Array.isArray(parsed.reports) ? parsed.reports : [],
          scoringWeights: parsed.scoringWeights ?? DEFAULT_SCORING_WEIGHTS,
        };
      }
    }
  } catch {
    /* corrupted storage — reseed */
  }
  return {
    session: false,
    onboarded: false,
    user: DEMO_USER,
    analyses: seedAnalyses(),
    reports: seedReports(),
    scoringWeights: DEFAULT_SCORING_WEIGHTS,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to local storage for offline resilience
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — session-only state */
    }
  }, [state]);

  const toast = useCallback((title: string, opts?: { body?: string; tone?: Toast["tone"] }) => {
    const t: Toast = { id: uid("t"), title, body: opts?.body, tone: opts?.tone ?? "success" };
    setToasts((prev) => [...prev.slice(-3), t]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const mutate = useCallback((fn: (s: PersistedState) => PersistedState) => {
    setState((prev) => fn(prev));
  }, []);

  // Supabase Auth listener & session hydration
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let mounted = true;

    async function initAuth() {
      try {
        const session = await remoteGetSession();
        if (session && session.user && mounted) {
          const profile = await fetchRemoteProfile(session.user.id);
          const remoteAn = await fetchRemoteAnalyses(session.user.id);
          const remoteRep = await fetchRemoteReports(session.user.id);

          setState((prev) => ({
            ...prev,
            session: true,
            user: {
              id: session.user.id,
              name: profile?.name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
              email: session.user.email || prev.user.email,
              role: profile?.role || "Retail Entrepreneur",
              org: profile?.org || "Independent",
            },
            analyses: remoteAn.length > 0 ? remoteAn : prev.analyses,
            reports: remoteRep.length > 0 ? remoteRep : prev.reports,
          }));
        }
      } catch (e) {
        console.warn("Session hydration notice:", e);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session && session.user) {
        const profile = await fetchRemoteProfile(session.user.id);
        const remoteAn = await fetchRemoteAnalyses(session.user.id);
        const remoteRep = await fetchRemoteReports(session.user.id);

        setState((prev) => ({
          ...prev,
          session: true,
          user: {
            id: session.user.id,
            name: profile?.name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
            email: session.user.email || prev.user.email,
            role: profile?.role || "Retail Entrepreneur",
            org: profile?.org || "Independent",
          },
          analyses: remoteAn.length > 0 ? remoteAn : prev.analyses,
          reports: remoteRep.length > 0 ? remoteRep : prev.reports,
        }));
      } else if (event === "SIGNED_OUT") {
        setState((prev) => ({ ...prev, session: false }));
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const touchAnalysis = (a: Analysis): Analysis => ({ ...a, updatedAt: new Date().toISOString() });

  const logActivity = useCallback(
    (analysisId: string, text: string, kind: Analysis["activity"][number]["kind"]) => {
      mutate((s) => {
        const updatedAnalyses = s.analyses.map((a) =>
          a.id === analysisId
            ? touchAnalysis({
                ...a,
                activity: [
                  {
                    id: uid("ev"),
                    at: new Date().toISOString(),
                    actor: s.user.name.split(" ")[0] + " " + (s.user.name.split(" ")[1]?.[0] ?? "") + ".",
                    text,
                    kind,
                  },
                  ...a.activity,
                ],
              })
            : a
        );

        // Remote sync if active user
        if (s.user.id && isSupabaseConfigured) {
          const target = updatedAnalyses.find((a) => a.id === analysisId);
          if (target) upsertRemoteAnalysis(target, s.user.id);
        }

        return { ...s, analyses: updatedAnalyses };
      });
    },
    [mutate]
  );

  const signIn = useCallback(
    async (email: string, password?: string) => {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured && password) {
          const res = await remoteSignIn(email, password);
          if (res.user) {
            const profile = await fetchRemoteProfile(res.user.id);
            const remoteAn = await fetchRemoteAnalyses(res.user.id);
            const remoteRep = await fetchRemoteReports(res.user.id);

            mutate((s) => ({
              ...s,
              session: true,
              user: {
                id: res.user.id,
                name: profile?.name || res.user.user_metadata?.name || email.split("@")[0],
                email: res.user.email || email,
                role: profile?.role || "Retail Entrepreneur",
                org: profile?.org || "Independent",
              },
              analyses: remoteAn.length > 0 ? remoteAn : s.analyses,
              reports: remoteRep.length > 0 ? remoteRep : s.reports,
            }));
            toast("Signed in to Supabase Cloud", { body: `Logged in as ${email}`, tone: "success" });
            return;
          }
        }
      } catch (err: any) {
        setIsLoading(false);
        throw err;
      } finally {
        setIsLoading(false);
      }

      // Local persistence fallback
      mutate((s) => ({ ...s, session: true, user: { ...s.user, email: email || s.user.email } }));
      toast("Signed in (Local Workspace)", { body: `Session active for ${email}`, tone: "info" });
    },
    [mutate, toast]
  );

  const signUp = useCallback(
    async (email: string, password?: string, name?: string, org?: string) => {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured && password) {
          const res = await remoteSignUp(email, password, name || "Retail Explorer", org || "Independent");
          if (res.user) {
            mutate((s) => ({
              ...s,
              session: true,
              user: {
                id: res.user?.id,
                name: name || email.split("@")[0],
                email,
                role: "Retail Entrepreneur",
                org: org || "Independent",
              },
            }));
            toast("Account created in Supabase", { body: "Your cloud database is connected.", tone: "success" });
            return;
          }
        }
      } catch (err: any) {
        setIsLoading(false);
        throw err;
      } finally {
        setIsLoading(false);
      }

      // Local fallback
      mutate((s) => ({
        ...s,
        session: true,
        user: { ...s.user, name: name || s.user.name, email, org: org || s.user.org },
      }));
      toast("Account created locally", { body: "Welcome to RetailRadar AI.", tone: "success" });
    },
    [mutate, toast]
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        await remoteSignOut();
      } catch (e) {
        console.warn("Sign out remote warning:", e);
      }
    }
    mutate((s) => ({ ...s, session: false }));
    toast("Signed out", { tone: "info" });
  }, [mutate, toast]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (isSupabaseConfigured) {
        await remoteResetPassword(email);
        toast("Reset email dispatched", { body: `Instructions sent to ${email}`, tone: "success" });
      } else {
        toast("Password recovery simulated", {
          body: `Supabase keys not yet set in .env. Password reset recorded for ${email}.`,
          tone: "info",
        });
      }
    },
    [toast]
  );

  const store: AppStore = useMemo(
    () => ({
      ...state,
      toasts,
      isCloudConnected: isSupabaseConfigured,
      isMapsConnected: Boolean(
        import.meta.env.VITE_MAPS_API_KEY ||
        import.meta.env.VITE_CARTO_API_KEY ||
        "cb1_4twj_1_0b4244f0717161156a2b678e"
      ),
      isLoading,
      toast,
      dismissToast,
      signIn,
      signUp,
      signOut,
      resetPassword,
      completeOnboarding: () => mutate((s) => ({ ...s, onboarded: true })),
      resetOnboarding: () => mutate((s) => ({ ...s, onboarded: false })),
      updateUser: (patch) => {
        mutate((s) => {
          const updated = { ...s.user, ...patch };
          if (s.user.id && isSupabaseConfigured) {
            updateRemoteProfile(s.user.id, patch);
          }
          return { ...s, user: updated };
        });
        toast("Profile updated", { tone: "success" });
      },
      updateScoringWeights: (weights) => {
        mutate((s) => ({ ...s, scoringWeights: weights }));
        toast("Scoring model weights updated", { tone: "success" });
      },
      getAnalysis: (id) => state.analyses.find((a) => a.id === id),
      createAnalysis: (a) =>
        mutate((s) => {
          if (s.user.id && isSupabaseConfigured) {
            upsertRemoteAnalysis(a, s.user.id);
          }
          return { ...s, analyses: [a, ...s.analyses] };
        }),
      deleteAnalysis: (id) =>
        mutate((s) => {
          if (isSupabaseConfigured) {
            deleteRemoteAnalysis(id);
          }
          return {
            ...s,
            analyses: s.analyses.filter((a) => a.id !== id),
            reports: s.reports.filter((r) => r.analysisId !== id),
          };
        }),
      logActivity,
      updateFinancials: (analysisId, locationId, patch) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId
              ? touchAnalysis({
                  ...a,
                  locations: a.locations.map((l) =>
                    l.id === locationId ? { ...l, financials: { ...l.financials, ...patch } } : l
                  ),
                })
              : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      updateTargetDailySales: (analysisId, target) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId ? touchAnalysis({ ...a, profile: { ...a.profile, targetDailySales: target } }) : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      addLocation: (analysisId, loc) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId ? touchAnalysis({ ...a, locations: [...a.locations, loc] }) : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      removeLocation: (analysisId, locationId) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId
              ? touchAnalysis({
                  ...a,
                  locations: a.locations.filter((l) => l.id !== locationId),
                  scenarios: a.scenarios.filter((sc) => sc.baseLocationId !== locationId),
                })
              : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      updateLocation: (analysisId, locationId, patch) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId
              ? touchAnalysis({
                  ...a,
                  locations: a.locations.map((l) => (l.id === locationId ? { ...l, ...patch } : l)),
                })
              : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      saveScenario: (analysisId, scenario) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId
              ? touchAnalysis({
                  ...a,
                  scenarios: [scenario, ...a.scenarios.filter((x) => x.id !== scenario.id)],
                })
              : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      deleteScenario: (analysisId, scenarioId) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId ? touchAnalysis({ ...a, scenarios: a.scenarios.filter((x) => x.id !== scenarioId) }) : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      addNearbyBusiness: (analysisId, locationId, b) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId
              ? touchAnalysis({
                  ...a,
                  locations: a.locations.map((l) => (l.id === locationId ? { ...l, nearby: [b, ...l.nearby] } : l)),
                })
              : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      updateNearbyBusiness: (analysisId, locationId, b) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId
              ? touchAnalysis({
                  ...a,
                  locations: a.locations.map((l) =>
                    l.id === locationId ? { ...l, nearby: l.nearby.map((x) => (x.id === b.id ? b : x)) } : l
                  ),
                })
              : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      removeNearbyBusiness: (analysisId, locationId, businessId) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId
              ? touchAnalysis({
                  ...a,
                  locations: a.locations.map((l) =>
                    l.id === locationId ? { ...l, nearby: l.nearby.filter((x) => x.id !== businessId) } : l
                  ),
                })
              : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      setChecklistItem: (analysisId, itemId, patch) =>
        mutate((s) => {
          const updated = s.analyses.map((a) =>
            a.id === analysisId
              ? touchAnalysis({
                  ...a,
                  checklist: a.checklist.map((c) => (c.id === itemId ? { ...c, ...patch } : c)),
                })
              : a
          );
          if (s.user.id && isSupabaseConfigured) {
            const an = updated.find((a) => a.id === analysisId);
            if (an) upsertRemoteAnalysis(an, s.user.id);
          }
          return { ...s, analyses: updated };
        }),
      saveReport: (report) =>
        mutate((s) => {
          if (s.user.id && isSupabaseConfigured) {
            saveRemoteReport(report, s.user.id);
          }
          return { ...s, reports: [report, ...s.reports.filter((r) => r.id !== report.id)] };
        }),
      deleteReport: (id) =>
        mutate((s) => {
          if (isSupabaseConfigured) {
            deleteRemoteReport(id);
          }
          return { ...s, reports: s.reports.filter((r) => r.id !== id) };
        }),
    }),
    [state, toasts, toast, dismissToast, mutate, logActivity, signIn, signUp, signOut, resetPassword, isLoading]
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function useAnalysis(id: string | undefined): Analysis | undefined {
  const { analyses } = useApp();
  return analyses.find((a) => a.id === id);
}
