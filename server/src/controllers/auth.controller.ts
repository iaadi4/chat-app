import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import statusCode from "../utils/status-code.utils";
import Send from "../utils/response.util";
import { registerSchema, loginSchema } from "../schema/auth.schema";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return Send.error(res, null, "User already exists", statusCode.BAD_REQUEST);
  }

  const hashedPassword = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return Send.success(res, user, "User created successfully");
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const hashedPassword = await argon2.hash(password);

  const user = await prisma.user.findUnique({
    where: {
      email,
      password: hashedPassword,
    },
  });

  if (!user) {
    return Send.error(res, null, "Invalid credentials", statusCode.BAD_REQUEST);
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return Send.success(res, user, "User logged in successfully");
};
