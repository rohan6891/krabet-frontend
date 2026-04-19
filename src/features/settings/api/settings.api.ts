import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";

const AUTH_PREFIX = "/api/v1/auth";

export type UpdateProfilePayload = {
  username?: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  country?: string;
  timezone?: string;
  preferredLanguage?: string;
  dateOfBirth?: string;
  preferredDateTime?: string;
};

export type SettingsUserResponse = {
  id?: string;
  username?: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  phoneCountryCode?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  country?: string | null;
  timezone?: string | null;
  preferredLanguage?: string | null;
  preferredDateTime?: string | null;
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function updateProfile(
  token: string,
  data: UpdateProfilePayload,
): Promise<{ success: boolean; data: { user: SettingsUserResponse } }> {
  return apiRequest(env.apiBaseUrl, `${AUTH_PREFIX}/profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: data,
  });
}

export function uploadProfileAvatar(
  token: string,
  avatar: File,
): Promise<{ success: boolean; data: { user: SettingsUserResponse } }> {
  const body = new FormData();
  body.append("avatar", avatar);

  return apiRequest(env.apiBaseUrl, `${AUTH_PREFIX}/profile/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });
}

export function checkUsernameAvailability(
  token: string,
  username: string,
): Promise<{ success: boolean; data: { available: boolean; reason?: "current" | "taken" } }> {
  const params = new URLSearchParams({ username });
  return apiRequest(env.apiBaseUrl, `${AUTH_PREFIX}/profile/check-username?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function checkEmailAvailability(
  token: string,
  email: string,
): Promise<{ success: boolean; data: { available: boolean; reason?: "current" | "taken" } }> {
  const params = new URLSearchParams({ email });
  return apiRequest(env.apiBaseUrl, `${AUTH_PREFIX}/profile/check-email?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function changePassword(
  token: string,
  data: { currentPassword: string; newPassword: string },
): Promise<{ success: boolean; message: string }> {
  return apiRequest(env.apiBaseUrl, `${AUTH_PREFIX}/change-password`, {
    method: "POST",
    headers: authHeaders(token),
    body: data,
  });
}
