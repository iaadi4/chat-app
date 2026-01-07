import { io, Socket } from "socket.io-client";

const getBackendUrl = () => {
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  try {
    return new URL(url).origin;
  } catch {
    return "http://localhost:3000";
  }
};

const BACKEND_URL = getBackendUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (): Socket => {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  socket.on("message_error", (error) => {
    console.error("Message error from server:", error);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
