import { env } from "@/shared/config/env";
import { apiRequest } from "@/shared/api/http";
import type {
  AuthTimerResponse,
  CompleteOAuthEmailPayload,
  CompleteOAuthEmailResponse,
  ForgotPasswordPayload,
  GoogleOAuthPayload,
  ResetPasswordPayload,
  ResetPasswordResponse,
  SigninPayload,
  SigninResponse,
  SignupPayload,
  TelegramOAuthPayload,
  TwoFactorLoginPayload,
  TwitterOAuthPayload,
  VerifyEmailPayload,
  VerifyEmailResponse,
} from "@/features/auth/types/auth.types";

const AUTH_PREFIX = "/api/v1/auth";
const TWO_FA_PREFIX = "/api/v1/2fa";

export function signup(payload: SignupPayload): Promise<AuthTimerResponse> {
  return apiRequest<AuthTimerResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/signup`, {
    method: "POST",
    body: payload,
  });
}

export function verifyEmail(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
  return apiRequest<VerifyEmailResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/verify-email`, {
    method: "POST",
    body: payload,
  });
}

export function resendVerifyEmail(email: string): Promise<AuthTimerResponse> {
  return apiRequest<AuthTimerResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/resend-verify-email`, {
    method: "POST",
    body: { email },
  });
}

export function signin(payload: SigninPayload): Promise<SigninResponse> {
  return apiRequest<SigninResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/login`, {
    method: "POST",
    body: payload,
  });
}

export function forgotPassword(payload: ForgotPasswordPayload): Promise<AuthTimerResponse> {
  return apiRequest<AuthTimerResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/forgot-password`, {
    method: "POST",
    body: payload,
  });
}

export function resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/reset-password`, {
    method: "POST",
    body: payload,
  });
}

export function oauthGoogle(payload: GoogleOAuthPayload): Promise<SigninResponse> {
  return apiRequest<SigninResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/oauth/google`, {
    method: "POST",
    body: payload,
  });
}

export function oauthTwitter(payload: TwitterOAuthPayload): Promise<SigninResponse> {
  return apiRequest<SigninResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/oauth/twitter`, {
    method: "POST",
    body: payload,
  });
}

export function oauthTelegram(payload: TelegramOAuthPayload): Promise<SigninResponse> {
  return apiRequest<SigninResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/oauth/telegram`, {
    method: "POST",
    body: payload,
  });
}

export function loginWith2FA(payload: TwoFactorLoginPayload): Promise<SigninResponse> {
  return apiRequest<SigninResponse>(env.apiBaseUrl, `${TWO_FA_PREFIX}/login`, {
    method: "POST",
    body: payload,
  });
}

export function completeOAuthEmail(payload: CompleteOAuthEmailPayload, token: string): Promise<CompleteOAuthEmailResponse> {
  return apiRequest<CompleteOAuthEmailResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/oauth/complete-email`, {
    method: "POST",
    body: payload,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
