"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { forgotPassword, resetPassword } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useCountdown } from "@/features/auth/hooks/useCountdown";
import { formatSeconds, toSecondsLeft } from "@/shared/utils/time";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { getUserFriendlyError } from "@/shared/utils/userFriendlyError";

export function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [sendLoading, setSendLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(0);

  const secondsLeft = useCountdown(initialTimerSeconds);

  const isPasswordStrong = newPassword.length >= 8;
  const doesPasswordMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const canReset = code.trim().length === 6 && isPasswordStrong && doesPasswordMatch;

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSendLoading(true);

    try {
      const data = await forgotPassword({ email: email.trim() });
      setIsCodeSent(true);
      setInitialTimerSeconds(toSecondsLeft(data.otpExpiresAt, data.otpExpiresInSeconds));
      showToast({ type: "success", title: "Forgot Password", message: data.message });
    } catch (error) {
      const message = getUserFriendlyError(error, "Unable to send reset code. Please try again.");
      showToast({ type: "error", title: "Forgot Password", message });
    } finally {
      setSendLoading(false);
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

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <p className="alerted" style={{ display: newPassword.length > 0 && !isPasswordStrong ? "block" : "none" }}>
              ● not strong enough
            </p>

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
