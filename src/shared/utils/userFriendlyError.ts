import { HttpError } from "@/shared/api/http";

function mapRawMessage(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (message.includes("invalid credentials")) {
    return "Email/username or password is incorrect.";
  }
  if (message.includes("verify your email")) {
    return "Please verify your email before logging in.";
  }
  if (message.includes("invalid or expired otp")) {
    return "Code is invalid or expired. Please request a new one.";
  }
  if (message.includes("email already in use")) {
    return "This email is already linked to another account. Use a different email.";
  }
  if (message.includes("email is already set for this account")) {
    return "This account already has an email. You can continue.";
  }
  if (message.includes("google verification failed")) {
    return "Google sign-in could not be verified. Please try again.";
  }
  if (message.includes("twitter verification failed")) {
    return "Twitter sign-in could not be verified. Please try again.";
  }
  if (message.includes("telegram auth data expired")) {
    return "Telegram login expired. Please retry from Telegram.";
  }
  if (message.includes("telegram signature")) {
    return "Telegram login could not be verified. Please try again.";
  }

  return rawMessage;
}

export function getUserFriendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  let rawMessage = "";
  let status: number | null = null;

  if (error instanceof HttpError) {
    rawMessage = error.message || "";
    status = error.status;
  } else if (error instanceof Error) {
    rawMessage = error.message || "";
  }

  if (!rawMessage) {
    return fallback;
  }

  const lower = rawMessage.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load resource")) {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (status !== null && status >= 500) {
    return "Server is temporarily unavailable. Please try again shortly.";
  }

  return mapRawMessage(rawMessage);
}
