import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { ENV_VARIABLES } from "../config/env-variables.config";
import Send from "../utils/response.util";
import statusCode from "../utils/status-code.utils";
import { prisma } from "../lib/prisma";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const getUserFromToken = (
  req: Request
): { id: string; email: string } | null => {
  const token = req.cookies.token;
  if (!token) return null;

  try {
    return jwt.verify(token, ENV_VARIABLES.JWT_SECRET) as {
      id: string;
      email: string;
    };
  } catch {
    return null;
  }
};

const createConversation = async (req: AuthenticatedRequest, res: Response) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const { participantId } = req.body;

  const participantIdsSorted = [tokenUser.id, participantId].sort();

  const conversation = await prisma.conversation.findFirst({
    where: {
      participantIds: {
        equals: participantIdsSorted,
      },
    },
  });

  if (conversation) {
    return Send.error(res, null, "Conversation exist", statusCode.BAD_REQUEST);
  }

  const newConversation = await prisma.conversation.create({
    data: {
      participantIds: [tokenUser.id, participantId],
    },
  });

  return Send.created(
    res,
    newConversation,
    "Conversation created successfully"
  );
};

const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participantIds: {
        has: tokenUser.id,
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      chats: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return Send.success(res, conversations, "Conversations fetched successfully");
};

const getConversationById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const { id } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      participantIds: {
        has: tokenUser.id,
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      chats: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return Send.error(
      res,
      null,
      "Conversation not found",
      statusCode.NOT_FOUND
    );
  }

  return Send.success(res, conversation, "Conversation fetched successfully");
};

const deleteConversation = async (req: AuthenticatedRequest, res: Response) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const { id } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      participantIds: {
        has: tokenUser.id,
      },
    },
  });

  if (!conversation) {
    return Send.error(
      res,
      null,
      "Conversation not found",
      statusCode.NOT_FOUND
    );
  }

  await prisma.chat.deleteMany({
    where: {
      conversationId: id,
    },
  });

  await prisma.conversation.delete({
    where: {
      id,
    },
  });

  return Send.success(res, null, "Conversation deleted successfully");
};

export {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
};
