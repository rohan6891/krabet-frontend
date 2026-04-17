import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import type { CoinSide, CoinflipBetApiResponse, CoinflipMode, CoinflipRoundResult } from "@/features/coinflip/types/coinflip.types";

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

function getOutcomeSideFromMetadata(metadata?: Record<string, unknown>): CoinSide {
  const raw = String(metadata?.outcome_side ?? "").toLowerCase();
  return raw === "tails" ? "tails" : "heads";
}

export async function placeCoinflipBet(payload: {
  mode: CoinflipMode;
  amount: string;
  choice: CoinSide;
}): Promise<CoinflipRoundResult> {
  const idempotencyKey = crypto.randomUUID();

  const betResponse = await apiRequest<CoinflipBetApiResponse>(env.apiBaseUrl, BETS_PREFIX, {
    method: "POST",
    headers: authHeaders({ "x-idempotency-key": idempotencyKey }),
    body: {
      gameCode: "coinflip",
      mode: payload.mode,
      currency: BET_CURRENCY,
      betAmount: String(payload.amount),
      metadata: {
        choice_side: payload.choice,
      },
    },
  });

  const resolved = betResponse.data?.result;
  if (resolved) {
    return {
      outcomeSide: resolved.outcomeSide,
      outcome: resolved.outcome,
      payout: toFinite(resolved.payout, 0),
      profit: toFinite(resolved.profit, 0),
      updatedBalance: toFinite(resolved.updatedBalance, 0),
    };
  }

  const bet = betResponse.data?.bet;
  if (!bet) {
    throw new Error("Invalid Coinflip response from server.");
  }

  const payout = toFinite(bet.payout, 0);
  const wager = toFinite(bet.bet_amount, 0);
  const outcome = bet.status === "won" ? "win" : "loss";
  const outcomeSide = getOutcomeSideFromMetadata(bet.metadata);

  const walletResponse = await apiRequest<{ data: { wallets?: Array<{ currency: string; availableBalance: string }> } }>(
    env.apiBaseUrl,
    `${WALLET_PREFIX}/balance`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  return {
    outcomeSide,
    outcome,
    payout,
    profit: payout - wager,
    updatedBalance: deriveUpdatedBalance(walletResponse),
  };
}
