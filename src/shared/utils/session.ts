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

const AUTH_COOKIE_NAME = "krabets_auth";
const AUTH_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7;

function setAuthCookie(hasToken: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  if (hasToken) {
    document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; Max-Age=${AUTH_COOKIE_TTL_SECONDS}; SameSite=Lax`;
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function persistAuthSession(token: string, user?: StoredSession["user"]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("accessToken", token);
  window.localStorage.setItem(
    "krabets_session",
    JSON.stringify({
      token,
      user,
    } satisfies StoredSession),
  );
  setAuthCookie(Boolean(token));
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("krabets_session");
  }

  setAuthCookie(false);
}

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
