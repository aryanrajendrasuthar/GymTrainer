"use client";

import { create } from "zustand";

export interface AppNotification {
  id: string;
  type: "success" | "info" | "warning" | "danger";
  title: string;
  body?: string;
  action?: { label: string; href: string };
  createdAt: number;
}

interface NotificationState {
  notifications: AppNotification[];
  push: (n: Omit<AppNotification, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],

  push: (n) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now() },
      ].slice(-5),
    })),

  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),
}));
