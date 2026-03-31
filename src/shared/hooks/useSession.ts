import { useState, useEffect } from "react";
import { clearAuthSession } from "@/shared/utils/session";

export interface SessionUser {
  username?: string;
  email?: string;
  provider?: string;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function userFromAccessToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(parts[1])) as {
      username?: string;
      email?: string;
    };

    if (!payload.username && !payload.email) {
      return null;
    }

    return {
      username: payload.username,
      email: payload.email,
      provider: "email",
    };
  } catch {
    return null;
  }
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem("krabets_session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session.user) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUser(session.user);
          return;
        }
      } catch {
        // ignore
      }
    }

    const token = window.localStorage.getItem("accessToken");
    if (token) {
      const fallbackUser = userFromAccessToken(token);
      if (fallbackUser) {
        window.localStorage.setItem(
          "krabets_session",
          JSON.stringify({
            token,
            user: fallbackUser,
          })
        );
        setUser(fallbackUser);
      }
    }
  }, []);

  function logout() {
    clearAuthSession();
    window.location.href = "/auth";
  }

  return { user, logout };
}
