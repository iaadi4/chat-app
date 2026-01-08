import api from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Message {
  id: string;
  message: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  image?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  sender: User;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: User[];
  chats: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const conversationService = {
  async getAll(): Promise<ApiResponse<Conversation[]>> {
    const response = await api.get("/conversation");
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Conversation>> {
    const response = await api.get(`/conversation/${id}`);
    return response.data;
  },

  async create(participantId: string): Promise<ApiResponse<Conversation>> {
    const response = await api.post("/conversation", { participantId });
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/conversation/${id}`);
    return response.data;
  },
};
