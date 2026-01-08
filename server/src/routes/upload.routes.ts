import { Router } from "express";
import { upload } from "../config/upload.config";
import Send from "../utils/response.util";
import statusCode from "../utils/status-code.utils";
import { ENV_VARIABLES } from "../config/env-variables.config";

const uploadRouter = Router();

uploadRouter.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return Send.error(res, null, "No file uploaded", statusCode.BAD_REQUEST);
  }

  const fileUrl = req.file.path;

  return Send.success(
    res,
    {
      url: fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    },
    "File uploaded successfully"
  );
});

export default uploadRouter;
