import { Router } from "express";
import { sendMessage, getMessages } from "../controllers/chat.controller";

const chatRouter = Router();

chatRouter.post("/:conversationId", sendMessage);
chatRouter.get("/:conversationId", getMessages);

export default chatRouter;
