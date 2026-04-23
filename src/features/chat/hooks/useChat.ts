"use client";

import { useState, useEffect, useCallback } from "react";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import { fetchChatHistory, sendChatMessage } from "../api/chat.api";

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

export function useChat(roomCode: string = "global") {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchChatHistory(token, roomCode, 50);
      if (res.success && res.data.messages) {
        // Reverse history to show oldest to newest at the bottom
        setMessages(res.data.messages.reverse());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
        // Subscribe to the chat room
        socket?.send(JSON.stringify({ action: "subscribe", channel: `chat:${roomCode}` }));
      };

      socket.onmessage = (event) => {
        let message: any;
        try {
          message = JSON.parse(String(event.data));
        } catch {
          return;
        }

        if (message.type === "chat_message" && message.payload) {
          const incoming = message.payload;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.message_id)) return prev;
            return [...prev, {
              id: incoming.message_id,
              room_id: incoming.room_id,
              room_code: incoming.room_code,
              type: incoming.message_type,
              message: incoming.message,
              metadata: incoming.metadata,
              created_at: incoming.timestamp,
              user: incoming.user,
            }];
          });
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
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [roomCode]);

  const sendMessage = useCallback(async (message: string, stickerUrl?: string) => {
    const token = getAccessTokenFromStorage();
    if (!token) return;
    try {
      await sendChatMessage(token, roomCode, message, stickerUrl);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }, [roomCode]);

  return { messages, loading, sendMessage };
}
