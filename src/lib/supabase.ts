import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Analysis, CandidateLocation, SavedReport, UserProfile } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  !supabaseUrl.includes("placeholder")
);

export const supabase: SupabaseClient | null =
  isSupabaseConfigured && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

// ==============================================================================
// AUTHENTICATION HELPERS
// ==============================================================================

export async function remoteSignUp(email: string, password: string, name: string, org?: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        org: org || "Independent",
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function remoteSignIn(email: string, password: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function remoteSignInWithGoogle() {
  if (!supabase) throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.");
  const redirectTo = `${window.location.origin}/#/app`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function remoteSignOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function remoteResetPassword(email: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const redirectTo = `${window.location.origin}/#/sign-in`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
  return data;
}

export async function remoteGetSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function remoteGetUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ==============================================================================
// DATABASE CRUD HELPERS (WITH USER ISOLATION VIA RLS)
// ==============================================================================

export async function fetchRemoteAnalyses(userId: string): Promise<Analysis[]> {
  if (!supabase) return [];
  try {
    // 1. Fetch analyses
    const { data: analysesData, error: anErr } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (anErr || !analysesData) {
      console.warn("Error fetching analyses:", anErr);
      return [];
    }

    const analyses: Analysis[] = [];

    for (const an of analysesData) {
      // Fetch locations for each analysis
      const { data: locData } = await supabase
        .from("candidate_locations")
        .select("*")
        .eq("analysis_id", an.id);

      const locations: CandidateLocation[] = [];
      if (locData) {
        for (const l of locData) {
          const { data: nearbyData } = await supabase
            .from("nearby_businesses")
            .select("*")
            .eq("location_id", l.id);

          locations.push({
            id: l.id,
            name: l.name,
            address: l.address,
            micro: l.micro,
            lat: l.lat,
            lng: l.lng,
            metrics: l.metrics,
            financials: l.financials,
            risks: l.risks || [],
            missingInfo: l.missing_info || [],
            nearby: nearbyData?.map((b) => ({
              id: b.id,
              name: b.name,
              category: b.category,
              lat: b.lat,
              lng: b.lng,
              distanceM: b.distance_m,
              source: b.source,
              status: b.status,
              competitor: b.competitor,
              note: b.note,
              addedBy: b.added_by,
            })) || [],
          });
        }
      }

      // Fetch scenarios
      const { data: scenData } = await supabase
        .from("scenarios")
        .select("*")
        .eq("analysis_id", an.id);

      // Fetch checklist
      const { data: checkData } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("analysis_id", an.id);

      // Fetch activity
      const { data: actData } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("analysis_id", an.id)
        .order("at", { ascending: false });

      analyses.push({
        id: an.id,
        title: an.title,
        status: an.status,
        createdAt: an.created_at,
        updatedAt: an.updated_at,
        profile: an.profile,
        budget: an.budget,
        locations,
        scenarios: scenData?.map((s) => ({
          id: s.id,
          name: s.name,
          baseLocationId: s.base_location_id,
          patch: s.patch,
          note: s.note,
          savedAt: s.saved_at,
        })) || [],
        checklist: checkData?.map((c) => ({
          id: c.id,
          group: c.group_name,
          label: c.label,
          hint: c.hint,
          state: c.state,
          note: c.note || "",
        })) || [],
        activity: actData?.map((ac) => ({
          id: ac.id,
          at: ac.at,
          actor: ac.actor,
          text: ac.text,
          kind: ac.kind,
        })) || [],
      });
    }

    return analyses;
  } catch (err) {
    console.error("fetchRemoteAnalyses failure:", err);
    return [];
  }
}

export async function upsertRemoteAnalysis(a: Analysis, userId: string) {
  if (!supabase) return;
  try {
    // Upsert analysis
    await supabase.from("analyses").upsert({
      id: a.id,
      user_id: userId,
      title: a.title,
      status: a.status,
      profile: a.profile,
      budget: a.budget,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    });

    // Upsert locations
    for (const loc of a.locations) {
      await supabase.from("candidate_locations").upsert({
        id: loc.id,
        analysis_id: a.id,
        user_id: userId,
        name: loc.name,
        address: loc.address,
        micro: loc.micro,
        lat: loc.lat,
        lng: loc.lng,
        metrics: loc.metrics,
        financials: loc.financials,
        risks: loc.risks,
        missing_info: loc.missingInfo,
      });

      // Upsert nearby
      for (const nb of loc.nearby) {
        await supabase.from("nearby_businesses").upsert({
          id: nb.id,
          location_id: loc.id,
          analysis_id: a.id,
          user_id: userId,
          name: nb.name,
          category: nb.category,
          lat: nb.lat,
          lng: nb.lng,
          distance_m: nb.distanceM,
          source: nb.source,
          status: nb.status,
          competitor: nb.competitor,
          note: nb.note,
          added_by: nb.addedBy,
        });
      }
    }

    // Upsert scenarios
    for (const sc of a.scenarios) {
      await supabase.from("scenarios").upsert({
        id: sc.id,
        analysis_id: a.id,
        user_id: userId,
        base_location_id: sc.baseLocationId,
        name: sc.name,
        patch: sc.patch,
        note: sc.note,
        saved_at: sc.savedAt,
      });
    }

    // Upsert checklist items
    for (const cl of a.checklist) {
      await supabase.from("checklist_items").upsert({
        id: cl.id,
        analysis_id: a.id,
        user_id: userId,
        group_name: cl.group,
        label: cl.label,
        hint: cl.hint,
        state: cl.state,
        note: cl.note,
        updated_at: new Date().toISOString(),
      });
    }

    // Upsert activity logs
    for (const act of a.activity) {
      await supabase.from("activity_logs").upsert({
        id: act.id,
        analysis_id: a.id,
        user_id: userId,
        actor: act.actor,
        text: act.text,
        kind: act.kind,
        at: act.at,
      });
    }
  } catch (err) {
    console.error("upsertRemoteAnalysis failure:", err);
  }
}

export async function deleteRemoteAnalysis(analysisId: string) {
  if (!supabase) return;
  await supabase.from("analyses").delete().eq("id", analysisId);
}

export async function fetchRemoteReports(userId: string): Promise<SavedReport[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("saved_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    analysisId: r.analysis_id,
    title: r.title,
    createdAt: r.created_at,
    verdict: r.verdict,
  }));
}

export async function saveRemoteReport(r: SavedReport, userId: string) {
  if (!supabase) return;
  await supabase.from("saved_reports").upsert({
    id: r.id,
    analysis_id: r.analysisId,
    user_id: userId,
    title: r.title,
    verdict: r.verdict,
    created_at: r.createdAt,
  });
}

export async function deleteRemoteReport(id: string) {
  if (!supabase) return;
  await supabase.from("saved_reports").delete().eq("id", id);
}

export async function fetchRemoteProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role || "Retail Entrepreneur",
    org: data.org || "Independent",
    avatarUrl: data.avatar_url || "",
  };
}

export async function ensureRemoteProfile(user: User): Promise<UserProfile> {
  const meta = user.user_metadata || {};
  const name =
    meta.full_name ||
    meta.name ||
    user.email?.split("@")[0] ||
    "Retail Explorer";
  const avatarUrl = meta.avatar_url || meta.picture || "";
  const role = meta.role || "Retail Entrepreneur";
  const org = meta.org || "Independent";

  if (!supabase) {
    return {
      id: user.id,
      name,
      email: user.email || "",
      avatarUrl,
      role,
      org,
    };
  }

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (existing && !fetchErr) {
      return {
        id: existing.id,
        name: existing.name || name,
        email: existing.email || user.email || "",
        avatarUrl: existing.avatar_url || avatarUrl,
        role: existing.role || role,
        org: existing.org || org,
      };
    }

    const profileRecord = {
      id: user.id,
      email: user.email || "",
      name,
      avatar_url: avatarUrl,
      role,
      org,
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("profiles")
      .upsert(profileRecord)
      .select()
      .maybeSingle();

    if (insertErr) {
      console.warn("Notice: profile persistence handled via schema trigger/RLS:", insertErr.message);
    }

    return {
      id: user.id,
      name: inserted?.name || name,
      email: inserted?.email || user.email || "",
      avatarUrl: inserted?.avatar_url || avatarUrl,
      role: inserted?.role || role,
      org: inserted?.org || org,
    };
  } catch (err) {
    console.warn("ensureRemoteProfile exception:", err);
    return {
      id: user.id,
      name,
      email: user.email || "",
      avatarUrl,
      role,
      org,
    };
  }
}

export async function updateRemoteProfile(userId: string, patch: Partial<UserProfile>) {
  if (!supabase) return;
  const dbPatch: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.role !== undefined) dbPatch.role = patch.role;
  if (patch.org !== undefined) dbPatch.org = patch.org;
  if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;

  await supabase.from("profiles").update(dbPatch).eq("id", userId);
}
