import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { authRateLimiter } from "../middleware/rateLimiter";
import { authGuard, type AuthenticatedRequest } from "../middleware/authGuard";
import { createError } from "../middleware/errorHandler";

export const authRouter = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  age: z.number().int().min(10).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  height_cm: z.number().min(50).max(300).optional(),
  weight_kg: z.number().min(20).max(500).optional(),
  body_fat_pct: z.number().min(2).max(70).optional(),
  fitness_level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  goal: z.enum([
    "muscle-gain", "fat-loss", "recomp",
    "strength", "greek-god", "calisthenics", "general-fitness",
  ]).optional(),
  split_id: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  units: z.enum(["kg", "lb"]).optional(),
  activity_level: z.enum([
    "sedentary", "light", "moderate", "active", "very-active",
  ]).optional(),
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

authRouter.post(
  "/signup",
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = signUpSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { email, password, name } = parsed.data;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return next(createError(error.message, 400, "SIGNUP_ERROR"));

    if (data.user) {
      await supabase.from("user_profiles").upsert({
        id: data.user.id,
        email,
        name,
      });
    }

    res.status(201).json({ message: "Account created. Check your email to confirm." });
  }
);

// ─── POST /api/auth/signin ────────────────────────────────────────────────────

authRouter.post(
  "/signin",
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = signInSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { email, password } = parsed.data;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return next(createError("Invalid email or password.", 401, "INVALID_CREDENTIALS"));

    res.json({
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  }
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

authRouter.post(
  "/refresh",
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError("Refresh token required.", 400, "VALIDATION_ERROR"));
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: parsed.data.refreshToken,
    });

    if (error || !data.session) {
      return next(createError("Session expired. Please sign in again.", 401, "SESSION_EXPIRED"));
    }

    res.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    });
  }
);

// ─── POST /api/auth/signout ───────────────────────────────────────────────────

authRouter.post(
  "/signout",
  authGuard,
  async (_req: Request, res: Response, next: NextFunction) => {
    const { error } = await supabase.auth.signOut();
    if (error) return next(createError(error.message, 500, "SIGNOUT_ERROR"));
    res.json({ message: "Signed out." });
  }
);

// ─── GET /api/auth/profile ────────────────────────────────────────────────────

authRouter.get(
  "/profile",
  authGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) return next(createError("Profile not found.", 404, "NOT_FOUND"));
    res.json(data);
  }
);

// ─── DELETE /api/auth/account ─────────────────────────────────────────────────

authRouter.delete(
  "/account",
  authGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    await supabase.from("user_profiles").delete().eq("id", userId);

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return next(createError(error.message, 500, "DELETE_ERROR"));

    res.json({ message: "Account deleted." });
  }
);

// ─── PATCH /api/auth/profile ──────────────────────────────────────────────────

authRouter.patch(
  "/profile",
  authGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req as AuthenticatedRequest;

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 400, "VALIDATION_ERROR"));
    }

    const { userEmail } = req as AuthenticatedRequest;

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        { id: userId, email: userEmail, ...parsed.data },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) return next(createError(error.message, 500, "UPDATE_ERROR"));
    res.json(data);
  }
);
