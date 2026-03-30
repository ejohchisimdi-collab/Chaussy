import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { exportUserData } from "./exportServcie.js";

export const exportRouter=Router()
exportRouter.post("/",authMiddleware,asyncHandler(exportUserData))