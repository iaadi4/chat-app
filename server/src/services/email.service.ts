import nodemailer from "nodemailer";
import { ENV_VARIABLES } from "../config/env-variables.config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  pool: true,
  maxConnections: 1,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${ENV_VARIABLES.FRONTEND_URL}/verify-email/${token}`;

  await transporter.sendMail({
    from: ENV_VARIABLES.EMAIL_FROM,
    to: email,
    subject: "Verify your email - Chat App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
        <p style="color: #666; font-size: 16px; text-align: center;">
          Thanks for signing up! Please verify your email address by clicking the button below.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4F46E5; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold; 
                    display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #999; font-size: 12px; text-align: center;">
          This link expires in 24 hours.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${ENV_VARIABLES.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: ENV_VARIABLES.EMAIL_FROM,
    to: email,
    subject: "Reset your password - Chat App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
        <p style="color: #666; font-size: 16px; text-align: center;">
          You requested a password reset. Click the button below to set a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold; 
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color: #999; font-size: 12px; text-align: center;">
          This link expires in 1 hour.
        </p>
      </div>
    `,
  });
}
