"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { completeOAuthEmail } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";

export function OAuthCompleteEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const existing = window.localStorage.getItem("accessToken") || "";
    setToken(existing);
    if (!existing) {
      setError("No OAuth session found. Please sign in again.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setError("No OAuth session found. Please sign in again.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await completeOAuthEmail({ email: email.trim() }, token);
      setSuccess(data.message || "Email saved successfully.");

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
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card active single-auth-card">
        <h2>COMPLETE ACCOUNT</h2>

        <form onSubmit={handleSubmit}>
          {error ? <p className="status-message error-text">{error}</p> : null}
          {success ? <p className="status-message success-text">{success}</p> : null}

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
        </form>

        <div className="divider">BACK TO AUTH</div>
        <p className="switch">
          <Link href="/auth">GO TO SIGN IN</Link>
        </p>
      </div>
    </AuthShell>
  );
}
