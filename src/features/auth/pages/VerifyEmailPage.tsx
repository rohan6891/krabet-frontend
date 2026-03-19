"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { resendVerifyEmail, verifyEmail } from "@/features/auth/api/auth.api";
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

  const [otpCountdownSeed, setOtpCountdownSeed] = useState(() => toSecondsLeft(otpExpiresAt, otpExpiresInSeconds));
  const [resendCountdownSeed, setResendCountdownSeed] = useState(30);
  const [otpResetTick, setOtpResetTick] = useState(0);
  const [resendResetTick, setResendResetTick] = useState(0);

  const secondsLeft = useCountdown(otpCountdownSeed, otpResetTick);
  const resendSecondsLeft = useCountdown(resendCountdownSeed, resendResetTick);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

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

  async function handleResendOTP() {
    if (resendSecondsLeft > 0 || resendLoading) {
      return;
    }

    if (!email) {
      showToast({ type: "error", title: "Verify Email", message: "Missing email context. Please sign up again." });
      return;
    }

    setResendLoading(true);
    try {
      const data = await resendVerifyEmail(email);

      setResendCountdownSeed(Math.max(1, data.resendAvailableInSeconds ?? 30));
      setOtpCountdownSeed(toSecondsLeft(data.otpExpiresAt, data.otpExpiresInSeconds));
      setResendResetTick((prev) => prev + 1);
      setOtpResetTick((prev) => prev + 1);
      setCode("");

      showToast({
        type: "success",
        title: "Verify Email",
        message: data.message || "A new verification code has been sent.",
      });
    } catch (error) {
      const message = getUserFriendlyError(error, "Unable to resend verification code. Please try again.");
      const cooldownMatch = message.match(/wait\s+(\d+)\s+seconds/i);
      if (cooldownMatch?.[1]) {
        setResendCountdownSeed(Math.max(1, Number(cooldownMatch[1])));
        setResendResetTick((prev) => prev + 1);
      }
      showToast({ type: "error", title: "Verify Email", message });
    } finally {
      setResendLoading(false);
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

          <button
            type="button"
            className="secondary-btn"
            onClick={handleResendOTP}
            disabled={resendLoading || resendSecondsLeft > 0}
          >
            {resendLoading
              ? "SENDING..."
              : resendSecondsLeft > 0
                ? `RESEND OTP IN ${formatSeconds(resendSecondsLeft)}`
                : "RESEND OTP"}
          </button>

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
