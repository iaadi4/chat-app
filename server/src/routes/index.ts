import { Router } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import conversationRouter from "./conversation.routes";
import chatRouter from "./chat.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/conversation", conversationRouter);
router.use("/chat", chatRouter);

export default router;
