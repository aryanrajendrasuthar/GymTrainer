import type { StateStorage } from "zustand/middleware";

// Reads the authenticated user's ID from the userStore's persisted JSON
// without importing the store (avoids circular dependencies).
function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("trainer-user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { profile?: { id?: string } } };
    return parsed?.state?.profile?.id ?? null;
  } catch {
    return null;
  }
}

// Custom Zustand storage that scopes every key to the signed-in user's ID.
// trainer-sessions becomes trainer-sessions::{userId}
// This means each user's data is completely isolated — no wiping needed on sign-out.
export const userScopedStorage: StateStorage = {
  getItem: (name) => {
    const uid = getCurrentUserId();
    if (!uid) return null;
    return localStorage.getItem(`${name}::${uid}`) ?? null;
  },
  setItem: (name, value) => {
    const uid = getCurrentUserId();
    if (!uid) return; // not authenticated — don't persist
    localStorage.setItem(`${name}::${uid}`, value);
  },
  removeItem: (name) => {
    const uid = getCurrentUserId();
    if (!uid) return;
    localStorage.removeItem(`${name}::${uid}`);
  },
};
