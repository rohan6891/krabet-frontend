"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { verifyEmail } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useCountdown } from "@/features/auth/hooks/useCountdown";
import { formatSeconds, toSecondsLeft } from "@/shared/utils/time";

export function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const otpExpiresAt = searchParams.get("otpExpiresAt") || undefined;
  const otpExpiresInSecondsRaw = searchParams.get("otpExpiresInSeconds");
  const otpExpiresInSeconds = otpExpiresInSecondsRaw ? Number(otpExpiresInSecondsRaw) : undefined;

  const initialSeconds = useMemo(
    () => toSecondsLeft(otpExpiresAt, otpExpiresInSeconds),
    [otpExpiresAt, otpExpiresInSeconds]
  );

  const secondsLeft = useCountdown(initialSeconds);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleVerifySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email) {
      setServerError("Missing email context. Please sign up again.");
      return;
    }

    setLoading(true);
    setServerError("");
    setSuccessMessage("");

    try {
      const data = await verifyEmail({
        email,
        code: code.trim(),
      });

      setSuccessMessage(data.message || "Email verified successfully");
      window.setTimeout(() => {
        router.push("/auth");
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "A server error occurred.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card active single-auth-card">
        <h2>EMAIL VERIFICATION</h2>

        <form onSubmit={handleVerifySubmit}>
          {serverError ? <p className="status-message error-text">{serverError}</p> : null}
          {successMessage ? <p className="status-message success-text">{successMessage}</p> : null}

          <p className="helper-text">Enter the 6-digit verification code sent to your email.</p>
          <input type="email" value={email} disabled placeholder="Email" />

          <input
            type="text"
            maxLength={6}
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />

          <p className={`timer-text ${secondsLeft === 0 ? "error-text" : ""}`}>
            Token expires in: {formatSeconds(secondsLeft)}
          </p>

          <button type="submit" className="main-btn" disabled={loading || code.trim().length !== 6}>
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "VERIFY EMAIL"}
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
