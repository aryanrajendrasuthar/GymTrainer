import type {
  UserProfile,
  WorkoutSession,
  Equipment,
  FitnessGoal,
  FitnessLevel,
} from "@/app/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Base fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  {
    token,
    method = "GET",
    body,
  }: { token?: string; method?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "UNKNOWN",
      json?.error?.message ?? "Request failed"
    );
  }

  return json as T;
}

// ─── Profile mapping (Supabase snake_case → camelCase) ───────────────────────

interface RawProfile {
  id: string;
  email: string;
  name: string;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  fitness_level: string | null;
  goal: string | null;
  split_id: string | null;
  equipment: string[] | null;
  units: "kg" | "lb" | null;
  created_at: string;
  updated_at: string;
}

function mapProfile(raw: RawProfile): UserProfile {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name ?? "",
    age: raw.age ?? 0,
    gender: raw.gender ?? "other",
    heightCm: raw.height_cm ?? 0,
    weightKg: raw.weight_kg ?? 0,
    bodyFatPercent: raw.body_fat_pct ?? undefined,
    fitnessLevel: (raw.fitness_level as FitnessLevel) ?? "beginner",
    goal: (raw.goal as FitnessGoal) ?? "general-fitness",
    splitId: raw.split_id ?? "",
    equipment: ((raw.equipment ?? []) as Equipment[]),
    injuries: [],
    units: raw.units ?? "kg",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

interface SignInResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: { id: string; email: string };
}

export const authApi = {
  signIn: (email: string, password: string) =>
    apiFetch<SignInResponse>("/api/auth/signin", {
      method: "POST",
      body: { email, password },
    }),

  signUp: (name: string, email: string, password: string) =>
    apiFetch<{ message: string }>("/api/auth/signup", {
      method: "POST",
      body: { name, email, password },
    }),

  getProfile: async (token: string): Promise<UserProfile> => {
    const raw = await apiFetch<RawProfile>("/api/auth/profile", { token });
    return mapProfile(raw);
  },

  updateProfile: (
    token: string,
    data: {
      name?: string;
      age?: number;
      gender?: "male" | "female" | "other";
      height_cm?: number;
      weight_kg?: number;
      fitness_level?: string;
      goal?: string;
      split_id?: string;
      equipment?: string[];
      units?: "kg" | "lb";
    }
  ) =>
    apiFetch<RawProfile>("/api/auth/profile", {
      token,
      method: "PATCH",
      body: data,
    }).then(mapProfile),

  signOut: (token: string) =>
    apiFetch<{ message: string }>("/api/auth/signout", {
      token,
      method: "POST",
    }),

  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; expiresAt: number }>(
      "/api/auth/refresh",
      { method: "POST", body: { refreshToken } }
    ),
};

// ─── Sessions API ─────────────────────────────────────────────────────────────

export const sessionsApi = {
  // Fire-and-forget durability sync. Local Zustand store is the source of truth.
  create: (token: string, session: WorkoutSession) =>
    apiFetch<unknown>("/api/sessions", {
      token,
      method: "POST",
      body: {
        date: session.date,
        split_day: session.splitDay,
        total_volume_kg: session.totalVolumeKg,
        duration_minutes: session.durationMinutes,
        session_notes: session.sessionNotes,
        is_partial: session.isPartial,
        exercise_logs: session.exercisesCompleted.map((log) => ({
          exercise_id: log.exerciseId,
          sets: log.sets.map((s) => ({
            set_number: s.setNumber,
            reps_completed: s.repsCompleted,
            weight_used: s.weightUsed,
            weight_unit: s.weightUnit,
            rpe: s.rpe,
            notes: s.notes,
          })),
        })),
      },
    }),
};

// ─── Physio API ───────────────────────────────────────────────────────────────

export const physioApi = {
  addInjury: (
    token: string,
    data: {
      condition: string;
      body_region: string;
      severity: "mild" | "moderate" | "severe";
      phase: string;
      onset_date: string;
    }
  ) =>
    apiFetch<{ id: string }>("/api/physio/injuries", {
      token,
      method: "POST",
      body: data,
    }),

  updateInjury: (
    token: string,
    id: string,
    data: { phase?: string; severity?: "mild" | "moderate" | "severe" }
  ) =>
    apiFetch<unknown>(`/api/physio/injuries/${id}`, {
      token,
      method: "PATCH",
      body: data,
    }),

  logSession: (
    token: string,
    data: {
      condition: string;
      phase: string;
      slot: "morning" | "evening";
      pain_before: number;
      pain_after: number;
      exercise_logs: { exercise_id: string }[];
      completed_at: string;
    }
  ) =>
    apiFetch<unknown>("/api/physio/sessions", {
      token,
      method: "POST",
      body: data,
    }),

  logPain: (token: string, condition: string, level: number) =>
    apiFetch<unknown>("/api/physio/pain-log", {
      token,
      method: "POST",
      body: { condition, pain_level: level },
    }),
};

// ─── Progress API ─────────────────────────────────────────────────────────────

export const progressApi = {
  getVolume: (token: string, days = 84) =>
    apiFetch<{ volume: { date: string; total_volume_kg: number; split_day: string }[] }>(
      `/api/progress/volume?days=${days}`,
      { token }
    ),

  logWeight: (token: string, weightKg: number) =>
    apiFetch<unknown>("/api/progress/weight", {
      token,
      method: "POST",
      body: { weight_kg: weightKg },
    }),
};
