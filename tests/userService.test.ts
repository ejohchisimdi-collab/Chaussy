import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma/client";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { LoginSchema, RegisterUserSchema } from "../src/user/schema";
import { generateAlphaNumCode, generateEmailConfirmationCode, logIn, registerUser, uploadProfilePicture, verifyEmail } from "../src/user/userService";
import { ConflictException, InvalidCredentialsException, NotFoundException } from "../src/middleware/exceptions";
import { generateToken } from "../src/middleware/authMiddleware";
import { generateRefreshToken, setRefreshCookie } from "../src/refresh/refreshService";
import { deleteFromS3, uploadToS3 } from "../src/middleware/s3Service";
import { sendEmail } from "../src/middleware/sendgrid";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../src/prisma/client.js", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("../src/middleware/authMiddleware.ts", () => ({
  generateToken: vi.fn(),
}));

vi.mock("../src/refresh/refreshService.ts", () => ({
  generateRefreshToken: vi.fn(),
  setRefreshCookie: vi.fn(),
}));

vi.mock("../src/middleware/s3Service.ts", () => ({
  uploadToS3: vi.fn(),
  deleteFromS3: vi.fn(),
}));

vi.mock("../src/middleware/sendgrid.ts", () => ({
  sendEmail: vi.fn(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("Register user", () => {
  let req: Partial<Request<{}, {}, RegisterUserSchema>>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      json: vi.fn(),
    };
  });

  it("should register a user successfully and create user setting", async () => {
    req = {
      body: {
        name: "chisimdi",
        email: "ejohc@gmail.com",
        password: "forever20",
        acceptedPrivacyPolicy: true,
      },
    };

    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue("hashed-password");

    prismaMock.user.create.mockResolvedValue({
      id: "1",
      name: "chisimdi",
      email: "ejohc@gmail.com",
      password: "hashed-password",
    } as any);

    prismaMock.userSetting.create.mockResolvedValue({} as any);

    await registerUser(req as Request, res as Response);

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith("forever20", expect.any(Number));
    expect(prismaMock.userSetting.create).toHaveBeenCalled();
  });

  it("Should throw a conflict exception from privacy policy not accepted", async () => {
    req = {
      body: {
        name: "chisimdi",
        email: "ejohc@gmail.com",
        password: "forever20",
        acceptedPrivacyPolicy: false,
      },
    };
    await expect(registerUser(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });
});

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  let req: Partial<Request<{}, {}, LoginSchema>> = {
    body: {
      email: "chi",
      password: "1877",
    },
  };
  let res: Partial<Response> = {
    json: vi.fn(),
  };

  it("Should return an access token and generate a refresh token", async () => {
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Chisimdi", email: "chisimdi", password: "chismdi", acceptedV1PrivacyPolicy: true });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (prismaMock.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Chisimdi", email: "chisimdi", password: "chismdi", acceptedV1PrivacyPolicy: true });
    (generateToken as ReturnType<typeof vi.fn>).mockReturnValue("abcd");
    (generateRefreshToken as ReturnType<typeof vi.fn>).mockResolvedValue("cde");

    await logIn(req as Request, res as Response);

    expect(res.json).toHaveBeenNthCalledWith(1, { accessToken: "abcd" });
    expect(generateRefreshToken).toHaveBeenCalled();
  });

  it("should throw privacy policy exception", async () => {
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Chisimdi", email: "chisimdi", password: "chismdi", acceptedV1PrivacyPolicy: false });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (generateToken as ReturnType<typeof vi.fn>).mockReturnValue("abcd");
    (generateRefreshToken as ReturnType<typeof vi.fn>).mockResolvedValue("cde");

    await expect(logIn(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });

  it("should throw Invalid credentials Exception", async () => {
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Chisimdi", email: "chisimdi", password: "chismdi", acceptedV1PrivacyPolicy: true });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (generateToken as ReturnType<typeof vi.fn>).mockReturnValue("abcd");
    (generateRefreshToken as ReturnType<typeof vi.fn>).mockResolvedValue("cde");

    await expect(logIn(req as Request, res as Response)).rejects.toThrow(InvalidCredentialsException);
  });

  it("should throw not found Exception", async () => {
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (generateToken as ReturnType<typeof vi.fn>).mockReturnValue("abcd");
    (generateRefreshToken as ReturnType<typeof vi.fn>).mockResolvedValue("cde");

    await expect(logIn(req as Request, res as Response)).rejects.toThrow(NotFoundException);
  });
});

describe("Upload profile picture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  let req: Partial<Request> & { file?: Express.Multer.File } = {
    user: { userId: 1, email: "ejohc" },
  };
  let res: Partial<Response> = {
    json: vi.fn(),
  };

  it("Should return a file key and upload to s3", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    req.file = {
      fieldname: "file",
      originalname: "profile.png",
      encoding: "7bit",
      mimetype: "image/png",
      buffer: Buffer.from("test"),
      size: 12345,
    } as Express.Multer.File;

    (uploadToS3 as ReturnType<typeof vi.fn>).mockResolvedValue("abc");
    (prismaMock.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({ email: "ejohc", profileKey: "abc" });

    await uploadProfilePicture(req as Request, res as Response);

    expect(uploadToS3).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it("should throw a conflict exception", async () => {
    req.file = undefined;

    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

    (uploadToS3 as ReturnType<typeof vi.fn>).mockResolvedValue("abc");
    (prismaMock.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({ email: "ejohc", profileKey: "abc" });

    await expect(uploadProfilePicture(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });
});

describe("Generate Email confirmation Code", () => {
  beforeEach(() => vi.clearAllMocks());

  let req: Partial<Request> = {
    user: { userId: 1, email: "ejohc" },
  };
  let res: Partial<Response> = {
    json: vi.fn(),
  };

  it("Should send an email", async () => {
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ email: "ejohc" });
    (prismaMock.confirmEmail.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await generateEmailConfirmationCode(req as Request, res as Response);

    expect(sendEmail).toHaveBeenCalled();
    expect(prismaMock.confirmEmail.create).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });
});

describe("Verify email", () => {
  beforeEach(() => vi.clearAllMocks());

  let req: Partial<Request> = {
    user: { userId: 1, email: "ejohc" },
    query: { code: "abc" },
  };
  let res: Partial<Response> = {
    json: vi.fn(),
  };

  it("Should verify email successfully", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
    (prismaMock.confirmEmail.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ emailCode: "abc", expiresAt: new Date(Date.now() + 10000) });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (prismaMock.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({ isEmailConfirmed: true });
    (prismaMock.confirmEmail.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await verifyEmail(req as Request, res as Response);

    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.confirmEmail.update).toHaveBeenCalled();
  });

  it("Should throw for invalid code", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
    (prismaMock.confirmEmail.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ emailCode: "abc", expiresAt: new Date(Date.now() + 10000) });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    await expect(verifyEmail(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });

  it("Should throw for expired code", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
    (prismaMock.confirmEmail.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ emailCode: "abc", expiresAt: new Date(Date.now() - 10000) });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await expect(verifyEmail(req as Request, res as Response)).rejects.toThrow(ConflictException);
  });

  it("Should throw for no code found", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
    (prismaMock.confirmEmail.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await expect(verifyEmail(req as Request, res as Response)).rejects.toThrow(NotFoundException);
  });
});