import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import { ENV_VARIABLES } from "./configs/env-variables.config";
import { logger } from "./utils/logger.util";
import {
  prometheusMiddleware,
  prometheusRegister
} from "./middlewares/prometheus.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

// Security & parsing
app.use(helmet());
app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: ENV_VARIABLES.ALLOWED_ORIGINS,
    credentials: true
  })
);

// Logging
app.use(
  pinoHttp({
    logger,
    genReqId: () => crypto.randomUUID()
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
    legacyHeaders: false
  })
);

// Metrics
app.use(prometheusMiddleware);

// Routes
app.get("/", (_, res) => {
  res.send("Hello, World!");
});

if (ENV_VARIABLES.METRICS_ENABLED) {
  app.get("/metrics", async (_, res) => {
    res.set("Content-Type", prometheusRegister.contentType);
    res.end(await prometheusRegister.metrics());
  });
}

// Error handler
app.use(errorMiddleware);

export default app;
