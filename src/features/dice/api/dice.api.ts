import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import type { DiceBetApiResponse, DiceRoundResult } from "@/features/dice/types/dice.types";

const BETS_PREFIX = "/api/v1/bets";
const BET_CURRENCY = "USDT";

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

function toFinite(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function placeDiceBet(payload: {
  mode: "live" | "demo";
  amount: string;
  target: number;
  rollOver: boolean;
}): Promise<DiceRoundResult> {
  const idempotencyKey = crypto.randomUUID();

  const response = await apiRequest<DiceBetApiResponse>(env.apiBaseUrl, BETS_PREFIX, {
    method: "POST",
    headers: authHeaders({ "x-idempotency-key": idempotencyKey }),
    body: {
      gameCode: "dice",
      mode: payload.mode,
      currency: BET_CURRENCY,
      betAmount: String(payload.amount),
      metadata: {
        target: payload.target,
        roll_over: payload.rollOver,
      },
    },
  });

  const resolved = response.data?.result;
  if (resolved) {
    return {
      roll: toFinite(resolved.roll, 0),
      target: toFinite(resolved.target, payload.target),
      rollOver: Boolean(resolved.rollOver),
      outcome: resolved.outcome,
      payout: toFinite(resolved.payout, 0),
      profit: toFinite(resolved.profit, 0),
      updatedBalance: toFinite(resolved.updatedBalance, 0),
    };
  }

  throw new Error("Invalid Dice response from server.");
}
