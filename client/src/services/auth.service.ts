import api from "@/lib/api";
import type { LoginFormData, RegisterFormData } from "@/schemas/auth.schema";

export interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const authService = {
  async register(data: RegisterFormData): Promise<ApiResponse<User>> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async login(data: LoginFormData): Promise<ApiResponse<User>> {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  async verifyEmail(token: string): Promise<ApiResponse<null>> {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  async resendVerification(email: string): Promise<ApiResponse<null>> {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  getGoogleAuthUrl(): string {
    return `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
  },
};
