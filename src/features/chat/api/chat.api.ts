import { http } from "@/shared/api/http";

export async function fetchChatHistory(token: string, roomCode: string = "global", limit: number = 50) {
  return http.get<{ success: boolean; data: { messages: any[] } }>(
    `/chat/rooms/${roomCode}/messages?limit=${limit}`,
    token
  );
}

export async function sendChatMessage(token: string, roomCode: string = "global", message: string, stickerUrl?: string) {
  return http.post<{ success: boolean; data: { message: any } }>(
    `/chat/messages`,
    { roomCode, message, stickerUrl },
    token
  );
}
