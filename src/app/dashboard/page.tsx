"use client";

import { useState } from "react";
import Link from "next/link";

interface SessionUser {
  username?: string;
  email?: string;
  provider?: string;
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
      return session.user || null;
    } catch {
      return null;
    }
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
