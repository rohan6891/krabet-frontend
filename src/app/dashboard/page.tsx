"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { getTwoFactorStatus, setupTwoFactor, verifyTwoFactorSetup } from "@/features/auth/api/auth.api";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { getUserFriendlyError } from "@/shared/utils/userFriendlyError";

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
  const { showToast } = useToast();

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

  const [token] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const accessToken = window.localStorage.getItem("accessToken") || "";
    if (accessToken) {
      return accessToken;
    }

    try {
      const raw = window.localStorage.getItem("krabets_session");
      if (!raw) {
        return "";
      }
      const parsed = JSON.parse(raw) as { token?: string };
      return parsed.token || "";
    } catch {
      return "";
    }
  });

  const [checkingTwoFactor, setCheckingTwoFactor] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [setupCode, setSetupCode] = useState("");

  const canVerifySetup = useMemo(() => setupCode.trim().length === 6 && !!token, [setupCode, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let mounted = true;
    setCheckingTwoFactor(true);

    (async () => {
      try {
        const status = await getTwoFactorStatus(token);
        if (mounted) {
          setTwoFactorEnabled(!!status.enabled);
        }
      } catch {
        if (mounted) {
          setTwoFactorEnabled(null);
        }
      } finally {
        if (mounted) {
          setCheckingTwoFactor(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleStartTwoFactorSetup() {
    if (!token) {
      showToast({ type: "error", title: "2FA Setup", message: "Missing session token. Please sign in again." });
      return;
    }

    setSetupLoading(true);
    try {
      const data = await setupTwoFactor(token);
      setQrCodeUrl(data.qrCodeUrl || "");
      showToast({ type: "info", title: "2FA Setup", message: "Scan the QR code in your authenticator app." });
    } catch (error) {
      const message = getUserFriendlyError(error, "Failed to initialize 2FA setup.");
      showToast({ type: "error", title: "2FA Setup", message });
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleVerifyTwoFactorSetup() {
    if (!token) {
      showToast({ type: "error", title: "2FA Setup", message: "Missing session token. Please sign in again." });
      return;
    }

    setVerifyLoading(true);
    try {
      const data = await verifyTwoFactorSetup(token, setupCode.trim());
      setTwoFactorEnabled(true);
      setQrCodeUrl("");
      setSetupCode("");
      setPromptDismissed(false);
      showToast({ type: "success", title: "2FA Setup", message: data.message || "2FA enabled successfully." });
    } catch (error) {
      const message = getUserFriendlyError(error, "Invalid authenticator code. Please try again.");
      showToast({ type: "error", title: "2FA Setup", message });
    } finally {
      setVerifyLoading(false);
    }
  }

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
          <>
            <p className="helper-text">
              Logged in as <strong>{user.username || "User"}</strong>
              {user.email ? ` (${user.email})` : ""}
              {user.provider ? ` via ${user.provider}` : ""}
            </p>

            {checkingTwoFactor ? (
              <p className="helper-text">Checking 2FA status...</p>
            ) : null}

            {!checkingTwoFactor && twoFactorEnabled === false && !promptDismissed ? (
              <div className="twofa-setup-card">
                <h3>Secure Your Account with 2FA (Optional)</h3>
                <p className="helper-text twofa-info-text">
                  Please open the Google Authenticator app and scan the QR code to protect your account.
                </p>

                {!qrCodeUrl ? (
                  <div className="twofa-setup-actions">
                    <button type="button" className="secondary-btn" onClick={handleStartTwoFactorSetup} disabled={setupLoading}>
                      {setupLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "SETUP 2FA"}
                    </button>
                    <button type="button" className="secondary-btn" onClick={() => setPromptDismissed(true)}>
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
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      type="button"
                      className="main-btn"
                      onClick={handleVerifyTwoFactorSetup}
                      disabled={!canVerifySetup || verifyLoading}
                    >
                      {verifyLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "ENABLE 2FA"}
                    </button>
                    <button type="button" className="secondary-btn" onClick={() => setPromptDismissed(true)}>
                      SKIP FOR NOW
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </>
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
