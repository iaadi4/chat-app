import { Router } from "express";
import {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
} from "../controllers/conversation.controller";

const conversationRouter = Router();

conversationRouter.post("/", createConversation);
conversationRouter.get("/", getConversations);
conversationRouter.get("/:id", getConversationById);
conversationRouter.delete("/:id", deleteConversation);

export default conversationRouter;
