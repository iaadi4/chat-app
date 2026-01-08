import "dotenv/config";

export const ENV_VARIABLES = {
  PORT: process.env.PORT || 3000,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:5173",
  ],
  METRICS_ENABLED: process.env.METRICS_ENABLED === "true",

  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",

  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@chat-app.com",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:3000/api/auth/google/callback",

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  SERVER_URL: process.env.SERVER_URL || "http://localhost:3000",
};
