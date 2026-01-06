import "express-async-errors";
import app from "./app";
import { ENV_VARIABLES } from "./configs/env-variables.config";
import { logger } from "./utils/logger.util";
import { connectDB } from "./configs/db.config";

connectDB();

const server = app.listen(ENV_VARIABLES.PORT, () => {
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
