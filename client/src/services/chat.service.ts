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

  async uploadFile(file: File): Promise<
    ApiResponse<{
      url: string;
      fileName: string;
      fileType: string;
    }>
  > {
    const formData = new FormData();
    formData.append("image", file); // Multer expects 'image' field name based on route config
    const response = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async uploadImage(file: File) {
    return this.uploadFile(file);
  },

  async sendMessage(
    conversationId: string,
    message: string,
    image?: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ): Promise<ApiResponse<Message>> {
    const response = await api.post(`/chat/${conversationId}`, {
      message,
      image,
      fileUrl,
      fileName,
      fileType,
    });
    return response.data;
  },
};
