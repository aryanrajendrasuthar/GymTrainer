import { type Request, type Response, type NextFunction } from "express";
import { supabase } from "../lib/supabase";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: { message: "Missing or invalid authorization header.", code: "UNAUTHORIZED" },
    });
    return;
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({
      error: { message: "Invalid or expired token.", code: "INVALID_TOKEN" },
    });
    return;
  }

  (req as AuthenticatedRequest).userId = data.user.id;
  next();
}
