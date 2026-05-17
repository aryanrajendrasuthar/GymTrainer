import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { authGuard, type AuthenticatedRequest } from "../middleware/authGuard";
import { createError } from "../middleware/errorHandler";

export const physioRouter = Router();
physioRouter.use(authGuard);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const VALID_CONDITIONS = [
  "adhesive-capsulitis", "cervical-strain", "thoracic-kyphosis",
  "scapular-winging", "scapular-dyskinesia", "l4-l5-disc-herniation",
  "l5-s1-disc-herniation", "coccydynia", "patellofemoral-pain-syndrome",
  "it-band-syndrome", "achilles-tendinopathy", "plantar-fasciitis",
  "peroneal-tendon-injury", "rotator-cuff-strain", "shoulder-impingement",
  "piriformis-syndrome", "si-joint-dysfunction", "thoracic-outlet-syndrome",
  "cervicogenic-headache", "whiplash",
] as const;

const VALID_PHASES = ["acute", "subacute", "chronic", "maintenance"] as const;

const injurySchema = z.object({
  condition: z.enum(VALID_CONDITIONS),
  body_region: z.string().min(1),
  severity: z.enum(["mild", "moderate", "severe"]).default("moderate"),
  phase: z.enum(VALID_PHASES).default("acute"),
  onset_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(1000).optional(),
});

const physioSessionSchema = z.object({
  injury_id: z.string().uuid().optional(),
  condition: z.enum(VALID_CONDITIONS),
  phase: z.enum(VALID_PHASES),
  slot: z.enum(["morning", "evening"]),
  pain_before: z.number().int().min(0).max(10),
  pain_after: z.number().int().min(0).max(10),
  exercise_logs: z.array(
    z.object({
      exercise_id: z.string().min(1),
      sets_completed: z.number().int().min(0).max(10).optional(),
      reps_completed: z.number().int().min(0).max(200).optional(),
      hold_seconds: z.number().int().min(0).max(600).optional(),
      pain_during: z.number().int().min(0).max(10).optional(),
      notes: z.string().max(500).optional(),
    })
  ).min(1),
  session_notes: z.string().max(1000).optional(),
});

const phaseTransitionSchema = z.object({
  injury_id: z.string().uuid(),
  condition: z.enum(VALID_CONDITIONS),
  from_phase: z.enum(VALID_PHASES),
  to_phase: z.enum(VALID_PHASES),
  direction: z.enum(["progression", "regression"]),
  triggered_by: z.enum(["user", "auto", "clinician"]).default("user"),
  reason: z.string().max(500).optional(),
});

const painLogSchema = z.object({
  injury_id: z.string().uuid().optional(),
  condition: z.enum(VALID_CONDITIONS),
  pain_level: z.number().int().min(0).max(10),
  context: z.enum(["rest", "morning", "during-activity", "after-activity", "end-of-day"]).optional(),
  notes: z.string().max(500).optional(),
});

// ─── GET /api/physio/injuries ─────────────────────────────────────────────────

physioRouter.get(
  "/injuries",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;
    const activeOnly = req.query.active !== "false";

    let query = supabase
      .from("user_injuries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (activeOnly) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) return next(createError(error.message, 500));
    res.json({ injuries: data ?? [] });
  }
);

// ─── POST /api/physio/injuries ────────────────────────────────────────────────

physioRouter.post(
  "/injuries",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const parsed = injurySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { data, error } = await supabase
      .from("user_injuries")
      .insert({ ...parsed.data, user_id: userId })
      .select()
      .single();

    if (error) return next(createError(error.message, 500));
    res.status(201).json(data);
  }
);

// ─── PATCH /api/physio/injuries/:id ──────────────────────────────────────────

physioRouter.patch(
  "/injuries/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const updateSchema = injurySchema.partial().extend({
      is_active: z.boolean().optional(),
      resolved_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { data, error } = await supabase
      .from("user_injuries")
      .update(parsed.data)
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return next(createError(error.message, 500));
    res.json(data);
  }
);

// ─── POST /api/physio/sessions ────────────────────────────────────────────────

physioRouter.post(
  "/sessions",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const parsed = physioSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { exercise_logs, ...sessionData } = parsed.data;

    const { data: session, error: sessionErr } = await supabase
      .from("physio_sessions")
      .insert({ ...sessionData, user_id: userId })
      .select()
      .single();

    if (sessionErr || !session) return next(createError("Failed to create physio session.", 500));

    const logsToInsert = exercise_logs.map((l) => ({
      ...l,
      physio_session_id: session.id,
      user_id: userId,
    }));

    await supabase.from("physio_exercise_logs").insert(logsToInsert);

    res.status(201).json(session);
  }
);

// ─── GET /api/physio/sessions ─────────────────────────────────────────────────

physioRouter.get(
  "/sessions",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;
    const condition = req.query.condition as string | undefined;
    const limit = Math.min(Number(req.query.limit ?? 20), 100);

    let query = supabase
      .from("physio_sessions")
      .select("*, physio_exercise_logs(*)")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (condition) query = query.eq("condition", condition);

    const { data, error } = await query;
    if (error) return next(createError(error.message, 500));
    res.json({ sessions: data ?? [] });
  }
);

// ─── POST /api/physio/phase-transition ───────────────────────────────────────

physioRouter.post(
  "/phase-transition",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const parsed = phaseTransitionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    // Verify injury belongs to user
    const { data: injury } = await supabase
      .from("user_injuries")
      .select("id")
      .eq("id", parsed.data.injury_id)
      .eq("user_id", userId)
      .single();

    if (!injury) return next(createError("Injury not found.", 404, "NOT_FOUND"));

    const { data, error } = await supabase
      .from("physio_phase_history")
      .insert({ ...parsed.data, user_id: userId })
      .select()
      .single();

    if (error) return next(createError(error.message, 500));
    res.status(201).json(data);
  }
);

// ─── POST /api/physio/pain-log ────────────────────────────────────────────────

physioRouter.post(
  "/pain-log",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const parsed = painLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { data, error } = await supabase
      .from("physio_pain_logs")
      .insert({ ...parsed.data, user_id: userId })
      .select()
      .single();

    if (error) return next(createError(error.message, 500));
    res.status(201).json(data);
  }
);

// ─── GET /api/physio/pain-log/:condition ─────────────────────────────────────

physioRouter.get(
  "/pain-log/:condition",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;
    const limit = Math.min(Number(req.query.limit ?? 30), 365);

    const { data, error } = await supabase
      .from("physio_pain_logs")
      .select("pain_level, context, logged_at")
      .eq("user_id", userId)
      .eq("condition", req.params.condition)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) return next(createError(error.message, 500));
    res.json({ logs: data ?? [] });
  }
);
