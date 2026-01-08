import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV_VARIABLES } from "../config/env-variables.config";
import { getIO } from "../config/socket.config";
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

const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const { conversationId } = req.params;
  const { message, image } = req.body;

  if ((!message || !message.trim()) && !image) {
    return Send.error(
      res,
      null,
      "Message or image is required",
      statusCode.BAD_REQUEST
    );
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
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

  const chat = await prisma.chat.create({
    data: {
      message: message?.trim() || "",
      image: image || null,
      conversationId,
      senderId: tokenUser.id,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  const io = getIO();
  if (io) {
    io.to(`conversation:${conversationId}`).emit("receive_message", chat);

    const conversationData = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantIds: true },
    });

    conversationData?.participantIds.forEach((participantId) => {
      if (participantId !== tokenUser.id) {
        io.to(`user:${participantId}`).emit("new_message_notification", {
          conversationId,
          message: chat,
        });
      }
    });
  }

  return Send.created(res, chat, "Message sent successfully");
};

const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const { conversationId } = req.params;
  const { cursor, limit = "50" } = req.query;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
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

  const messages = await prisma.chat.findMany({
    where: {
      conversationId,
      ...(cursor && {
        createdAt: {
          lt: new Date(cursor as string),
        },
      }),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: parseInt(limit as string),
  });

  const orderedMessages = messages.reverse();

  return Send.success(
    res,
    {
      messages: orderedMessages,
      nextCursor:
        messages.length === parseInt(limit as string)
          ? messages[messages.length - 1]?.createdAt?.toISOString()
          : null,
    },
    "Messages fetched successfully"
  );
};

export { sendMessage, getMessages };
