import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import type { NotificationsResponse } from "@/features/notifications/types/notification.types";

const PREFIX = "/api/v1/notifications";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function fetchNotifications(
  token: string,
  limit = 50,
  offset = 0,
): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>(
    env.apiBaseUrl,
    `${PREFIX}?limit=${limit}&offset=${offset}`,
    { method: "GET", headers: authHeaders(token) },
  );
}

export function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    env.apiBaseUrl,
    `${PREFIX}/${notificationId}/read`,
    { method: "PATCH", headers: authHeaders(token) },
  );
}

export function markAllNotificationsRead(
  token: string,
): Promise<{ success: boolean; data: { updated: number } }> {
  return apiRequest<{ success: boolean; data: { updated: number } }>(
    env.apiBaseUrl,
    `${PREFIX}/read-all`,
    { method: "PATCH", headers: authHeaders(token) },
  );
}
