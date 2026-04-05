import { vi, describe, it, expect, beforeEach } from "vitest";
import { DeepMockProxy, mockDeep } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ConflictException, NotFoundException } from "../src/middleware/exceptions";
import { createHomeAsset, createRoomAsset } from "../src/assets/assetsService"
import { CreateHomeAssetSchema, CreateRoomAssetsSchema } from "../src/assets/schema";


vi.mock("../src/prisma/client.ts", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from "../src/prisma/client";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// ─── createHomeAsset ───────────────────────────────────────────────────────────

describe("createHomeAsset", () => {
  let req: Partial<Request<{}, {}, CreateHomeAssetSchema>>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    res = { json: vi.fn() };
    req = {
      user: { userId: 1, email: "ejohc" },
      body: {
        homeId: 1,
        name: "Boiler",
        brandName: "Vaillant",
        modelName: "ecoTEC",
        purchaseDate: new Date("2023-01-01"),
        notes: "Main boiler",
      },
    };
  });

  it("should create a home asset successfully", async () => {
    (prismaMock.assets.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isPremium: false });
    (prismaMock.home.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "home-1" });
    (prismaMock.assets.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "asset-1", name: "Boiler" });

    await createHomeAsset(req as Request<{}, {}, CreateHomeAssetSchema>, res as Response);

    expect(prismaMock.assets.count).toHaveBeenCalled();
    expect(prismaMock.home.findUnique).toHaveBeenCalled();
    expect(prismaMock.assets.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: "asset-1", name: "Boiler" });
  });

  it("should throw ConflictException when non-premium user exceeds 20 assets", async () => {
    (prismaMock.assets.count as ReturnType<typeof vi.fn>).mockResolvedValue(21);
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isPremium: false });

    await expect(
      createHomeAsset(req as Request<{}, {}, CreateHomeAssetSchema>, res as Response)
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.assets.create).not.toHaveBeenCalled();
  });

  it("should allow premium user to exceed 20 assets", async () => {
    (prismaMock.assets.count as ReturnType<typeof vi.fn>).mockResolvedValue(21);
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isPremium: true });
    (prismaMock.home.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "home-1" });
    (prismaMock.assets.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "asset-2", name: "Boiler" });

    await createHomeAsset(req as Request<{}, {}, CreateHomeAssetSchema>, res as Response);

    expect(prismaMock.assets.create).toHaveBeenCalled();
  });

  it("should throw NotFoundException when home is not found", async () => {
    (prismaMock.assets.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isPremium: false });
    (prismaMock.home.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      createHomeAsset(req as Request<{}, {}, CreateHomeAssetSchema>, res as Response)
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.assets.create).not.toHaveBeenCalled();
  });
});

// ─── createRoomAsset ───────────────────────────────────────────────────────────

describe("createRoomAsset", () => {
  let req: Partial<Request<{}, {}, CreateRoomAssetsSchema>>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    res = { json: vi.fn() };
    req = {
      user: { userId: 1, email: "ejohc" },
      body: {
        roomId: 1,
        name: "TV",
        brandName: "Samsung",
        modelName: "QLED",
        purchaseDate: new Date("2023-06-01"),
        notes: "Living room TV",
      },
    };
  });

  it("should create a room asset successfully", async () => {
    (prismaMock.assets.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isPremium: false });
    (prismaMock.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "room-1" });
    (prismaMock.assets.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "asset-3", name: "TV" });

    await createRoomAsset(req as Request<{}, {}, CreateRoomAssetsSchema>, res as Response);

    expect(prismaMock.assets.count).toHaveBeenCalled();
    expect(prismaMock.room.findUnique).toHaveBeenCalled();
    expect(prismaMock.assets.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: "asset-3", name: "TV" });
  });

  it("should throw ConflictException when non-premium user exceeds 20 assets", async () => {
    (prismaMock.assets.count as ReturnType<typeof vi.fn>).mockResolvedValue(21);
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isPremium: false });

    await expect(
      createRoomAsset(req as Request<{}, {}, CreateRoomAssetsSchema>, res as Response)
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.assets.create).not.toHaveBeenCalled();
  });

  it("should allow premium user to exceed 20 assets", async () => {
    (prismaMock.assets.count as ReturnType<typeof vi.fn>).mockResolvedValue(21);
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isPremium: true });
    (prismaMock.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "room-1" });
    (prismaMock.assets.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "asset-4", name: "TV" });

    await createRoomAsset(req as Request<{}, {}, CreateRoomAssetsSchema>, res as Response);

    expect(prismaMock.assets.create).toHaveBeenCalled();
  });

  it("should throw NotFoundException when room is not found", async () => {
    (prismaMock.assets.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);
    (prismaMock.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isPremium: false });
    (prismaMock.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      createRoomAsset(req as Request<{}, {}, CreateRoomAssetsSchema>, res as Response)
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.assets.create).not.toHaveBeenCalled();
  });
});