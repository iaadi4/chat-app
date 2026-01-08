import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { ENV_VARIABLES } from "./env-variables.config";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: ENV_VARIABLES.CLOUDINARY_CLOUD_NAME,
  api_key: ENV_VARIABLES.CLOUDINARY_API_KEY,
  api_secret: ENV_VARIABLES.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chat-app-uploads",
    resource_type: "auto",
    allowed_formats: [
      "jpg",
      "png",
      "jpeg",
      "gif",
      "mp4",
      "webm",
      "pdf",
      "doc",
      "docx",
      "txt",
    ],
  } as any,
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});
