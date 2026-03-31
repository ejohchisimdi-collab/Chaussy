import { Router } from "express";
import { logout, refresh } from "./refreshService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authLimiter } from "../middleware/ratelimtiMiddleware.js";

export const refreshRouter=Router()

refreshRouter.post("/",authLimiter,asyncHandler(refresh))

refreshRouter.post("/logout",authLimiter,asyncHandler(logout))

