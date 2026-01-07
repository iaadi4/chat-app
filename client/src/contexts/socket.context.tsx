import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuth } from "./auth.context";
import { toast } from "sonner";

interface Message {
  id: string;
  message: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, message: string) => void;
  onNewMessage: (callback: (message: Message) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messageListenersRef = useRef<Set<(message: Message) => void>>(
    new Set()
  );

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const newSocket = connectSocket();
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
      newSocket.emit("get_online_users");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      toast.error(`Socket error: ${error.message}`);
      setIsConnected(false);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on("user_online", (userId: string) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    newSocket.on("user_offline", (userId: string) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    newSocket.on("receive_message", (message: Message) => {
      messageListenersRef.current.forEach((callback) => callback(message));
    });

    return () => {
      newSocket.off("receive_message");
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  const joinConversation = useCallback((conversationId: string) => {
    const s = getSocket();
    if (s) {
      s.emit("join_conversation", conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    const s = getSocket();
    if (s) {
      s.emit("leave_conversation", conversationId);
    }
  }, []);

  const sendMessage = useCallback((conversationId: string, message: string) => {
    const s = getSocket();
    console.log("Sending message:", {
      conversationId,
      message,
      connected: s?.connected,
    });
    if (s) {
      s.emit("send_message", { conversationId, message });
    }
  }, []);

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    messageListenersRef.current.add(callback);
    return () => {
      messageListenersRef.current.delete(callback);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        joinConversation,
        leaveConversation,
        sendMessage,
        onNewMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
