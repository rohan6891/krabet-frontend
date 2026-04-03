import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";

const AUTH_PREFIX = "/api/v1/auth";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function updateProfile(
  token: string,
  data: { displayName?: string },
): Promise<{ success: boolean; data: { user: Record<string, unknown> } }> {
  return apiRequest(env.apiBaseUrl, `${AUTH_PREFIX}/profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function changePassword(
  token: string,
  data: { currentPassword: string; newPassword: string },
): Promise<{ success: boolean; message: string }> {
  return apiRequest(env.apiBaseUrl, `${AUTH_PREFIX}/change-password`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}
