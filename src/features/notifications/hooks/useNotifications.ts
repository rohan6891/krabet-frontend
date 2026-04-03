"use client";

import { useState, useEffect, useCallback } from "react";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage, getStoredSession } from "@/shared/utils/session";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/notifications/api/notification.api";
import type { NotificationItem } from "@/features/notifications/types/notification.types";

type RealtimeEnvelope = {
  type?: string;
  payload?: NotificationItem;
  user_id?: string;
};

function toWebSocketBaseUrl(apiBaseUrl: string): string {
  const normalized = apiBaseUrl.replace(/\/$/, "");
  if (normalized.startsWith("https://")) {
    return `wss://${normalized.slice("https://".length)}`;
  }
  if (normalized.startsWith("http://")) {
    return `ws://${normalized.slice("http://".length)}`;
  }
  return normalized;
}

function isNotificationItem(value: unknown): value is NotificationItem {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.user_id === "string" &&
    typeof record.title === "string" &&
    typeof record.message === "string" &&
    typeof record.is_read === "boolean" &&
    typeof record.created_at === "string"
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchNotifications(token);
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) return;

    const wsBase = toWebSocketBaseUrl(env.apiBaseUrl);
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByHook = false;

    const mergeNotification = (incoming: NotificationItem) => {
      let shouldIncrementUnread = false;

      setNotifications((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === incoming.id);
        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          shouldIncrementUnread = existing.is_read && !incoming.is_read;
          const next = [...prev];
          next[existingIndex] = incoming;
          return next;
        }

        shouldIncrementUnread = !incoming.is_read;
        return [incoming, ...prev];
      });

      if (shouldIncrementUnread) {
        setUnreadCount((count) => count + 1);
      }
    };

    const subscribeToUserNotifications = (userId: string) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      const channel = `user:${userId}:notifications`;
      socket.send(JSON.stringify({ action: "subscribe", channel }));
    };

    const connect = () => {
      socket = new WebSocket(`${wsBase}/ws?token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        const userId = getStoredSession()?.user?.id;
        if (userId) {
          subscribeToUserNotifications(userId);
        }
      };

      socket.onmessage = (event) => {
        let message: RealtimeEnvelope;
        try {
          message = JSON.parse(String(event.data)) as RealtimeEnvelope;
        } catch {
          return;
        }

        if (message.type === "ready" && typeof message.user_id === "string") {
          subscribeToUserNotifications(message.user_id);
          return;
        }

        if (message.type === "notification_created" && isNotificationItem(message.payload)) {
          mergeNotification(message.payload);
        }
      };

      socket.onclose = () => {
        if (closedByHook) return;
        reconnectTimer = setTimeout(connect, 2500);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      closedByHook = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    const token = getAccessTokenFromStorage();
    if (!token) return;
    try {
      await markNotificationRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  return { notifications, unreadCount, loading, reload: load, markRead, markAllRead };
}
