import "dotenv/config";

export const ENV_VARIABLES = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:5173",
  ],
  METRICS_ENABLED: process.env.METRICS_ENABLED === "true",

  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",

  MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@chat-app.com",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  CALLBACK_URL:
    process.env.CALLBACK_URL ||
    "http://localhost:3000/api/auth/google/callback",

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  SERVER_URL: process.env.SERVER_URL || "http://localhost:3000",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
};
