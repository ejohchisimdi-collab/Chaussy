import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../prisma/client.js";
import { generateToken } from "../middleware/authMiddleware.js";
import { generateRefreshToken, setRefreshCookie } from "../refresh/refreshService.js";
import { ConflictException } from "../middleware/exceptions.js";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!   
);

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
];

export const googleRedirect = async (_req: Request, res: Response) => {
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  return res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    throw new ConflictException("Authorization code missing");
  }

  // Exchange code for tokens
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Get user info from Google
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID!,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new ConflictException("Failed to retrieve Google account info");
  }

  const { email, name, sub: googleId } = payload;

  // Upsert user — create if new, find if existing
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.info(`Registering new OAuth user with email ${email}`);
    user = await prisma.user.create({
      data: {
        email,
        name: name ?? email,
        password: googleId,          // unusable password — OAuth users can't log in with password
        isEmailConfirmed: true,      // Google email is already verified
        userSetting: {
          create: { enableEmailNotifications: true },
        },
      },
    });
  }

  console.info(`OAuth login successful for user with id ${user.id}`);

  const accessToken = generateToken({ userId: user.id, email: user.email });
  const refreshToken = await generateRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);

  return res.json({ accessToken });
};
