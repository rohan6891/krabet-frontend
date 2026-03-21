"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { setupTwoFactor, verifyTwoFactorSetup } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { getUserFriendlyError } from "@/shared/utils/userFriendlyError";

export function SetupTwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const nextPath = searchParams.get("next") || "/";

  const [token, setToken] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [code, setCode] = useState("");

  const canVerify = useMemo(() => code.trim().length === 6 && !!token, [code, token]);

  useEffect(() => {
    const accessToken = window.localStorage.getItem("accessToken") || "";
    if (accessToken) {
      setToken(accessToken);
      return;
    }

    try {
      const rawSession = window.localStorage.getItem("krabets_session");
      if (!rawSession) {
        showToast({ type: "error", title: "2FA Setup", message: "Session missing. Please sign in again." });
        router.replace("/auth");
        return;
      }

      const parsed = JSON.parse(rawSession) as { token?: string };
      if (!parsed.token) {
        showToast({ type: "error", title: "2FA Setup", message: "Session missing. Please sign in again." });
        router.replace("/auth");
        return;
      }

      setToken(parsed.token);
    } catch {
      showToast({ type: "error", title: "2FA Setup", message: "Session missing. Please sign in again." });
      router.replace("/auth");
      return;
    }
  }, [router, showToast]);

  async function handleStartSetup() {
    if (!token) {
      return;
    }

    setSetupLoading(true);
    try {
      const data = await setupTwoFactor(token);
      setQrCodeUrl(data.qrCodeUrl || "");
      showToast({ type: "info", title: "2FA Setup", message: "Please open Google Authenticator and scan the QR code." });
    } catch (error) {
      const message = getUserFriendlyError(error, "Unable to start 2FA setup.");
      showToast({ type: "error", title: "2FA Setup", message });
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleEnableTwoFactor() {
    if (!token) {
      return;
    }

    setVerifyLoading(true);
    try {
      const data = await verifyTwoFactorSetup(token, code.trim());
      showToast({ type: "success", title: "2FA Setup", message: data.message || "2FA enabled successfully." });
      window.setTimeout(() => {
        router.replace(nextPath);
      }, 500);
    } catch (error) {
      const message = getUserFriendlyError(error, "Invalid code. Please try again.");
      showToast({ type: "error", title: "2FA Setup", message });
    } finally {
      setVerifyLoading(false);
    }
  }

  function handleSkip() {
    router.replace(nextPath);
  }

  return (
    <AuthShell>
      <div className="auth-card active single-auth-card">
        <h2>SET UP 2FA</h2>

        <p className="helper-text twofa-info-text">
          This is optional. Please open the Google Authenticator app and scan the QR code.
        </p>

        {!qrCodeUrl ? (
          <div className="twofa-setup-actions">
            <button type="button" className="main-btn" onClick={handleStartSetup} disabled={setupLoading || !token}>
              {setupLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "SETUP 2FA"}
            </button>
            <button type="button" className="secondary-btn" onClick={handleSkip}>
              SKIP FOR NOW
            </button>
          </div>
        ) : (
          <div className="twofa-qr-wrap">
            <img src={qrCodeUrl} alt="2FA QR code" className="twofa-qr-image" />
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
            <button type="button" className="main-btn" onClick={handleEnableTwoFactor} disabled={!canVerify || verifyLoading}>
              {verifyLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "ENABLE 2FA"}
            </button>
            <button type="button" className="secondary-btn" onClick={handleSkip}>
              SKIP FOR NOW
            </button>
          </div>
        )}

        <div className="divider">BACK TO AUTH</div>
        <p className="switch">
          <Link href="/auth">GO TO SIGN IN</Link>
        </p>
      </div>
    </AuthShell>
  );
}
