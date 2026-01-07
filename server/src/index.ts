import { createServer } from "http";
import app from "./app";
import { ENV_VARIABLES } from "./config/env-variables.config";
import { logger } from "./utils/logger.util";
import { connectDB } from "./config/db.config";
import { initializeSocket, getIO } from "./config/socket.config";

connectDB();

const httpServer = createServer(app);
initializeSocket(httpServer);

const server = httpServer.listen(ENV_VARIABLES.PORT, () => {
  logger.info(`Server running on port ${ENV_VARIABLES.PORT}`);
});

let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown...`);

  const forceExitTimeout = setTimeout(() => {
    logger.error("Forced shutdown due to timeout");
    process.exit(1);
  }, 5000);

  const io = getIO();
  if (io) {
    io.close(() => {
      logger.info("Socket.io connections closed");
    });
  }

  server.close((err) => {
    clearTimeout(forceExitTimeout);
    if (err) {
      logger.error("Error during shutdown");
      process.exit(1);
    }
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
