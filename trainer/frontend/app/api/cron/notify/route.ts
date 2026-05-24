import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:admin@gymtrainer.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Returns the current hour (0-23) in the given IANA timezone.
function localHour(timezone: string): number {
  try {
    return parseInt(
      new Date().toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false }),
      10
    );
  } catch {
    return new Date().getUTCHours();
  }
}

// Checks whether a notification of `type` has already been sent to `userId` today (UTC date).
async function alreadySentToday(userId: string, type: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("push_notification_log")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("sent_date", today)
    .maybeSingle();
  return !!data;
}

async function markSent(userId: string, type: string) {
  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("push_notification_log")
    .upsert({ user_id: userId, type, sent_date: today }, { onConflict: "user_id,type,sent_date" });
}

async function sendPush(
  sub: { endpoint: string; p256dh: string; auth_key: string },
  payload: { title: string; body: string; url: string; tag: string }
) {
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
    JSON.stringify(payload)
  );
}

export async function POST(req: NextRequest) {
  // Protect the cron endpoint — Vercel sends the CRON_SECRET as a bearer token.
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth_key, timezone, notification_prefs");

  if (error || !subs) return NextResponse.json({ error: "DB error" }, { status: 500 });

  let sent = 0;

  for (const sub of subs) {
    const prefs = (sub.notification_prefs ?? {}) as Record<string, unknown>;
    const hour = localHour(sub.timezone);
    const userId: string = sub.user_id;

    // ── Workout reminder ──────────────────────────────────────────────────────
    if (prefs.workoutReminders) {
      const [rh = 7] = String(prefs.workoutReminderTime ?? "07:00").split(":").map(Number);
      const days: number[] = Array.isArray(prefs.workoutReminderDays)
        ? (prefs.workoutReminderDays as number[])
        : [1, 2, 3, 4, 5];
      const todayDay = new Date().toLocaleString("en-US", { timeZone: sub.timezone, weekday: "short" });
      const dayNum = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(todayDay.slice(0, 3));
      const adjustedDay = dayNum === 0 ? 7 : dayNum;

      if (hour === rh && days.includes(adjustedDay) && !(await alreadySentToday(userId, "workout"))) {
        try {
          await sendPush(sub, { title: "Time to train 💪", body: "Your workout is scheduled for today.", url: "/workout", tag: "workout-reminder" });
          await markSent(userId, "workout");
          sent++;
        } catch { /* expired subscription or send error — skip */ }
      }
    }

    // ── Physio morning ────────────────────────────────────────────────────────
    if (prefs.physioMorning) {
      const [ph = 8] = String(prefs.physioMorningTime ?? "08:00").split(":").map(Number);
      if (hour >= ph && !(await alreadySentToday(userId, "physio-morning"))) {
        const { data: injuries } = await supabase
          .from("user_injuries")
          .select("id, condition")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (injuries && injuries.length > 0) {
          const today = new Date().toISOString().split("T")[0];
          const { data: done } = await supabase
            .from("physio_sessions")
            .select("id")
            .eq("user_id", userId)
            .eq("slot", "morning")
            .gte("completed_at", today);

          const pending = injuries.length - (done?.length ?? 0);
          if (pending > 0) {
            try {
              await sendPush(sub, { title: "Morning physio pending", body: `${pending} session${pending !== 1 ? "s" : ""} to complete.`, url: "/physio", tag: "physio-morning" });
              await markSent(userId, "physio-morning");
              sent++;
            } catch {}
          }
        }
      }
    }

    // ── Physio evening ────────────────────────────────────────────────────────
    if (prefs.physioEvening) {
      const [ph = 20] = String(prefs.physioEveningTime ?? "20:00").split(":").map(Number);
      if (hour >= ph && !(await alreadySentToday(userId, "physio-evening"))) {
        const { data: injuries } = await supabase
          .from("user_injuries")
          .select("id, condition")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (injuries && injuries.length > 0) {
          const today = new Date().toISOString().split("T")[0];
          const { data: done } = await supabase
            .from("physio_sessions")
            .select("id")
            .eq("user_id", userId)
            .eq("slot", "evening")
            .gte("completed_at", today);

          const pending = injuries.length - (done?.length ?? 0);
          if (pending > 0) {
            try {
              await sendPush(sub, { title: "Evening physio pending", body: `${pending} session${pending !== 1 ? "s" : ""} to complete.`, url: "/physio", tag: "physio-evening" });
              await markSent(userId, "physio-evening");
              sent++;
            } catch {}
          }
        }
      }
    }

    // ── Streak warning ────────────────────────────────────────────────────────
    if (prefs.streakWarning && hour >= 20) {
      if (!(await alreadySentToday(userId, "streak-warning"))) {
        const today = new Date().toLocaleString("en-CA", { timeZone: sub.timezone }).split(",")[0];
        const { data: todaySessions } = await supabase
          .from("workout_sessions")
          .select("id")
          .eq("user_id", userId)
          .eq("date", today)
          .limit(1);

        if (!todaySessions || todaySessions.length === 0) {
          try {
            await sendPush(sub, { title: "Streak at risk 🔥", body: "Log a workout before midnight to keep your streak.", url: "/workout", tag: "streak-warning" });
            await markSent(userId, "streak-warning");
            sent++;
          } catch {}
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
