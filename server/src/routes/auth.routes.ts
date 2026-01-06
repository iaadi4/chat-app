import { Router } from "express";
import {
  register,
  login,
  logout,
  verifyEmail,
  resendVerification,
  googleAuth,
  googleCallback,
  me,
} from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

authRouter.get("/verify-email/:token", verifyEmail);
authRouter.post("/resend-verification", resendVerification);

authRouter.get("/google", googleAuth);
authRouter.get("/google/callback", googleCallback);

authRouter.get("/me", me);

export default authRouter;
