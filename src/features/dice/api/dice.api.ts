import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import type { DiceBetApiResponse, DiceRoundResult } from "@/features/dice/types/dice.types";

const BETS_PREFIX = "/api/v1/bets";
const WALLET_PREFIX = "/api/v1/wallet";
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

function deriveUpdatedBalance(walletResponse: {
  data: {
    wallets?: Array<{
      currency: string;
      availableBalance: string;
    }>;
  };
}): number {
  const wallets = walletResponse.data.wallets || [];
  const preferred = wallets.find((wallet) => wallet.currency === BET_CURRENCY) || wallets[0];
  return toFinite(preferred?.availableBalance, 0);
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

  const bet = response.data?.bet;
  if (!bet) {
    throw new Error("Invalid Dice response from server.");
  }

  const metadata = (bet.metadata || {}) as Record<string, unknown>;
  const roll = toFinite(metadata.roll, 0);
  const target = toFinite(metadata.target, payload.target);
  const rollOver = Boolean(metadata.roll_over ?? payload.rollOver);
  const payout = toFinite(bet.payout, 0);
  const wager = toFinite(bet.bet_amount, 0);
  const outcome = bet.status === "won" ? "win" : "loss";

  const walletResponse = await apiRequest<{ data: { wallets?: Array<{ currency: string; availableBalance: string }> } }>(
    env.apiBaseUrl,
    `${WALLET_PREFIX}/balance`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  return {
    roll,
    target,
    rollOver,
    outcome,
    payout,
    profit: payout - wager,
    updatedBalance: deriveUpdatedBalance(walletResponse),
  };
}

export async function fetchDiceDemoBalance(): Promise<number> {
  const response = await apiRequest<{ data?: { currency?: string; balance?: number | string } }>(
    env.apiBaseUrl,
    `${BETS_PREFIX}/demo-balance`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  return toFinite(response.data?.balance, 0);
}
