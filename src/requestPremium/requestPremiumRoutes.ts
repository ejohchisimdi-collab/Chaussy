import { Router } from "express";
import { authLimiter, sensitiveRouteLimiter } from "../middleware/ratelimtiMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requestPremium } from "./requestPremiumService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const requestPremiumRouter=Router()

requestPremiumRouter.post("/",sensitiveRouteLimiter,authMiddleware,asyncHandler(requestPremium))