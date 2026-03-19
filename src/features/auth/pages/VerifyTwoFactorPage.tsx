"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { loginWith2FA } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useToast } from "@/shared/ui/toast/ToastProvider";

export function VerifyTwoFactorPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId") || "";
  const needsEmail = searchParams.get("needsEmail") === "1";
  const provider = searchParams.get("provider") || "email";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => code.trim().length === 6 && !!userId, [code, userId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      showToast({ type: "error", title: "Verify 2FA", message: "Missing 2FA context. Please sign in again." });
      return;
    }

    setLoading(true);

    try {
      const data = await loginWith2FA({ userId, code: code.trim() });
      if (!data.token) {
        throw new Error("2FA verification did not return a token.");
      }

      window.localStorage.setItem("accessToken", data.token);
      window.localStorage.setItem(
        "krabets_session",
        JSON.stringify({
          token: data.token,
          user: {
            provider,
            ...(data.user || {}),
          },
        })
      );

      showToast({ type: "success", title: "Verify 2FA", message: "2FA verified successfully." });

      if (needsEmail || !data.user?.email) {
        router.push("/auth/oauth-complete-email");
        return;
      }

      router.push("/dashboard");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "2FA verification failed.";
      showToast({ type: "error", title: "Verify 2FA", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card active single-auth-card">
        <h2>VERIFY 2FA</h2>

        <form onSubmit={handleSubmit}>
          <p className="helper-text">Enter the 6-digit authenticator code to complete sign in.</p>

          <input
            type="text"
            maxLength={6}
            placeholder="2FA Code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />

          <button type="submit" className="main-btn" disabled={!canSubmit || loading}>
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "VERIFY 2FA"}
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
