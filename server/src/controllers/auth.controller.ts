import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import statusCode from "../utils/status-code.utils";
import Send from "../utils/response.util";
import { registerSchema, loginSchema } from "../schema/auth.schema";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/email.service";
import { ENV_VARIABLES } from "../config/env-variables.config";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(
  ENV_VARIABLES.GOOGLE_CLIENT_ID,
  ENV_VARIABLES.GOOGLE_CLIENT_SECRET,
  ENV_VARIABLES.CALLBACK_URL
);

function setAuthCookie(res: Response, user: { id: string; email: string }) {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    ENV_VARIABLES.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
}

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email },
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
      isVerified: false,
      provider: "local",
    },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      token,
      email,
      expiresAt,
    },
  });

  await sendVerificationEmail(email, token);

  return Send.created(
    res,
    { id: user.id, email: user.email, name: user.name },
    "Registration successful! Please check your email to verify your account."
  );
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return Send.error(
      res,
      null,
      "Invalid verification token",
      statusCode.BAD_REQUEST
    );
  }

  if (verificationToken.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return Send.error(
      res,
      null,
      "Verification token has expired",
      statusCode.BAD_REQUEST
    );
  }

  await prisma.user.update({
    where: { email: verificationToken.email },
    data: { isVerified: true },
  });

  await prisma.verificationToken.deleteMany({ where: { token } });

  return Send.success(res, null, "Email verified successfully!");
};

export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return Send.error(res, null, "Email is required", statusCode.BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return Send.error(res, null, "User not found", statusCode.NOT_FOUND);
  }

  if (user.isVerified) {
    return Send.error(
      res,
      null,
      "Email is already verified",
      statusCode.BAD_REQUEST
    );
  }

  await prisma.verificationToken.deleteMany({
    where: { email },
  });
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      token,
      email,
      expiresAt,
    },
  });

  await sendVerificationEmail(email, token);

  return Send.success(res, null, "Verification email sent!");
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return Send.error(res, null, "Invalid credentials", statusCode.BAD_REQUEST);
  }

  const isPasswordValid = await argon2.verify(user.password, password);
  if (!isPasswordValid) {
    return Send.error(res, null, "Invalid credentials", statusCode.BAD_REQUEST);
  }

  if (!user.isVerified) {
    return Send.error(
      res,
      null,
      "Please verify your email before logging in",
      statusCode.UNAUTHORIZED
    );
  }

  setAuthCookie(res, user);

  return Send.success(
    res,
    { id: user.id, email: user.email, name: user.name },
    "Logged in successfully"
  );
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("token");
  return Send.success(res, null, "Logged out successfully");
};
export const googleAuth = async (_req: Request, res: Response) => {
  const authUrl = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
    prompt: "consent",
  });

  res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return res.redirect(
      `${ENV_VARIABLES.FRONTEND_URL}/login?error=invalid_code`
    );
  }

  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: ENV_VARIABLES.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.redirect(`${ENV_VARIABLES.FRONTEND_URL}/login?error=no_email`);
    }

    const { email, name, sub: googleId } = payload;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { googleId }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          googleId,
          provider: "google",
          isVerified: true,
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          isVerified: true,
        },
      });
    }

    setAuthCookie(res, user);

    res.redirect(`${ENV_VARIABLES.FRONTEND_URL}/`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect(`${ENV_VARIABLES.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

export const me = async (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    return Send.error(res, null, "Not authenticated", statusCode.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, ENV_VARIABLES.JWT_SECRET) as {
      id: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        createdAt: true,
      },
    });

    if (!user) {
      return Send.error(res, null, "User not found", statusCode.NOT_FOUND);
    }

    return Send.success(res, user, "User retrieved successfully");
  } catch {
    return Send.error(res, null, "Invalid token", statusCode.UNAUTHORIZED);
  }
};
