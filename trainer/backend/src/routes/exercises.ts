import { Router, type Request, type Response, type NextFunction } from "express";
import { authGuard } from "../middleware/authGuard";
import { createError } from "../middleware/errorHandler";
import { allExercises, searchExercises, getExercisesByCategory, getExercisesByMuscle } from "../data/exercises";

export const exercisesRouter = Router();
exercisesRouter.use(authGuard);

// ─── GET /api/exercises ───────────────────────────────────────────────────────
// Supports ?q=, ?category=, ?muscle=, ?limit=, ?offset=

exercisesRouter.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, category, muscle } = req.query;
      const limit = Math.min(Number(req.query.limit ?? 50), 200);
      const offset = Number(req.query.offset ?? 0);

      let results = allExercises;

      if (typeof q === "string" && q.trim()) {
        results = searchExercises(q.trim());
      } else if (typeof category === "string") {
        results = getExercisesByCategory(category as never);
      } else if (typeof muscle === "string") {
        results = getExercisesByMuscle(muscle as never);
      }

      const total = results.length;
      const page = results.slice(offset, offset + limit);

      res.json({ exercises: page, total, limit, offset });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/exercises/:id ───────────────────────────────────────────────────

exercisesRouter.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    const exercise = allExercises.find((ex) => ex.id === req.params.id);
    if (!exercise) return next(createError("Exercise not found.", 404, "NOT_FOUND"));
    res.json(exercise);
  }
);
