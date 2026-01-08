import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";

import { ENV_VARIABLES } from "./config/env-variables.config";
import { logger } from "./utils/logger.util";
import {
  prometheusMiddleware,
  prometheusRegister,
} from "./middlewares/prometheus.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import router from "./routes";

const app = express();

// Security & parsing
app.use(helmet());
app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Logging
app.use(
  pinoHttp({
    logger,
    genReqId: () => crypto.randomUUID(),
  })
);

// Proxy awareness (Cloudflare / Nginx)
app.set("trust proxy", 1);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Metrics
app.use(prometheusMiddleware);

// Routes
app.get("/", (_, res) => {
  res.send("Hello, World!");
});

app.use("/api", router);

if (ENV_VARIABLES.METRICS_ENABLED) {
  app.get("/metrics", async (_, res) => {
    res.set("Content-Type", prometheusRegister.contentType);
    res.end(await prometheusRegister.metrics());
  });
}

// Error handler
app.use(errorMiddleware);

export default app;
