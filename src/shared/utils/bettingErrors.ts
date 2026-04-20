import { HttpError } from "@/shared/api/http";

const INSUFFICIENT_FUNDS_REGEX = /insufficient|available balance|less than bet amount|balance.*less|not enough balance|not enough funds/i;

function toFinite(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isInsufficientFundsError(error: unknown): boolean {
  if (error instanceof HttpError && error.status === 400) {
    return INSUFFICIENT_FUNDS_REGEX.test(error.message || "");
  }

  if (error instanceof Error) {
    return INSUFFICIENT_FUNDS_REGEX.test(error.message || "");
  }

  return false;
}

export function formatInsufficientFundsMessage(betAmount: number, availableBalance: number): string {
  const bet = toFinite(betAmount, 0);
  const balance = toFinite(availableBalance, 0);
  return `Insufficient funds. Bet: $${bet.toFixed(2)}, Available: $${balance.toFixed(2)}.`;
}

export function resolveBetErrorMessage(
  error: unknown,
  fallbackMessage: string,
  context?: { betAmount?: number; availableBalance?: number },
): string {
  if (isInsufficientFundsError(error)) {
    if (context && context.betAmount !== undefined && context.availableBalance !== undefined) {
      return formatInsufficientFundsMessage(context.betAmount, context.availableBalance);
    }
    return "Insufficient funds for this bet.";
  }

  if (error instanceof HttpError && error.status === 401) {
    return "Authentication required. Please log in again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
