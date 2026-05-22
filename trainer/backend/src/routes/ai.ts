import { Router, type Request, type Response } from "express";
import Groq from "groq-sdk";
import { z } from "zod";
import { authGuard } from "../middleware/authGuard";

export const aiRouter = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";

async function groqWithRetry(
  params: ChatCompletionCreateParamsNonStreaming,
  retries = 2
): Promise<ChatCompletion> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await groq.chat.completions.create({ ...params, stream: false });
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

// ─── POST /api/ai/tip ─────────────────────────────────────────────────────────
// Returns a single motivational/coaching tip after a workout session.

const TipSchema = z.object({
  splitDay: z.string(),
  exerciseCount: z.number(),
  totalSets: z.number(),
  durationMinutes: z.number(),
  volumeKg: z.number(),
  prCount: z.number(),
  goal: z.string(),
  fitnessLevel: z.string().optional(),
});

aiRouter.post("/tip", authGuard, async (req: Request, res: Response) => {
  const parse = TipSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { splitDay, exerciseCount, totalSets, durationMinutes, volumeKg, prCount, goal, fitnessLevel } = parse.data;

  const prompt = `You are an elite personal trainer. A user just finished a ${splitDay} session: ${exerciseCount} exercises, ${totalSets} sets, ${durationMinutes} minutes, ${Math.round(volumeKg)} kg volume${prCount > 0 ? `, ${prCount} personal record${prCount > 1 ? "s" : ""}` : ""}. Their goal is ${goal}${fitnessLevel ? ` and their level is ${fitnessLevel}` : ""}. Write exactly ONE concise motivational coaching tip (max 2 sentences) tailored to this session. Be specific, direct, and data-aware. No generic filler. No emojis.`;

  try {
    const completion = await groqWithRetry({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const tip = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ tip });
  } catch {
    res.status(500).json({ error: "AI service unavailable" });
  }
});

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
// AI Coach Chat with full context awareness.

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const ChatSchema = z.object({
  messages: z.array(MessageSchema).max(20),
  context: z.object({
    goal: z.string().optional(),
    fitnessLevel: z.string().optional(),
    splitName: z.string().optional(),
    recentSessionCount: z.number().optional(),
    streak: z.number().optional(),
    totalVolumeKg: z.number().optional(),
    injuries: z.array(z.string()).optional(),
    thisWeekVolumeKg: z.number().optional(),
    lastWeekVolumeKg: z.number().optional(),
    recentPRs: z.array(z.string()).optional(),
    stagnantExercises: z.array(z.string()).optional(),
    activeGoalCount: z.number().optional(),
  }),
});

const SYSTEM_PROMPT = `You are an elite AI personal trainer and health coach with deep expertise in exercise science, nutrition, and sports psychology. You have full context about the user's training profile, recent sessions, and goals.

Key rules:
- Be direct, specific, and evidence-based. No filler.
- Tailor every response to the user's goal, level, and recent data you've been given.
- Keep responses concise (3-5 sentences max unless the user asks for a detailed plan).
- When discussing exercises, recommend sets/reps/rest based on the user's goal.
- You are their coach, not a search engine. Give opinions and recommendations.
- Never mention that you're an AI. Just be the coach.`;

aiRouter.post("/chat", authGuard, async (req: Request, res: Response) => {
  const parse = ChatSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { messages, context } = parse.data;

  const contextBlock = [
    context.goal && `Goal: ${context.goal}`,
    context.fitnessLevel && `Level: ${context.fitnessLevel}`,
    context.splitName && `Current split: ${context.splitName}`,
    context.recentSessionCount != null && `Sessions logged: ${context.recentSessionCount}`,
    context.streak != null && `Current streak: ${context.streak} days`,
    context.totalVolumeKg != null && `Lifetime volume: ${Math.round(context.totalVolumeKg)} kg`,
    context.injuries?.length && `Active injuries: ${context.injuries.join(", ")}`,
    context.thisWeekVolumeKg != null && `This week volume: ${context.thisWeekVolumeKg} kg`,
    context.lastWeekVolumeKg != null && `Last week volume: ${context.lastWeekVolumeKg} kg`,
    context.recentPRs?.length && `Recent PRs: ${context.recentPRs.join(", ")}`,
    context.stagnantExercises?.length && `Stuck exercises (no progress): ${context.stagnantExercises.join(", ")}`,
    context.activeGoalCount != null && `Active performance goals: ${context.activeGoalCount}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemContent = SYSTEM_PROMPT + (contextBlock ? `\n\nUser profile:\n${contextBlock}` : "");

  try {
    const completion = await groqWithRetry({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemContent },
        ...messages,
      ],
      max_tokens: 400,
      temperature: 0.75,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ reply });
  } catch {
    res.status(500).json({ error: "AI service unavailable" });
  }
});

// ─── POST /api/ai/weekly-summary ──────────────────────────────────────────────
// Returns a paragraph-length AI weekly training summary.

const WeeklySummarySchema = z.object({
  sessions: z.array(z.object({
    splitDay: z.string(),
    durationMinutes: z.number(),
    exerciseCount: z.number(),
    totalVolumeKg: z.number(),
    prCount: z.number().optional().default(0),
  })).max(10),
  goal: z.string(),
  streak: z.number().optional(),
  weekVolumeTrend: z.enum(["up", "down", "flat"]).optional(),
});

aiRouter.post("/weekly-summary", authGuard, async (req: Request, res: Response) => {
  const parse = WeeklySummarySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { sessions, goal, streak, weekVolumeTrend } = parse.data;

  const sessionLines = sessions
    .map((s, i) => `${i + 1}. ${s.splitDay}: ${s.exerciseCount} exercises, ${Math.round(s.totalVolumeKg)} kg, ${s.durationMinutes} min${s.prCount ? `, ${s.prCount} PR` : ""}`)
    .join("\n");

  const prompt = `You are an elite personal trainer writing a weekly training summary for a client. Here is their week:

Goal: ${goal}
${streak != null ? `Streak: ${streak} days` : ""}
${weekVolumeTrend ? `Volume trend vs last week: ${weekVolumeTrend}` : ""}

Sessions this week:
${sessionLines}

Write a concise, data-driven weekly summary in 3-4 sentences. Cover: what they accomplished, whether the volume/frequency was good, one specific strength or improvement, and one specific actionable focus for next week. Be direct and personal. No fluff.`;

  try {
    const completion = await groqWithRetry({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.65,
    });

    const summary = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ summary });
  } catch {
    res.status(500).json({ error: "AI service unavailable" });
  }
});
