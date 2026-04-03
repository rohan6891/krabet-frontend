import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import type { MinesSessionResponse } from "@/features/mines/types/mines.types";

const MINES_PREFIX = "/api/v1/games/mines";

function authHeaders(): HeadersInit {
  const token = getAccessTokenFromStorage();
  if (!token) {
    throw new Error("Authentication required.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export function startMinesSession(payload: {
  amount: string;
  currency: string;
  mine_count: number;
  idempotencyKey?: string;
}): Promise<MinesSessionResponse> {
  return apiRequest<MinesSessionResponse>(env.apiBaseUrl, `${MINES_PREFIX}/start`, {
    method: "POST",
    headers: authHeaders(),
    body: {
      amount: String(payload.amount),
      currency: payload.currency,
      mine_count: payload.mine_count,
      mineCount: payload.mine_count,
      idempotencyKey: payload.idempotencyKey,
    },
  });
}

export function submitMinesMove(payload: {
  sessionId: string;
  tileIndex: number;
}): Promise<MinesSessionResponse> {
  return apiRequest<MinesSessionResponse>(env.apiBaseUrl, `${MINES_PREFIX}/move`, {
    method: "POST",
    headers: authHeaders(),
    body: payload,
  });
}

export function cashoutMinesSession(payload: {
  sessionId: string;
}): Promise<MinesSessionResponse> {
  return apiRequest<MinesSessionResponse>(env.apiBaseUrl, `${MINES_PREFIX}/cashout`, {
    method: "POST",
    headers: authHeaders(),
    body: payload,
  });
}

export function getMinesSession(sessionId: string): Promise<MinesSessionResponse> {
  return apiRequest<MinesSessionResponse>(env.apiBaseUrl, `${MINES_PREFIX}/${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: authHeaders(),
  });
}
