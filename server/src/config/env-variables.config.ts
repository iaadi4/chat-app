import "dotenv/config";

export const ENV_VARIABLES = {
  PORT: process.env.PORT || 3000,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ],
  METRICS_ENABLED: process.env.METRICS_ENABLED === "true",
};
