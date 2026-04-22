import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import type { VipLevelsResponse, VipProfileResponse } from "@/features/dashboard/types/vip.types";

const VIP_PREFIX = "/api/v1/vip";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function fetchVipMe(token: string): Promise<VipProfileResponse> {
  return apiRequest<VipProfileResponse>(env.apiBaseUrl, `${VIP_PREFIX}/me`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function fetchVipLevels(): Promise<VipLevelsResponse> {
  return apiRequest<VipLevelsResponse>(env.apiBaseUrl, `${VIP_PREFIX}/levels`);
}
