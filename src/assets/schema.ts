import { notStrictEqual } from "assert";
import { isModuleNamespaceObject } from "util/types";
import z from "zod";

export const CreateRoomAssetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z0-9\s\-_'()]+$/, "Invalid characters in name"),

  brandName: z
    .string()
    .trim()
    .min(2, "Brand name too short")
    .max(80, "Brand name too long")
    .regex(/^[a-zA-Z0-9\s\-&]+$/, "Invalid brand name")
    .optional(),

  modelName: z
    .string()
    .trim()
    .min(1, "Model name too short")
    .max(100, "Model name too long")
    .regex(/^[a-zA-Z0-9\s\-_.#/]+$/, "Invalid model name")
    .optional(),

  purchaseDate: z.coerce.date().max(new Date(), {
  message: "Purchase date cannot be in the future"
}).optional(),

  notes: z
    .string()
    .trim()
    .max(500, "Notes too long")
    .optional(),

  roomId: z
    .number({
      required_error: "Room ID is required",
      invalid_type_error: "Room ID must be a number"
    })
    .int("Room ID must be an integer")
    .positive("Room ID must be positive")
});

export type CreateRoomAssetsSchema=z.infer<typeof CreateRoomAssetSchema>

export const CreateHomeAssetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z0-9\s\-_'()]+$/, "Invalid characters in name"),

  brandName: z
    .string()
    .trim()
    .min(2, "Brand name too short")
    .max(80, "Brand name too long")
    .regex(/^[a-zA-Z0-9\s\-&]+$/, "Invalid brand name")
    .optional(),

  modelName: z
    .string()
    .trim()
    .min(1, "Model name too short")
    .max(100, "Model name too long")
    .regex(/^[a-zA-Z0-9\s\-_.#/]+$/, "Invalid model name")
    .optional(),

  purchaseDate: z.coerce.date().max(new Date(), {
  message: "Purchase date cannot be in the future"
}).optional(),

  notes: z
    .string()
    .trim()
    .max(500, "Notes too long")
    .optional(),

  homeId: z
    .number({
      required_error: "HOME ID is required",
      invalid_type_error: "Home ID must be a number"
    })
    .int("Room ID must be an integer")
    .positive("Room ID must be positive")
});

export type CreateHomeAssetSchema=z.infer<typeof CreateHomeAssetSchema>


export const EditAssetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z0-9\s\-_'()]+$/, "Invalid characters in name").optional(),

  brandName: z
    .string()
    .trim()
    .min(2, "Brand name too short")
    .max(80, "Brand name too long")
    .regex(/^[a-zA-Z0-9\s\-&]+$/, "Invalid brand name")
    .optional(),

  modelName: z
    .string()
    .trim()
    .min(1, "Model name too short")
    .max(100, "Model name too long")
    .regex(/^[a-zA-Z0-9\s\-_.#/]+$/, "Invalid model name")
    .optional(),

  purchaseDate: z.coerce.date().max(new Date(), {
  message: "Purchase date cannot be in the future"
}).optional(),

  notes: z
    .string()
    .trim()
    .max(500, "Notes too long")
    .optional(),

  assetId: z
    .number({
      required_error: "Asset ID is required",
      invalid_type_error: "Asset ID must be a number"
    })
    .int("Room ID must be an integer")
    .positive("Room ID must be positive")
});

export type EditAssetSChema=z.infer<typeof EditAssetSchema>
