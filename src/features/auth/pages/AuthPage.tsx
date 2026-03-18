"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  oauthGoogle,
  oauthTelegram,
  oauthTwitter,
  signin,
  signup,
} from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthSocialButtons } from "@/features/auth/components/AuthSocialButtons";
import { env } from "@/shared/config/env";
import type { SigninResponse } from "@/features/auth/types/auth.types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string>) => void;
          prompt: (momentListener?: (notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => void) => void;
        };
      };
    };
    onTelegramAuth?: (user: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      auth_date: number;
      hash: string;
    }) => void;
  }
}

const TW_VERIFIER_KEY = "krabets_tw_verifier";
const TW_REDIRECT_KEY = "krabets_tw_redirect";

function randomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sha256Base64Url(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function AuthPage() {
  const router = useRouter();
  const googleHostRef = useRef<HTMLDivElement | null>(null);

  const [signinIdentity, setSigninIdentity] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinLoading, setSigninLoading] = useState(false);
  const [signinServerError, setSigninServerError] = useState("");

  const [signupLoading, setSignupLoading] = useState(false);
  const [signupServerError, setSignupServerError] = useState("");
  const [signupSuccessMessage, setSignupSuccessMessage] = useState("");

  const [showSignup, setShowSignup] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showBadEmail, setShowBadEmail] = useState(false);
  const [showBadUsername, setShowBadUsername] = useState(false);
  const [showWeak, setShowWeak] = useState(false);
  const [showNotMatch, setShowNotMatch] = useState(false);

  const [oauthServerError, setOauthServerError] = useState("");
  const [oauthMessage, setOauthMessage] = useState("");
  const [telegramWidgetOpenFor, setTelegramWidgetOpenFor] = useState<"signin" | "signup" | null>(null);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernamePattern = /^[A-Za-z0-9_]+$/;

  const saveAuthSession = useCallback(
    (token: string, user?: SigninResponse["user"], provider: "google" | "twitter" | "telegram" | "email" = "email") => {
    window.localStorage.setItem("accessToken", token);
    window.localStorage.setItem(
      "krabets_session",
      JSON.stringify({
        token,
        user: {
          provider,
          ...(user || {}),
        },
      })
    );
    },
    []
  );

  const completeOAuthAuthFlow = useCallback(async (data: SigninResponse, provider: "google" | "twitter" | "telegram") => {
    if (data.requires2FA) {
      const params = new URLSearchParams({
        userId: data.userId || "",
        needsEmail: data.needsEmail ? "1" : "0",
        provider,
      });
      router.push(`/auth/verify-2fa?${params.toString()}`);
      return;
    }

    if (!data.token) {
      throw new Error("OAuth login did not return a token.");
    }

    saveAuthSession(data.token, data.user, provider);

    if (data.needsEmail || !data.user?.email) {
      router.push("/auth/oauth-complete-email");
      return;
    }

    router.push("/dashboard");
  }, [router, saveAuthSession]);

  const handleGoogleCredentialResponse = useCallback(async (response: { credential?: string }) => {
    const idToken = response.credential;
    if (!idToken) {
      setOauthServerError("Google did not return id token.");
      return;
    }

    setOauthServerError("");
    setOauthMessage("Verifying Google sign-in...");

    try {
      const data = await oauthGoogle({ idToken });
      await completeOAuthAuthFlow(data, "google");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed.";
      setOauthServerError(message);
    }
  }, [completeOAuthAuthFlow]);

  const initGoogle = useCallback(() => {
    if (!env.googleClientId || !window.google || !googleHostRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: env.googleClientId,
      callback: handleGoogleCredentialResponse,
    });

    googleHostRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleHostRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
    });
  }, [handleGoogleCredentialResponse]);

  const loadGoogleScript = useCallback(() => {
    if (document.querySelector("script[data-krabets-google-script='1']")) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.krabetsGoogleScript = "1";
    script.onload = () => {
      initGoogle();
    };
    document.body.appendChild(script);
  }, [initGoogle]);

  const waitForGoogleSdk = useCallback(async (timeoutMs = 5000): Promise<boolean> => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (window.google?.accounts?.id) {
        return true;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    return false;
  }, []);

  useEffect(() => {
    loadGoogleScript();
  }, [loadGoogleScript]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      return;
    }

    const codeVerifier = window.localStorage.getItem(TW_VERIFIER_KEY);
    const redirectUri = window.localStorage.getItem(TW_REDIRECT_KEY) || env.twitterRedirectUri;
    if (!codeVerifier || !redirectUri) {
      setOauthServerError("Twitter callback detected but verifier or redirect URI is missing.");
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setOauthMessage("Completing Twitter login...");
        const data = await oauthTwitter({ code, codeVerifier, redirectUri });
        if (isMounted) {
          await completeOAuthAuthFlow(data, "twitter");
          window.history.replaceState({}, "", "/auth");
        }
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Twitter login failed.";
          setOauthServerError(message);
        }
      } finally {
        if (isMounted) {
          window.localStorage.removeItem(TW_VERIFIER_KEY);
          window.localStorage.removeItem(TW_REDIRECT_KEY);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [completeOAuthAuthFlow]);

  const renderTelegramWidget = useCallback((containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container || !env.telegramBotUsername) {
      return;
    }

    container.innerHTML = "";
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", env.telegramBotUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);
  }, []);

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      try {
        setOauthServerError("");
        setOauthMessage("Verifying Telegram sign-in...");

        const data = await oauthTelegram(user);
        await completeOAuthAuthFlow(data, "telegram");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Telegram sign-in failed.";
        setOauthServerError(message);
      }
    };

    return () => {
      window.onTelegramAuth = undefined;
    };
  }, [completeOAuthAuthFlow]);

  function handleEmailBlur() {
    const valid = emailPattern.test(email.trim());
    setShowBadEmail(!valid);
  }

  function handleUsernameChange(value: string) {
    setUsername(value);
    const valid = usernamePattern.test(value.trim());
    setShowBadUsername(value.trim() !== "" && !valid);
  }

  function handlePasswordChange(value: string) {
    setPassword(value);

    const passwordValid = value.length >= 8;
    setShowWeak(value.length > 0 && !passwordValid);

    const passwordsMatch = confirmPassword === value;
    setShowNotMatch(confirmPassword.length > 0 && !passwordsMatch);
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value);
    const passwordsMatch = value === password;
    setShowNotMatch(value.length > 0 && !passwordsMatch);
  }

  const isEmailValid = emailPattern.test(email.trim());
  const isUsernameValid = usernamePattern.test(username.trim());
  const isPasswordValid = password.length >= 8;
  const isConfirmPasswordValid = confirmPassword === password && confirmPassword.length > 0;

  const isSignupValid = isEmailValid && isUsernameValid && isPasswordValid && isConfirmPasswordValid;

  async function handleGoogleClick() {
    setOauthServerError("");
    setOauthMessage("");

    if (!env.googleClientId) {
      setOauthServerError("Google client id is missing. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env");
      return;
    }

    loadGoogleScript();
    const ready = await waitForGoogleSdk();
    if (!ready || !window.google?.accounts?.id) {
      setOauthServerError("Google SDK did not load. Please try again.");
      return;
    }

    initGoogle();

    // Prefer clicking the rendered Google button when available, and fall back to prompt.
    const host = googleHostRef.current;
    const clickTarget = host?.querySelector("div[role='button'], iframe") as HTMLElement | null;
    if (clickTarget) {
      clickTarget.click();
      return;
    }

    setOauthMessage("Opening Google sign-in...");
    window.google.accounts.id.prompt((notification) => {
      if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        setOauthServerError("Google sign-in popup was blocked or dismissed. Please allow popups and try again.");
      }
    });
  }

  async function handleTwitterClick() {
    setOauthServerError("");
    setOauthMessage("");

    if (!env.twitterClientId || !env.twitterRedirectUri) {
      setOauthServerError("Twitter client id or redirect URI missing. Set NEXT_PUBLIC_TWITTER_* in .env");
      return;
    }

    const verifier = randomString(128);
    const challenge = await sha256Base64Url(verifier);
    window.localStorage.setItem(TW_VERIFIER_KEY, verifier);
    window.localStorage.setItem(TW_REDIRECT_KEY, env.twitterRedirectUri);

    const url =
      `https://twitter.com/i/oauth2/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(env.twitterClientId)}` +
      `&redirect_uri=${encodeURIComponent(env.twitterRedirectUri)}` +
      `&scope=${encodeURIComponent("users.read tweet.read")}` +
      `&state=krabets-auth` +
      `&code_challenge=${encodeURIComponent(challenge)}` +
      `&code_challenge_method=S256`;

    window.location.href = url;
  }

  async function handleTelegramClick(source: "signin" | "signup") {
    setOauthServerError("");
    setOauthMessage("");

    if (!env.telegramBotUsername) {
      setOauthServerError("Telegram bot username missing. Set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME in .env");
      return;
    }

    setTelegramWidgetOpenFor(source);
    window.setTimeout(() => {
      renderTelegramWidget(source === "signin" ? "telegram-widget-signin" : "telegram-widget-signup");
    }, 0);
  }

  async function handleSigninSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSigninLoading(true);
    setSigninServerError("");

    try {
      const data = await signin({
        email: signinIdentity.trim(),
        password: signinPassword,
      });

      if (data.token) {
        window.localStorage.setItem("accessToken", data.token);
      }

      if (data.requires2FA) {
        const params = new URLSearchParams({
          userId: data.userId || "",
          needsEmail: "0",
          provider: "email",
        });
        router.push(`/auth/verify-2fa?${params.toString()}`);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "A server error occurred.";
      setSigninServerError(message);
    } finally {
      setSigninLoading(false);
    }
  }

  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignupLoading(true);
    setSignupServerError("");
    setSignupSuccessMessage("");

    try {
      const data = await signup({
        email: email.trim(),
        username: username.trim(),
        password,
      });

      setSignupSuccessMessage(data.message || "Signup successful.");

      const params = new URLSearchParams({ email: email.trim() });
      if (data.otpExpiresAt) {
        params.set("otpExpiresAt", data.otpExpiresAt);
      }
      if (typeof data.otpExpiresInSeconds === "number") {
        params.set("otpExpiresInSeconds", String(data.otpExpiresInSeconds));
      }

      router.push(`/auth/verify-email?${params.toString()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "A server error occurred.";
      setSignupServerError(message);
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <AuthShell>
      <div id="signin" className={`auth-card ${!showSignup ? "active" : ""}`}>
        <h2>SIGN IN</h2>
        <form onSubmit={handleSigninSubmit}>
          {signinServerError ? <p className="status-message error-text">{signinServerError}</p> : null}
          {oauthServerError ? <p className="status-message error-text">{oauthServerError}</p> : null}
          {oauthMessage ? <p className="status-message success-text">{oauthMessage}</p> : null}

          <input
            type="text"
            placeholder="Email / Phone / Username"
            value={signinIdentity}
            onChange={(e) => setSigninIdentity(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={signinPassword}
            onChange={(e) => setSigninPassword(e.target.value)}
            required
          />

          <Link href="/auth/forgot-password" className="forgot">
            Forgot Password?
          </Link>

          <button type="submit" className="main-btn" disabled={signinLoading}>
            {signinLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "SIGN IN"}
          </button>
        </form>

        <div className="divider">OR SIGN IN DIRECTLY WITH</div>
        <AuthSocialButtons
          onGoogleClick={handleGoogleClick}
          onTwitterClick={handleTwitterClick}
          onTelegramClick={() => handleTelegramClick("signin")}
          telegramWidgetOpen={telegramWidgetOpenFor === "signin"}
          telegramWidgetContainerId="telegram-widget-signin"
        />

        <p className="switch">
          DON&apos;T HAVE AN ACCOUNT?{" "}
          <span id="gotoSignup" onClick={() => setShowSignup(true)}>
            SIGN UP
          </span>
        </p>
      </div>

      <div id="signup" className={`auth-card ${showSignup ? "active" : ""}`}>
        <h2>SIGN UP</h2>

        <form onSubmit={handleSignupSubmit}>
          {signupServerError ? <p className="status-message error-text">{signupServerError}</p> : null}
          {signupSuccessMessage ? <p className="status-message success-text">{signupSuccessMessage}</p> : null}

          <p className="alerted" id="bademail" style={{ display: showBadEmail ? "block" : "none" }}>
            ● This email is incorrect
          </p>
          <input
            id="signupEmail"
            type="text"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
          />

          <p className="alerted" id="badusername" style={{ display: showBadUsername ? "block" : "none" }}>
            ● Username can only contain letters, numbers and underscore
          </p>
          <input
            id="signupUsername"
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
          />

          <p className="alerted" id="weak" style={{ display: showWeak ? "block" : "none" }}>
            ● not strong enough
          </p>
          <input
            id="signupPassword"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
          />

          <p className="alerted" id="notmatch" style={{ display: showNotMatch ? "block" : "none" }}>
            ● Passwords don&apos;t match
          </p>
          <input
            id="signupConfirmPassword"
            type="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          />

          <button type="submit" id="signupBtn" className="main-btn" disabled={!isSignupValid || signupLoading}>
            {signupLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "SIGN UP"}
          </button>
        </form>

        <div className="divider">OR SIGN UP DIRECTLY WITH</div>
        <AuthSocialButtons
          onGoogleClick={handleGoogleClick}
          onTwitterClick={handleTwitterClick}
          onTelegramClick={() => handleTelegramClick("signup")}
          telegramWidgetOpen={telegramWidgetOpenFor === "signup"}
          telegramWidgetContainerId="telegram-widget-signup"
        />

        <p className="switch">
          ALREADY HAVE AN ACCOUNT?{" "}
          <span id="gotoSignin" onClick={() => setShowSignup(false)}>
            SIGN IN
          </span>
        </p>
      </div>

      <div ref={googleHostRef} className="hidden-google-host" />
    </AuthShell>
  );
}
