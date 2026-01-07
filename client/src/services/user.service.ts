import api from "@/lib/api";

export interface SearchUser {
  id: string;
  name: string;
  email: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const userService = {
  async search(email: string): Promise<ApiResponse<SearchUser[]>> {
    const response = await api.get(
      `/user/search?email=${encodeURIComponent(email)}`
    );
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<SearchUser>> {
    const response = await api.get(`/user/${id}`);
    return response.data;
  },
};
