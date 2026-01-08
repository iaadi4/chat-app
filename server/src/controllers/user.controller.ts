import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import statusCode from "../utils/status-code.utils";
import Send from "../utils/response.util";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ENV_VARIABLES } from "../config/env-variables.config";

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

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const { name, password, currentPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
  });

  if (!user) {
    return Send.error(res, null, "User not found", statusCode.NOT_FOUND);
  }

  const updateData: { name?: string; password?: string } = {};

  if (name && typeof name === "string" && name.trim().length > 0) {
    updateData.name = name.trim();
  }

  if (password) {
    if (user.provider === "local" && user.password) {
      if (!currentPassword) {
        return Send.error(
          res,
          null,
          "Current password is required to update password",
          statusCode.BAD_REQUEST
        );
      }

      const isCurrentPasswordValid = await argon2.verify(
        user.password,
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        return Send.error(
          res,
          null,
          "Current password is incorrect",
          statusCode.BAD_REQUEST
        );
      }
    }

    if (password.length < 8) {
      return Send.error(
        res,
        null,
        "Password must be at least 8 characters long",
        statusCode.BAD_REQUEST
      );
    }

    updateData.password = await argon2.hash(password);
  }

  if (Object.keys(updateData).length === 0) {
    return Send.error(
      res,
      null,
      "No valid fields to update",
      statusCode.BAD_REQUEST
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: tokenUser.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      provider: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Send.success(res, updatedUser, "User updated successfully");
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const { password } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
  });

  if (!user) {
    return Send.error(res, null, "User not found", statusCode.NOT_FOUND);
  }

  if (user.provider === "local" && user.password) {
    if (!password) {
      return Send.error(
        res,
        null,
        "Password is required to delete account",
        statusCode.BAD_REQUEST
      );
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      return Send.error(
        res,
        null,
        "Password is incorrect",
        statusCode.BAD_REQUEST
      );
    }
  }

  await prisma.verificationToken.deleteMany({
    where: { email: user.email },
  });
  await prisma.chat.deleteMany({
    where: { senderId: user.id },
  });

  const userConversations = await prisma.conversation.findMany({
    where: { participantIds: { has: user.id } },
  });

  for (const conversation of userConversations) {
    const updatedParticipantIds = conversation.participantIds.filter(
      (id: string) => id !== user.id
    );

    if (updatedParticipantIds.length === 0) {
      await prisma.chat.deleteMany({
        where: { conversationId: conversation.id },
      });
      await prisma.conversation.delete({
        where: { id: conversation.id },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { participantIds: updatedParticipantIds },
      });
    }
  }

  await prisma.user.delete({
    where: { id: user.id },
  });
  res.clearCookie("token");

  return Send.success(res, null, "Account deleted successfully");
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    return Send.error(res, null, "User not found", statusCode.NOT_FOUND);
  }

  return Send.success(res, user, "User retrieved successfully");
};

export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  const tokenUser = getUserFromToken(req);

  if (!tokenUser) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  const { email } = req.query;

  if (!email || typeof email !== "string" || email.trim().length < 2) {
    return Send.error(
      res,
      null,
      "Email query must be at least 2 characters",
      statusCode.BAD_REQUEST
    );
  }

  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: email.trim(),
        mode: "insensitive",
      },
      id: {
        not: tokenUser.id,
      },
      isVerified: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 10,
  });

  return Send.success(res, users, "Users found");
};
