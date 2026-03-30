import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { deleteFromS3 } from "../middleware/s3Service.js";
import { NotFoundException } from "../middleware/exceptions.js";

// DELETE /api/v1/delete/homes/:homeId
export const deleteHome = async (req: Request, res: Response) => {
  const homeId = parseInt(req.params.homeId);
  const userId = req.user!.userId;
  console.info(`Deleting home with id ${homeId} for user with id ${userId}`);

  const home = await prisma.home.findUnique({
    where: { id: homeId, userId },
    include: {
      homeAsset: {
        include: {
          assets: {
            include: {
              warranties: { include: { warrantyDocuments: true } },
            },
          },
        },
      },
      rooms: {
        include: {
          roomAssets: {
            include: {
              assets: {
                include: {
                  warranties: { include: { warrantyDocuments: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (home === null) {
    throw new NotFoundException(`Home with id ${homeId} and userId ${userId} not found`);
  }

  // Collect S3 keys
  const s3Keys: string[] = [];
  if (home.profileKey) s3Keys.push(home.profileKey);

  const homeAssets = home.homeAsset.map((ha) => ha.assets);
  const roomAssets = home.rooms.flatMap((r) => r.roomAssets.map((ra) => ra.assets));
  const allAssets = [...homeAssets, ...roomAssets];

  for (const asset of allAssets) {
    for (const warranty of asset.warranties) {
      for (const doc of warranty.warrantyDocuments) {
        if (doc.fileKey) s3Keys.push(doc.fileKey);
      }
    }
  }

  await Promise.all(s3Keys.map((key) => deleteFromS3(key)));

  const homeAssetIds = homeAssets.map((a) => a.id);
  const roomAssetIds = roomAssets.map((a) => a.id);
  const allAssetIds = [...homeAssetIds, ...roomAssetIds];

  await prisma.$transaction(async (tx) => {
    // Warranty docs -> warranties -> assets (HomeAssets/RoomAssets share the asset id so they delete with the asset)
    await tx.warrantyDocuments.deleteMany({ where: { warranties: { assetId: { in: allAssetIds } } } });
    await tx.warranties.deleteMany({ where: { assetId: { in: allAssetIds } } });
    await tx.homeAssets.deleteMany({ where: { id: { in: homeAssetIds } } });
    await tx.roomAssets.deleteMany({ where: { id: { in: roomAssetIds } } });
    await tx.assets.deleteMany({ where: { id: { in: allAssetIds } } });
    await tx.room.deleteMany({ where: { homeId } });
    await tx.home.delete({ where: { id: homeId } });
  });

  console.info(`Home with id ${homeId} deleted successfully`);
  return res.json({ message: `Home with id ${homeId} deleted` });
};

// DELETE /api/v1/delete/rooms/:roomId
export const deleteRoom = async (req: Request, res: Response) => {
  const roomId = parseInt(req.params.roomId);
  const userId = req.user!.userId;
  console.info(`Deleting room with id ${roomId} for user with id ${userId}`);

  const room = await prisma.room.findUnique({
    where: { id: roomId, home: { userId } },
    include: {
      roomAssets: {
        include: {
          assets: {
            include: {
              warranties: { include: { warrantyDocuments: true } },
            },
          },
        },
      },
    },
  });

  if (room === null) {
    throw new NotFoundException(`Room with id ${roomId} and userId ${userId} not found`);
  }

  const s3Keys: string[] = [];
  const assets = room.roomAssets.map((ra) => ra.assets);
  const assetIds = assets.map((a) => a.id);

  for (const asset of assets) {
    for (const warranty of asset.warranties) {
      for (const doc of warranty.warrantyDocuments) {
        if (doc.fileKey) s3Keys.push(doc.fileKey);
      }
    }
  }

  await Promise.all(s3Keys.map((key) => deleteFromS3(key)));

  await prisma.$transaction(async (tx) => {
    await tx.warrantyDocuments.deleteMany({ where: { warranties: { assetId: { in: assetIds } } } });
    await tx.warranties.deleteMany({ where: { assetId: { in: assetIds } } });
    await tx.roomAssets.deleteMany({ where: { id: { in: assetIds } } });
    await tx.assets.deleteMany({ where: { id: { in: assetIds } } });
    await tx.room.delete({ where: { id: roomId } });
  });

  console.info(`Room with id ${roomId} deleted successfully`);
  return res.json({ message: `Room with id ${roomId} deleted` });
};

// DELETE /api/v1/delete/assets/:assetId
export const deleteAsset = async (req: Request, res: Response) => {
  const assetId = parseInt(req.params.assetId);
  const userId = req.user!.userId;
  console.info(`Deleting asset with id ${assetId} for user with id ${userId}`);

  const asset = await prisma.assets.findUnique({
    where: { id: assetId, userId },
    include: {
      warranties: { include: { warrantyDocuments: true } },
    },
  });

  if (asset === null) {
    throw new NotFoundException(`Asset with id ${assetId} and userId ${userId} not found`);
  }

  const s3Keys = asset.warranties
    .flatMap((w) => w.warrantyDocuments)
    .filter((d) => d.fileKey !== null)
    .map((d) => d.fileKey!);

  await Promise.all(s3Keys.map((key) => deleteFromS3(key)));

  await prisma.$transaction(async (tx) => {
    await tx.warrantyDocuments.deleteMany({ where: { warranties: { assetId } } });
    await tx.warranties.deleteMany({ where: { assetId } });
    // HomeAssets and RoomAssets share the asset id — delete them before the asset
    await tx.homeAssets.deleteMany({ where: { id: assetId } });
    await tx.roomAssets.deleteMany({ where: { id: assetId } });
    await tx.assets.delete({ where: { id: assetId } });
  });

  console.info(`Asset with id ${assetId} deleted successfully`);
  return res.json({ message: `Asset with id ${assetId} deleted` });
};

// DELETE /api/v1/delete/warranties/:warrantyId
export const deleteWarranty = async (req: Request, res: Response) => {
  const warrantyId = parseInt(req.params.warrantyId);
  const userId = req.user!.userId;
  console.info(`Deleting warranty with id ${warrantyId} for user with id ${userId}`);

  const warranty = await prisma.warranties.findUnique({
    where: { id: warrantyId, asset: { userId } },
    include: { warrantyDocuments: true },
  });

  if (warranty === null) {
    throw new NotFoundException(`Warranty with id ${warrantyId} and userId ${userId} not found`);
  }

  const s3Keys = warranty.warrantyDocuments
    .filter((d) => d.fileKey !== null)
    .map((d) => d.fileKey!);

  await Promise.all(s3Keys.map((key) => deleteFromS3(key)));

  await prisma.$transaction(async (tx) => {
    await tx.warrantyDocuments.deleteMany({ where: { warrantyId } });
    await tx.warranties.delete({ where: { id: warrantyId } });
  });

  console.info(`Warranty with id ${warrantyId} deleted successfully`);
  return res.json({ message: `Warranty with id ${warrantyId} deleted` });
};



export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  console.info(`GDPR delete initiated for user with id ${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      homes: {
        include: {
          homeAsset: {
            include: {
              assets: {
                include: {
                  warranties: { include: { warrantyDocuments: true } },
                },
              },
            },
          },
          rooms: {
            include: {
              roomAssets: {
                include: {
                  assets: {
                    include: {
                      warranties: { include: { warrantyDocuments: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (user === null) {
    throw new NotFoundException(`User with id ${userId} not found`);
  }

  // Collect all S3 keys to delete
  const s3Keys: string[] = [];

  if (user.profileKey) {
    s3Keys.push(user.profileKey);
  }

  for (const home of user.homes) {
    if (home.profileKey) s3Keys.push(home.profileKey);

    const assets = [
      ...home.homeAsset.map((ha) => ha.assets),
      ...home.rooms.flatMap((r) => r.roomAssets.map((ra) => ra.assets)),
    ];

    for (const asset of assets) {
      for (const warranty of asset.warranties) {
        for (const doc of warranty.warrantyDocuments) {
          if (doc.fileKey) s3Keys.push(doc.fileKey);
        }
      }
    }
  }

  // Delete all S3 files first, then wipe the DB in a transaction
  await Promise.all(s3Keys.map((key) => deleteFromS3(key)));

  const allAssets = [
    ...user.homes.flatMap((h) => h.homeAsset.map((ha) => ha.assets)),
    ...user.homes.flatMap((h) => h.rooms.flatMap((r) => r.roomAssets.map((ra) => ra.assets))),
  ];
  const allAssetIds = allAssets.map((a) => a.id);

  await prisma.$transaction(async (tx) => {
    await tx.warrantyDocuments.deleteMany({ where: { warranties: { assetId: { in: allAssetIds } } } });
    await tx.warranties.deleteMany({ where: { assetId: { in: allAssetIds } } });
    await tx.homeAssets.deleteMany({ where: { id: { in: allAssetIds } } });
    await tx.roomAssets.deleteMany({ where: { id: { in: allAssetIds } } });
    await tx.assets.deleteMany({ where: { userId } });
    await tx.room.deleteMany({ where: { home: { userId } } });
    await tx.home.deleteMany({ where: { userId } });
    await tx.confirmEmail.deleteMany({ where: { userId } });
    await tx.passwordReset.deleteMany({ where: { email: user.email } });
    await tx.userSetting.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  console.info(`GDPR delete completed for user with id ${userId}`);
  return res.json({ message: "Account and all associated data deleted" });
};