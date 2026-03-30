import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { deleteAccount, deleteAsset, deleteHome, deleteRoom } from "./deleteService.js";

export const deleteRouter =Router()

deleteRouter.delete("/homes/:homeId",authMiddleware,asyncHandler(deleteHome))

deleteRouter.delete("/rooms/:roomId",authMiddleware,asyncHandler(deleteRoom))

deleteRouter.delete("/asset/:assetId",authMiddleware,asyncHandler(deleteAsset))

deleteRouter.delete("/account",authMiddleware,asyncHandler(deleteAccount))

