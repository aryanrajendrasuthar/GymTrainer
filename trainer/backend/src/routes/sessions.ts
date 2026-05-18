import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { authGuard, type AuthenticatedRequest } from "../middleware/authGuard";
import { createError } from "../middleware/errorHandler";

export const sessionsRouter = Router();
sessionsRouter.use(authGuard);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const setLogSchema = z.object({
  set_number: z.number().int().min(1).max(20),
  reps_completed: z.number().int().min(0).max(200),
  weight_used: z.number().min(0),
  weight_unit: z.enum(["kg", "lb"]).default("kg"),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
});

const exerciseLogSchema = z.object({
  exercise_id: z.string().min(1),
  sets: z.array(setLogSchema).min(1),
});

const createSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  split_day: z.string().min(1),
  exercise_logs: z.array(exerciseLogSchema).min(1),
  total_volume_kg: z.number().min(0),
  duration_minutes: z.number().int().min(0).max(480).optional(),
  session_notes: z.string().max(1000).optional(),
  is_partial: z.boolean().default(false),
});

// ─── GET /api/sessions ────────────────────────────────────────────────────────

sessionsRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const offset = Number(req.query.offset ?? 0);

    const { data, error, count } = await supabase
      .from("workout_sessions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return next(createError(error.message, 500));
    res.json({ sessions: data, total: count, limit, offset });
  }
);

// ─── GET /api/sessions/:id ────────────────────────────────────────────────────

sessionsRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const { data: session, error: sessionErr } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .single();

    if (sessionErr || !session) return next(createError("Session not found.", 404, "NOT_FOUND"));

    const { data: exerciseLogs } = await supabase
      .from("exercise_logs")
      .select("*, set_logs(*)")
      .eq("session_id", session.id)
      .order("logged_at");

    res.json({ ...session, exercise_logs: exerciseLogs ?? [] });
  }
);

// ─── POST /api/sessions ───────────────────────────────────────────────────────

sessionsRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { exercise_logs, ...sessionData } = parsed.data;

    // Insert workout session
    const { data: session, error: sessionErr } = await supabase
      .from("workout_sessions")
      .insert({ ...sessionData, user_id: userId, completed_at: new Date().toISOString() })
      .select()
      .single();

    if (sessionErr || !session) return next(createError("Failed to create session.", 500));

    // Insert exercise logs and their set logs
    for (const exLog of exercise_logs) {
      const { data: insertedLog, error: logErr } = await supabase
        .from("exercise_logs")
        .insert({
          user_id: userId,
          session_id: session.id,
          exercise_id: exLog.exercise_id,
        })
        .select()
        .single();

      if (logErr || !insertedLog) continue;

      const setsToInsert = exLog.sets.map((s) => ({
        ...s,
        exercise_log_id: insertedLog.id,
        user_id: userId,
      }));

      await supabase.from("set_logs").insert(setsToInsert);
    }

    res.status(201).json(session);
  }
);

// ─── DELETE /api/sessions/:id ─────────────────────────────────────────────────

sessionsRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const { error } = await supabase
      .from("workout_sessions")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", userId);

    if (error) return next(createError(error.message, 500));
    res.status(204).send();
  }
);
