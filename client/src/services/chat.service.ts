import api from "@/lib/api";
import type { Message } from "./conversation.service";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface GetMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}

export const chatService = {
  async getMessages(
    conversationId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<ApiResponse<GetMessagesResponse>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await api.get(`/chat/${conversationId}?${params}`);
    return response.data;
  },

  async sendMessage(
    conversationId: string,
    message: string
  ): Promise<ApiResponse<Message>> {
    const response = await api.post(`/chat/${conversationId}`, { message });
    return response.data;
  },
};
