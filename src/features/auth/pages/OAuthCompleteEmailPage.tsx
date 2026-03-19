"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { completeOAuthEmail } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useToast } from "@/shared/ui/toast/ToastProvider";

export function OAuthCompleteEmailPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const existingAccessToken = window.localStorage.getItem("accessToken") || "";
    let sessionToken = "";

    try {
      const rawSession = window.localStorage.getItem("krabets_session");
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as { token?: string; user?: { email?: string } };
        sessionToken = parsed.token || "";

        if (parsed.user?.email) {
          setCanContinue(true);
        }
      }
    } catch {
      // ignore malformed session
    }

    const existing = existingAccessToken || sessionToken;
    setToken(existing);
    if (!existing) {
      showToast({ type: "error", title: "Complete Account", message: "No OAuth session found. Please sign in again." });
    }
  }, [showToast]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      showToast({ type: "error", title: "Complete Account", message: "No OAuth session found. Please sign in again." });
      return;
    }

    setLoading(true);

    try {
      const data = await completeOAuthEmail({ email: email.trim() }, token);
      showToast({ type: "success", title: "Complete Account", message: data.message || "Email saved successfully." });

      const rawSession = window.localStorage.getItem("krabets_session");
      if (rawSession) {
        try {
          const parsed = JSON.parse(rawSession) as { token: string; user?: Record<string, unknown> };
          parsed.user = {
            ...(parsed.user || {}),
            ...(data.user || {}),
          };
          window.localStorage.setItem("krabets_session", JSON.stringify(parsed));
        } catch {
          // ignore malformed session payload
        }
      }

      window.setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to save email.";
      showToast({ type: "error", title: "Complete Account", message });

      if (message.toLowerCase().includes("already set for this account")) {
        setCanContinue(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card active single-auth-card">
        <h2>COMPLETE ACCOUNT</h2>

        <form onSubmit={handleSubmit}>
          <p className="helper-text">Add your email to finish OAuth account setup.</p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className="main-btn" disabled={loading || !token}>
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "SAVE EMAIL"}
          </button>

          {canContinue ? (
            <button type="button" className="main-btn" onClick={() => router.push("/dashboard")}>CONTINUE TO DASHBOARD</button>
          ) : null}
        </form>

        <div className="divider">BACK TO AUTH</div>
        <p className="switch">
          <Link href="/auth">GO TO SIGN IN</Link>
        </p>
      </div>
    </AuthShell>
  );
}
