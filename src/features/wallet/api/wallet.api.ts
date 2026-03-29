import { env } from "@/shared/config/env";
import { apiRequest } from "@/shared/api/http";
import type {
  AuthMeResponse,
  WalletActionResponse,
  WalletBalanceResponse,
  WalletDepositPayload,
  WalletTransactionsResponse,
  WalletWithdrawPayload,
} from "@/features/wallet/types/wallet.types";

const WALLET_PREFIX = "/api/v1/wallet";
const AUTH_PREFIX = "/api/v1/auth";

function authHeaders(token: string, extraHeaders?: Record<string, string>) {
  return {
    Authorization: `Bearer ${token}`,
    ...(extraHeaders || {}),
  };
}

export function fetchWalletBalance(token: string): Promise<WalletBalanceResponse> {
  return apiRequest<WalletBalanceResponse>(env.apiBaseUrl, `${WALLET_PREFIX}/balance`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function fetchWalletTransactions(token: string, limit = 50, offset = 0): Promise<WalletTransactionsResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return apiRequest<WalletTransactionsResponse>(env.apiBaseUrl, `${WALLET_PREFIX}/transactions?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function fetchAuthMe(token: string): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/me`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function createDeposit(token: string, payload: WalletDepositPayload, idempotencyKey: string): Promise<WalletActionResponse> {
  return apiRequest<WalletActionResponse>(env.apiBaseUrl, `${WALLET_PREFIX}/deposit`, {
    method: "POST",
    body: payload,
    headers: authHeaders(token, { "idempotency-key": idempotencyKey }),
  });
}

export function createWithdrawal(token: string, payload: WalletWithdrawPayload, idempotencyKey: string): Promise<WalletActionResponse> {
  return apiRequest<WalletActionResponse>(env.apiBaseUrl, `${WALLET_PREFIX}/withdraw`, {
    method: "POST",
    body: payload,
    headers: authHeaders(token, { "idempotency-key": idempotencyKey }),
  });
}
