export interface SignupPayload {
  email: string;
  username: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface SigninPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthTimerResponse {
  message: string;
  otpExpiresAt?: string;
  otpExpiresInSeconds?: number;
  resendAvailableInSeconds?: number;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface SigninResponse {
  requires2FA: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    avatarUrl?: string;
  };
  userId?: string;
  needsEmail?: boolean;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface GoogleOAuthPayload {
  idToken: string;
}

export interface TwitterOAuthPayload {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface TelegramOAuthPayload {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TwoFactorLoginPayload {
  userId: string;
  code: string;
}

export interface CompleteOAuthEmailPayload {
  email: string;
}

export interface CompleteOAuthEmailResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
}
