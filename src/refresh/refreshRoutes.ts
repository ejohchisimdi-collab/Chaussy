import { Router } from "express";
import { logout, refresh } from "./refreshService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authLimiter, generalLimiter } from "../middleware/ratelimtiMiddleware.js";

export const refreshRouter=Router()

refreshRouter.post("/",generalLimiter,asyncHandler(refresh))

refreshRouter.post("/logout",generalLimiter,asyncHandler(logout))

