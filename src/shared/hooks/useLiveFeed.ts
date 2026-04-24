"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import { apiRequest } from "@/shared/api/http";

export type LiveFeedEntry = {
  user_id: string;
  username: string;
  game: string;
  bet: string;
  payout: string;
  multiplier: string;
  event_type: "bet_created" | "bet_won";
  timestamp: string;
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

export function useLiveFeed(limit = 20) {
  const [entries, setEntries] = useState<LiveFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef<LiveFeedEntry[]>([]);

  const fetchInitial = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    if (!token) return;

    try {
      const res = await apiRequest<{ success: boolean; data: { entries: LiveFeedEntry[] } }>(
        env.apiBaseUrl,
        "/api/v1/live-feed",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.success) {
        const data = res.data.entries.slice(0, limit);
        setEntries(data);
        entriesRef.current = data;
      }
    } catch (err) {
      console.error("Failed to fetch initial live feed:", err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) return;

    const wsBase = toWebSocketBaseUrl(env.apiBaseUrl);
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByHook = false;

    const connect = () => {
      socket = new WebSocket(`${wsBase}/ws?token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        if (closedByHook) {
          socket?.close();
          return;
        }
        console.log("[useLiveFeed] Socket connected, subscribing to engagement:live-feed");
        socket?.send(JSON.stringify({ action: "subscribe", channel: "engagement:live-feed" }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data));
          if (message.type === "livefeed_updated" && message.payload?.entry) {
            console.log("[useLiveFeed] Received live update:", message.payload.entry);
            const entry = message.payload.entry as LiveFeedEntry;
            
            setEntries((prev) => {
              const next = [entry, ...prev].slice(0, limit);
              entriesRef.current = next;
              return next;
            });
          }
        } catch (err) {
          console.error("[useLiveFeed] Failed to parse message:", err);
        }
      };

      socket.onclose = () => {
        if (closedByHook) return;
        reconnectTimer = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      closedByHook = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [limit]);

  return { entries, loading, reload: fetchInitial };
}
