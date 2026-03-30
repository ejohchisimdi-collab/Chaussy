import { Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { NotFoundException } from "../middleware/exceptions.js";
import { generatePresignedUrl } from "../middleware/s3Service.js";

const EXPORT_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days — S3 maximum for presigned URLs

export const exportUserData = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  console.info(`Data export requested for user with id ${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userSetting: true,
      homes: {
        include: {
          rooms: {
            include: {
              roomAssets: {
                include: {
                  assets: {
                    include: {
                      warranties: {
                        include: { warrantyDocuments: true },
                      },
                    },
                  },
                },
              },
            },
          },
          homeAsset: {
            include: {
              assets: {
                include: {
                  warranties: {
                    include: { warrantyDocuments: true },
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

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailConfirmed: user.isEmailConfirmed,
      isPremium: user.isPremium,
      registeredAt: user.registeredAt,
      loggedInAt: user.loggedInAt,
      acceptedV1PrivacyPolicy: user.acceptedV1PrivacyPolicy,
      hasProfilePicture: user.profileKey !== null,
    },
    settings: user.userSetting
      ? { enableEmailNotifications: user.userSetting.enableEmailNotifications }
      : null,
    homes: await Promise.all(
      user.homes.map(async (home) => ({
        id: home.id,
        propertyType: home.propertyType,
        address: home.address,
        yearBuilt: home.yearBuilt,
        createdAt: home.createdAt,
        hasProfilePicture: home.profileKey !== null,
        rooms: await Promise.all(
          home.rooms.map(async (room) => ({
            id: room.id,
            name: room.name,
            roomSize: room.roomSize,
            floorLevel: room.floorLevel,
            createdAt: room.createdAt,
            assets: await Promise.all(room.roomAssets.map((ra) => formatAsset(ra.assets))),
          }))
        ),
        assets: await Promise.all(home.homeAsset.map((ha) => formatAsset(ha.assets))),
      }))
    ),
  };

  console.info(`Data export completed for user with id ${userId}`);
  res.attachment(`chaussy-data-export-${userId}-${Date.now()}.json`);
  return res.json(payload);
};

async function formatAsset(asset: {
  id: number;
  name: string;
  brandName: string | null;
  modelName: string | null;
  purchaseDate: Date | null;
  notes: string | null;
  createdAt: Date;
  warranties: {
    id: number;
    providerName: string;
    startDate: Date | null;
    expiryDate: Date;
    coverageNotes: string | null;
    warrantyStatus: string;
    isAiExtracted: boolean;
    createdAt: Date;
    warrantyDocuments: {
      id: number;
      name: string;
      mimeType: string;
      fileSize: number;
      fileKey: string | null;
      createdAt: Date;
    }[];
  }[];
}) {
  return {
    id: asset.id,
    name: asset.name,
    brandName: asset.brandName,
    modelName: asset.modelName,
    purchaseDate: asset.purchaseDate,
    notes: asset.notes,
    createdAt: asset.createdAt,
    warranties: await Promise.all(
      asset.warranties.map(async (w) => ({
        id: w.id,
        providerName: w.providerName,
        startDate: w.startDate,
        expiryDate: w.expiryDate,
        coverageNotes: w.coverageNotes,
        warrantyStatus: w.warrantyStatus,
        isAiExtracted: w.isAiExtracted,
        createdAt: w.createdAt,
        documents: await Promise.all(
          w.warrantyDocuments.map(async (d) => ({
            id: d.id,
            name: d.name,
            mimeType: d.mimeType,
            fileSizeBytes: d.fileSize,
            createdAt: d.createdAt,
            downloadUrl: d.fileKey ? await generatePresignedUrl(d.fileKey, EXPORT_URL_EXPIRY) : null,
            downloadUrlExpiresAt: d.fileKey
              ? new Date(Date.now() + EXPORT_URL_EXPIRY * 1000).toISOString()
              : null,
          }))
        ),
      }))
    ),
  };
}