import { createServer } from "http";
import app from "./app";
import { ENV_VARIABLES } from "./config/env-variables.config";
import { logger } from "./utils/logger.util";
import { connectDB } from "./config/db.config";
import { initializeSocket } from "./config/socket.config";

connectDB();

const httpServer = createServer(app);
initializeSocket(httpServer);

const server = httpServer.listen(ENV_VARIABLES.PORT, () => {
  logger.info(`Server running on port ${ENV_VARIABLES.PORT}`);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down");
  server.close(() => process.exit(0));
});
