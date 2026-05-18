import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import { authRouter } from "./routes/auth";
import { sessionsRouter } from "./routes/sessions";
import { exercisesRouter } from "./routes/exercises";
import { progressRouter } from "./routes/progress";
import { physioRouter } from "./routes/physio";

const app = express();
const PORT = process.env.PORT ?? 4000;

// ─── Security & Parsing ───────────────────────────────────────────────────────

app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server requests (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "256kb" }));
app.use(rateLimiter);

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", authRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/progress", progressRouter);
app.use("/api/physio", physioRouter);

// ─── Error Handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Trainer backend running on port ${PORT}`);
});

export default app;
