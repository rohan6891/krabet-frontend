"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { forgotPassword, resetPassword } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useCountdown } from "@/features/auth/hooks/useCountdown";
import { formatSeconds, toSecondsLeft } from "@/shared/utils/time";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { getUserFriendlyError } from "@/shared/utils/userFriendlyError";

export function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [sendLoading, setSendLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [otpCountdownSeed, setOtpCountdownSeed] = useState(0);
  const [resendCountdownSeed, setResendCountdownSeed] = useState(0);
  const [otpResetTick, setOtpResetTick] = useState(0);
  const [resendResetTick, setResendResetTick] = useState(0);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const secondsLeft = useCountdown(otpCountdownSeed, otpResetTick);
  const resendSecondsLeft = useCountdown(resendCountdownSeed, resendResetTick);

  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    hasNoSpace: !/\s/.test(newPassword),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const doesPasswordMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const canReset = code.trim().length === 6 && isPasswordStrong && doesPasswordMatch;

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSendLoading(true);

    try {
      const data = await forgotPassword({ email: email.trim() });
      setIsCodeSent(true);
      setOtpCountdownSeed(toSecondsLeft(data.otpExpiresAt, data.otpExpiresInSeconds));
      setResendCountdownSeed(Math.max(1, data.resendAvailableInSeconds ?? 30));
      setOtpResetTick((prev) => prev + 1);
      setResendResetTick((prev) => prev + 1);
      showToast({ type: "success", title: "Forgot Password", message: data.message });
    } catch (error) {
      const message = getUserFriendlyError(error, "Unable to send reset code. Please try again.");
      showToast({ type: "error", title: "Forgot Password", message });
    } finally {
      setSendLoading(false);
    }
  }

  async function handleResendCode() {
    if (!isCodeSent || resendSecondsLeft > 0 || resendLoading) {
      return;
    }

    setResendLoading(true);
    try {
      const data = await forgotPassword({ email: email.trim() });
      setOtpCountdownSeed(toSecondsLeft(data.otpExpiresAt, data.otpExpiresInSeconds));
      setResendCountdownSeed(Math.max(1, data.resendAvailableInSeconds ?? 30));
      setOtpResetTick((prev) => prev + 1);
      setResendResetTick((prev) => prev + 1);
      setCode("");

      showToast({
        type: "success",
        title: "Forgot Password",
        message: data.message || "A new reset code has been sent to your email.",
      });
    } catch (error) {
      const message = getUserFriendlyError(error, "Unable to resend reset code. Please try again.");
      showToast({ type: "error", title: "Forgot Password", message });
    } finally {
      setResendLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetLoading(true);

    try {
      const data = await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      showToast({ type: "success", title: "Password Reset", message: data.message });
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        router.push("/auth");
      }, 900);
    } catch (error) {
      const message = getUserFriendlyError(error, "Password reset failed. Please try again.");
      showToast({ type: "error", title: "Password Reset", message });
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card active single-auth-card">
        <h2>FORGOT PASSWORD</h2>

        {!isCodeSent ? (
          <form onSubmit={handleSendCode}>
            <p className="helper-text">We will send a reset code to your email.</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" className="main-btn" disabled={sendLoading}>
              {sendLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "SEND RESET CODE"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <input type="email" value={email} disabled placeholder="Email" />

            <input
              type="text"
              maxLength={6}
              placeholder="Reset Code"
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
              onClick={handleResendCode}
              disabled={resendLoading || resendSecondsLeft > 0}
            >
              {resendLoading
                ? "SENDING..."
                : resendSecondsLeft > 0
                  ? `RESEND CODE IN ${formatSeconds(resendSecondsLeft)}`
                  : "RESEND CODE"}
            </button>

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordTouched(true);
              }}
              required
            />

            <div className={`password-rules-box ${passwordTouched || newPassword.length > 0 ? "active" : ""}`}>
              <p className="password-rules-title">Password must contain:</p>
              <ul className="password-rules-list">
                <li className={passwordChecks.minLength ? "rule-ok" : "rule-bad"}>At least 8 characters</li>
                <li className={passwordChecks.hasUppercase ? "rule-ok" : "rule-bad"}>One uppercase letter</li>
                <li className={passwordChecks.hasLowercase ? "rule-ok" : "rule-bad"}>One lowercase letter</li>
                <li className={passwordChecks.hasNumber ? "rule-ok" : "rule-bad"}>One number</li>
                <li className={passwordChecks.hasSpecial ? "rule-ok" : "rule-bad"}>One special character</li>
                <li className={passwordChecks.hasNoSpace ? "rule-ok" : "rule-bad"}>No spaces</li>
              </ul>
            </div>

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <p className="alerted" style={{ display: confirmPassword.length > 0 && !doesPasswordMatch ? "block" : "none" }}>
              ● Passwords don&apos;t match
            </p>

            <button type="submit" className="main-btn" disabled={resetLoading || !canReset}>
              {resetLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "RESET PASSWORD"}
            </button>
          </form>
        )}

        <div className="divider">BACK TO AUTH</div>
        <p className="switch">
          <Link href="/auth">GO TO SIGN IN</Link>
        </p>
      </div>
    </AuthShell>
  );
}
