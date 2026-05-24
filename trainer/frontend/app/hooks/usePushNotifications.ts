"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/app/store/userStore";
import { useSettingsStore } from "@/app/store/settingsStore";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const { accessToken } = useUserStore();
  const { settings } = useSettingsStore();
  const [permission, setPermission] = useState<PushPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, []);

  const syncPrefs = useCallback(async (sub: PushSubscription) => {
    if (!accessToken) return;
    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notificationPrefs: settings.notifications ?? {},
      }),
    }).catch(() => {});
  }, [accessToken, settings.notifications]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return false;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await syncPrefs(sub);
      return true;
    } catch {
      return false;
    }
  }, [syncPrefs]);

  const unsubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        if (accessToken) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          }).catch(() => {});
        }
      }
    } catch {}
  }, [accessToken]);

  // When notification prefs change, push the updated prefs to the stored subscription.
  useEffect(() => {
    if (permission !== "granted" || !accessToken) return;
    navigator.serviceWorker?.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) syncPrefs(sub);
      })
    ).catch(() => {});
  }, [settings.notifications, permission, accessToken, syncPrefs]);

  return { permission, subscribe, unsubscribe };
}
