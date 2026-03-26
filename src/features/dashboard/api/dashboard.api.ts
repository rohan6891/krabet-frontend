import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import type {
  DashboardGamesResponse,
  DashboardWinsResponse,
  MeResponse,
  WalletBalanceResponse,
} from "@/features/dashboard/types/dashboard.types";

const GAMES_PREFIX = "/api/v1/games";
const AUTH_PREFIX = "/api/v1/auth";
const WALLET_PREFIX = "/api/v1/wallet";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function fetchDashboardGames(): Promise<DashboardGamesResponse> {
  return apiRequest<DashboardGamesResponse>(env.apiBaseUrl, `${GAMES_PREFIX}`);
}

export function fetchRecentWins(): Promise<DashboardWinsResponse> {
  return apiRequest<DashboardWinsResponse>(env.apiBaseUrl, `${GAMES_PREFIX}/recent-wins`);
}

export function fetchWalletBalance(token: string): Promise<WalletBalanceResponse> {
  return apiRequest<WalletBalanceResponse>(env.apiBaseUrl, `${WALLET_PREFIX}/balance`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function fetchMe(token: string): Promise<MeResponse> {
  return apiRequest<MeResponse>(env.apiBaseUrl, `${AUTH_PREFIX}/me`, {
    method: "GET",
    headers: authHeaders(token),
  });
}
