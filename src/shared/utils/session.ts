export type StoredSession = {
  token?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    avatarUrl?: string;
    provider?: string;
  };
};

export function getAccessTokenFromStorage(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const directToken = window.localStorage.getItem("accessToken") || "";
  if (directToken) {
    return directToken;
  }

  const raw = window.localStorage.getItem("krabets_session");
  if (!raw) {
    return "";
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token || "";
  } catch {
    return "";
  }
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("krabets_session");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}
