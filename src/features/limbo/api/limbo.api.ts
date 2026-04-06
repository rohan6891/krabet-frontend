import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import type { BetApiResponse, LimboRoundResult, WalletBalanceResponse } from "@/features/limbo/types/limbo.types";

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

function deriveUpdatedBalance(walletResponse: WalletBalanceResponse): number {
  const wallets = walletResponse.data.wallets || [];
  const preferred = wallets.find((wallet) => wallet.currency === BET_CURRENCY) || wallets[0];
  return toFinite(preferred?.availableBalance, 0);
}

export async function placeLimboBet(payload: {
  mode: "live" | "demo";
  amount: string;
  targetMultiplier: string;
}): Promise<LimboRoundResult> {
  const idempotencyKey = crypto.randomUUID();

  const betResponse = await apiRequest<BetApiResponse>(env.apiBaseUrl, BETS_PREFIX, {
    method: "POST",
    headers: authHeaders({ "x-idempotency-key": idempotencyKey }),
    body: {
      gameCode: "limbo",
      mode: payload.mode,
      currency: BET_CURRENCY,
      betAmount: String(payload.amount),
      metadata: {
        target_multiplier: toFinite(payload.targetMultiplier, 1.01),
      },
    },
  });

  const resolved = betResponse.data?.result;
  if (resolved) {
    return {
      rolledMultiplier: toFinite(resolved.rolledMultiplier, 1),
      outcome: resolved.outcome,
      payout: toFinite(resolved.payout, 0),
      profit: toFinite(resolved.profit, 0),
      updatedBalance: toFinite(resolved.updatedBalance, 0),
    };
  }

  const bet = betResponse.data?.bet;
  if (!bet) {
    throw new Error("Invalid Limbo response from server.");
  }

  const rolledMultiplier = toFinite(bet.multiplier, 1);
  const payout = toFinite(bet.payout, 0);
  const wager = toFinite(bet.bet_amount, 0);
  const outcome = bet.status === "won" ? "win" : "loss";

  const walletResponse = await apiRequest<WalletBalanceResponse>(env.apiBaseUrl, `${WALLET_PREFIX}/balance`, {
    method: "GET",
    headers: authHeaders(),
  });

  return {
    rolledMultiplier,
    outcome,
    payout,
    profit: payout - wager,
    updatedBalance: deriveUpdatedBalance(walletResponse),
  };
}
