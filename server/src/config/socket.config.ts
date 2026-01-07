import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { ENV_VARIABLES } from "./env-variables.config";
import { logger } from "../utils/logger.util";

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: ENV_VARIABLES.ALLOWED_ORIGINS,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("disconnect", (reason) => {
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
