"use client";

import { useState } from "react";
import Link from "next/link";

interface SessionUser {
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

export default function DashboardPage() {
  const [user] = useState<SessionUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw =window.localStorage.getItem("krabets_session");
    if (!raw) {
      return null;
    }

    try {
      const session = JSON.parse(raw) as { user?: SessionUser };
      if (session.user) {
        return session.user;
      }
    } catch {
      // ignore malformed session and try token fallback
    }

    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      return null;
    }

    const fallbackUser = userFromAccessToken(token);
    if (fallbackUser) {
      window.localStorage.setItem(
        "krabets_session",
        JSON.stringify({
          token,
          user: fallbackUser,
        })
      );
    }

    return fallbackUser;
  });

  function logout() {
    window.localStorage.removeItem("krabets_session");
    window.localStorage.removeItem("accessToken");
    window.location.href = "/auth";
  }

  return (
    <main style={{ width: "100%", display: "flex", justifyContent: "center", padding: 20 }}>
      <section className="auth-card active single-auth-card">
        <h2>DASHBOARD</h2>

        {user ? (
          <p className="helper-text">
            Logged in as <strong>{user.username || "User"}</strong>
            {user.email ? ` (${user.email})` : ""}
            {user.provider ? ` via ${user.provider}` : ""}
          </p>
        ) : (
          <p className="status-message error-text">No active session found.</p>
        )}

        <button type="button" className="main-btn" onClick={logout}>
          LOG OUT
        </button>

        <div className="divider">AUTH NAVIGATION</div>
        <p className="switch">
          <Link href="/auth">BACK TO AUTH</Link>
        </p>
      </section>
    </main>
  );
}
