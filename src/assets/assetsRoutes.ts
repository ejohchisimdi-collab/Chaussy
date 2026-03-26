import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { CreateHomeAssetSchema, CreateRoomAssetSchema, EditAssetSchema } from "./schema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createHomeAsset, createRoomAsset, editAsset, findAssetsByHomeAndUserId, findAssetsByRoomAndUserId } from "./assetsService.js";

export const assetRouter=Router()

assetRouter.post("/homes",authMiddleware,validate(CreateHomeAssetSchema),asyncHandler(createHomeAsset))

assetRouter.post("/rooms",authMiddleware,validate(CreateRoomAssetSchema),asyncHandler(createRoomAsset))

assetRouter.put("/",authMiddleware,validate(EditAssetSchema),asyncHandler(editAsset))

assetRouter.get("/homes/:homeId",authMiddleware,asyncHandler(findAssetsByHomeAndUserId))

assetRouter.get("/rooms/:roomId",authMiddleware,asyncHandler(findAssetsByRoomAndUserId))