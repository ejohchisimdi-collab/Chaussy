import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { generateToken } from "../middleware/authMiddleware.js";
import { UnauthorizedException } from "../middleware/exceptions.js";
import { randomUUID } from "crypto";

const COOKIE_NAME = "refreshToken";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const generateRefreshToken = async (userId: number): Promise<string> => {
  const token = randomUUID();
  await prisma.refreshToken.create({ data: { token, userId } });
  return token;
};

export const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
  });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// POST /api/v1/auth/refresh
export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies[COOKIE_NAME];

  if (!refreshToken) {
    throw new UnauthorizedException("Refresh token required");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (stored === null || stored.revoked) {
    clearRefreshCookie(res);
    throw new UnauthorizedException("Invalid refresh token");
  }

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({ where: { token: refreshToken }, data: { revoked: true } });
  });

  const newRefreshToken = await generateRefreshToken(stored.userId);
  setRefreshCookie(res, newRefreshToken);

  const accessToken = generateToken({ userId: stored.userId, email: stored.user.email });

  console.info(`Access token refreshed for user with id ${stored.userId}`);
  return res.json({ accessToken });
};

// POST /api/v1/auth/logout
export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies[COOKIE_NAME];

  if (!refreshToken) {
    throw new UnauthorizedException("Refresh token required");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (stored === null || stored.revoked) {
    clearRefreshCookie(res);
    throw new UnauthorizedException("Invalid refresh token");
  }

  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: { revoked: true },
  });

  clearRefreshCookie(res);
  console.info(`User with id ${stored.userId} logged out`);
  return res.json({ message: "Logged out successfully" });
};