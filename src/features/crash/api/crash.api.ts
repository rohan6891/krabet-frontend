import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import type {
  CashoutCrashBetResponse,
  CrashDemoBetResponse,
  CrashDemoRoundResult,
  CrashLiveStateResponse,
  CrashRoundBetResponse,
  CurrentCrashBetResponse,
} from "@/features/crash/types/crash.types";

const BET_CURRENCY = "USDT";
const BETS_PREFIX = "/api/v1/bets";
const CRASH_PREFIX = "/api/v1/games/crash";

function authHeaders(extraHeaders?: Record<string, string>): HeadersInit {
  const token = getAccessTokenFromStorage();
  if (!token) {
    throw new Error("Authentication required.");
  }

  return {
    Authorization: `Bearer ${token}`,
    ...(extraHeaders || {}),
  };
}

export async function placeCrashRoundBet(amount: string): Promise<CrashRoundBetResponse> {
  const idempotencyKey = crypto.randomUUID();

  return apiRequest<CrashRoundBetResponse>(env.apiBaseUrl, `${BETS_PREFIX}/round`, {
    method: "POST",
    headers: authHeaders({ "x-idempotency-key": idempotencyKey }),
    body: {
      currency: BET_CURRENCY,
      betAmount: String(amount),
    },
  });
}

function toFinite(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function placeCrashDemoBet(payload: {
  amount: string;
  cashoutAt?: number;
}): Promise<CrashDemoRoundResult> {
  const idempotencyKey = crypto.randomUUID();

  const response = await apiRequest<CrashDemoBetResponse>(env.apiBaseUrl, BETS_PREFIX, {
    method: "POST",
    headers: authHeaders({ "x-idempotency-key": idempotencyKey }),
    body: {
      gameCode: "crash",
      mode: "demo",
      currency: BET_CURRENCY,
      betAmount: String(payload.amount),
      metadata: {
        cashout_at: toFinite(payload.cashoutAt, 1.01),
      },
    },
  });

  const resolved = response.data?.result;
  if (!resolved) {
    throw new Error("Invalid Crash demo response from server.");
  }

  return {
    crashPoint: toFinite(resolved.crashPoint, 1),
    cashoutAt: toFinite(resolved.cashoutAt, 1.01),
    outcome: resolved.outcome,
    payout: toFinite(resolved.payout, 0),
    profit: toFinite(resolved.profit, 0),
    updatedBalance: toFinite(resolved.updatedBalance, 0),
  };
}

export async function cashoutCrashBet(betId: string): Promise<CashoutCrashBetResponse> {
  return apiRequest<CashoutCrashBetResponse>(env.apiBaseUrl, `${BETS_PREFIX}/cashout`, {
    method: "POST",
    headers: authHeaders(),
    body: { betId },
  });
}

export async function fetchCrashLiveState(): Promise<CrashLiveStateResponse> {
  return apiRequest<CrashLiveStateResponse>(env.apiBaseUrl, `${CRASH_PREFIX}/state`, {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function fetchCurrentCrashBet(): Promise<CurrentCrashBetResponse> {
  return apiRequest<CurrentCrashBetResponse>(env.apiBaseUrl, `${CRASH_PREFIX}/my-bet`, {
    method: "GET",
    headers: authHeaders(),
  });
}
