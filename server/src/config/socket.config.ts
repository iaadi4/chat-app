import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV_VARIABLES } from "./env-variables.config";
import { logger } from "../utils/logger.util";
import { prisma } from "../lib/prisma";

let io: Server;

const onlineUsers = new Map<string, Set<string>>();

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

const authenticateSocket = (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers.cookie?.split("token=")[1]?.split(";")[0];

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, ENV_VARIABLES.JWT_SECRET) as {
      id: string;
    };
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
};

const addOnlineUser = (userId: string, socketId: string) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);
};

const removeOnlineUser = (userId: string, socketId: string) => {
  const userSockets = onlineUsers.get(userId);
  if (userSockets) {
    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }
};

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys());
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: ENV_VARIABLES.ALLOWED_ORIGINS,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(authenticateSocket);

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

    addOnlineUser(userId, socket.id);

    socket.broadcast.emit("user_online", userId);

    socket.join(`user:${userId}`);

    socket.on("join_conversations", async (conversationIds: string[]) => {
      conversationIds.forEach((id) => {
        socket.join(`conversation:${id}`);
      });
      logger.info(
        `User ${userId} joined conversations: ${conversationIds.join(", ")}`
      );
    });

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      logger.info(`User ${userId} joined conversation: ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${userId} left conversation: ${conversationId}`);
    });

    socket.on(
      "send_message",
      async (data: { conversationId: string; message: string }) => {
        try {
          const chat = await prisma.chat.create({
            data: {
              message: data.message,
              conversationId: data.conversationId,
              senderId: userId,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: { updatedAt: new Date() },
          });

          io.to(`conversation:${data.conversationId}`).emit(
            "receive_message",
            chat
          );

          const conversation = await prisma.conversation.findUnique({
            where: { id: data.conversationId },
            select: { participantIds: true },
          });

          conversation?.participantIds.forEach((participantId: string) => {
            if (participantId !== userId) {
              io.to(`user:${participantId}`).emit("new_message_notification", {
                conversationId: data.conversationId,
                message: chat,
              });
            }
          });

          logger.info(
            `Message sent in conversation ${data.conversationId} by user ${userId}`
          );
        } catch (error) {
          logger.error(error, "Error sending message");
          socket.emit("message_error", { error: "Failed to send message" });
        }
      }
    );

    socket.on("get_online_users", () => {
      socket.emit("online_users", getOnlineUserIds());
    });

    socket.on("disconnect", (reason) => {
      removeOnlineUser(userId, socket.id);

      if (!isUserOnline(userId)) {
        socket.broadcast.emit("user_offline", userId);
      }

      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on("error", (error) => {
      logger.error(error, `Socket error: ${socket.id}`);
    });
  });

  logger.info("Socket.io initialized");
  return io;
};

export const getIO = (): Server | null => {
  return io || null;
};
