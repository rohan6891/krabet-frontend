import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";

export async function fetchChatHistory(token: string, roomCode: string = "global", limit: number = 50) {
  return apiRequest<{ success: boolean; data: { messages: any[] } }>(
    env.apiBaseUrl,
    `/api/v1/chat/rooms/${roomCode}/messages?limit=${limit}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}

export async function sendChatMessage(token: string, roomCode: string = "global", message: string, stickerUrl?: string) {
  return apiRequest<{ success: boolean; data: { message: any } }>(
    env.apiBaseUrl,
    `/api/v1/chat/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: { roomCode, message, stickerUrl }
    }
  );
}
