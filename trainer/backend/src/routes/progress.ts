import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { authGuard, type AuthenticatedRequest } from "../middleware/authGuard";
import { createError } from "../middleware/errorHandler";

export const progressRouter = Router();
progressRouter.use(authGuard);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const bodyWeightSchema = z.object({
  weight_kg: z.number().min(20).max(500),
});

const progressionFlagSchema = z.object({
  exercise_id: z.string().min(1),
  session_id: z.string().uuid().optional(),
  current_weight_kg: z.number().min(0),
  suggested_weight_kg: z.number().min(0),
  status: z.enum(["pending", "accepted", "ignored", "custom"]).default("pending"),
  custom_weight_kg: z.number().min(0).optional(),
});

// ─── GET /api/progress/prs ────────────────────────────────────────────────────

progressRouter.get(
  "/prs",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const { data, error } = await supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: false });

    if (error) return next(createError(error.message, 500));
    res.json({ prs: data });
  }
);

// ─── GET /api/progress/prs/:exerciseId ────────────────────────────────────────

progressRouter.get(
  "/prs/:exerciseId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const { data, error } = await supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise_id", req.params.exerciseId)
      .single();

    if (error) return next(createError("No PR found for this exercise.", 404, "NOT_FOUND"));
    res.json(data);
  }
);

// ─── GET /api/progress/history/:exerciseId ────────────────────────────────────

progressRouter.get(
  "/history/:exerciseId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;
    const limit = Math.min(Number(req.query.limit ?? 20), 100);

    const { data: exerciseLogs, error } = await supabase
      .from("exercise_logs")
      .select("id, session_id, logged_at, set_logs(*)")
      .eq("user_id", userId)
      .eq("exercise_id", req.params.exerciseId)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) return next(createError(error.message, 500));
    res.json({ history: exerciseLogs ?? [] });
  }
);

// ─── GET /api/progress/volume ─────────────────────────────────────────────────
// Returns total session volume grouped by date for the last N days

progressRouter.get(
  "/volume",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;
    const days = Math.min(Number(req.query.days ?? 30), 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from("workout_sessions")
      .select("date, total_volume_kg, split_day")
      .eq("user_id", userId)
      .gte("date", since.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) return next(createError(error.message, 500));
    res.json({ volume: data ?? [] });
  }
);

// ─── GET /api/progress/weight ─────────────────────────────────────────────────

progressRouter.get(
  "/weight",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;
    const limit = Math.min(Number(req.query.limit ?? 90), 365);

    const { data, error } = await supabase
      .from("body_weight_logs")
      .select("weight_kg, logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) return next(createError(error.message, 500));
    res.json({ logs: data ?? [] });
  }
);

// ─── POST /api/progress/weight ────────────────────────────────────────────────

progressRouter.post(
  "/weight",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const parsed = bodyWeightSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { data, error } = await supabase
      .from("body_weight_logs")
      .upsert(
        { user_id: userId, weight_kg: parsed.data.weight_kg },
        { onConflict: "user_id,logged_at::date" }
      )
      .select()
      .single();

    if (error) return next(createError(error.message, 500));
    res.status(201).json(data);
  }
);

// ─── POST /api/progress/flags ─────────────────────────────────────────────────

progressRouter.post(
  "/flags",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const parsed = progressionFlagSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { data, error } = await supabase
      .from("progression_flags")
      .insert({ ...parsed.data, user_id: userId })
      .select()
      .single();

    if (error) return next(createError(error.message, 500));
    res.status(201).json(data);
  }
);

// ─── PATCH /api/progress/flags/:id ───────────────────────────────────────────

progressRouter.patch(
  "/flags/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const updateSchema = z.object({
      status: z.enum(["accepted", "ignored", "custom"]),
      custom_weight_kg: z.number().min(0).optional(),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { data, error } = await supabase
      .from("progression_flags")
      .update(parsed.data)
      .eq("id", req.params.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return next(createError(error.message, 500));
    res.json(data);
  }
);
