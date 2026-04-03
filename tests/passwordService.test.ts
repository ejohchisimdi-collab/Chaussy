import { DeepMockProxy, mockDeep } from "vitest-mock-extended";
import { prisma } from "../src/prisma/client";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "../src/middleware/sendgrid";
import { generateAlphaNumCode } from "../src/user/userService";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { confirmPasswordReset, generatePassWordReset } from "../src/passwords/passwordService";
import { ConflictException, NotFoundException } from "../src/middleware/exceptions";
import { ConfirmPasswordResetSchema } from "../src/passwords/schema";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../src/prisma/client.ts", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock("../src/middleware/sendgrid.ts", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("../src/user/userService.ts", () => ({
  generateAlphaNumCode: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("Generate Password Reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  let req: Partial<Request> = {
    query: { email: "ejohC" },
  };
  let res: Partial<Response> = {
    json: vi.fn(),
  };

  it("should generate code and send email", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isEmailConfirmed: true });
    (generateAlphaNumCode as ReturnType<typeof vi.fn>).mockResolvedValue("bsc");
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue("abc");
    (prismaMock.passwordReset.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await generatePassWordReset(req as Request, res as Response);

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(generateAlphaNumCode).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(prisma.passwordReset.create).toHaveBeenCalled();
  });

  it("should throw conflict exception for unverified email", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isEmailConfirmed: false });
    (generateAlphaNumCode as ReturnType<typeof vi.fn>).mockResolvedValue("bsc");
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue("abc");
    (prismaMock.passwordReset.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(generatePassWordReset(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });

  it("should throw Not found exception for user not found", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (generateAlphaNumCode as ReturnType<typeof vi.fn>).mockResolvedValue("bsc");
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue("abc");
    (prismaMock.passwordReset.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(generatePassWordReset(req as Request, res as Response)).rejects.toThrow(NotFoundException);
  });
});

describe("Confirm password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  let req: Partial<Request<{}, {}, ConfirmPasswordResetSchema>> = {
    body: {
      email: "ejohc",
      code: "abc",
      newPassword: "123",
    },
  };
  let res: Partial<Response> = {
    json: vi.fn(),
  };

  it("Should change password", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (prismaMock.passwordReset.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ expiresAt: new Date(Date.now() + 10000) });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (prismaMock.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prismaMock.passwordReset.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await confirmPasswordReset(req as Request, res as Response);

    expect(prisma.passwordReset.findFirst).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.passwordReset.update).toHaveBeenCalled();
  });

  it("Should throw conflict exception at wrong code", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (prismaMock.passwordReset.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ expiresAt: new Date(Date.now() + 10000) });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (prismaMock.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prismaMock.passwordReset.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(confirmPasswordReset(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });

  it("Should throw conflict exception at expired code", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (prismaMock.passwordReset.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ expiresAt: new Date(Date.now() - 10000) });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (prismaMock.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prismaMock.passwordReset.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(confirmPasswordReset(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });

  it("Should throw conflict exception when no code exists", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (prismaMock.passwordReset.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (prismaMock.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prismaMock.passwordReset.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(confirmPasswordReset(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });
});