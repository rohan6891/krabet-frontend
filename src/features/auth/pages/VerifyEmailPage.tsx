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
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { getUserFriendlyError } from "@/shared/utils/userFriendlyError";

export function VerifyEmailPage() {
  const router = useRouter();
  const { showToast } = useToast();
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

  async function handleVerifySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email) {
      showToast({ type: "error", title: "Verify Email", message: "Missing email context. Please sign up again." });
      return;
    }

    setLoading(true);

    try {
      const data = await verifyEmail({
        email,
        code: code.trim(),
      });

      showToast({ type: "success", title: "Verify Email", message: data.message || "Email verified successfully" });
      window.setTimeout(() => {
        router.push("/auth");
      }, 1000);
    } catch (error) {
      const message = getUserFriendlyError(error, "Email verification failed. Please try again.");
      showToast({ type: "error", title: "Verify Email", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card active single-auth-card">
        <h2>EMAIL VERIFICATION</h2>

        <form onSubmit={handleVerifySubmit}>
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
