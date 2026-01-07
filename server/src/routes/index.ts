import { Router } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import conversationRouter from "./conversation.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/conversation", conversationRouter);

export default router;
